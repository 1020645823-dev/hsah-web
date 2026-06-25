# Content Block Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a visual content block editor supporting text and stat_card types with drag-and-drop sorting and real-time preview.

**Architecture:** Create a controlled ContentBlockEditor component that integrates into the existing AssetEditorForm as a 5th Card. Use @dnd-kit for drag-and-drop sorting. Each block type has its own editor component (TextBlockEditor with markdown preview, StatCardBlockEditor with items list). The editor uses a hybrid interaction model: list view with inline editing and real-time preview.

**Tech Stack:** React 19, @dnd-kit/core, @dnd-kit/sortable, TypeScript, Tailwind CSS, Vitest

---

## File Structure

```
web/src/
├── components/admin/content-blocks/
│   ├── content-block-editor.tsx       # Main container, manages blocks state
│   ├── block-list.tsx                 # DnD sortable list
│   ├── sortable-block-item.tsx        # Individual draggable block
│   ├── block-preview.tsx              # Block preview when not editing
│   ├── text-block-editor.tsx          # Markdown editor with preview
│   └── stat-card-block-editor.tsx     # Stats items editor
├── lib/
│   ├── admin-content-blocks.ts        # Types + helper functions (NEW)
│   └── admin-asset-editor.ts          # Extend draft type (MODIFY)
└── app/admin/assets/[id]/edit/
    └── page.tsx                       # Add 5th Card (MODIFY)
```

---

## Task 1: Install Dependencies + Define Types

**Files:**
- Modify: `web/package.json`
- Create: `web/src/lib/admin-content-blocks.ts`
- Create: `web/src/lib/admin-content-blocks.test.ts`

---

### Step 1: Install @dnd-kit dependencies

Run the following command in the `web` directory:

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected output: Dependencies added to package.json and node_modules updated.

---

### Step 2: Write failing tests for type definitions

Create `web/src/lib/admin-content-blocks.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  isContentBlock,
  validateBlock,
  createDefaultBlock,
  type ContentBlock,
  type TextBlockConfig,
  type StatCardBlockConfig,
  type StatCardItem,
} from './admin-content-blocks';

describe('isContentBlock', () => {
  it('returns true for valid text block', () => {
    const block = {
      id: 'block-1',
      type: 'text',
      order: 0,
      visible: true,
      config: { markdown: '# Hello' },
    };
    expect(isContentBlock(block)).toBe(true);
  });

  it('returns true for valid stat_card block', () => {
    const block = {
      id: 'block-2',
      type: 'stat_card',
      order: 1,
      visible: true,
      config: { items: [{ label: 'Users', value: '100' }] },
    };
    expect(isContentBlock(block)).toBe(true);
  });

  it('returns false for invalid type', () => {
    const block = {
      id: 'block-3',
      type: 'invalid',
      order: 0,
      visible: true,
      config: {},
    };
    expect(isContentBlock(block)).toBe(false);
  });

  it('returns false for missing required fields', () => {
    const block = { id: 'block-4' };
    expect(isContentBlock(block)).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isContentBlock(null)).toBe(false);
    expect(isContentBlock(undefined)).toBe(false);
  });
});

describe('createDefaultBlock', () => {
  it('creates default text block', () => {
    const block = createDefaultBlock('text');
    expect(block.type).toBe('text');
    expect(block.visible).toBe(true);
    expect(block.config).toEqual({ markdown: '' });
    expect(typeof block.id).toBe('string');
    expect(block.id.length).toBeGreaterThan(0);
  });

  it('creates default stat_card block', () => {
    const block = createDefaultBlock('stat_card');
    expect(block.type).toBe('stat_card');
    expect(block.visible).toBe(true);
    expect(block.config).toEqual({ items: [] });
  });
});

describe('validateBlock', () => {
  it('returns valid block unchanged', () => {
    const block = {
      id: 'block-1',
      type: 'text' as const,
      order: 0,
      visible: true,
      config: { markdown: '# Hello' },
    };
    const result = validateBlock(block);
    expect(result).toEqual(block);
  });

  it('returns default block for invalid input', () => {
    const result = validateBlock({ invalid: 'data' });
    expect(result.type).toBe('text');
    expect(result.visible).toBe(true);
    expect(result.config).toEqual({ markdown: '' });
  });

  it('fills missing id with generated uuid', () => {
    const block = {
      type: 'text' as const,
      order: 0,
      visible: true,
      config: { markdown: 'test' },
    };
    const result = validateBlock(block);
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
  });

  it('fills missing order with 0', () => {
    const block = {
      id: 'block-1',
      type: 'text' as const,
      visible: true,
      config: { markdown: 'test' },
    };
    const result = validateBlock(block);
    expect(result.order).toBe(0);
  });

  it('fills missing visible with true', () => {
    const block = {
      id: 'block-1',
      type: 'text' as const,
      order: 0,
      config: { markdown: 'test' },
    };
    const result = validateBlock(block);
    expect(result.visible).toBe(true);
  });
});
```

