"use client";

import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import type {
  ContentBlock,
  ContentAudience,
  TextBlockConfig,
  StatCardBlockConfig,
  ImageBlockConfig,
  CodeSnippetBlockConfig,
  CalloutBlockConfig,
  ContentBlockType,
} from "@/lib/admin-content-blocks";
import {
  createDefaultBlock,
  searchBlockContent,
  LATEST_CONTENT_BLOCK_VERSION,
} from "@/lib/admin-content-blocks";
import { BlockList } from "./block-list";
import { TextBlockEditor } from "./text-block-editor";
import { StatCardBlockEditor } from "./stat-card-block-editor";
import { ImageBlockEditor } from "./image-block-editor";
import { CodeSnippetBlockEditor } from "./code-snippet-block-editor";
import { CalloutBlockEditor } from "./callout-block-editor";
import { TemplateSelector } from "../template-selector";
import { createTemplate } from "@/lib/admin-templates";
import { BlockClipboardProvider, useBlockClipboard } from "./block-clipboard-context";
import { BlockFilterBar, type FilterState } from "./block-filter-bar";
import { GlobalSearchModal } from "./global-search-modal";
import {
  getErrorSummary,
  type BlockFieldError,
  groupBlockErrors,
} from "@/lib/content-block-errors";

type BlockConfig =
  | TextBlockConfig
  | StatCardBlockConfig
  | ImageBlockConfig
  | CodeSnippetBlockConfig
  | CalloutBlockConfig;

const EMPTY_ERRORS: BlockFieldError[] = [];

interface ContentBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  token?: string;
  errors?: BlockFieldError[];
}

