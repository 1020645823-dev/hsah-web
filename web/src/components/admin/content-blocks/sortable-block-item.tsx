"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ContentBlock } from "@/lib/admin-content-blocks";
import { Copy } from "lucide-react";
import { BlockPreview } from "./block-preview";

interface SortableBlockItemProps {
  block: ContentBlock;
  isEditing: boolean;
  index: number;
  totalCount: number;
  errorCount?: number;
  children?: ReactNode;
  onEdit: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onToggleVisibility: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  onCopy: (blockId: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  text: "Text",
  stat_card: "Stat Card",
  image: "Image",
  code_snippet: "Code Snippet",
  callout: "Callout",
};

export function SortableBlockItem({
  block,
  isEditing,
  index,
  totalCount,
  errorCount = 0,
  children,
  onEdit,
  onDelete,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onCopy,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const borderColor = errorCount > 0
    ? "border-red-500/40"
    : isEditing
      ? "border-[rgb(139_92_246_/60%)]"
      : "border-[rgb(255_255_255_/10%)]";

  const opacity = isDragging
    ? "opacity-50"
    : !block.visible
      ? "opacity-60"
      : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border ${borderColor} rounded-lg p-4 bg-[rgb(255_255_255_/2%)] ${opacity}`}
      data-testid={`block-item-${block.id}`}
    >
      <div
        className="flex items-center justify-between mb-2 cursor-grab"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {TYPE_LABELS[block.type] ?? block.type}
          </span>
          {errorCount > 0 && (
            <span
              className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-200"
              data-testid={`block-error-${block.id}`}
            >
              {errorCount} 个错误
            </span>
          )}
          {!block.visible && (
            <span className="text-xs text-[var(--color-text-secondary)]">
              (已隐藏)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onMoveUp(block.id)}
            disabled={index === 0}
            className="px-2 py-1 text-xs border border-[rgb(255_255_255_/10%)] rounded hover:bg-[rgb(255_255_255_/5%)] disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => onMoveDown(block.id)}
            disabled={index === totalCount - 1}
            className="px-2 py-1 text-xs border border-[rgb(255_255_255_/10%)] rounded hover:bg-[rgb(255_255_255_/5%)] disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            onClick={() => onToggleVisibility(block.id)}
            className="px-2 py-1 text-xs border border-[rgb(255_255_255_/10%)] rounded hover:bg-[rgb(255_255_255_/5%)]"
            aria-label="Toggle visibility"
          >
            {block.visible ? "👁" : "👁‍🗨"}
          </button>
          <button
            onClick={() => onCopy(block.id)}
            title="复制"
            className="px-2 py-1 text-xs border border-[rgb(255_255_255_/10%)] rounded hover:bg-[rgb(255_255_255_/5%)]"
            aria-label="Copy block"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={() => onEdit(block.id)}
            className="px-2 py-1 text-xs border border-[rgb(255_255_255_/10%)] rounded hover:bg-[rgb(255_255_255_/5%)]"
            aria-label="Edit block"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(block.id)}
            className="px-2 py-1 text-xs border border-[rgb(255_255_255_/10%)] rounded hover:bg-[rgb(255_255_255_/5%)]"
            aria-label="Delete block"
          >
            ✕
          </button>
        </div>
      </div>

      {isEditing && children ? (
        <div className="mt-4 pt-4 border-t border-[rgb(255_255_255_/10%)]">
          {children}
        </div>
      ) : (
        <div className="mt-2">
          <BlockPreview block={block} />
        </div>
      )}
    </div>
  );
}
