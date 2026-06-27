"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  BarChart3,
  Image as ImageIcon,
  Code,
  AlertCircle,
  X,
  LayoutTemplate,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ContentBlock } from "@/lib/admin-content-blocks";
import { listTemplates } from "@/lib/admin-templates";

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (blocks: ContentBlock[]) => void;
  token: string;
}

const BLOCK_TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  stat_card: <BarChart3 className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  code_snippet: <Code className="h-4 w-4" />,
  callout: <AlertCircle className="h-4 w-4" />,
};

const BLOCK_TYPE_LABELS: Record<string, string> = {
  text: "文本",
  stat_card: "统计",
  image: "图片",
  code_snippet: "代码",
  callout: "提示",
};

export function TemplateSelector({ isOpen, onClose, onApply, token }: TemplateSelectorProps) {
  const t = useTranslations("Admin");
  const [templates, setTemplates] = useState<Awaited<ReturnType<typeof listTemplates>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await listTemplates(token);
        setTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isOpen, token]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = (blocks: ContentBlock[]) => {
    const cloned = blocks.map((block, index) => ({
      ...block,
      id: crypto.randomUUID(),
      order: index,
    }));
    onApply(cloned);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/95%)] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <LayoutTemplate className="h-5 w-5 text-[var(--color-electric-purple)]" />
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {t("templateSelector.title")}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[rgb(255_255_255_/5%)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-sm text-[var(--color-text-secondary)]">
            {t("templateSelector.loading")}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && templates.length === 0 && (
          <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
            {t("templateSelector.empty")}
          </div>
        )}

        {!loading && !error && templates.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-xl border border-[rgb(255_255_255_/10%)] bg-[rgb(255_255_255_/3%)] p-4 hover:border-[rgb(123_63_242_/40%)] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-[var(--color-text-primary)]">
                    {template.name}
                  </h3>
                  {template.is_builtin && (
                    <span className="rounded-full bg-[rgb(123_63_242_/18%)] px-2 py-0.5 text-xs text-[var(--color-electric-purple)]">
                      {t("templateSelector.builtin")}
                    </span>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {t("templateSelector.blockCount", { count: template.blocks.length })}
                  </span>
                  <div className="flex gap-1">
                    {template.blocks.map((block, index) => (
                      <span
                        key={index}
                        className="text-[var(--color-text-tertiary)]"
                        title={BLOCK_TYPE_LABELS[block.type] ?? block.type}
                      >
                        {BLOCK_TYPE_ICONS[block.type] ?? <FileText className="h-3 w-3" />}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleApply(template.blocks)}
                  className="w-full rounded-lg bg-[rgb(123_63_242_/25%)] py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[rgb(123_63_242_/35%)] transition-colors"
                >
                  {t("templateSelector.apply")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
