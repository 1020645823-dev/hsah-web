"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { ContentBlock } from "@/lib/admin-content-blocks";
import type { BlockErrorMap } from "@/lib/content-block-errors";
import { SortableBlockItem } from "./sortable-block-item";

interface BlockListProps {
  blocks: ContentBlock[];
  editingBlockId: string | null;
  onChange: (blocks: ContentBlock[]) => void;
  onEdit: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onToggleVisibility: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  onCopy: (blockId: string) => void;
  blockErrors?: BlockErrorMap;
  renderEditor: (block: ContentBlock) => ReactNode;
}

export function BlockList({
  blocks,
  editingBlockId,
  onChange,
  onEdit,
  onDelete,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onCopy,
  blockErrors,
  renderEditor,
}: BlockListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const blockIds = useMemo(
    () => blocks.map((b) => b.id),
    [blocks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      const reordered = arrayMove(blocks, oldIndex, newIndex);
      onChange(reordered.map((b, idx) => ({ ...b, order: idx })));
    },
    [blocks, onChange],
  );

  if (blocks.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-secondary)]">
        暂无内容块，点击添加
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              isEditing={editingBlockId === block.id}
              index={index}
              totalCount={blocks.length}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleVisibility={onToggleVisibility}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onCopy={onCopy}
              errorCount={blockErrors?.[block.id]?.length ?? 0}
            >
              {renderEditor(block)}
            </SortableBlockItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
