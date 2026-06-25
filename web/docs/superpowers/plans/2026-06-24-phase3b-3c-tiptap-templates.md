# Phase 3B+3C Implementation Plan

> **For agentic workers:** Use subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace TextBlockEditor textarea with Tiptap WYSIWYG editor, and add a backend-persisted template system for reusable content block combinations.

**Architecture:** Phase 3B upgrades the text block editing experience. Phase 3C adds a Template model/API and frontend UI for saving/applying block templates.

**Tech Stack:** React 19, TypeScript, Tiptap, FastAPI, SQLAlchemy, Vitest

---

## File Structure

### Phase 3B (Frontend)
```
web/src/
├── components/admin/content-blocks/
│   ├── tiptap-editor.tsx              # NEW: Tiptap WYSIWYG editor component
│   ├── tiptap-editor.test.tsx         # NEW: Tests for TiptapEditor
│   └── text-block-editor.tsx          # MODIFY: Replace textarea with TiptapEditor
├── lib/admin-content-blocks.ts        # MODIFY: Add html field to TextBlockConfig
└── lib/admin-content-blocks.test.ts   # MODIFY: Update tests for html field
```

### Phase 3C (Backend)
```
api/app/
├── models/
│   └── template.py                    # NEW: Template SQLAlchemy model
├── schemas/
│   └── template.py                    # NEW: Template Pydantic schemas
├── api/v1/
│   └── templates.py                   # NEW: Template CRUD endpoints
├── api/v1/router.py                 # MODIFY: Register template router
├── db/
│   └── seed_templates.py             # NEW: Seed built-in templates
└── tests/
    └── test_templates.py              # NEW: Template API tests
```

### Phase 3C (Frontend)
```
web/src/
├── components/admin/
│   ├── template-selector.tsx          # NEW: Template selection modal
│   ├── template-selector.test.tsx     # NEW: Tests
│   ├── template-manager.tsx           # NEW: Template management page
│   └── template-manager.test.tsx      # NEW: Tests
├── app/admin/templates/
│   └── page.tsx                       # NEW: Admin template management page
├── components/admin/content-blocks/
│   └── content-block-editor.tsx       # MODIFY: Add template integration
├── lib/
│   └── admin-templates.ts             # NEW: Template API client
└── lib/admin-templates.test.ts        # NEW: Template client tests
```

---

## Phase 3B Tasks

### Task 1: Install Tiptap Dependencies

**Files:**
- Modify: `web/package.json` (via npm install)

