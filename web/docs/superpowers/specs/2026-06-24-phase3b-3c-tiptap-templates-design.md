# Phase 3B+3C: Tiptap Rich Text Editor + Template System Design

## Overview

This design covers two independent features:
- **Phase 3B**: Replace the TextBlockEditor's textarea with a Tiptap WYSIWYG rich text editor
- **Phase 3C**: Add a template system with backend persistence for reusable content block combinations

## Phase 3B: Tiptap Rich Text Editor

### Goal
Replace the simple textarea Markdown editor in TextBlockEditor with a Tiptap-based WYSIWYG editor that supports basic formatting (bold, italic, headings, lists, links).

### Data Model Changes

The `TextBlockConfig` currently stores `markdown: string`. We will add an `html` field:

```typescript
export type TextBlockConfig = {
  markdown: string;  // Kept for backward compatibility
  html: string;      // New: stores Tiptap-generated HTML
};
```

- When `html` is present, render it directly
- When only `markdown` is present (legacy), continue using the existing parser
- New content uses `html` field

### Tech Stack

- `@tiptap/react` — React wrapper for Tiptap
- `@tiptap/starter-kit` — Core extensions (bold, italic, headings, lists, etc.)
- `@tiptap/extension-link` — Link support

### Component Design

**New Component: `TiptapEditor`**
- Props: `content: string`, `onChange: (html: string) => void`
- Toolbar: Bold, Italic, H1, H2, Bullet List, Ordered List, Link
- Uses Tiptap's `useEditor` hook with StarterKit + Link extensions
- Outputs clean HTML (no inline styles, uses semantic tags)

**Modified: `TextBlockEditor`**
- Replace the textarea with `TiptapEditor`
- Keep the preview pane (renders the HTML directly)
- Remove `parseMarkdown` function (kept for backward compatibility in BlockRenderer)

### Styling

- Editor area: dark theme matching the app, with a subtle border
- Toolbar: compact button row with active state highlighting
- Content area: `prose-invert` styling for dark mode readability

## Phase 3C: Template System

### Goal
Allow users to save reusable content block combinations as templates, and apply them when creating new assets. Templates are persisted in the backend database.

### Backend Design

**New Model: `Template`** (SQLAlchemy)

```python
class Template(Base):
    __tablename__ = "templates"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    blocks = Column(JSON, nullable=False)  # Array of ContentBlock objects
    is_builtin = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**New API Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/templates` | List all templates (built-in + user's own) |
| POST | `/api/v1/admin/templates` | Create a new template |
| GET | `/api/v1/admin/templates/{id}` | Get a single template |
| PUT | `/api/v1/admin/templates/{id}` | Update a template |
| DELETE | `/api/v1/admin/templates/{id}` | Delete a template (only non-built-in) |

**Built-in Templates:**

1. **Product Introduction** (`product-intro`)
   - H1 heading (product name)
   - Image block (product screenshot)
   - Text block (product description)
   - Stat card block (key metrics)

2. **Technical Documentation** (`tech-doc`)
   - H1 heading (doc title)
   - Text block (overview)
   - Code snippet block (example)
   - Callout block (note/warning)

3. **News Article** (`news-article`)
   - H1 heading (headline)
   - Text block (lead paragraph)
   - Image block (featured image)
   - Text block (body content)

### Frontend Design

**New Component: `TemplateSelector`**
- Modal/panel showing available templates as cards
- Each card: name, description, preview of block types
- Click to apply: replaces current blocks with template blocks
- Accessible from the "Add Block" menu

**New Component: `TemplateManager`**
- Admin page at `/admin/templates`
- List all templates with edit/delete actions
- "Save Current as Template" button (captures current blocks)
- Form for creating/editing: name, description, block preview

**Modified: `ContentBlockEditor`**
- Add "从模板添加" option to the add block menu
- Opens TemplateSelector modal
- On select: appends template blocks to current list

**Modified: `AssetEditorForm`**
- Add "保存为模板" button near the block editor
- Opens a dialog to name and save the current block configuration

### Data Flow

```
User creates blocks → clicks "Save as Template" → 
  Frontend sends blocks array to POST /admin/templates → 
  Backend stores in Template table → 
  User later clicks "Add from Template" → 
  Frontend fetches templates from GET /admin/templates → 
  User selects template → Frontend clones blocks and appends
```

### Security

- Built-in templates cannot be deleted or modified by users
- Users can only see their own templates + built-in templates
- Admin users can see all templates
- Template blocks are validated using existing `validateBlock` before storage

## Integration Points

### Phase 3B Integration
- `TextBlockEditor` imports `TiptapEditor` instead of using textarea
- `BlockRenderer` in asset detail page checks for `html` field first
- `BlockPreview` renders HTML directly for text blocks

### Phase 3C Integration
- `ContentBlockEditor` imports `TemplateSelector` for template application
- `AssetEditorForm` imports `TemplateManager` actions for save-as-template
- New route `/admin/templates` added to admin navigation

## Testing Strategy

### Phase 3B Tests
- TiptapEditor renders toolbar buttons
- TiptapEditor outputs correct HTML on content change
- TextBlockEditor integrates TiptapEditor correctly
- Backward compatibility: old markdown-only blocks still render

### Phase 3C Tests
- Backend: CRUD operations on templates
- Backend: built-in templates are seeded on startup
- Frontend: TemplateSelector renders template cards
- Frontend: Applying template appends correct blocks
- Frontend: Saving current blocks as template works

## Success Criteria

### Phase 3B
1. TextBlockEditor uses Tiptap WYSIWYG editor with toolbar
2. Bold, italic, headings, lists, links all work
3. Preview renders HTML correctly
4. Old markdown content still renders (backward compatibility)
5. All tests pass, lint clean, build succeeds

### Phase 3C
1. Users can apply built-in templates when adding blocks
2. Users can save current block configuration as custom template
3. Templates persist across sessions (backend storage)
4. Template management page works (list, edit, delete)
5. All tests pass, lint clean, build succeeds
