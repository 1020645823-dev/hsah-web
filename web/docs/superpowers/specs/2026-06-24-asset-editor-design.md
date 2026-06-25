# Asset Editor Design Spec

**Date**: 2026-06-24  
**Phase**: Phase 1 (Basic Field Editing)  
**Status**: Draft

---

## Overview

Build a complete asset editor system that supports both **creating new assets** and **editing existing assets**, with a unified form interface and full backend CRUD support.

This is Phase 1 of a two-phase delivery. Phase 1 covers all basic fields (slug, title, description, tags, type, status, visibility, access control). Phase 2 will add content block editing.

---

## Goals

1. **Backend**: Add complete CRUD API for assets (GET by ID, POST, PUT)
2. **Frontend**: Build a unified editor form that works for both create and edit modes
3. **List Page**: Upgrade the existing assets list page to match admin UI standards
4. **Validation**: Implement comprehensive client-side and server-side validation
5. **Error Handling**: Provide clear, actionable error messages for all failure scenarios

---

## Scope

### In Scope (Phase 1)

**Backend**:
- `GET /api/v1/admin/assets/{id}` - Fetch single asset by ID
- `POST /api/v1/admin/assets` - Create new asset
- `PUT /api/v1/admin/assets/{id}` - Update existing asset
- Pydantic schemas for request/response validation
- Slug uniqueness validation
- Enum validation for asset_type, status, visibility

**Frontend**:
- `/admin/assets/new` - Create new asset page
- `/admin/assets/[id]/edit` - Edit existing asset page
- Unified `AssetEditorForm` component shared by both pages
- Tag input component for multi-value fields
- Form validation with field-level error messages
- Dirty detection (disable Save when no changes)
- Unsaved changes warning when navigating away
- Upgraded assets list page with Edit links and New Asset button
- Uses `adminRequest` instead of raw `fetch`

**Fields**:
- Basic info: slug, title, subtitle, short_description
- Tags: cloud_providers, industries, technologies (arrays of strings)
- Classification: asset_type, status, visibility (enums)
- Access control: allowed_roles, allowed_users (arrays of strings)
- content_blocks: preserved as-is during edit, set to [] during create

### Out of Scope (Phase 2)

- Content block editing UI
- Asset deletion
- Asset versioning/history
- Asset preview/publish workflow
- Bulk operations

---

## Backend API Design

### Endpoints

#### GET /api/v1/admin/assets/{id}

**Purpose**: Fetch a single asset by ID for editing.

**Response**:
```json
{
  "id": "uuid",
  "slug": "cloud-platform-01",
  "title": "Cloud Platform Solution",
  "subtitle": "Enterprise-grade cloud infrastructure",
  "short_description": "A comprehensive cloud platform...",
  "cloud_providers": ["aws", "azure", "gcp"],
  "industries": ["fintech", "healthcare"],
  "technologies": ["kubernetes", "terraform"],
  "asset_type": "solution",
  "status": "published",
  "visibility": "public",
  "allowed_roles": ["admin", "editor"],
  "allowed_users": ["alice@example.com"],
  "content_blocks": [],
  "created_at": "2026-06-20T10:00:00Z",
  "updated_at": "2026-06-24T15:30:00Z"
}
```

**Error codes**:
- 404 `asset_not_found` - Asset does not exist

---

#### POST /api/v1/admin/assets

**Purpose**: Create a new asset.

**Request body**:
```json
{
  "slug": "cloud-platform-01",
  "title": "Cloud Platform Solution",
  "subtitle": "Enterprise-grade cloud infrastructure",
  "short_description": "A comprehensive cloud platform...",
  "cloud_providers": ["aws", "azure", "gcp"],
  "industries": ["fintech", "healthcare"],
  "technologies": ["kubernetes", "terraform"],
  "asset_type": "solution",
  "status": "draft",
  "visibility": "public",
  "allowed_roles": ["admin", "editor"],
  "allowed_users": ["alice@example.com"],
  "content_blocks": []
}
```

