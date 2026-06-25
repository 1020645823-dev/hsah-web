# Phase 9 — Content Block Schema, Migration, and Validation Design

## Goal

Phase 9 upgrades the content block system from loosely structured JSON into a versioned, migratable, and validated content model. The objective is to make the current five block types safer to evolve, easier to validate, and easier to diagnose in the editor without rewriting the editor architecture.

## Scope

This phase includes:

1. A centralized backend pipeline for `normalize -> migrate -> validate`.
2. Asset-level and block-level version tracking.
3. Read-time automatic migration with save-time writeback to the latest schema.
4. Structured validation for the current five block types only:
   - `text`
   - `stat_card`
   - `image`
   - `code_snippet`
   - `callout`
5. Frontend editor error mapping and error display for block and field failures.

This phase does not include:

- New block types
- Full editor rewrite
- Independent migration dashboard or operator tooling
- SEO, analytics, or public-site growth features

## Product Requirements

### Content blocks become schema-governed

Every content block must follow a stable outer structure with explicit versioning. Backend logic becomes the only source of truth for block compatibility and validity. Frontend code should operate on normalized blocks instead of trying to understand historical data formats.

### Old content remains usable

Existing stored blocks may have old field layouts or no version fields at all. The system must support mixed historical data through runtime compatibility:

- On read, old blocks are normalized and migrated to the latest in-memory structure.
- On save, the backend validates and writes back the latest schema shape.
- Unknown or damaged block data must fail with explicit validation errors instead of being guessed into a potentially wrong shape.

### Validation errors must be actionable

If an asset contains invalid blocks, the backend must return structured errors that let the frontend identify:

- which block failed
- what type it is
- which field is invalid
- what message should be shown

The editor must show these errors in a way that helps users quickly navigate and fix the content.

## Architecture

### Backend is the schema authority

The backend owns the full content compatibility pipeline:

1. **Normalize**
   - Fill missing required wrapper fields such as `version` or `visible`
   - Lift known legacy field names into the normalized shape
   - Apply harmless defaults where the meaning is unambiguous

2. **Migrate**
   - Run block-specific migration steps from older versions to the latest version
   - Each migration is single-step (`v1 -> v2`, `v2 -> v3`) rather than a large cross-version branch
   - Migration order is determined by block type and current block version

3. **Validate**
   - Enforce required fields, field types, enum constraints, and structural rules
   - Reject unknown block types or unsupported versions
   - Return a consistent error model

This pipeline runs:

- when reading assets for admin editing or detail retrieval
- when saving assets from the admin editor

### Version model

The system uses two levels of versioning.

#### Asset-level version

Each asset stores `content_schema_version`.

Purpose:

- indicates the overall generation of the asset content payload
- helps future upgrades reason about asset-wide changes
- provides a top-level marker for whether the asset has already been written by the new system

#### Block-level version

Each block stores `version`.

Purpose:

- represents the real migration source for that block
- lets block types evolve independently
- avoids forcing all block types to share the same internal version cadence

Compatibility rules:

- If a block has no `version`, treat it as `version = 1`
- If an asset has no `content_schema_version`, treat it as `1`
- If asset-level and block-level versions disagree, block-level version is authoritative for block migration

### Migration trigger

Migration happens automatically on read.

Recommended behavior:

- Asset is loaded from storage
- Each block is normalized
- Each block is migrated to the latest known schema
- The frontend receives only normalized latest-shape blocks

On save:

- Submitted blocks are normalized and migrated again for safety
- The backend validates the migrated result
- The asset is stored using the latest `content_schema_version`
- Each stored block is written with the latest block `version`

This design provides mixed-mode compatibility:

- old content continues to open
- active editing naturally upgrades stored content over time
- future offline migration tooling remains possible, but is not required for this phase

## Target Block Shape

All blocks converge to a single wrapper shape:

```json
{
  "id": "block_xxx",
  "type": "text",
  "version": 2,
  "order": 0,
  "visible": true,
  "config": {}
}
```

Field responsibilities:

- `id`: stable block identifier for rendering and error mapping
- `type`: block type
- `version`: block schema version
- `order`: position in the content flow
- `visible`: display state
- `config`: block-specific payload container

Business fields move into `config` so migration and validation operate on a consistent boundary.

### Text block

Target shape:

```json
{
  "id": "block_text_1",
  "type": "text",
  "version": 2,
  "order": 0,
  "visible": true,
  "config": {
    "markdown": "## Title",
    "html": "<h2>Title</h2>"
  }
}
```

Rules:

- `config.markdown` is required
- `config.html` is optional
- block must have renderable text content

Legacy compatibility:

- old `content` or `text` fields migrate into `config.markdown`

### Stat card block

Target shape:

```json
{
  "id": "block_stat_1",
  "type": "stat_card",
  "version": 2,
  "order": 1,
  "visible": true,
  "config": {
    "title": "Key Metrics",
    "stats": [
      {
        "label": "ROI",
        "value": "28%",
        "description": "YoY improvement"
      }
    ]
  }
}
```

Rules:

- `config.stats` is required and must contain at least one item
- each stat requires `label` and `value`
- `description` is optional
- `title` is optional

Legacy compatibility:

- flat `label/value/description` migrate into a single-item `stats[]`

### Image block

Target shape:

