"use client";

import type { ContentBlock } from "@/lib/admin-content-blocks";
import type {
  TextBlockConfig,
  StatCardBlockConfig,
  ImageBlockConfig,
  CodeSnippetBlockConfig,
  CalloutBlockConfig,
} from "@/lib/admin-content-blocks";
import Image from "next/image";
import { ImageIcon, Info, AlertTriangle, XCircle, Lightbulb } from "lucide-react";

const calloutIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: Lightbulb,
} as const;

const calloutColors = {
  info: "border-blue-500 text-blue-400",
  warning: "border-amber-500 text-amber-400",
  error: "border-red-500 text-red-400",
  success: "border-green-500 text-green-400",
} as const;

interface BlockPreviewProps {
  block: ContentBlock;
}

export function BlockPreview({ block }: BlockPreviewProps) {
  if (!block.visible) {
    return (
      <div className="text-sm text-[var(--color-text-secondary)] italic">
        (已隐藏)
      </div>
    );
  }

  if (block.type === "text") {
    const { html, markdown } = block.config as TextBlockConfig;
    if (html) {
      const text = html.replace(/<[^>]+>/g, "");
      const preview = text.length > 100 ? text.slice(0, 100) + "..." : text;
      return (
        <div className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
          {preview || <span className="text-[var(--color-text-secondary)] italic">空文本块</span>}
        </div>
      );
    }
    if (!markdown) {
      return (
        <div className="text-sm text-[var(--color-text-secondary)] italic">
          空文本块
        </div>
      );
    }
    const preview = markdown.length > 100 ? markdown.slice(0, 100) + "..." : markdown;
    return (
      <div className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
        {preview}
      </div>
    );
  }

  if (block.type === "stat_card") {
    const cfg = block.config as StatCardBlockConfig & {
      items?: Array<{ label: string; value: string; description?: string }>;
    };
    const stats = Array.isArray(cfg.stats) ? cfg.stats : cfg.items ?? [];
    if (stats.length === 0) {
      return (
        <div className="text-sm text-[var(--color-text-secondary)] italic">
          空统计卡片
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-3">
        {stats.map((item, idx) => (
          <div key={idx} className="text-sm">
            <span className="text-[var(--color-text-secondary)]">{item.label}: </span>
            <span className="font-medium text-[var(--color-text-primary)]">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "image") {
    const cfg = block.config as ImageBlockConfig & { url?: string };
    const src = cfg.src || cfg.url || "";
    const alt = cfg.alt || "";
    if (!src) {
      return (
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] italic">
          <ImageIcon className="h-4 w-4" />
          未设置图片
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3">
        <Image
          src={src}
          alt={alt || "图片"}
          width={48}
          height={48}
          className="h-12 w-12 rounded object-cover border border-border/80"
          unoptimized
        />
        <div className="text-sm text-[var(--color-text-primary)] truncate max-w-[200px]">
          {alt || src}
        </div>
      </div>
    );
  }

  if (block.type === "code_snippet") {
    const { language, code } = block.config as CodeSnippetBlockConfig;
    if (!code) {
      return (
        <div className="text-sm text-[var(--color-text-secondary)] italic">
          空代码片段
        </div>
      );
    }
    const lines = code.split("\n").slice(0, 3);
    return (
      <div className="space-y-1">
        <span className="inline-block rounded bg-input/50 px-1.5 py-0.5 text-xs text-[var(--color-text-secondary)]">
          {language}
        </span>
        <pre className="overflow-hidden text-xs font-mono text-[var(--color-text-primary)] leading-5 max-h-[60px]">
          <code>{lines.join("\n")}</code>
        </pre>
      </div>
    );
  }

  if (block.type === "callout") {
    const cfg = block.config as CalloutBlockConfig & { variant?: "info" | "warning" | "error" | "tip" };
    const tone = cfg.tone || (cfg.variant === "tip" ? "success" : cfg.variant) || "info";
    const { title, content } = cfg;
    const Icon = calloutIcons[tone];
    const colors = calloutColors[tone];
    const firstLine = content ? (content.split("\n")[0] || content) : "";
    const truncated = firstLine.length > 60 ? firstLine.slice(0, 60) + "..." : firstLine;

    return (
      <div className={`flex items-start gap-2 border-l-4 ${colors} pl-3 py-1`}>
        <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${colors.split(" ")[1]}`} />
        <div className="text-sm text-[var(--color-text-primary)] truncate">
          {title && <span className="font-medium">{title}: </span>}
          {truncated || (
            <span className="text-[var(--color-text-secondary)] italic">暂无内容</span>
          )}
        </div>
      </div>
    );
  }

  return null;
}