**Steps:**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link
```

---

### Task 2: Extend TextBlockConfig Type

**Files:**
- Modify: `web/src/lib/admin-content-blocks.ts`
- Modify: `web/src/lib/admin-content-blocks.test.ts`

**Steps:**

1. Add `html` field to `TextBlockConfig`:
```typescript
export type TextBlockConfig = {
  markdown: string;
  html: string;
};
```

2. Update `createDefaultBlock("text")` to include `html: ""`

3. Update `isContentBlock` validation for text type to accept `html` as optional

4. Update `validateBlock` for text type to fill `html` default

5. Update tests to include `html` field in text block fixtures

---

### Task 3: Create TiptapEditor Component

**Files:**
- Create: `web/src/components/admin/content-blocks/tiptap-editor.tsx`
- Create: `web/src/components/admin/content-blocks/tiptap-editor.test.tsx`

**Steps:**

1. Implement `TiptapEditor` with:
   - `useEditor` hook from `@tiptap/react`
   - `StarterKit` extension (bold, italic, heading, bulletList, orderedList)
   - `Link` extension
   - Toolbar with toggle buttons for each format
   - Active state styling for toolbar buttons
   - Dark theme styling matching the app

2. Write tests:
   - Renders toolbar buttons
   - Calls onChange with HTML content
   - Toolbar buttons are clickable

---

### Task 4: Integrate TiptapEditor into TextBlockEditor

**Files:**
- Modify: `web/src/components/admin/content-blocks/text-block-editor.tsx`
- Modify: `web/src/components/admin/content-blocks/text-block-editor.test.tsx`

**Steps:**

1. Replace textarea with `TiptapEditor`
2. Update `handleChange` to set `html` field
3. Update preview to render HTML directly (use `html` field, fallback to `markdown`)
4. Update tests to interact with Tiptap editor

---

### Task 5: Update BlockRenderer for HTML Support

**Files:**
- Modify: `web/src/app/assets/[slug]/page.tsx`
- Modify: `web/src/components/admin/content-blocks/block-preview.tsx`

**Steps:**

1. In `page.tsx` BlockRenderer: check `html` field first, fallback to `markdown`
2. In `block-preview.tsx`: render HTML directly when available

---

## Phase 3C Tasks

### Task 6: Create Backend Template Model

**Files:**
- Create: `api/app/models/template.py`
- Create: `api/app/schemas/template.py`

**Steps:**

1. Create `Template` SQLAlchemy model with fields:
   - id, name, description, blocks (JSON), is_builtin, created_by, created_at, updated_at

2. Create Pydantic schemas:
   - `TemplateBase`, `TemplateCreate`, `TemplateUpdate`, `TemplateResponse`

---

### Task 7: Create Template API Endpoints

**Files:**
- Create: `api/app/api/v1/templates.py`
- Modify: `api/app/api/v1/router.py`

**Steps:**

1. Implement CRUD endpoints:
   - `GET /admin/templates` — list all (built-in + user's own)
   - `POST /admin/templates` — create
   - `GET /admin/templates/{id}` — get one
   - `PUT /admin/templates/{id}` — update (only own templates)
   - `DELETE /admin/templates/{id}` — delete (only non-built-in)

2. Register router in `api/app/api/v1/router.py`

---

### Task 8: Seed Built-in Templates

**Files:**
- Create: `api/app/db/seed_templates.py`
- Modify: `api/app/main.py` (call seed on startup)

**Steps:**

1. Define 3 built-in templates with block arrays:
   - Product Introduction
   - Technical Documentation
   - News Article

2. Seed on app startup (idempotent — skip if already exist)

---

### Task 9: Create Frontend Template API Client

**Files:**
- Create: `web/src/lib/admin-templates.ts`
- Create: `web/src/lib/admin-templates.test.ts`

**Steps:**

1. Define `Template` type matching backend schema
2. Implement API functions: `listTemplates`, `createTemplate`, `getTemplate`, `updateTemplate`, `deleteTemplate`
3. Write tests with mocked fetch

---

### Task 10: Create TemplateSelector Component

**Files:**
- Create: `web/src/components/admin/template-selector.tsx`
- Create: `web/src/components/admin/template-selector.test.tsx`

**Steps:**

1. Implement modal component:
   - Fetches templates on open
   - Shows template cards with name, description, block type preview
   - "Apply" button clones template blocks and calls onApply
   - Cancel/close functionality

2. Write tests for rendering and apply action

---

### Task 11: Create TemplateManager Page

**Files:**
- Create: `web/src/app/admin/templates/page.tsx`
- Create: `web/src/components/admin/template-manager.tsx`
- Create: `web/src/components/admin/template-manager.test.tsx`

**Steps:**

1. Implement template management page:
   - List all templates in a table/card grid
   - Edit name/description
   - Delete custom templates (built-in protected)
   - "Create from Current" button (accepts blocks prop)

2. Write tests

---

### Task 12: Integrate Templates into ContentBlockEditor

**Files:**
- Modify: `web/src/components/admin/content-blocks/content-block-editor.tsx`
- Modify: `web/src/components/admin/content-block-editor.test.tsx`

**Steps:**

1. Add "从模板添加" option to add block menu
2. Import and use `TemplateSelector` modal
3. On apply: append template blocks to current list
4. Add "保存为模板" button (opens dialog to name and save)

---

## Task 13: Integration Testing

**Steps:**

1. Run all frontend tests:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test
```

2. Run lint:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run lint
```

3. Run build:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run build
```

4. Run backend tests:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_templates.py -v
```

---

## Success Criteria

### Phase 3B
1. TextBlockEditor uses Tiptap with toolbar (bold, italic, headings, lists, links)
2. Preview renders HTML correctly
3. Old markdown content still renders (backward compatibility)
4. All tests pass

### Phase 3C
1. Built-in templates are seeded on startup
2. Users can apply templates from the add block menu
3. Users can save current blocks as custom template
4. Template management page works (list, edit, delete)
5. All tests pass, lint clean, build succeeds
