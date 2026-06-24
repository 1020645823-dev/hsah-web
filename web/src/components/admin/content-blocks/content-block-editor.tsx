"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { ContentBlock, TextBlockConfig } from "@/lib/admin-content-blocks";
import { createDefaultBlock } from "@/lib/admin-content-blocks";
import { BlockList } from "./block-list";
import { TextBlockEditor } from "./text-block-editor";

interface ContentBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export function ContentBlockEditor({ blocks, onChange }: ContentBlockEditorProps) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleAddBlock = (type: "text" | "stat_card") => {
    const newBlock = createDefaultBlock(type);
    onChange([...blocks, newBlock]);
    setEditingBlockId(newBlock.id);
    setShowAddMenu(false);
  };

  const handleEditBlock = (blockId: string) => {
    setEditingBlockId(editingBlockId === blockId ? null : blockId);
  };

  const handleDeleteBlock = (blockId: string) => {
    const filtered = blocks.filter((b) => b.id !== blockId);
    const reordered = filtered.map((b, idx) => ({ ...b, order: idx }));
    onChange(reordered);
    if (editingBlockId === blockId) {
      setEditingBlockId(null);
    }
  };

  const handleToggleVisibility = (blockId: string) => {
    const updated = blocks.map((b) =>
      b.id === blockId ? { ...b, visible: !b.visible } : b
    );
    onChange(updated);
  };

  const handleMoveUp = (blockId: string) => {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index <= 0) return;
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    onChange(newBlocks.map((b, idx) => ({ ...b, order: idx })));
  };

  const handleMoveDown = (blockId: string) => {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index < 0 || index >= blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    onChange(newBlocks.map((b, idx) => ({ ...b, order: idx })));
  };

  const handleBlockConfigChange = (blockId: string, newConfig: TextBlockConfig) => {
    const updated = blocks.map((b) =>
      b.id === blockId ? { ...b, config: newConfig } : b
    );
    onChange(updated);
  };

  const renderEditor = (block: ContentBlock): ReactNode => {
    if (block.type === "text") {
      return (
        <TextBlockEditor
          config={block.config as TextBlockConfig}
          onChange={(newConfig) => handleBlockConfigChange(block.id, newConfig)}
        />
      );
    }
    return (
      <div className="text-sm text-[var(--color-text-secondary)]">
        Editor placeholder for {block.type}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <BlockList
        blocks={blocks}
        editingBlockId={editingBlockId}
        onChange={onChange}
        onEdit={handleEditBlock}
        onDelete={handleDeleteBlock}
        onToggleVisibility={handleToggleVisibility}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        renderEditor={renderEditor}
      />

      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full py-3 border-2 border-dashed border-[rgb(255_255_255_/10%)] rounded-lg text-[var(--color-text-secondary)] hover:border-[rgb(255_255_255_/20%)] hover:bg-[rgb(255_255_255_/2%)] transition-colors"
        >
          + 添加内容块
        </button>
        {showAddMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 border border-[rgb(255_255_255_/10%)] rounded-lg bg-[rgb(18_18_26_/95%)] shadow-lg z-10">
            <button
              onClick={() => handleAddBlock("text")}
              className="w-full px-4 py-3 text-left text-sm hover:bg-[rgb(255_255_255_/5%)] transition-colors"
            >
              文本块
            </button>
            <button
              onClick={() => handleAddBlock("stat_card")}
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
