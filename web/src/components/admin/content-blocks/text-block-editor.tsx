"use client";

import { useMemo } from "react";
import type { TextBlockConfig } from "@/lib/admin-content-blocks";
import { getFieldError, type BlockFieldError } from "@/lib/content-block-errors";
import { TiptapEditor } from "./tiptap-editor";

interface TextBlockEditorProps {
  config: TextBlockConfig;
  onChange: (config: TextBlockConfig) => void;
  errors?: BlockFieldError[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-[var(--color-electric-purple)] underline" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return result;
}

export function parseMarkdown(markdown: string): string {
  if (!markdown) return "";

  const lines = markdown.split("\n");
  const htmlLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        htmlLines.push("<ul>");
        inList = true;
      }
      htmlLines.push(`<li>${renderInline(trimmed.slice(2))}</li>`);
      continue;
    }

    if (inList) {
      htmlLines.push("</ul>");
      inList = false;
    }

    if (trimmed.startsWith("### ")) {
      htmlLines.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      htmlLines.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      htmlLines.push(`<h1>${renderInline(trimmed.slice(2))}</h1>`);
    } else if (trimmed === "") {
      htmlLines.push("<br />");
    } else {
      htmlLines.push(`<p>${renderInline(trimmed)}</p>`);
    }
  }

  if (inList) {
    htmlLines.push("</ul>");
  }

  return htmlLines.join("\n");
}

export function TextBlockEditor({ config, onChange, errors }: TextBlockEditorProps) {
  const previewHtml = useMemo(() => {
    if (config.html) return config.html;
    return parseMarkdown(config.markdown);
  }, [config.html, config.markdown]);
  const editorError = getFieldError(errors, ["config.html", "config.markdown"]);

  const handleChange = (html: string) => {
    onChange({ ...config, html });
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          富文本编辑
        </label>
        <TiptapEditor
          content={config.html || parseMarkdown(config.markdown)}
          onChange={handleChange}
        />
        {editorError && (
          <p className="text-xs text-red-400">{editorError}</p>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          预览
        </label>
        <div
          className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-4 py-3 text-sm text-[var(--color-text-primary)] min-h-[200px] overflow-auto"
          data-testid="text-block-editor-preview"
        >
          {previewHtml ? (
            <div
              className="prose-invert space-y-1 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <div className="text-[var(--color-text-secondary)] italic">
              暂无内容
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
