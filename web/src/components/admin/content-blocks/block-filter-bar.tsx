"use client";

import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";

export type FilterState = {
  keyword: string;
  type: string;
};

interface BlockFilterBarProps {
  onFilterChange: (filter: FilterState) => void;
}

const TYPE_OPTIONS = [
  { value: "", label: "全部类型" },
  { value: "text", label: "文本" },
  { value: "image", label: "图片" },
  { value: "code_snippet", label: "代码片段" },
  { value: "callout", label: "提示框" },
  { value: "stat_card", label: "统计卡片" },
];

export function BlockFilterBar({ onFilterChange }: BlockFilterBarProps) {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("");

  const hasActiveFilter = keyword !== "" || type !== "";

  const handleKeywordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newKeyword = e.target.value;
      setKeyword(newKeyword);
      onFilterChange({ keyword: newKeyword, type });
    },
    [type, onFilterChange],
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value;
      setType(newType);
      onFilterChange({ keyword, type: newType });
    },
    [keyword, onFilterChange],
  );

  const handleClear = useCallback(() => {
    setKeyword("");
    setType("");
    onFilterChange({ keyword: "", type: "" });
  }, [onFilterChange]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
        <input
          type="text"
          value={keyword}
          onChange={handleKeywordChange}
          placeholder="搜索内容..."
          className="w-full pl-9 pr-3 py-2 bg-input/40 border border-border/80 rounded text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[rgb(139_92_246_/60%)]"
        />
      </div>
      <select
        value={type}
        onChange={handleTypeChange}
        className="px-3 py-2 bg-input/40 border border-border/80 rounded text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[rgb(139_92_246_/60%)]"
      >
        {TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasActiveFilter && (
        <button
          onClick={handleClear}
          className="flex items-center gap-1 px-3 py-2 text-sm border border-border/80 rounded hover:bg-input/40 text-[var(--color-text-primary)]"
        >
          <X className="w-4 h-4" />
          清除
        </button>
      )}
    </div>
  );
}