function ContentBlockEditorInner({ blocks, onChange, token, errors }: ContentBlockEditorProps) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>({ keyword: "", type: "all" });
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [dismissedBlockIds, setDismissedBlockIds] = useState<string[]>([]);

  const { copyBlock, pasteBlocks, hasBlocks } = useBlockClipboard();
  const incomingErrors = errors ?? EMPTY_ERRORS;

  const filteredBlocks = useMemo(() => {
    return blocks.filter((block) => {
      if (filter.type !== "all" && block.type !== filter.type) return false;
      if (filter.keyword && !searchBlockContent(block, filter.keyword)) return false;
      return true;
    });
  }, [blocks, filter]);
  const visibleErrors = useMemo(
    () => incomingErrors.filter((error) => !dismissedBlockIds.includes(error.blockId)),
    [dismissedBlockIds, incomingErrors],
  );
  const errorsByBlockId = useMemo(() => groupBlockErrors(visibleErrors), [visibleErrors]);
  const errorSummary = useMemo(() => getErrorSummary(visibleErrors), [visibleErrors]);

  const handleAddBlock = (type: ContentBlockType) => {
    const newBlock = createDefaultBlock(type);
    onChange([...blocks, newBlock]);
    setEditingBlockId(newBlock.id);
    setShowAddMenu(false);
  };

  const handleApplyTemplate = (templateBlocks: ContentBlock[]) => {
    const reordered = [...blocks, ...templateBlocks].map((b, idx) => ({
      ...b,
      order: idx,
    }));
    onChange(reordered);
  };

  const handleSaveTemplate = async () => {
    if (!token || !templateName.trim() || blocks.length === 0) return;
    setSavingTemplate(true);
    setSaveError(null);
    try {
      await createTemplate(token, {
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        blocks,
      });
      setShowSaveTemplateDialog(false);
      setTemplateName("");
      setTemplateDescription("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSavingTemplate(false);
    }
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

  const handleBlockConfigChange = (blockId: string, newConfig: BlockConfig) => {
    setDismissedBlockIds((current) => (
      current.includes(blockId) ? current : [...current, blockId]
    ));
    const updated = blocks.map((b) =>
      b.id === blockId ? { ...b, config: newConfig } : b
    );
    onChange(updated);
  };

  const handleBlockAudienceChange = (blockId: string, audience: ContentAudience) => {
    const updated = blocks.map((b) =>
      b.id === blockId ? { ...b, audience } : b
    );
    onChange(updated);
  };

  const handleCopy = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block) copyBlock(block);
  };

  const handlePaste = () => {
    const copied = pasteBlocks();
    const newBlocks = copied.map((cb) => ({
      id: crypto.randomUUID(),
      type: cb.type,
      version: typeof cb.version === "number" ? cb.version : LATEST_CONTENT_BLOCK_VERSION,
      order: 0,
      visible: true,
      config: cb.config,
    }));
    onChange([...blocks, ...newBlocks]);
  };

  const handleInsertFromSearch = (block: ContentBlock) => {
    onChange([...blocks, block]);
    setShowGlobalSearch(false);
  };

  const renderEditor = (block: ContentBlock): ReactNode => {
    const blockErrors = errorsByBlockId[block.id];
    const audience = block.audience ?? "sales";

    const withAudienceControl = (editor: ReactNode) => (
      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor={`block-audience-${block.id}`} className="block text-xs font-medium text-[var(--color-text-secondary)]">
            Audience
          </label>
          <select
            id={`block-audience-${block.id}`}
            aria-label="Audience"
            value={audience}
            onChange={(event) => handleBlockAudienceChange(block.id, event.target.value as ContentAudience)}
            className="w-full rounded-lg border border-border/80 bg-input/40 px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[rgb(139_92_246_/60%)]"
          >
            <option value="shared">Shared</option>
            <option value="sales">Sales</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        {editor}
      </div>
    );

    if (block.type === "text") {
      return withAudienceControl(
        <TextBlockEditor
          config={block.config as TextBlockConfig}
          errors={blockErrors}
          onChange={(newConfig) => handleBlockConfigChange(block.id, newConfig)}
        />
      );
    }
    if (block.type === "stat_card") {
      const config = block.config as StatCardBlockConfig;
      const stats = Array.isArray(config.stats)
        ? config.stats
        : ((block.config as unknown as {
            items?: Array<{ label: string; value: string; description?: string }>;
          }).items ?? []);
      return withAudienceControl(
        <StatCardBlockEditor
          config={{
            items: stats.map((item) => ({
              label: item.label,
              value: item.value,
            })),
          } as unknown as StatCardBlockConfig}
          errors={blockErrors}
          onChange={(newConfig) => {
            const legacyConfig = newConfig as unknown as {
              items?: Array<{ label: string; value: string; description?: string }>;
            };
            handleBlockConfigChange(block.id, {
              title: config.title,
              stats: Array.isArray(legacyConfig.items)
                ? legacyConfig.items.map((item, index) => ({
                    label: item.label,
                    value: item.value,
                    description: stats[index]?.description ?? item.description ?? "",
                  }))
                : [],
            });
          }}
        />
      );
    }
    if (block.type === "image") {
      const config = block.config as ImageBlockConfig;
      const src = config.src || ((block.config as unknown as { url?: string }).url ?? "");
      return withAudienceControl(
        <ImageBlockEditor
          config={{
            url: src,
            alt: config.alt,
            caption: config.caption,
          } as unknown as ImageBlockConfig}
          errors={blockErrors}
          onChange={(newConfig) => {
            const legacyConfig = newConfig as unknown as {
              url?: string;
              alt?: string;
              caption?: string;
            };
            handleBlockConfigChange(block.id, {
              src: typeof legacyConfig.url === "string" ? legacyConfig.url : "",
              alt: typeof legacyConfig.alt === "string" ? legacyConfig.alt : "",
              caption: typeof legacyConfig.caption === "string" ? legacyConfig.caption : "",
            });
          }}
          token={token ?? ""}
        />
      );
    }
    if (block.type === "code_snippet") {
      const config = block.config as CodeSnippetBlockConfig;
      return withAudienceControl(
        <CodeSnippetBlockEditor
          config={{
            language: config.language,
            code: config.code,
            showLineNumbers: config.showLineNumbers ?? true,
          }}
          errors={blockErrors}
          onChange={(newConfig) => {
            const legacyConfig = newConfig as unknown as {
              language?: string;
              code?: string;
              showLineNumbers?: boolean;
            };
            handleBlockConfigChange(block.id, {
              language: typeof legacyConfig.language === "string" ? legacyConfig.language : "plaintext",
              code: typeof legacyConfig.code === "string" ? legacyConfig.code : "",
              showLineNumbers:
                typeof legacyConfig.showLineNumbers === "boolean"
                  ? legacyConfig.showLineNumbers
                  : (config.showLineNumbers ?? true),
            });
          }}
        />
      );
    }
    if (block.type === "callout") {
      const config = block.config as CalloutBlockConfig;
      return withAudienceControl(
        <CalloutBlockEditor
          config={{
            tone:
              config.tone ??
              (((block.config as unknown as { variant?: string }).variant === "tip"
                ? "success"
                : (block.config as unknown as { variant?: string }).variant) as CalloutBlockConfig["tone"] | undefined) ??
              "info",
            title: config.title,
            content: config.content,
          } as unknown as CalloutBlockConfig}
          errors={blockErrors}
          onChange={(newConfig) => {
            const legacyConfig = newConfig as unknown as {
              tone?: string;
              title?: string;
              content?: string;
            };
            handleBlockConfigChange(block.id, {
              tone:
                legacyConfig.tone === "warning" ||
                legacyConfig.tone === "error" ||
                legacyConfig.tone === "success"
                  ? legacyConfig.tone
                  : "info",
              title: typeof legacyConfig.title === "string" ? legacyConfig.title : "",
              content: typeof legacyConfig.content === "string" ? legacyConfig.content : "",
            });
          }}
        />
      );
    }
    return withAudienceControl(
      <div className="text-sm text-[var(--color-text-secondary)]">
        Editor placeholder for {block.type}
      </div>
    );
  };

  const isFiltering = filter.keyword !== "" || filter.type !== "all";

  return (
    <div className="space-y-4">
      <BlockFilterBar onFilterChange={setFilter} />

      {visibleErrors.length > 0 && (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          data-testid="content-block-errors-summary"
        >
          <div className="font-medium">
            {errorSummary.totalBlocksWithErrors} 个内容块存在 {errorSummary.totalFieldErrors} 个字段错误
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-red-200">
            {Object.entries(errorsByBlockId).map(([blockId, blockErrors]) => (
              <button
                key={blockId}
                type="button"
                className="rounded-full border border-red-400/40 px-2 py-1 hover:bg-red-500/10"
                onClick={() => setEditingBlockId(blockId)}
              >
                {blockId} · {blockErrors.length} 个错误
              </button>
            ))}
          </div>
        </div>
      )}

      {isFiltering && (
        <div className="text-xs text-[var(--color-text-secondary)]">
          {filteredBlocks.length} / {blocks.length} 个内容块
        </div>
      )}

      <BlockList
        blocks={filteredBlocks}
        editingBlockId={editingBlockId}
        onChange={onChange}
        onEdit={handleEditBlock}
        onDelete={handleDeleteBlock}
        onToggleVisibility={handleToggleVisibility}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onCopy={handleCopy}
        blockErrors={errorsByBlockId}
        renderEditor={renderEditor}
      />

      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full py-3 border-2 border-dashed border-border/80 rounded-lg text-[var(--color-text-secondary)] hover:border-border hover:bg-input/25 transition-colors"
        >
          + 添加内容块
        </button>
        {showAddMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 border border-border/80 rounded-lg bg-card shadow-lg z-10">
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-input/40 transition-colors text-[var(--color-electric-purple)]"
            >
              从模板添加
            </button>
            {token && (
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-input/40 transition-colors text-[var(--color-electric-purple)]"
              >
                从其他资产搜索
              </button>
            )}
            {hasBlocks && (
              <button
                onClick={() => {
                  handlePaste();
                  setShowAddMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm hover:bg-input/40 transition-colors"
              >
                粘贴
              </button>
            )}
            <button
              onClick={() => handleAddBlock("text")}
              className="w-full px-4 py-3 text-left text-sm hover:bg-input/40 transition-colors"
            >
              文本块
            </button>
            <button
              onClick={() => handleAddBlock("stat_card")}
              className="w-full px-4 py-3 text-left text-sm hover:bg-input/40 transition-colors"
            >
              统计卡片
            </button>
            <button
              onClick={() => handleAddBlock("image")}
              className="w-full px-4 py-3 text-left text-sm hover:bg-input/40 transition-colors"
            >
              图片
            </button>
            <button
              onClick={() => handleAddBlock("code_snippet")}
              className="w-full px-4 py-3 text-left text-sm hover:bg-input/40 transition-colors"
            >
              代码片段
            </button>
            <button
              onClick={() => handleAddBlock("callout")}
              className="w-full px-4 py-3 text-left text-sm hover:bg-input/40 transition-colors"
            >
              提示框
            </button>
          </div>
        )}
      </div>

      {token && blocks.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowSaveTemplateDialog(true)}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            保存为模板
          </button>
        </div>
      )}

      {token && (
        <TemplateSelector
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          onApply={handleApplyTemplate}
          token={token}
        />
      )}

      {token && (
        <GlobalSearchModal
          isOpen={showGlobalSearch}
          onClose={() => setShowGlobalSearch(false)}
          onInsert={handleInsertFromSearch}
          token={token}
        />
      )}

      {showSaveTemplateDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSaveTemplateDialog(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
              保存为模板
            </h3>
            <div className="space-y-3">
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-muted px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                placeholder="模板名称"
              />
              <input
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-muted px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                placeholder="描述（可选）"
              />
              {saveError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                  {saveError}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate || !templateName.trim()}
                  className="flex-1 rounded-lg bg-[rgb(123_63_242_/25%)] py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[rgb(123_63_242_/35%)] disabled:opacity-50 transition-colors"
                >
                  {savingTemplate ? "保存中..." : "保存"}
                </button>
                <button
                  onClick={() => setShowSaveTemplateDialog(false)}
                  className="rounded-lg bg-input/40 px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-input/60 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ContentBlockEditor(props: ContentBlockEditorProps) {
  return (
    <BlockClipboardProvider>
      <ContentBlockEditorInner {...props} />
    </BlockClipboardProvider>
  );
}