---

### Step 3: Run tests to verify they fail

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test src/lib/admin-content-blocks.test.ts
```

Expected: FAIL with "Cannot find module './admin-content-blocks'"

---

### Step 4: Implement types and helper functions

Create `web/src/lib/admin-content-blocks.ts`:

```typescript
import { v4 as uuidv4 } from 'uuid';

export type TextBlockConfig = {
  markdown: string;
};

export type StatCardItem = {
  label: string;
  value: string;
};

export type StatCardBlockConfig = {
  items: StatCardItem[];
};

export type ContentBlock = {
  id: string;
  type: 'text' | 'stat_card';
  order: number;
  visible: boolean;
  config: TextBlockConfig | StatCardBlockConfig;
};

export function isContentBlock(value: unknown): value is ContentBlock {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.id !== 'string' || obj.id.length === 0) {
    return false;
  }

  if (obj.type !== 'text' && obj.type !== 'stat_card') {
    return false;
  }

  if (typeof obj.order !== 'number') {
    return false;
  }

  if (typeof obj.visible !== 'boolean') {
    return false;
  }

  if (typeof obj.config !== 'object' || obj.config === null) {
    return false;
  }

  return true;
}

export function createDefaultBlock(type: 'text' | 'stat_card'): ContentBlock {
  const config = type === 'text' 
    ? { markdown: '' }
    : { items: [] };

  return {
    id: crypto.randomUUID(),
    type,
    order: 0,
    visible: true,
    config,
  };
}

export function validateBlock(block: unknown): ContentBlock {
  if (!isContentBlock(block)) {
    return createDefaultBlock('text');
  }

  return {
    id: block.id || crypto.randomUUID(),
    type: block.type,
    order: typeof block.order === 'number' ? block.order : 0,
    visible: typeof block.visible === 'boolean' ? block.visible : true,
    config: block.config,
  };
}
```

---

### Step 5: Run tests to verify they pass

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test src/lib/admin-content-blocks.test.ts
```

Expected: PASS (all tests pass)

---

### Step 6: Commit changes

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
git add package.json package-lock.json src/lib/admin-content-blocks.ts src/lib/admin-content-blocks.test.ts
git commit -m "feat: add content block types and helper functions"
```

---

## Task 2: Build ContentBlockEditor Container

**Files:**
- Create: `web/src/components/admin/content-blocks/content-block-editor.tsx`
- Create: `web/src/components/admin/content-blocks/content-block-editor.test.tsx`

---

### Step 1: Write failing test for add block functionality

Create `web/src/components/admin/content-blocks/content-block-editor.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentBlockEditor } from './content-block-editor';
import type { ContentBlock } from '@/lib/admin-content-blocks';

