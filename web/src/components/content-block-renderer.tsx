"use client";

import { Info, AlertTriangle, AlertCircle, Lightbulb } from "lucide-react";
import Image from "next/image";
import type { ContentBlock } from "@/lib/admin-content-blocks";

const calloutVariantStyles = {
  info: {
    border: "border-l-blue-500",
    icon: Info,
    iconColor: "text-blue-400",
    bg: "bg-blue-500/5",
  },
  warning: {
    border: "border-l-yellow-500",
    icon: AlertTriangle,
    iconColor: "text-yellow-400",
    bg: "bg-yellow-500/5",
  },
  error: {
    border: "border-l-red-500",
    icon: AlertCircle,
    iconColor: "text-red-400",
    bg: "bg-red-500/5",
  },
  success: {
    border: "border-l-green-500",
    icon: Lightbulb,
    iconColor: "text-green-400",
    bg: "bg-green-500/5",
  },
  tip: {
    border: "border-l-green-500",
    icon: Lightbulb,
    iconColor: "text-green-400",
    bg: "bg-green-500/5",
  },
};

function TextBlock({ html, markdown }: { html?: string; markdown?: string }) {
  const content = html || markdown || "";
  return (
    <div
      className="prose-invert max-w-none space-y-2 text-sm leading-7 text-[var(--color-text-secondary)] [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-[var(--color-text-primary)] [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--color-text-primary)] [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-[var(--color-text-primary)] [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_a]:text-[var(--color-electric-purple)] [&_a]:underline [&_strong]:text-[var(--color-text-primary)]"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

function StatCardBlock({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/72%)] px-5 py-5 shadow-[var(--shadow-card)] backdrop-blur-[24px]"
        >
          <div className="text-2xl font-semibold text-[var(--color-text-primary)]">{item.value}</div>
          <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function ImageBlock({
  url,
  alt,
  caption,
  width,
}: {
  url: string;
  alt: string;
  caption?: string;
  width?: number;
}) {
  return (
    <figure className="space-y-3">
      <Image
        src={url}
        alt={alt}
        width={800}
        height={600}
        className="rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/72%)]"
        style={{ maxWidth: width ? `${width}%` : "100%", height: "auto" }}
        unoptimized
      />
      {caption ? (
        <figcaption className="text-center text-sm text-[var(--color-text-tertiary)]">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

function CodeSnippetBlock({
  language,
  filename,
  code,
  showLineNumbers,
}: {
  language: string;
  filename?: string;
  code: string;
  showLineNumbers: boolean;
}) {
  const lines = code.split("\n");
  return (
    <div className="overflow-hidden rounded-xl border border-[rgb(212_218_245_/12%)] bg-[rgb(10_12_18_/90%)]">
      <div className="flex items-center justify-between border-b border-[rgb(212_218_245_/10%)] px-4 py-2">
        <span className="text-xs font-medium text-[var(--color-text-tertiary)]">{language}</span>
        {filename ? (
          <span className="text-xs font-medium text-[var(--color-text-tertiary)]">{filename}</span>
        ) : null}
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="font-mono text-sm leading-6">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="flex">
                {showLineNumbers ? (
                  <span className="mr-4 inline-block w-8 select-none text-right text-[var(--color-text-tertiary)]">
                    {idx + 1}
                  </span>
                ) : null}
                <span className="text-[var(--color-text-secondary)]">{line || " "}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

function CalloutBlock({
  tone,
  title,
  content,
}: {
  tone: "info" | "warning" | "error" | "success" | "tip";
  title?: string;
  content: string;
}) {
  const style = calloutVariantStyles[tone];
  const Icon = style.icon;
  return (
    <div
      className={`rounded-r-xl border-l-4 ${style.border} ${style.bg} px-5 py-4`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${style.iconColor}`} />
        {title ? (
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</span>
        ) : (
          <span className="text-sm font-semibold capitalize text-[var(--color-text-primary)]">{tone}</span>
        )}
      </div>
      <div className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{content}</div>
    </div>
  );
}

interface ContentBlockRendererProps {
  blocks: ContentBlock[];
}

export function ContentBlockRenderer({ blocks }: ContentBlockRendererProps) {
  const visibleBlocks = blocks
    .filter((b) => b.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      {visibleBlocks.map((block) => {
        switch (block.type) {
          case "text": {
            const cfg = block.config as { markdown?: string; html?: string };
            return (
              <div key={block.id}>
                <TextBlock html={cfg.html} markdown={cfg.markdown} />
              </div>
            );
          }
          case "stat_card": {
            const cfg = block.config as {
              stats?: Array<{ label: string; value: string }>;
              items?: Array<{ label: string; value: string }>;
            };
            const items = cfg.stats ?? cfg.items ?? [];
            return (
              <div key={block.id}>
                <StatCardBlock items={items} />
              </div>
            );
          }
          case "image": {
            const cfg = block.config as {
              src?: string;
              url?: string;
              alt: string;
              caption?: string;
              width?: number;
            };
            const url = cfg.src ?? cfg.url ?? "";
            return (
              <div key={block.id}>
                <ImageBlock url={url} alt={cfg.alt} caption={cfg.caption} width={cfg.width} />
              </div>
            );
          }
          case "code_snippet": {
            const cfg = block.config as {
              language: string;
              code: string;
              filename?: string;
              showLineNumbers?: boolean;
            };
            return (
              <div key={block.id}>
                <CodeSnippetBlock
                  language={cfg.language}
                  filename={cfg.filename}
                  code={cfg.code}
                  showLineNumbers={cfg.showLineNumbers ?? true}
                />
              </div>
            );
          }
          case "callout": {
            const cfg = block.config as {
              tone?: "info" | "warning" | "success" | "error";
              variant?: "info" | "warning" | "error" | "tip";
              title?: string;
              content: string;
            };
            let tone = cfg.tone ?? cfg.variant ?? "info";
            if (tone === "tip") tone = "success";
            return (
              <div key={block.id}>
                <CalloutBlock tone={tone} title={cfg.title} content={cfg.content} />
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
