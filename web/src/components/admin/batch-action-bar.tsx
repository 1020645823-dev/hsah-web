"use client";

import { Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

type BatchActionBarProps = {
  selectedCount: number;
  onDelete: () => void;
  onClear: () => void;
};

export function BatchActionBar({ selectedCount, onDelete, onClear }: BatchActionBarProps) {
  const t = useTranslations("Admin");

  if (selectedCount <= 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/95%)] px-5 py-3 shadow-2xl backdrop-blur-[24px]">
      <span className="text-sm text-[var(--color-text-primary)]">
        {t("batchActionBar.selectedCount", { count: selectedCount })}
      </span>
      <div className="h-4 w-px bg-[rgb(212_218_245_/12%)]" />
      <button
        type="button"
        onClick={onDelete}
        className="flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition-colors duration-150 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-400/50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {t("batchActionBar.delete")}
      </button>
      <button
        type="button"
        onClick={onClear}
        className="flex items-center gap-1.5 rounded-md border border-[rgb(212_218_245_/12%)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50"
      >
        <X className="h-3.5 w-3.5" />
        {t("batchActionBar.clearSelection")}
      </button>
    </div>
  );
}