describe('ContentBlockEditor', () => {
  it('renders empty state message when no blocks', () => {
    const onChange = vi.fn();
    render(<ContentBlockEditor blocks={[]} onChange={onChange} />);
    expect(screen.getByText('暂无内容块，点击添加')).toBeTruthy();
  });

  it('renders add button', () => {
    const onChange = vi.fn();
    render(<ContentBlockEditor blocks={[]} onChange={onChange} />);
    expect(screen.getByText('+ 添加内容块')).toBeTruthy();
  });

  it('shows type selection menu when add button clicked', () => {
    const onChange = vi.fn();
    render(<ContentBlockEditor blocks={[]} onChange={onChange} />);
    const addButton = screen.getByText('+ 添加内容块');
    fireEvent.click(addButton);
    expect(screen.getByText('文本块')).toBeTruthy();
    expect(screen.getByText('统计卡片')).toBeTruthy();
  });

  it('calls onChange with new text block when text type selected', () => {
    const onChange = vi.fn();
    render(<ContentBlockEditor blocks={[]} onChange={onChange} />);
    const addButton = screen.getByText('+ 添加内容块');
    fireEvent.click(addButton);
    const textOption = screen.getByText('文本块');
    fireEvent.click(textOption);
    
    expect(onChange).toHaveBeenCalledTimes(1);
    const newBlocks = onChange.mock.calls[0][0];
    expect(newBlocks).toHaveLength(1);
    expect(newBlocks[0].type).toBe('text');
    expect(newBlocks[0].visible).toBe(true);
  });

  it('calls onChange with new stat_card block when stat_card type selected', () => {
    const onChange = vi.fn();
    render(<ContentBlockEditor blocks={[]} onChange={onChange} />);
    const addButton = screen.getByText('+ 添加内容块');
    fireEvent.click(addButton);
    const statOption = screen.getByText('统计卡片');
    fireEvent.click(statOption);
    
    expect(onChange).toHaveBeenCalledTimes(1);
    const newBlocks = onChange.mock.calls[0][0];
    expect(newBlocks).toHaveLength(1);
    expect(newBlocks[0].type).toBe('stat_card');
    expect(newBlocks[0].visible).toBe(true);
  });

  it('renders existing blocks', () => {
    const blocks: ContentBlock[] = [
      {
        id: 'block-1',
        type: 'text',
        order: 0,
        visible: true,
        config: { markdown: '# Hello' },
      },
    ];
    const onChange = vi.fn();
    render(<ContentBlockEditor blocks={blocks} onChange={onChange} />);
    expect(screen.getByText('Text')).toBeTruthy();
  });
});
```

---

### Step 2: Run tests to verify they fail

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test src/components/admin/content-blocks/content-block-editor.test.tsx
```

Expected: FAIL with "Cannot find module './content-block-editor'"

---

### Step 3: Implement ContentBlockEditor component

Create `web/src/components/admin/content-blocks/content-block-editor.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { createDefaultBlock, type ContentBlock } from '@/lib/admin-content-blocks';

type ContentBlockEditorProps = {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
};

export function ContentBlockEditor({ blocks, onChange }: ContentBlockEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const handleAddBlock = (type: 'text' | 'stat_card') => {
    const newBlock = createDefaultBlock(type);
    const updatedBlocks = [...blocks, { ...newBlock, order: blocks.length }];
    onChange(updatedBlocks);
    setShowAddMenu(false);
    setEditingBlockId(newBlock.id);
  };

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = blocks
      .filter(b => b.id !== blockId)
      .map((b, index) => ({ ...b, order: index }));
    onChange(updatedBlocks);
    if (editingBlockId === blockId) {
      setEditingBlockId(null);
    }
  };

  const handleToggleVisibility = (blockId: string) => {
    const updatedBlocks = blocks.map(b =>
      b.id === blockId ? { ...b, visible: !b.visible } : b
    );
    onChange(updatedBlocks);
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    const updatedBlocks = blocks.map(b =>
      b.id === blockId ? { ...b, ...updates } : b
    );
    onChange(updatedBlocks);
  };

  return (
    <div className="space-y-4">
      {blocks.length === 0 && (
        <div className="text-center py-8 text-sm text-[var(--color-text-secondary)]">
          暂无内容块，点击添加
        </div>
      )}

      {/* Block list placeholder - will be implemented in Task 3 */}
      {blocks.map(block => (
        <div key={block.id} className="border border-[rgb(255_255_255_/10%)] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{block.type}</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleVisibility(block.id)}
                className="text-xs px-2 py-1 rounded bg-[rgb(255_255_255_/5%)] hover:bg-[rgb(255_255_255_/10%)]"
              >
                {block.visible ? '👁' : '👁‍🗨'}
              </button>
              <button
                onClick={() => handleDeleteBlock(block.id)}
                className="text-xs px-2 py-1 rounded bg-[rgb(255_255_255_/5%)] hover:bg-[rgb(255_255_255_/10%)]"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add button */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full border-2 border-dashed border-[rgb(255_255_255_/10%)] rounded-lg py-4 text-sm text-[var(--color-text-secondary)] hover:border-[rgb(255_255_255_/20%)] hover:bg-[rgb(255_255_255_/2%)] transition-colors"
        >
          + 添加内容块
        </button>

        {showAddMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-[rgb(18_18_26_/95%)] border border-[rgb(255_255_255_/10%)] rounded-lg overflow-hidden shadow-lg">
            <button
              onClick={() => handleAddBlock('text')}
              className="w-full px-4 py-3 text-left text-sm hover:bg-[rgb(255_255_255_/5%)] transition-colors"
            >
              文本块
            </button>
            <button
              onClick={() => handleAddBlock('stat_card')}
              className="w-full px-4 py-3 text-left text-sm hover:bg-[rgb(255_255_255_/5%)] transition-colors"
            >
              统计卡片
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Step 4: Run tests to verify they pass

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test src/components/admin/content-blocks/content-block-editor.test.tsx
```

