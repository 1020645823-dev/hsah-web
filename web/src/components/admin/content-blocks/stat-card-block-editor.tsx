"use client";

import type { StatCardBlockConfig, StatCardItem } from "@/lib/admin-content-blocks";
import { X, Plus } from "lucide-react";

interface StatCardBlockEditorProps {
  config: StatCardBlockConfig;
  onChange: (config: StatCardBlockConfig) => void;
}

export function StatCardBlockEditor({ config, onChange }: StatCardBlockEditorProps) {
  const items = config.items;

  const handleAddItem = () => {
    onChange({ items: [...items, { label: "", value: "" }] });
  };

  const handleDeleteItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange({ items: next });
  };

  const handleItemChange = (index: number, field: keyof StatCardItem, fieldValue: string) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: fieldValue } : item,
    );
    onChange({ items: next });
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div
          className="text-center py-6 text-sm text-[var(--color-text-secondary)] italic"
          data-testid="stat-card-empty-state"
        >
          暂无统计项，点击下方按钮添加
        </div>
      )}

      {items.length > 6 && (
        <div
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
          data-testid="stat-card-warning"
        >
          建议不超过 6 个统计项，当前有 {items.length} 个
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2"
            data-testid={`stat-card-item-${index}`}
          >
            <input
              className="flex-1 rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
              type="text"
              value={item.label}
              onChange={(e) => handleItemChange(index, "label", e.target.value)}
              placeholder="标签"
              data-testid={`stat-card-item-label-${index}`}
            />
            <input
              className="flex-1 rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
              type="text"
              value={item.value}
              onChange={(e) => handleItemChange(index, "value", e.target.value)}
              placeholder="数值"
              data-testid={`stat-card-item-value-${index}`}
            />
            <button
              type="button"
              onClick={() => handleDeleteItem(index)}
              className="shrink-0 rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[rgb(255_255_255_/5%)] hover:text-red-400 transition-colors"
              data-testid={`stat-card-item-delete-${index}`}
              aria-label={`删除第 ${index + 1} 项`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddItem}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[rgb(255_255_255_/10%)] py-2.5 text-sm text-[var(--color-text-secondary)] hover:border-[rgb(255_255_255_/20%)] hover:bg-[rgb(255_255_255_/2%)] transition-colors"
        data-testid="stat-card-add-item"
      >
        <Plus className="h-4 w-4" />
        添加统计项
      </button>
    </div>
  );
}