**Validation rules**:
- `slug`: required, unique, lowercase alphanumeric + hyphens only, max 200 chars
- `title`: required, max 240 chars
- `subtitle`: optional, max 300 chars
- `short_description`: required, max 500 chars
- `cloud_providers`, `industries`, `technologies`: optional arrays of strings
- `asset_type`: required, must be one of: `solution`, `whitepaper`, `demo`, `reference-architecture`
- `status`: required, must be one of: `draft`, `published`, `archived`
- `visibility`: required, must be one of: `public`, `restricted`, `internal`
- `allowed_roles`, `allowed_users`: optional arrays of strings
- `content_blocks`: optional array, defaults to []

**Response**: Full asset object (same as GET by ID)

**Error codes**:
- 409 `slug_already_exists` - Slug is already in use
- 422 `validation_error` - Request body validation failed

---

#### PUT /api/v1/admin/assets/{id}

**Purpose**: Update an existing asset.

**Request body**: Same as POST (all fields required)

**Validation rules**: Same as POST, plus:
- `slug` must not conflict with any other asset (excluding self)

**Response**: Full asset object (same as GET by ID)

**Error codes**:
- 404 `asset_not_found` - Asset does not exist
- 409 `slug_already_exists` - Slug conflicts with another asset
- 422 `validation_error` - Request body validation failed

---

### Database Schema

No changes to the `assets` table. The existing schema already supports all fields.

---

### Pydantic Schemas

**AssetCreateRequest** (used by POST):
```python
class AssetCreateRequest(BaseModel):
    slug: str = Field(..., min_length=1, max_length=200, pattern=r'^[a-z0-9-]+$')
    title: str = Field(..., min_length=1, max_length=240)
    subtitle: str | None = Field(None, max_length=300)
    short_description: str = Field(..., min_length=1, max_length=500)
    cloud_providers: list[str] = []
    industries: list[str] = []
    technologies: list[str] = []
    asset_type: str = Field(..., pattern=r'^(solution|whitepaper|demo|reference-architecture)$')
    status: str = Field(..., pattern=r'^(draft|published|archived)$')
    visibility: str = Field(..., pattern=r'^(public|restricted|internal)$')
    allowed_roles: list[str] = []
    allowed_users: list[str] = []
    content_blocks: list[dict] = []
```

**AssetUpdateRequest** (used by PUT): Same as AssetCreateRequest

---

## Frontend Design

### Routes

- `/admin/assets` - List page (upgraded)
- `/admin/assets/new` - Create new asset
- `/admin/assets/[id]/edit` - Edit existing asset

---

### Component Architecture

```
/admin/assets/new/page.tsx
  └─ AssetEditorForm (mode="create")

/admin/assets/[id]/edit/page.tsx
  └─ AssetEditorForm (mode="edit", assetId=id)

AssetEditorForm
  ├─ BasicInfoCard (slug, title, subtitle, short_description)
  ├─ TagsCard (cloud_providers, industries, technologies)
  ├─ ClassificationCard (asset_type, status, visibility)
  ├─ AccessControlCard (allowed_roles, allowed_users)
  └─ ActionBar (Save, Cancel)

TagInput (reusable component)
  ├─ Text input with comma/space/Enter separation
  ├─ Chip rendering
  └─ Optional suggestion dropdown
```

---

### AssetEditorForm

**Props**:
```typescript
type AssetEditorFormProps = {
  mode: "create" | "edit";
  assetId?: string; // Required when mode="edit"
};
```

**State**:
```typescript
type AssetEditorDraft = {
  slug: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  cloudProviders: string[];
  industries: string[];
  technologies: string[];
  assetType: string;
  status: string;
  visibility: string;
  allowedRoles: string[];
  allowedUsers: string[];
};

// Initial state (create mode)
const INITIAL_DRAFT: AssetEditorDraft = {
  slug: "",
  title: "",
  subtitle: "",
  shortDescription: "",
  cloudProviders: [],
  industries: [],
  technologies: [],
  assetType: "solution",
  status: "draft",
  visibility: "public",
  allowedRoles: [],
  allowedUsers: [],
};
```