Expected: PASS (all tests pass)

---

### Step 5: Commit changes

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
git add src/components/admin/content-blocks/content-block-editor.tsx src/components/admin/content-blocks/content-block-editor.test.tsx
git commit -m "feat: add ContentBlockEditor container component"
```

---

## Task 3: Build BlockList with DnD

**Files:**
- Create: `web/src/components/admin/content-blocks/block-list.tsx`
- Create: `web/src/components/admin/content-blocks/sortable-block-item.tsx`
- Create: `web/src/components/admin/content-blocks/block-preview.tsx`
- Modify: `web/src/components/admin/content-blocks/content-block-editor.tsx` (integrate BlockList)

---

### Step 1: Implement BlockPreview component

Create `web/src/components/admin/content-blocks/block-preview.tsx`:

```typescript
import type { ContentBlock } from '@/lib/admin-content-blocks';

type BlockPreviewProps = {
  block: ContentBlock;
};

export function BlockPreview({ block }: BlockPreviewProps) {
  if (!block.visible) {
    return (
      <div className="flex items-center justify-center min-h-[60px] text-xs text-[var(--color-text-secondary)] italic">
        已隐藏
      </div>
    );
  }

  if (block.type === 'text') {
    const markdown = block.config.markdown || '';
    const preview = markdown.slice(0, 100);
    return (
      <div className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
        {preview || '空文本块'}
      </div>
    );
  }

  if (block.type === 'stat_card') {
    const items = block.config.items;
    if (items.length === 0) {
      return (
        <div className="text-sm text-[var(--color-text-secondary)] italic">
          暂无统计数据
        </div>
      );
    }
    return (
      <div className="grid grid-cols-3 gap-2">
        {items.slice(0, 3).map((item, idx) => (
          <div key={idx} className="text-center">
            <div className="text-lg font-semibold text-[var(--color-electric-purple)]">
              {item.value}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
```

---

### Step 2: Implement SortableBlockItem component

Create `web/src/components/admin/content-blocks/sortable-block-item.tsx`:

```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ContentBlock } from '@/lib/admin-content-blocks';
import { BlockPreview } from './block-preview';

type SortableBlockItemProps = {
  block: ContentBlock;
  isEditing: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children?: React.ReactNode;
};

export function SortableBlockItem({
  block,
  isEditing,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  children,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex border rounded-lg transition-colors
        ${isDragging ? 'opacity-50' : ''}
        ${isEditing 
          ? 'border-[var(--color-electric-purple)] bg-[rgb(124_58_237_/5%)]' 
          : 'border-[rgb(255_255_255_/10%)] bg-[rgb(255_255_255_/2%)] hover:bg-[rgb(255_255_255_/4%)]'
        }
        ${!block.visible ? 'opacity-60' : ''}
      `}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-8 cursor-grab active:cursor-grabbing text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] select-none"
      >
        ⋮⋮
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(255_255_255_/5%)]">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide">
            {block.type === 'text' ? 'Text' : 'Stat Card'}
          </div>
          <div className="flex gap-1">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[rgb(255_255_255_/10%)] disabled:opacity-30 disabled:cursor-not-allowed"
              title="上移"
            >
              ↑
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[rgb(255_255_255_/10%)] disabled:opacity-30 disabled:cursor-not-allowed"
              title="下移"
            >
              ↓
            </button>
            <button
              onClick={onToggleVisibility}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[rgb(255_255_255_/10%)]"
              title={block.visible ? '隐藏' : '显示'}
            >
              {block.visible ? '👁' : '👁‍🗨'}
            </button>
            <button
              onClick={onEdit}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[rgb(255_255_255_/10%)]"
              title="编辑"
            >
              ✎
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[rgb(255_255_255_/10%)]"
              title="删除"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Preview or Editor */}
        <div className="p-4">
          {isEditing ? children : <BlockPreview block={block} />}
        </div>
      </div>
    </div>
  );
}
```

---

### Step 3: Implement BlockList component

Create `web/src/components/admin/content-blocks/block-list.tsx`:

```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ContentBlock } from '@/lib/admin-content-blocks';
import { SortableBlockItem } from './sortable-block-item';

type BlockListProps = {
  blocks: ContentBlock[];
  editingBlockId: string | null;
  onChange: (blocks: ContentBlock[]) => void;
  onEditBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onToggleVisibility: (blockId: string) => void;
  onUpdateBlock: (blockId: string, updates: Partial<ContentBlock>) => void;
  renderEditor: (block: ContentBlock) => React.ReactNode;
};

export function BlockList({
  blocks,
  editingBlockId,
  onChange,
  onEditBlock,
  onDeleteBlock,
  onToggleVisibility,
  onUpdateBlock,
  renderEditor,
}: BlockListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((b, idx) => ({
        ...b,
        order: idx,
      }));
      onChange(newBlocks);
    }
  };

  const handleMoveUp = (blockId: string) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index > 0) {
      const newBlocks = arrayMove(blocks, index, index - 1).map((b, idx) => ({
        ...b,
        order: idx,
      }));
      onChange(newBlocks);
    }
  };

  const handleMoveDown = (blockId: string) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index < blocks.length - 1) {
      const newBlocks = arrayMove(blocks, index, index + 1).map((b, idx) => ({
        ...b,
        order: idx,
      }));
      onChange(newBlocks);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={blocks.map(b => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              isEditing={editingBlockId === block.id}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
              onEdit={() => onEditBlock(block.id)}
              onDelete={() => {
                if (confirm('确定删除此内容块？')) {
                  onDeleteBlock(block.id);
                }
              }}
              onToggleVisibility={() => onToggleVisibility(block.id)}
              onMoveUp={() => handleMoveUp(block.id)}
              onMoveDown={() => handleMoveDown(block.id)}
            >
              {renderEditor(block)}
            </SortableBlockItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

---

### Step 4: Integrate BlockList into ContentBlockEditor

Modify `web/src/components/admin/content-blocks/content-block-editor.tsx`:

Replace the block list placeholder section with the BlockList component:

```typescript
// Import at the top
import { BlockList } from './block-list';

// Replace the block list placeholder with:
<BlockList
  blocks={blocks}
  editingBlockId={editingBlockId}
  onChange={onChange}
  onEditBlock={setEditingBlockId}
  onDeleteBlock={handleDeleteBlock}
  onToggleVisibility={handleToggleVisibility}
  onUpdateBlock={handleUpdateBlock}
  renderEditor={(block) => (
    <div className="text-sm text-[var(--color-text-secondary)]">
      Editor for {block.type} (will be implemented in Tasks 4 & 5)
    </div>
  )}
/>
```

---

### Step 5: Run all tests to verify

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test
```

Expected: All tests pass

---

### Step 6: Commit changes

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
git add src/components/admin/content-blocks/block-list.tsx src/components/admin/content-blocks/sortable-block-item.tsx src/components/admin/content-blocks/block-preview.tsx src/components/admin/content-blocks/content-block-editor.tsx
git commit -m "feat: add BlockList with drag-and-drop sorting"
```

---

## Task 4: Build TextBlockEditor

**Files:**
- Create: `web/src/components/admin/content-blocks/text-block-editor.tsx`
- Modify: `web/src/components/admin/content-blocks/content-block-editor.tsx` (integrate TextBlockEditor)

---

### Step 1: Implement TextBlockEditor component

Create `web/src/components/admin/content-blocks/text-block-editor.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { TextBlockConfig } from '@/lib/admin-content-blocks';

type TextBlockEditorProps = {
  config: TextBlockConfig;
  onChange: (config: TextBlockConfig) => void;
};

function renderSimpleMarkdown(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold mt-3 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-semibold mt-4 mb-3">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-[rgb(255_255_255_/10%)] rounded text-sm">$1</code>')
    .replace(/^\- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\* (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/^(?!<)(.*$)/gm, '<p class="mb-2">$1</p>');
}

export function TextBlockEditor({ config, onChange }: TextBlockEditorProps) {
  const [markdown, setMarkdown] = useState(config.markdown);

  useEffect(() => {
    setMarkdown(config.markdown);
  }, [config.markdown]);

  const handleChange = (value: string) => {
    setMarkdown(value);
    onChange({ ...config, markdown: value });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs text-[var(--color-text-secondary)] mb-2">
          Markdown 内容
        </label>
        <textarea
          value={markdown}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="输入 Markdown 文本..."
          className="w-full min-h-[200px] p-3 bg-[rgb(0_0_0_/30%)] border border-[rgb(255_255_255_/10%)] rounded-md font-mono text-sm leading-relaxed resize-y focus:outline-none focus:border-[var(--color-electric-purple)]"
        />
      </div>
      <div>
        <label className="block text-xs text-[var(--color-text-secondary)] mb-2">
          预览
        </label>
        <div
          className="w-full min-h-[200px] p-3 bg-[rgb(0_0_0_/20%)] border border-[rgb(255_255_255_/10%)] rounded-md text-sm leading-relaxed overflow-auto"
          dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(markdown) }}
        />
      </div>
    </div>
  );
}
```

---

### Step 2: Integrate TextBlockEditor into ContentBlockEditor

Modify `web/src/components/admin/content-blocks/content-block-editor.tsx`:

```typescript
// Import at the top
import { TextBlockEditor } from './text-block-editor';
import type { TextBlockConfig, StatCardBlockConfig } from '@/lib/admin-content-blocks';

// Update renderEditor function
renderEditor={(block) => {
  if (block.type === 'text') {
    return (
      <TextBlockEditor
        config={block.config as TextBlockConfig}
        onChange={(newConfig) => handleUpdateBlock(block.id, { config: newConfig })}
      />
    );
  }
  if (block.type === 'stat_card') {
    return (
      <div className="text-sm text-[var(--color-text-secondary)]">
        Stat card editor (will be implemented in Task 5)
      </div>
    );
  }
  return null;
}}
```

---

### Step 3: Run tests to verify

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test
```

Expected: All tests pass

---

### Step 4: Commit changes

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
git add src/components/admin/content-blocks/text-block-editor.tsx src/components/admin/content-blocks/content-block-editor.tsx
git commit -m "feat: add TextBlockEditor with markdown preview"
```

---

## Task 5: Build StatCardBlockEditor

**Files:**
- Create: `web/src/components/admin/content-blocks/stat-card-block-editor.tsx`
- Modify: `web/src/components/admin/content-blocks/content-block-editor.tsx` (integrate StatCardBlockEditor)

---

### Step 1: Implement StatCardBlockEditor component

Create `web/src/components/admin/content-blocks/stat-card-block-editor.tsx`:

```typescript
'use client';

import type { StatCardBlockConfig, StatCardItem } from '@/lib/admin-content-blocks';

type StatCardBlockEditorProps = {
  config: StatCardBlockConfig;
  onChange: (config: StatCardBlockConfig) => void;
};

export function StatCardBlockEditor({ config, onChange }: StatCardBlockEditorProps) {
  const handleAddItem = () => {
    const newItem: StatCardItem = { label: '', value: '' };
    onChange({ ...config, items: [...config.items, newItem] });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = config.items.filter((_, i) => i !== index);
    onChange({ ...config, items: newItems });
  };

  const handleUpdateItem = (index: number, field: 'label' | 'value', value: string) => {
    const newItems = config.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange({ ...config, items: newItems });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {config.items.map((item, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={item.label}
              onChange={(e) => handleUpdateItem(index, 'label', e.target.value)}
              placeholder="标签"
              className="flex-1 px-3 py-2 bg-[rgb(255_255_255_/5%)] border border-[rgb(255_255_255_/10%)] rounded text-sm focus:outline-none focus:border-[var(--color-electric-purple)]"
            />
            <input
              type="text"
              value={item.value}
              onChange={(e) => handleUpdateItem(index, 'value', e.target.value)}
              placeholder="数值"
              className="flex-1 px-3 py-2 bg-[rgb(255_255_255_/5%)] border border-[rgb(255_255_255_/10%)] rounded text-sm focus:outline-none focus:border-[var(--color-electric-purple)]"
            />
            <button
              onClick={() => handleRemoveItem(index)}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[rgb(255_255_255_/10%)]"
              title="删除"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {config.items.length === 0 && (
        <div className="text-center py-4 text-sm text-[var(--color-text-secondary)] italic">
          暂无统计数据
        </div>
      )}

      <button
        onClick={handleAddItem}
        className="w-full py-2 border border-dashed border-[rgb(255_255_255_/10%)] rounded text-sm text-[var(--color-text-secondary)] hover:border-[rgb(255_255_255_/20%)] hover:bg-[rgb(255_255_255_/2%)] transition-colors"
      >
        + 添加统计项
      </button>

      {config.items.length > 6 && (
        <div className="text-xs text-[var(--color-text-tertiary)]">
          💡 建议 3-6 个统计项以获得最佳显示效果
        </div>
      )}
    </div>
  );
}
```

---

### Step 2: Integrate StatCardBlockEditor into ContentBlockEditor

Modify `web/src/components/admin/content-blocks/content-block-editor.tsx`:

```typescript
// Import at the top
import { StatCardBlockEditor } from './stat-card-block-editor';

// Update renderEditor function
renderEditor={(block) => {
  if (block.type === 'text') {
    return (
      <TextBlockEditor
        config={block.config as TextBlockConfig}
        onChange={(newConfig) => handleUpdateBlock(block.id, { config: newConfig })}
      />
    );
  }
  if (block.type === 'stat_card') {
    return (
      <StatCardBlockEditor
        config={block.config as StatCardBlockConfig}
        onChange={(newConfig) => handleUpdateBlock(block.id, { config: newConfig })}
      />
    );
  }
  return null;
}}
```

---

### Step 3: Run tests to verify

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test
```

Expected: All tests pass

---

### Step 4: Commit changes

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
git add src/components/admin/content-blocks/stat-card-block-editor.tsx src/components/admin/content-blocks/content-block-editor.tsx
git commit -m "feat: add StatCardBlockEditor for items list editing"
```

---

## Task 6: Integrate into AssetEditorForm

**Files:**
- Modify: `web/src/lib/admin-asset-editor.ts` (extend draft type)
- Modify: `web/src/app/admin/assets/[id]/edit/page.tsx` (add 5th Card)
- Modify: `web/src/lib/admin-asset-editor.test.ts` (update tests)

---

### Step 1: Extend AssetEditorDraft type

Modify `web/src/lib/admin-asset-editor.ts`:

```typescript
import type { ContentBlock } from './admin-content-blocks';
import { validateBlock } from './admin-content-blocks';

// Add to AssetEditorDraft type
export type AssetEditorDraft = {
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
  contentBlocks: ContentBlock[]; // NEW
};

// Add to INITIAL_DRAFT
export const INITIAL_DRAFT: AssetEditorDraft = {
  slug: '',
  title: '',
  subtitle: '',
  shortDescription: '',
  cloudProviders: [],
  industries: [],
  technologies: [],
  assetType: 'solution',
  status: 'draft',
  visibility: 'public',
  allowedRoles: [],
  allowedUsers: [],
  contentBlocks: [], // NEW
};

// Update buildPayload
export function buildPayload(draft: AssetEditorDraft) {
  return {
    slug: draft.slug.trim(),
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim() || null,
    short_description: draft.shortDescription.trim(),
    cloud_providers: draft.cloudProviders.map(s => s.trim()).filter(Boolean),
    industries: draft.industries.map(s => s.trim()).filter(Boolean),
    technologies: draft.technologies.map(s => s.trim()).filter(Boolean),
    asset_type: draft.assetType,
    status: draft.status,
    visibility: draft.visibility,
    allowed_roles: draft.allowedRoles.map(s => s.trim()).filter(Boolean),
    allowed_users: draft.allowedUsers.map(s => s.trim()).filter(Boolean),
    content_blocks: draft.contentBlocks.map((block, index) => ({
      ...block,
      order: index,
    })),
  };
}

// Update parseAssetToDraft
export function parseAssetToDraft(asset: any): AssetEditorDraft {
  const contentBlocks = Array.isArray(asset.content_blocks)
    ? asset.content_blocks
        .map(validateBlock)
        .sort((a, b) => a.order - b.order)
    : [];

  return {
    slug: asset.slug || '',
    title: asset.title || '',
    subtitle: asset.subtitle || '',
    shortDescription: asset.short_description || '',
    cloudProviders: Array.isArray(asset.cloud_providers) ? asset.cloud_providers : [],
    industries: Array.isArray(asset.industries) ? asset.industries : [],
    technologies: Array.isArray(asset.technologies) ? asset.technologies : [],
    assetType: asset.asset_type || 'solution',
    status: asset.status || 'draft',
    visibility: asset.visibility || 'public',
    allowedRoles: Array.isArray(asset.allowed_roles) ? asset.allowed_roles : [],
    allowedUsers: Array.isArray(asset.allowed_users) ? asset.allowed_users : [],
    contentBlocks,
  };
}
```

---

### Step 2: Update tests for new draft structure

Modify `web/src/lib/admin-asset-editor.test.ts`:

Add `contentBlocks: []` to all test fixtures that use `validDraft`.

---

### Step 3: Add ContentBlockEditor to AssetEditorForm

Modify `web/src/app/admin/assets/[id]/edit/page.tsx`:

```typescript
// Import at the top
import { ContentBlockEditor } from '@/components/admin/content-blocks/content-block-editor';

// Add 5th Card after Access Control Card
<div className="border border-[rgb(212_218_245_/12%)] rounded-2xl p-6">
  <div className="mb-4">
    <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
      CONTENT BLOCKS
    </div>
    <div className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
      内容块
    </div>
  </div>
  <ContentBlockEditor
    blocks={draft.contentBlocks}
    onChange={(blocks) => updateField('contentBlocks', blocks)}
  />
</div>
```

---

### Step 4: Run tests to verify

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test
```

Expected: All tests pass

---

### Step 5: Build project to verify no TypeScript errors

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run build
```

Expected: Build succeeds with no errors

---

### Step 6: Commit changes

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
git add src/lib/admin-asset-editor.ts src/lib/admin-asset-editor.test.ts src/app/admin/assets/[id]/edit/page.tsx
git commit -m "feat: integrate ContentBlockEditor into AssetEditorForm"
```

---

## Task 7: Integration Testing & Manual Verification

**Files:**
- None (testing only)

---

### Step 1: Run all tests

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test
```

Expected: All tests pass

---

### Step 2: Start development server

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run dev
```

Open: `http://localhost:3000`

---

### Step 3: Test create flow

1. Navigate to `/admin/assets/new`
2. Fill in required fields (slug, title, shortDescription)
3. Scroll to "内容块" section
4. Click "+ 添加内容块"
5. Select "文本块"
6. Enter markdown: `# Hello World\n\nThis is a test.`
7. Verify preview shows rendered markdown
8. Click "+ 添加内容块"
9. Select "统计卡片"
10. Click "+ 添加统计项" 3 times
11. Fill in label/value pairs
12. Click "保存"
13. Verify asset created with content_blocks

---

### Step 4: Test edit flow

1. Navigate to `/admin/assets`
2. Click "编辑" on an asset
3. Verify content blocks load correctly
4. Edit a text block
5. Verify preview updates
6. Edit stat card items
7. Verify items update
8. Drag a block to reorder
9. Verify order changes
10. Click ↑↓ buttons to reorder
11. Verify order changes
12. Click 👁 to toggle visibility
13. Verify block shows as hidden
14. Click ✕ to delete a block
15. Confirm deletion
16. Verify block removed
17. Click "保存"
18. Verify changes saved

---

### Step 5: Test edge cases

1. Empty content blocks list
2. Single block (↑↓ buttons disabled)
3. Many blocks (>6 stat items shows warning)
4. Invalid block data (should be validated)
5. Toggle visibility on all blocks
6. Delete all blocks

---

### Step 6: Verify data persistence

1. Create asset with content blocks
2. Reload page
3. Verify content blocks still there
4. Edit and save
5. Reload page
6. Verify edits persisted

---

### Step 7: Commit final changes (if any)

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
git status
# If there are changes:
git add .
git commit -m "fix: content block editor integration fixes"
```

---

## Success Criteria Checklist

- ✅ Can add text and stat_card blocks
- ✅ Can edit text block with markdown preview
- ✅ Can edit stat card items
- ✅ Can drag blocks to reorder
- ✅ Can use ↑↓ buttons to reorder
- ✅ Can toggle block visibility
- ✅ Can delete blocks
- ✅ 5th Card appears in edit page
- ✅ content_blocks saved to API correctly
- ✅ content_blocks loaded from API correctly
- ✅ All tests pass
- ✅ Build succeeds
