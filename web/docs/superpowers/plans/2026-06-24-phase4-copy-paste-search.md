# Phase 4: Copy/Paste + Search/Filter Implementation Plan

> **For agentic workers:** Use subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add copy/paste functionality for content blocks and local/global search/filter capabilities to improve content editing efficiency.

**Architecture:** React Context manages copied blocks for paste operations. Local filter is a pure frontend filter on the current blocks array. Global search calls a new backend endpoint that searches across all assets' content_blocks JSON.

**Tech Stack:** React 19, TypeScript, FastAPI, SQLAlchemy, Vitest

---

## File Structure

### Frontend (New)
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
```

### Backend (New)
```
api/app/
├── api/v1/
│   └── admin_assets.py                  # MODIFY: Add search-blocks endpoint
└── tests/
    └── test_admin_assets.py             # MODIFY: Add search tests
```

---

## Task 1: BlockClipboardContext

**Files:**
- Create: `web/src/components/admin/content-blocks/block-clipboard-context.tsx`
- Create: `web/src/components/admin/content-blocks/block-clipboard-context.test.tsx`

---

### Step 1: Write the failing test

Create `web/src/components/admin/content-blocks/block-clipboard-context.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { BlockClipboardProvider, useBlockClipboard } from "./block-clipboard-context";
import type { ContentBlock } from "@/lib/admin-content-blocks";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BlockClipboardProvider>{children}</BlockClipboardProvider>
);

