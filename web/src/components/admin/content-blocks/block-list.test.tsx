import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BlockList } from './block-list';
import type { ContentBlock } from '@/lib/admin-content-blocks';

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  PointerSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  })),
  verticalListSortingStrategy: {},
  arrayMove: vi.fn((arr: unknown[], from: number, to: number) => {
    const result = [...arr];
    const [item] = result.splice(from, 1);
    result.splice(to, 0, item);
    return result;
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Translate: { toString: () => undefined },
  },
}));

describe('BlockList', () => {
  const mockBlocks: ContentBlock[] = [
    {
      id: 'block-1',
      type: 'text',
      order: 0,
      visible: true,
      config: { markdown: 'First block content' },
    },
    {
      id: 'block-2',
      type: 'stat_card',
      order: 1,
      visible: true,
      config: { items: [{ label: 'Stat 1', value: '100' }] },
    },
  ];

  const defaultProps = {
    blocks: mockBlocks,
    editingBlockId: null,
    onChange: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleVisibility: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    renderEditor: (block: ContentBlock) => (
      <div>Editor for {block.type}</div>
    ),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('渲染', () => {
    it('应该渲染空状态', () => {
      render(<BlockList {...defaultProps} blocks={[]} />);
      expect(screen.getByText('暂无内容块，点击添加')).toBeInTheDocument();
    });

    it('应该渲染所有块的类型标签', () => {
      render(<BlockList {...defaultProps} />);
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Stat Card')).toBeInTheDocument();
    });

    it('应该显示 text 块的内容预览', () => {
      render(<BlockList {...defaultProps} />);
      expect(screen.getByText('First block content')).toBeInTheDocument();
    });

    it('应该显示 stat_card 块的统计数据', () => {
      render(<BlockList {...defaultProps} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('隐藏块应该显示已隐藏标记', () => {
      const blocksWithHidden: ContentBlock[] = [
        { ...mockBlocks[0], visible: false },
      ];
      render(<BlockList {...defaultProps} blocks={blocksWithHidden} />);
      expect(screen.getAllByText('(已隐藏)')).toHaveLength(2);
    });
  });

  describe('操作按钮', () => {
    it('点击编辑按钮应该调用 onEdit', () => {
      render(<BlockList {...defaultProps} />);
      const editButtons = screen.getAllByLabelText('Edit block');
      fireEvent.click(editButtons[0]);
      expect(defaultProps.onEdit).toHaveBeenCalledWith('block-1');
    });

    it('点击删除按钮应该调用 onDelete', () => {
      render(<BlockList {...defaultProps} />);
      const deleteButtons = screen.getAllByLabelText('Delete block');
      fireEvent.click(deleteButtons[0]);
      expect(defaultProps.onDelete).toHaveBeenCalledWith('block-1');
    });

    it('点击可见性按钮应该调用 onToggleVisibility', () => {
      render(<BlockList {...defaultProps} />);
      const visibilityButtons = screen.getAllByLabelText('Toggle visibility');
      fireEvent.click(visibilityButtons[0]);
      expect(defaultProps.onToggleVisibility).toHaveBeenCalledWith('block-1');
    });

    it('第一个块的向上移动按钮应该被禁用', () => {
      render(<BlockList {...defaultProps} />);
      const moveUpButtons = screen.getAllByLabelText('Move up');
      expect(moveUpButtons[0]).toBeDisabled();
    });

    it('最后一个块的向下移动按钮应该被禁用', () => {
      render(<BlockList {...defaultProps} />);
      const moveDownButtons = screen.getAllByLabelText('Move down');
      expect(moveDownButtons[1]).toBeDisabled();
    });

    it('点击向上移动按钮应该调用 onMoveUp', () => {
      render(<BlockList {...defaultProps} />);
      const moveUpButtons = screen.getAllByLabelText('Move up');
      fireEvent.click(moveUpButtons[1]);
      expect(defaultProps.onMoveUp).toHaveBeenCalledWith('block-2');
    });

    it('点击向下移动按钮应该调用 onMoveDown', () => {
      render(<BlockList {...defaultProps} />);
      const moveDownButtons = screen.getAllByLabelText('Move down');
      fireEvent.click(moveDownButtons[0]);
      expect(defaultProps.onMoveDown).toHaveBeenCalledWith('block-1');
    });
  });

  describe('编辑状态', () => {
    it('正在编辑的块应该显示编辑器内容', () => {
      render(<BlockList {...defaultProps} editingBlockId="block-1" />);
      expect(screen.getByText('Editor for text')).toBeInTheDocument();
    });

    it('未编辑的块不应该显示编辑器内容', () => {
      render(<BlockList {...defaultProps} editingBlockId="block-2" />);
      expect(screen.queryByText('Editor for text')).not.toBeInTheDocument();
      expect(screen.getByText('Editor for stat_card')).toBeInTheDocument();
    });
  });

  describe('拖拽标识', () => {
    it('每个块应该有唯一的 test-id', () => {
      render(<BlockList {...defaultProps} />);
      const blockItems = screen.getAllByTestId(/block-item-/);
      expect(blockItems).toHaveLength(2);
      expect(blockItems[0]).toHaveAttribute('data-testid', 'block-item-block-1');
      expect(blockItems[1]).toHaveAttribute('data-testid', 'block-item-block-2');
    });
  });
});