```json
{
  "id": "block_image_1",
  "type": "image",
  "version": 2,
  "order": 2,
  "visible": true,
  "config": {
    "src": "https://...",
    "alt": "Architecture diagram",
    "caption": "Optional caption"
  }
}
```

Rules:

- `config.src` is required
- `config.alt` is required
- `config.caption` is optional

Legacy compatibility:

- old image fields migrate into `config`
- missing `alt` is a validation error, not a guessed migration

### Code snippet block

Target shape:

```json
{
  "id": "block_code_1",
  "type": "code_snippet",
  "version": 2,
  "order": 3,
  "visible": true,
  "config": {
    "language": "python",
    "code": "print('hello')",
    "filename": "demo.py"
  }
}
```

Rules:

- `config.code` is required
- `config.language` is optional but recommended
- `config.filename` is optional

Legacy compatibility:

- old `code` and `language` move into `config`

### Callout block

Target shape:

```json
{
  "id": "block_callout_1",
  "type": "callout",
  "version": 2,
  "order": 4,
  "visible": true,
  "config": {
    "title": "Important",
    "content": "Key reminder",
    "tone": "info"
  }
}
```

Rules:

- `config.content` is required
- `config.title` is optional
- `config.tone` must be one of:
  - `info`
  - `warning`
  - `success`
  - `error`

Legacy compatibility:

- missing `tone` defaults to `info`
- old `title/content` fields move into `config`

## Error Model

The backend returns a standardized validation error shape:

```json
{
  "code": "content_block_validation_failed",
  "message": "One or more content blocks are invalid",
  "errors": [
    {
      "block_id": "block_image_1",
      "block_type": "image",
      "field": "config.alt",
      "message": "Alt text is required"
    },
    {
      "block_id": "block_stat_1",
      "block_type": "stat_card",
      "field": "config.stats[0].value",
      "message": "Value is required"
    }
  ]
}
```

Requirements:

- every error includes `block_id`
- every error includes `block_type`
- every error includes a field path
- messages are user-facing and directly actionable

This format lets the frontend support block-level and field-level feedback without reverse-engineering backend behavior.

## Frontend Editor UX

The editor should not duplicate backend schema logic. It should consume backend errors and present them clearly.

### Error state model

Frontend transforms backend errors into a grouped structure:

```ts
type BlockFieldError = {
  blockId: string;
  blockType: string;
  field: string;
  message: string;
};

type BlockErrorMap = Record<string, BlockFieldError[]>;
```

### Display layers

Three layers of feedback are required:

1. **Top summary**
   - shows how many blocks and fields are invalid
   - each summary item can navigate to the affected block

2. **Block-level highlighting**
   - invalid blocks show an error border or badge
   - collapsed blocks still indicate error presence clearly

3. **Field-level messages**
   - specific field errors appear near the corresponding input

### Interaction rules

- On failed save, store backend errors in editor state
- Clicking a summary item scrolls to the relevant block
- Each block container should expose a stable `data-block-id`
- Editing a field clears only the matching field error locally
- Block-level scroll targeting is required in this phase
- Direct field focus targeting is optional and may be added later

### Frontend scope control

Phase 9 should not rewrite the editor. The preferred implementation is a minimal enhancement of the existing block editor:

- add `errorsByBlockId`
- pass `fieldErrors` into individual block editors
- add shared helpers such as:
  - `groupBlockErrors(errors)`
  - `getFieldError(errors, fieldPath)`

## Testing Strategy

### Backend tests

Unit tests should cover:

- normalization of legacy blocks without version fields
- migration for each supported block type
- validation failures for missing required fields
- enum validation failures
- unknown block type rejection
- unknown version rejection

API tests should cover:

- reading legacy content returns normalized latest-shape blocks
- invalid block payloads return the structured validation error shape
- valid saves write back the latest `content_schema_version`
- valid saves write back the latest block `version`

### Frontend tests

Unit tests should cover:

- error grouping helpers
- field lookup helpers
- local field-error clearing behavior

Component tests should cover:

- top error summary rendering
- block-level error state rendering
- field-level error message rendering
- click-to-scroll behavior to a block
- local removal of field errors after user edits

### Regression tests

The existing five block editors must continue to support:

- edit
- save
- preview/render

Global verification remains required:

- `npm run lint`
- `npm run test`
- `npm run build`
- `pytest -q`

## Implementation Breakdown

Phase 9 should be implemented in four stages:

1. **Backend schema core**
   - define normalized wrapper shape
   - create normalize/migrate/validate pipeline

2. **Per-block migration and validation**
   - implement current five block types
   - add migration tests and validation tests

3. **Frontend error mapping**
   - consume backend validation shape
   - render summary, block, and field errors

4. **Version writeback and regression hardening**
   - write latest versions on save
   - run full regression suite

## Risks and Constraints

- The main risk is historical data ambiguity, not validation mechanics.
- Only known legacy structures should auto-migrate.
- Unknown or damaged structures must fail explicitly.
- Phase 9 must not turn into an editor rewrite.
- Phase 9 must not add speculative framework work for future block types beyond what the current five require.

## Acceptance Criteria

- The backend becomes the only schema authority for content blocks.
- Legacy blocks without version metadata can still be read and upgraded in memory.
- Saving content writes the latest asset schema version and block versions.
- The five current block types are validated against a normalized target structure.
- Invalid content returns structured block and field errors.
- The editor can show summary, block-level, and field-level error states.
- Existing block editing and rendering behavior continues to work after the schema upgrade.