**Data flow**:
1. **Create mode**: Initialize with `INITIAL_DRAFT`
2. **Edit mode**: Fetch asset by ID → convert snake_case to camelCase → initialize draft
3. User edits form → updates draft state
4. On Save: `validateDraft(draft)` → if valid → `buildPayload(draft)` → POST/PUT → redirect to list
5. On Cancel: Navigate to `/admin/assets`

**Dirty detection**:
- Store `initialDraft` (snapshot after load)
- Compare `currentDraft` with `initialDraft` using deep equality
- Disable Save button when `isDirty === false`
- Show unsaved changes warning when navigating away with `isDirty === true`

---

### Validation

**validateDraft(draft)** returns:
```typescript
type ValidationResult = {
  valid: boolean;
  errors: Partial<Record<keyof AssetEditorDraft, string>>;
};
```

**Rules**:
- `slug`: required, pattern `/^[a-z0-9-]+$/`, max 200 chars
- `title`: required, max 240 chars
- `subtitle`: optional, max 300 chars
- `shortDescription`: required, max 500 chars
- `assetType`: must be one of the allowed values
- `status`: must be one of the allowed values
- `visibility`: must be one of the allowed values
- Arrays: automatically deduplicated and trimmed

**Field-level errors**: Displayed below each input in red text.

---

### TagInput Component

**Props**:
```typescript
type TagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[]; // Optional dropdown suggestions
};
```

**Behavior**:
- Text input accepts comma, space, or Enter as separators
- On separator: trim input, add to array if non-empty and not duplicate, clear input
- Render chips for all items in array
- Chip has "×" button to remove
- If `suggestions` provided: show dropdown when input is focused and non-empty
- Deduplication happens on every change

**Implementation notes**:
- Use controlled input
- Store pending input in local state
- Suggestions filter: case-insensitive substring match, exclude already-selected items

---

### List Page Upgrade

**Changes**:
1. Replace raw `fetch` with `adminRequest`
2. Add "New Asset" button in header → `/admin/assets/new`
3. Add "Edit" link in each row → `/admin/assets/{id}/edit`
4. Display additional columns: `asset_type`, `visibility`, `industries`
5. Status badge with color coding:
   - `draft`: gray
   - `published`: green
   - `archived`: amber

---

### Error Handling

**Backend errors** (mapped via `getErrorMessage`):
- 409 `slug_already_exists` → "这个 Slug 已被其他资产使用，请换一个"
- 422 `validation_error` → "请检查表单填写是否正确"
- 404 `asset_not_found` → "资产不存在或已被删除" + redirect to list
- 401 `unauthorized` → Redirect to `/auth/login`

**Frontend validation errors**:
- Required field empty → "必填"
- Slug format invalid → "只能包含小写字母、数字和连字符"
- Field exceeds max length → "最多 {N} 个字符"

**Network errors**:
- Fetch failure during edit load → "加载失败" + Retry button
- Submit timeout → Show error, preserve form data

---

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Edit with slug conflict | Backend 409, frontend shows friendly message |
| Edit page load failure | Show "加载失败" + Retry button |
| Submit network timeout | Show error, keep form data |
| allowedRoles suggestions empty | Allow manual input, don't block |
| Slug real-time validation | Not implemented (over-engineering), only validate on submit |
| content_blocks during edit | Preserve original value, don't modify |
| content_blocks during create | Set to [] |

---

## Testing Strategy

### Backend Tests

1. **POST /admin/assets**:
   - Create with valid payload → 201 + asset object
   - Create with duplicate slug → 409 + error code
   - Create with invalid enum → 422 + validation error
   - Create with missing required field → 422 + validation error

2. **PUT /admin/assets/{id}**:
   - Update with valid payload → 200 + updated asset
   - Update non-existent asset → 404
   - Update with slug conflict (different asset) → 409
   - Update with slug unchanged (same asset) → 200 (no conflict)

