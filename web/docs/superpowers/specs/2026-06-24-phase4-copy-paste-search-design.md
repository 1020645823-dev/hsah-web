# Phase 4: Copy/Paste + Search/Filter Design

## Overview

Add copy/paste functionality for content blocks and search/filter capabilities to improve content editing efficiency.

**Features:**
1. **Copy/Paste** — Copy individual or multiple blocks via React Context, paste into current editor
2. **Local Filter** — Filter blocks by type and content keywords within the current editor
3. **Global Search** — Search across all assets' content blocks and insert found blocks into current editor

## Copy/Paste System

### Architecture

**React Context: `BlockClipboardContext`**

```typescript
type ClipboardBlock = {
  type: ContentBlockType;
  config: ContentBlockConfig;
};

type BlockClipboardState = {
  copiedBlocks: ClipboardBlock[];
  copyBlock: (block: ContentBlock) => void;
  copyBlocks: (blocks: ContentBlock[]) => void;
  pasteBlocks: () => ClipboardBlock[];
  clearClipboard: () => void;
  hasBlocks: boolean;
};
```

- `copiedBlocks` — Array of copied blocks (without IDs, order, visible — just type + config)
- `copyBlock` — Copy a single block
- `copyBlocks` — Copy multiple blocks (for multi-select)
- `pasteBlocks` — Return copied blocks for insertion (caller generates new IDs)
- `clearClipboard` — Clear all copied blocks
- `hasBlocks` — Whether clipboard has content

### UI Integration

**Per-block actions:**
- Add "复制" button to each block's action bar (next to edit/delete)
- Click → copies block to clipboard, shows brief toast/feedback

**Add menu:**
- Add "粘贴" option at the top of the add block menu (when clipboard has content)
- Click → inserts copied blocks with new IDs at the end of the list

**Multi-select mode (optional):**
- Checkbox on each block for multi-select
- "复制选中" button in a floating toolbar
- Scope: MVP can start with single-block copy, multi-select as future enhancement

## Local Filter

### UI Design

**Filter bar above BlockList:**

```
┌────────────────────────────────────────────────────────────┐
│ 🔍 [搜索关键词...]    [全部类型 ▼]    [✕ 清除]            │
└────────────────────────────────────────────────────────────┘
```

**Components:**
- Search input: placeholder "搜索内容..."
- Type dropdown: 全部 / 文本 / 图片 / 代码片段 / 提示框 / 统计卡片
- Clear button: resets both filters

**Filter logic:**
- Search: case-insensitive match against block content
  - `text`: search in `html` and `markdown`
  - `stat_card`: search in `items[].label` and `items[].value`
  - `image`: search in `alt` and `caption`
  - `code_snippet`: search in `code`
  - `callout`: search in `title` and `content`
- Type filter: exact match on `block.type`
- Both filters combined with AND logic
- Hidden blocks are still searchable but visually marked

**Empty state:**
- When filters match nothing: "没有匹配的内容块"
- Show "清除筛选" button

## Global Search

### Backend API

**New Endpoint: `GET /api/v1/admin/assets/search-blocks`**

Query params:
- `q`: search keyword (required)
- `type`: optional block type filter
- `limit`: max results (default 20)

Response:
```json
{
  "results": [
    {
      "asset_id": 1,
      "asset_name": "Product X",
      "asset_slug": "product-x",
      "block": {
        "id": "block-1",
        "type": "text",
        "config": { "html": "...", "markdown": "..." }
      },
      "matched_field": "html",
      "matched_snippet": "...keyword..."
    }
  ]
}
```

Implementation:
- Query all assets' `content_blocks` JSON field
- Filter blocks where any text field contains the keyword
- Return asset info + block info + matched snippet

### Frontend UI

**GlobalSearchModal component:**
- Triggered from ContentBlockEditor ("从其他资产搜索" button in add menu)
- Search input at top
- Results list: each item shows asset name, block type icon, matched snippet
- "插入到当前" button per result — clones block with new ID and appends
- "预览资产" link to open asset in new tab

## Integration Points

### ContentBlockEditor Changes

1. Wrap with `BlockClipboardProvider`
2. Add filter bar above BlockList
3. Add "复制" button per block (via SortableBlockItem)
4. Add "粘贴" and "从其他资产搜索" to add menu
5. Pass filtered blocks to BlockList

### SortableBlockItem Changes

1. Add "复制" button to action bar
2. Optional: add checkbox for multi-select

### BlockList Changes

1. Accept `filteredBlocks` prop (or filter internally)
2. Show "X of Y blocks" count when filtering

## Data Flow

### Copy/Paste
```
User clicks "复制" on block
  → BlockClipboardContext.copyBlock(block)
  → Block stored in React Context (no IDs)
User clicks "粘贴"
  → BlockClipboardContext.pasteBlocks()
  → ContentBlockEditor generates new IDs
  → Appends to blocks array
  → onChange(newBlocks)
```

### Local Filter
```
User types in search box / selects type
  → ContentBlockEditor filters blocks array
  → Passes filtered subset to BlockList
  → BlockList renders only matching blocks
```

### Global Search
```
User clicks "从其他资产搜索"
  → Opens GlobalSearchModal
  → User types keyword
  → Frontend calls GET /admin/assets/search-blocks?q=...
  → Backend searches content_blocks JSON
  → Results displayed with snippets
  → User clicks "插入"
  → Block cloned with new ID and appended
```

## Testing Strategy

### Copy/Paste Tests
- Copy block stores correct type + config in context
- Paste block generates new ID
- Multiple copy overwrites previous
- Clear clipboard works

### Local Filter Tests
- Filter by type shows only matching blocks
- Filter by keyword matches content
- Combined filters work
- Clear resets filters
- Empty state shown when no matches

### Global Search Tests
- API returns results for keyword
- Results include asset info and matched snippet
- Insert clones block with new ID
- No results shows empty state

## Success Criteria

1. ✅ 可以复制单个 block 并粘贴为新 block
2. ✅ 可以按类型过滤当前 block 列表
3. ✅ 可以按关键词搜索当前 block 内容
4. ✅ 可以从其他资产搜索 block 并插入
5. ✅ 所有测试通过
6. ✅ Lint + Build 成功

## File Structure

```
web/src/
├── components/admin/content-blocks/
│   ├── block-clipboard-context.tsx      # NEW: React Context for copy/paste
│   ├── block-clipboard-context.test.tsx # NEW: Tests
│   ├── block-filter-bar.tsx             # NEW: Local filter UI
│   ├── block-filter-bar.test.tsx        # NEW: Tests
│   ├── global-search-modal.tsx          # NEW: Global search modal
│   ├── global-search-modal.test.tsx     # NEW: Tests
│   ├── sortable-block-item.tsx          # MODIFY: Add copy button
│   ├── block-list.tsx                   # MODIFY: Accept filtered blocks
│   └── content-block-editor.tsx         # MODIFY: Integrate all features
├── lib/admin-content-blocks.ts          # MODIFY: Add search helper
└── lib/admin-content-blocks.test.ts     # MODIFY: Add search tests

api/app/
├── api/v1/
│   └── admin_assets.py                  # MODIFY: Add search-blocks endpoint
└── tests/
    └── test_admin_assets.py             # MODIFY: Add search tests
```
