"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, Loader2, ExternalLink } from "lucide-react";
import type { ContentBlock } from "@/lib/admin-content-blocks";
import type { BlockSearchResult } from "@/lib/admin-asset-editor";
import { searchBlocks } from "@/lib/admin-asset-editor";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (block: ContentBlock) => void;
  token: string;
}

export function GlobalSearchModal({ isOpen, onClose, onInsert, token }: GlobalSearchModalProps) {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [results, setResults] = useState<BlockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [keyword]);

  const handleSearch = useCallback(async () => {
    if (!debouncedKeyword.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await searchBlocks(token, debouncedKeyword.trim());
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "搜索失败");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, token]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleInsert = (result: BlockSearchResult) => {
    onInsert(result.block);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl border border-border/80 bg-card shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border/80">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            全局搜索内容块
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-input/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入关键词搜索..."
              className="w-full pl-9 pr-3 py-2 bg-input/40 border border-border/80 rounded text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[rgb(139_92_246_/60%)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-secondary)]" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && searched && results.length === 0 && !error && (
            <div className="text-center py-8 text-[var(--color-text-secondary)] text-sm">
              未找到匹配的内容块
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={`${result.asset_id}-${result.block.id}-${index}`}
                  className="rounded-lg border border-border/80 bg-input/30 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {result.asset_name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-input/60 text-[var(--color-text-secondary)]">
                          {result.block.type}
                        </span>
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          匹配: {result.matched_field}
                        </span>
                      </div>
                      <a
                        href={`/admin/assets/${result.asset_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[var(--color-electric-purple)] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        查看资产
                      </a>
                    </div>
                    <button
                      onClick={() => handleInsert(result)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-[rgb(123_63_242_/25%)] text-sm text-[var(--color-text-primary)] hover:bg-[rgb(123_63_242_/35%)] transition-colors"
                    >
                      插入到当前
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