3. **GET /admin/assets/{id}**:
   - Fetch existing asset → 200 + asset object
   - Fetch non-existent asset → 404

### Frontend Tests

1. **validateDraft**:
   - Valid draft → `valid: true`, empty errors
   - Missing slug → `valid: false`, error on slug field
   - Invalid slug format → `valid: false`, error on slug field
   - Missing title → `valid: false`, error on title field
   - Invalid enum value → `valid: false`, error on that field

2. **buildPayload**:
   - Converts camelCase draft to snake_case payload
   - Deduplicates arrays
   - Trims strings
   - Sets content_blocks to [] when not provided

3. **TagInput component**:
   - Add tag on Enter
   - Add tag on comma
   - Add tag on space
   - Remove tag via "×" button
   - Deduplicate tags
   - Filter suggestions

4. **AssetEditorForm**:
   - Create mode: empty form, Save calls POST
   - Edit mode: loads asset, fills form, Save calls PUT
   - Dirty detection: Save disabled when no changes
   - Validation errors displayed correctly
   - Unsaved changes warning on navigation

---

## File Structure

### Backend

```
api/app/
├─ api/v1/admin_assets.py
│  ├─ get_asset_by_id(asset_id)
│  ├─ create_asset(request)
│  └─ update_asset(asset_id, request)
├─ schemas/asset.py
│  ├─ AssetCreateRequest
│  └─ AssetUpdateRequest
└─ main.py (register new routes)
```

### Frontend

```
web/src/
├─ app/admin/assets/
│  ├─ page.tsx (upgraded list page)
│  ├─ new/page.tsx (create page)
│  └─ [id]/edit/page.tsx (edit page)
├─ components/admin/
│  ├─ asset-editor-form.tsx (unified form)
│  └─ tag-input.tsx (reusable tag input)
└─ lib/
   └─ admin-asset-editor.ts
      ├─ AssetEditorDraft type
      ├─ INITIAL_DRAFT constant
      ├─ validateDraft(draft)
      ├─ buildPayload(draft)
      └─ parseAssetToDraft(asset) (snake_case → camelCase)
```

---

## Implementation Plan

### Task 1: Backend CRUD API
- Implement GET/POST/PUT endpoints
- Add Pydantic schemas
- Register routes in main.py
- Test with curl/httpie

### Task 2: Frontend Helper Functions
- Define AssetEditorDraft type
- Implement validateDraft
- Implement buildPayload
- Implement parseAssetToDraft
- Write unit tests

### Task 3: TagInput Component
- Build reusable TagInput
- Add suggestion dropdown support
- Write component tests

### Task 4: AssetEditorForm Component
- Build form with 4 cards
- Integrate TagInput for array fields
- Add validation error display
- Implement dirty detection
- Add unsaved changes warning

### Task 5: Create/Edit Pages
- Build /admin/assets/new page
- Build /admin/assets/[id]/edit page
- Wire up AssetEditorForm
- Handle loading/error states

### Task 6: List Page Upgrade
- Replace fetch with adminRequest
- Add New Asset button
- Add Edit link per row
- Display additional columns
- Add status badges

### Task 7: Integration Testing
- Test create flow end-to-end
- Test edit flow end-to-end
- Test error scenarios (409, 404, 422)
- Test validation
- Test dirty detection

---

## Success Criteria

1. ✅ Can create a new asset via UI
2. ✅ Can edit an existing asset via UI
3. ✅ Slug uniqueness enforced (409 error handled)
4. ✅ All validation rules working (client + server)
5. ✅ Form preserves data on network error
6. ✅ Dirty detection prevents unnecessary saves
7. ✅ Unsaved changes warning works
8. ✅ List page shows all assets with Edit links
9. ✅ All tests passing (backend + frontend)

---

## Future Work (Phase 2)

- Content block editor (add/remove/reorder blocks)
- Block type selection (text, image, code, etc.)
- Block-specific editors (markdown, image upload, syntax highlight)
- Asset preview before publish
- Asset versioning/history
- Bulk operations (delete, change status)
