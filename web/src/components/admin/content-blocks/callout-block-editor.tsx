"use client";

import type { CalloutBlockConfig } from "@/lib/admin-content-blocks";
import { getFieldError, type BlockFieldError } from "@/lib/content-block-errors";
import { Info, AlertTriangle, XCircle, Lightbulb } from "lucide-react";

interface CalloutBlockEditorProps {
  config: CalloutBlockConfig;
  onChange: (config: CalloutBlockConfig) => void;
  errors?: BlockFieldError[];
}

const variants = [
  { value: "info" as const, label: "信息", icon: Info, color: "blue" },
  { value: "warning" as const, label: "警告", icon: AlertTriangle, color: "amber" },
  { value: "error" as const, label: "错误", icon: XCircle, color: "red" },
  { value: "tip" as const, label: "提示", icon: Lightbulb, color: "green" },
];

type CalloutVariantOption = (typeof variants)[number]["value"];

const variantStyles = {
  info: {
    border: "border-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
  },
  warning: {
    border: "border-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
  },
  error: {
    border: "border-red-500",
    bg: "bg-red-500/10",
    text: "text-red-400",
  },
  tip: {
    border: "border-green-500",
    bg: "bg-green-500/10",
    text: "text-green-400",
  },
};

export function CalloutBlockEditor({ config, onChange, errors }: CalloutBlockEditorProps) {
  const toneError = getFieldError(errors, "config.tone");
  const titleError = getFieldError(errors, "config.title");
  const contentError = getFieldError(errors, "config.content");

  const handleVariantChange = (variant: CalloutVariantOption) => {
    onChange({ ...config, tone: variant === "tip" ? "success" : variant });
  };

  const handleTitleChange = (title: string) => {
    onChange({ ...config, title });
  };

  const handleContentChange = (content: string) => {
    onChange({ ...config, content });
  };

  const selectedVariant: CalloutVariantOption = config.tone === "success" ? "tip" : config.tone;
  const currentVariant = variants.find((variant) => variant.value === selectedVariant) || variants[0];
  const styles = variantStyles[selectedVariant];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          类型
        </label>
        <div className="flex gap-2" data-testid="callout-variant-buttons">
          {variants.map((variant) => {
            const Icon = variant.icon;
            const isSelected = selectedVariant === variant.value;
            return (
              <button
                key={variant.value}
                type="button"
                onClick={() => handleVariantChange(variant.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? "border-2 border-[var(--color-electric-purple)] bg-[var(--color-electric-purple)]/10 text-[var(--color-text-primary)]"
                    : "border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] text-[var(--color-text-secondary)] hover:border-[rgb(255_255_255_/20%)] hover:bg-[rgb(255_255_255_/2%)]"
                }`}
                data-testid={`callout-variant-${variant.value}`}
                aria-label={variant.label}
              >
                <Icon className="h-4 w-4" />
                {variant.label}
              </button>
            );
          })}
        </div>
        {toneError && <p className="text-xs text-red-400">{toneError}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          标题 <span className="text-[var(--color-text-secondary)]/60">(可选)</span>
        </label>
        <input
          type="text"
          value={config.title || ""}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
          placeholder="输入标题..."
          data-testid="callout-title-input"
        />
        {titleError && <p className="text-xs text-red-400">{titleError}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          内容
        </label>
        <textarea
          value={config.content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-electric-purple)] focus:outline-none min-h-[100px] resize-y"
          placeholder="输入内容..."
          data-testid="callout-content-textarea"
        />
        {contentError && <p className="text-xs text-red-400">{contentError}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          预览
        </label>
        <div
          className={`rounded-lg border-l-4 ${styles.border} ${styles.bg} px-4 py-3`}
          data-testid="callout-preview"
        >
          <div className="flex items-start gap-3">
            <currentVariant.icon className={`h-5 w-5 shrink-0 ${styles.text} mt-0.5`} />
            <div className="space-y-1">
              {config.title && (
                <div className={`text-sm font-medium ${styles.text}`}>
                  {config.title}
                </div>
              )}
              <div className="text-sm text-[var(--color-text-primary)]">
                {config.content || (
                  <span className="text-[var(--color-text-secondary)] italic">
                    暂无内容
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
