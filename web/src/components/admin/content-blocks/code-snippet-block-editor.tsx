"use client";

import { useMemo } from "react";
import type { CodeSnippetBlockConfig } from "@/lib/admin-content-blocks";
import { getFieldError, type BlockFieldError } from "@/lib/content-block-errors";

interface CodeSnippetBlockEditorProps {
  config: CodeSnippetBlockConfig;
  onChange: (config: CodeSnippetBlockConfig) => void;
  errors?: BlockFieldError[];
}

const LANGUAGES = [
  "plaintext",
  "javascript",
  "typescript",
  "python",
  "java",
  "go",
  "rust",
  "html",
  "css",
  "sql",
  "bash",
  "json",
  "yaml",
] as const;

export function CodeSnippetBlockEditor({ config, onChange, errors }: CodeSnippetBlockEditorProps) {
  const { language, code, showLineNumbers } = config;
  const filename = config.filename ?? "";
  const languageError = getFieldError(errors, "config.language");
  const codeError = getFieldError(errors, "config.code");
  const filenameError = getFieldError(errors, "config.filename");

  const lines = useMemo(() => code.split("\n"), [code]);

  const handleLanguageChange = (value: string) => {
    onChange({ ...config, language: value });
  };

  const handleCodeChange = (value: string) => {
    onChange({ ...config, code: value });
  };

  const handleFilenameChange = (value: string) => {
    onChange({ ...config, filename: value });
  };

  const handleToggleLineNumbers = () => {
    onChange({ ...config, showLineNumbers: !showLineNumbers });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            语言
          </label>
          <select
            className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            data-testid="code-snippet-language-select"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          {languageError && <p className="text-xs text-red-400">{languageError}</p>}
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            文件名
          </label>
          <input
            className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
            value={filename}
            onChange={(e) => handleFilenameChange(e.target.value)}
            placeholder="例如 demo.py"
            data-testid="code-snippet-filename-input"
          />
          {filenameError && <p className="text-xs text-red-400">{filenameError}</p>}
        </div>

        <label className="flex items-center gap-2 pt-5 text-sm text-[var(--color-text-secondary)] select-none">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] accent-[var(--color-electric-purple)]"
            checked={showLineNumbers}
            onChange={handleToggleLineNumbers}
            data-testid="code-snippet-line-numbers-checkbox"
          />
          显示行号
        </label>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          代码
        </label>
        <div className="flex rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] focus-within:border-[var(--color-electric-purple)]">
          {showLineNumbers && (
            <div
              className="shrink-0 select-none border-r border-[rgb(212_218_245_/12%)] px-3 py-2 text-right text-xs leading-6 text-[var(--color-text-secondary)]"
              data-testid="code-snippet-line-numbers"
              aria-hidden
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          )}
          <textarea
            className="min-h-[200px] w-full resize-y bg-transparent px-3 py-2 font-mono text-sm leading-6 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="输入代码..."
            spellCheck={false}
            data-testid="code-snippet-textarea"
          />
        </div>
        {codeError && <p className="text-xs text-red-400">{codeError}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          预览
        </label>
        <div
          className="rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-4 py-3"
          data-testid="code-snippet-preview"
        >
          <div className="mb-2 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <span
              className="rounded bg-[rgb(255_255_255_/8%)] px-1.5 py-0.5"
              data-testid="code-snippet-preview-language"
            >
              {language}
            </span>
            {filename ? (
              <span
                className="rounded bg-[rgb(255_255_255_/8%)] px-1.5 py-0.5"
                data-testid="code-snippet-preview-filename"
              >
                {filename}
              </span>
            ) : null}
            <span data-testid="code-snippet-preview-line-count">
              {lines.length} 行
            </span>
          </div>
          <pre className="overflow-x-auto font-mono text-sm leading-6 text-[var(--color-text-primary)]">
            <code>{code || "暂无代码"}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