describe("BlockClipboardContext", () => {
  it("has no blocks initially", () => {
    const { result } = renderHook(() => useBlockClipboard(), { wrapper });
    expect(result.current.hasBlocks).toBe(false);
    expect(result.current.copiedBlocks).toEqual([]);
  });

  it("copies a single block", () => {
    const { result } = renderHook(() => useBlockClipboard(), { wrapper });
    const block: ContentBlock = {
      id: "test-1",
      type: "text",
      order: 0,
      visible: true,
      config: { markdown: "hello", html: "<p>hello</p>" },
    };

    act(() => {
      result.current.copyBlock(block);
    });

    expect(result.current.hasBlocks).toBe(true);
    expect(result.current.copiedBlocks).toHaveLength(1);
    expect(result.current.copiedBlocks[0].type).toBe("text");
    expect(result.current.copiedBlocks[0].config).toEqual(block.config);
  });

  it("pastes blocks without IDs", () => {
    const { result } = renderHook(() => useBlockClipboard(), { wrapper });
    const block: ContentBlock = {
      id: "test-1",
      type: "text",
      order: 0,
      visible: true,
      config: { markdown: "hello", html: "<p>hello</p>" },
    };

    act(() => {
      result.current.copyBlock(block);
    });

    const pasted = result.current.pasteBlocks();
    expect(pasted).toHaveLength(1);
    expect(pasted[0].type).toBe("text");
    expect(pasted[0].config).toEqual(block.config);
  });

  it("clears clipboard", () => {
    const { result } = renderHook(() => useBlockClipboard(), { wrapper });
    const block: ContentBlock = {
      id: "test-1",
      type: "text",
      order: 0,
      visible: true,
      config: { markdown: "hello", html: "<p>hello</p>" },
    };

    act(() => {
      result.current.copyBlock(block);
      result.current.clearClipboard();
    });

    expect(result.current.hasBlocks).toBe(false);
    expect(result.current.copiedBlocks).toEqual([]);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test src/components/admin/content-blocks/block-clipboard-context.test.tsx
```

Expected: FAIL with "BlockClipboardProvider not found" or similar

### Step 3: Write implementation

Create `web/src/components/admin/content-blocks/block-clipboard-context.tsx`:

```typescript
"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ContentBlock, ContentBlockType, ContentBlockConfig } from "@/lib/admin-content-blocks";

type ClipboardBlock = {
  type: ContentBlockType;
  config: ContentBlockConfig;
};

type BlockClipboardContextType = {
  copiedBlocks: ClipboardBlock[];
  copyBlock: (block: ContentBlock) => void;
  copyBlocks: (blocks: ContentBlock[]) => void;
  pasteBlocks: () => ClipboardBlock[];
  clearClipboard: () => void;
  hasBlocks: boolean;
};

const BlockClipboardContext = createContext<BlockClipboardContextType | null>(null);

export function BlockClipboardProvider({ children }: { children: React.ReactNode }) {
  const [copiedBlocks, setCopiedBlocks] = useState<ClipboardBlock[]>([]);

  const copyBlock = useCallback((block: ContentBlock) => {
    setCopiedBlocks([{ type: block.type, config: block.config }]);
  }, []);

  const copyBlocks = useCallback((blocks: ContentBlock[]) => {
    setCopiedBlocks(blocks.map((b) => ({ type: b.type, config: b.config })));
  }, []);

  const pasteBlocks = useCallback(() => {
    return copiedBlocks;
  }, [copiedBlocks]);

  const clearClipboard = useCallback(() => {
    setCopiedBlocks([]);
  }, []);

  const hasBlocks = copiedBlocks.length > 0;

  return (
    <BlockClipboardContext.Provider
      value={{ copiedBlocks, copyBlock, copyBlocks, pasteBlocks, clearClipboard, hasBlocks }}
    >
      {children}
    </BlockClipboardContext.Provider>
  );
}

export function useBlockClipboard(): BlockClipboardContextType {
  const context = useContext(BlockClipboardContext);
  if (!context) {
    throw new Error("useBlockClipboard must be used within BlockClipboardProvider");
  }
  return context;
}
```

### Step 4: Run test to verify it passes

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test src/components/admin/content-blocks/block-clipboard-context.test.tsx
```

Expected: PASS

---

## Task 2: Add Copy Button to SortableBlockItem

**Files:**
- Modify: `web/src/components/admin/content-blocks/sortable-block-item.tsx`
- Modify: `web/src/components/admin/content-blocks/block-list.tsx`

---

### Step 1: Update SortableBlockItem props

Add `onCopy` prop to `SortableBlockItem` interface:

```typescript
interface SortableBlockItemProps {
  block: ContentBlock;
  isEditing: boolean;
  index: number;
  totalCount: number;
  onEdit: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onToggleVisibility: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  onCopy: (blockId: string) => void;  // NEW
  children: ReactNode;
}
```

### Step 2: Add copy button to action bar

In the action buttons row (next to visibility toggle), add a copy button using `Copy` icon from lucide-react.

### Step 3: Update BlockList to pass onCopy

Add `onCopy` to `BlockListProps` and pass it through to `SortableBlockItem`.

---

## Task 3: BlockFilterBar Component

**Files:**
- Create: `web/src/components/admin/content-blocks/block-filter-bar.tsx`
- Create: `web/src/components/admin/content-blocks/block-filter-bar.test.tsx`

---

### Step 1: Write the failing test

Create `block-filter-bar.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BlockFilterBar } from "./block-filter-bar";

describe("BlockFilterBar", () => {
  it("renders search input and type select", () => {
    render(<BlockFilterBar onFilterChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("搜索内容...")).toBeInTheDocument();
    expect(screen.getByDisplayValue("全部类型")).toBeInTheDocument();
  });

  it("calls onFilterChange with keyword", () => {
    const onFilterChange = vi.fn();
    render(<BlockFilterBar onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByPlaceholderText("搜索内容..."), {
      target: { value: "hello" },
    });
    expect(onFilterChange).toHaveBeenCalledWith({ keyword: "hello", type: "all" });
  });

  it("calls onFilterChange with type", () => {
    const onFilterChange = vi.fn();
    render(<BlockFilterBar onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByDisplayValue("全部类型"), {
      target: { value: "text" },
    });
    expect(onFilterChange).toHaveBeenCalledWith({ keyword: "", type: "text" });
  });

  it("clears filters when clear button clicked", () => {
    const onFilterChange = vi.fn();
    render(<BlockFilterBar onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByPlaceholderText("搜索内容..."), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByText("清除"));
    expect(onFilterChange).toHaveBeenLastCalledWith({ keyword: "", type: "all" });
  });
});
```

### Step 2: Implement BlockFilterBar

Create `block-filter-bar.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

export type FilterState = {
  keyword: string;
  type: string;
};

interface BlockFilterBarProps {
  onFilterChange: (filter: FilterState) => void;
}

const BLOCK_TYPES = [
  { value: "all", label: "全部类型" },
  { value: "text", label: "文本" },
  { value: "image", label: "图片" },
  { value: "code_snippet", label: "代码片段" },
  { value: "callout", label: "提示框" },
  { value: "stat_card", label: "统计卡片" },
];

export function BlockFilterBar({ onFilterChange }: BlockFilterBarProps) {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("all");

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    onFilterChange({ keyword: value, type });
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    onFilterChange({ keyword, type: value });
  };

  const handleClear = () => {
    setKeyword("");
    setType("all");
    onFilterChange({ keyword: "", type: "all" });
  };

  const hasFilter = keyword || type !== "all";

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          placeholder="搜索内容..."
          className="w-full rounded-lg border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/80%)] pl-9 pr-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-electric-purple)]"
        />
      </div>
      <select
        value={type}
        onChange={(e) => handleTypeChange(e.target.value)}
        className="rounded-lg border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/80%)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-electric-purple)]"
      >
        {BLOCK_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      {hasFilter && (
        <button
          onClick={handleClear}
          className="flex items-center gap-1 rounded-lg bg-[rgb(255_255_255_/5%)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[rgb(255_255_255_/10%)] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          清除
        </button>
      )}
    </div>
  );
}
```

---

## Task 4: Add Search Helper to admin-content-blocks

**Files:**
- Modify: `web/src/lib/admin-content-blocks.ts`
- Modify: `web/src/lib/admin-content-blocks.test.ts`

---

### Step 1: Add search helper function

Add to `admin-content-blocks.ts`:

```typescript
export function searchBlockContent(block: ContentBlock, keyword: string): boolean {
  if (!keyword) return true;
  const lowerKeyword = keyword.toLowerCase();
  
  if (block.type === "text") {
    const cfg = block.config as TextBlockConfig;
    return (cfg.html?.toLowerCase().includes(lowerKeyword) || false) ||
           (cfg.markdown?.toLowerCase().includes(lowerKeyword) || false);
  }
  if (block.type === "stat_card") {
    const cfg = block.config as StatCardBlockConfig;
    return cfg.items.some(
      (item) => item.label.toLowerCase().includes(lowerKeyword) ||
                item.value.toLowerCase().includes(lowerKeyword)
    );
  }
  if (block.type === "image") {
    const cfg = block.config as ImageBlockConfig;
    return (cfg.alt?.toLowerCase().includes(lowerKeyword) || false) ||
           (cfg.caption?.toLowerCase().includes(lowerKeyword) || false);
  }
  if (block.type === "code_snippet") {
    const cfg = block.config as CodeSnippetBlockConfig;
    return cfg.code.toLowerCase().includes(lowerKeyword);
  }
  if (block.type === "callout") {
    const cfg = block.config as CalloutBlockConfig;
    return (cfg.title?.toLowerCase().includes(lowerKeyword) || false) ||
           cfg.content.toLowerCase().includes(lowerKeyword);
  }
  return false;
}
```

### Step 2: Write tests

Add to `admin-content-blocks.test.ts`:

```typescript
describe("searchBlockContent", () => {
  it("matches text block html", () => {
    const block = { id: "1", type: "text" as const, order: 0, visible: true, config: { markdown: "hello world", html: "<p>hello world</p>" } };
    expect(searchBlockContent(block, "hello")).toBe(true);
    expect(searchBlockContent(block, "xyz")).toBe(false);
  });

  it("matches stat_card items", () => {
    const block = { id: "1", type: "stat_card" as const, order: 0, visible: true, config: { items: [{ label: "Users", value: "10M" }] } };
    expect(searchBlockContent(block, "Users")).toBe(true);
    expect(searchBlockContent(block, "10M")).toBe(true);
    expect(searchBlockContent(block, "xyz")).toBe(false);
  });

  it("returns true for empty keyword", () => {
    const block = { id: "1", type: "text" as const, order: 0, visible: true, config: { markdown: "", html: "" } };
    expect(searchBlockContent(block, "")).toBe(true);
  });
});
```

---

## Task 5: Backend Global Search Endpoint

**Files:**
- Modify: `api/app/api/v1/admin_assets.py`
- Modify: `api/tests/test_admin_assets.py`

---

### Step 1: Add search endpoint

Add to `admin_assets.py`:

```python
@router.get("/search-blocks")
async def search_blocks(
    q: str = Query(..., min_length=1),
    type: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Search across all assets' content blocks."""
    assets = db.query(Asset).all()
    results = []
    
    for asset in assets:
        if not asset.content_blocks:
            continue
        for block in asset.content_blocks:
            if type and block.get("type") != type:
                continue
            if _block_matches_keyword(block, q):
                results.append({
                    "asset_id": asset.id,
                    "asset_name": asset.name,
                    "asset_slug": asset.slug,
                    "block": block,
                    "matched_field": _get_matched_field(block, q),
                })
                if len(results) >= limit:
                    break
        if len(results) >= limit:
            break
    
    return {"results": results}


def _block_matches_keyword(block: dict, keyword: str) -> bool:
    keyword_lower = keyword.lower()
    config = block.get("config", {})
    block_type = block.get("type", "")
    
    if block_type == "text":
        return keyword_lower in config.get("html", "").lower() or \
               keyword_lower in config.get("markdown", "").lower()
    elif block_type == "stat_card":
        items = config.get("items", [])
        return any(keyword_lower in item.get("label", "").lower() or 
                   keyword_lower in item.get("value", "").lower() for item in items)
    elif block_type == "image":
        return keyword_lower in config.get("alt", "").lower() or \
               keyword_lower in config.get("caption", "").lower()
    elif block_type == "code_snippet":
        return keyword_lower in config.get("code", "").lower()
    elif block_type == "callout":
        return keyword_lower in config.get("title", "").lower() or \
               keyword_lower in config.get("content", "").lower()
    return False


def _get_matched_field(block: dict, keyword: str) -> str:
    """Return the field name that matched the keyword."""
    config = block.get("config", {})
    block_type = block.get("type", "")
    keyword_lower = keyword.lower()
    
    if block_type == "text":
        if keyword_lower in config.get("html", "").lower():
            return "html"
        return "markdown"
    elif block_type == "stat_card":
        return "items"
    elif block_type == "image":
        if keyword_lower in config.get("alt", "").lower():
            return "alt"
        return "caption"
    elif block_type == "code_snippet":
        return "code"
    elif block_type == "callout":
        if keyword_lower in config.get("title", "").lower():
            return "title"
        return "content"
    return "unknown"
```

### Step 2: Write backend tests

Add to `test_admin_assets.py`:

```python
def test_search_blocks_success():
    # Create asset with content blocks
    headers = get_auth_header()
    create_payload = {
        "name": "Search Test Asset",
        "slug": "search-test-asset",
        "description": "Test",
        "content_blocks": [
            {"id": "b1", "type": "text", "order": 0, "visible": True, "config": {"markdown": "hello world", "html": "<p>hello world</p>"}}
        ]
    }
    client.post("/api/v1/admin/assets", json=create_payload, headers=headers)
    
    response = client.get("/api/v1/admin/assets/search-blocks?q=hello", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) > 0
    assert data["results"][0]["asset_name"] == "Search Test Asset"


def test_search_blocks_no_results():
    headers = get_auth_header()
    response = client.get("/api/v1/admin/assets/search-blocks?q=xyznonexistent", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 0


def test_search_blocks_requires_auth():
    response = client.get("/api/v1/admin/assets/search-blocks?q=test")
    assert response.status_code == 401
```

---

## Task 6: GlobalSearchModal Component

**Files:**
- Create: `web/src/components/admin/content-blocks/global-search-modal.tsx`
- Create: `web/src/components/admin/content-blocks/global-search-modal.test.tsx`

---

### Step 1: Create API client function

Add to `web/src/lib/admin-asset-editor.ts`:

```typescript
export type BlockSearchResult = {
  asset_id: number;
  asset_name: string;
  asset_slug: string;
  block: ContentBlock;
  matched_field: string;
};

export async function searchBlocks(
  token: string,
  keyword: string,
  type?: string
): Promise<BlockSearchResult[]> {
  const params = new URLSearchParams();
  params.append("q", keyword);
  if (type) params.append("type", type);
  
  const res = await fetch(`${API_BASE}/admin/assets/search-blocks?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("搜索失败");
  const data = await res.json();
  return data.results;
}
```

### Step 2: Implement GlobalSearchModal

Create `global-search-modal.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Search, X, ExternalLink, Plus } from "lucide-react";
import type { ContentBlock } from "@/lib/admin-content-blocks";
import { searchBlocks } from "@/lib/admin-asset-editor";
import type { BlockSearchResult } from "@/lib/admin-asset-editor";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (block: ContentBlock) => void;
  token: string;
}

export function GlobalSearchModal({ isOpen, onClose, onInsert, token }: GlobalSearchModalProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<BlockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchBlocks(token, keyword.trim());
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "搜索失败");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = (result: BlockSearchResult) => {
    const newBlock: ContentBlock = {
      ...result.block,
      id: crypto.randomUUID(),
      order: 0,
    };
    onInsert(newBlock);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/95%)] shadow-2xl flex flex-col">
        <div className="p-4 border-b border-[rgb(255_255_255_/10%)]">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="搜索所有资产的内容块..."
              className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
            />
            <button onClick={handleSearch} className="rounded-lg bg-[rgb(123_63_242_/25%)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[rgb(123_63_242_/35%)]">
              搜索
            </button>
            <button onClick={onClose} className="p-1 hover:bg-[rgb(255_255_255_/5%)] rounded">
              <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {loading && <div className="text-center text-sm text-[var(--color-text-secondary)]">搜索中...</div>}
          {error && <div className="text-sm text-red-400">{error}</div>}
          {!loading && results.length === 0 && keyword && <div className="text-center text-sm text-[var(--color-text-secondary)]">没有匹配的结果</div>}
          
          <div className="space-y-3">
            {results.map((result, idx) => (
              <div key={idx} className="rounded-lg border border-[rgb(255_255_255_/10%)] bg-[rgb(255_255_255_/2%)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">{result.asset_name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-tertiary)]">{result.block.type}</span>
                    <a href={`/assets/${result.asset_slug}`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mb-2">
                  匹配: {result.matched_field}
                </div>
                <button
                  onClick={() => handleInsert(result)}
                  className="flex items-center gap-1 rounded bg-[rgb(123_63_242_/25%)] px-2 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgb(123_63_242_/35%)]"
                >
                  <Plus className="h-3 w-3" />
                  插入到当前
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Task 7: Integrate Everything into ContentBlockEditor

**Files:**
- Modify: `web/src/components/admin/content-blocks/content-block-editor.tsx`
- Modify: `web/src/components/admin/content-blocks/content-block-editor.test.tsx`

---

### Step 1: Add imports and state

Add imports:
```typescript
import { BlockClipboardProvider, useBlockClipboard } from "./block-clipboard-context";
import { BlockFilterBar, type FilterState } from "./block-filter-bar";
import { GlobalSearchModal } from "./global-search-modal";
import { searchBlockContent } from "@/lib/admin-content-blocks";
```

Add state:
```typescript
const [filter, setFilter] = useState<FilterState>({ keyword: "", type: "all" });
const [showGlobalSearch, setShowGlobalSearch] = useState(false);
```

### Step 2: Add filter logic

```typescript
const filteredBlocks = useMemo(() => {
  return blocks.filter((block) => {
    if (filter.type !== "all" && block.type !== filter.type) return false;
    if (filter.keyword && !searchBlockContent(block, filter.keyword)) return false;
    return true;
  });
}, [blocks, filter]);
```

### Step 3: Add copy/paste handlers

```typescript
const { copyBlock, pasteBlocks, hasBlocks } = useBlockClipboard();

const handleCopy = (blockId: string) => {
  const block = blocks.find((b) => b.id === blockId);
  if (block) copyBlock(block);
};

const handlePaste = () => {
  const copied = pasteBlocks();
  const newBlocks = copied.map((cb) => ({
    id: crypto.randomUUID(),
    type: cb.type,
    order: 0,
    visible: true,
    config: cb.config,
  }));
  onChange([...blocks, ...newBlocks]);
};

const handleInsertFromSearch = (block: ContentBlock) => {
  onChange([...blocks, block]);
  setShowGlobalSearch(false);
};
```

### Step 4: Update JSX

- Add `<BlockFilterBar onFilterChange={setFilter} />` above BlockList
- Pass `filteredBlocks` to BlockList
- Pass `onCopy={handleCopy}` to BlockList
- Add "粘贴" button to add menu (when `hasBlocks`)
- Add "从其他资产搜索" button to add menu
- Add `<GlobalSearchModal />` component

---

## Task 8: Integration Testing

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
pytest -v
```

---

## Success Criteria

1. ✅ 可以复制单个 block 并粘贴为新 block
2. ✅ 可以按类型过滤当前 block 列表
3. ✅ 可以按关键词搜索当前 block 内容
4. ✅ 可以从其他资产搜索 block 并插入
5. ✅ 所有测试通过
6. ✅ Lint + Build 成功
