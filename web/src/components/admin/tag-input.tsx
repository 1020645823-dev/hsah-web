"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
};

function dedupe(value: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of value) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

export function TagInput({
  value,
  onChange,
  placeholder,
  suggestions,
  className,
}: TagInputProps) {
  const t = useTranslations("Admin");
  const [input, setInput] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addTags = React.useCallback(
    (raw: string) => {
      const parts = raw.split(/[, ]+/).map((s) => s.trim()).filter(Boolean);
      if (parts.length === 0) return;
      const next = dedupe([...value, ...parts]);
      onChange(next);
      setInput("");
    },
    [value, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTags(input);
      return;
    }
    if (e.key === "Backspace" && input === "" && value.length > 0) {
      const next = value.slice(0, -1);
      onChange(next);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const commaIdx = val.lastIndexOf(",");
    if (commaIdx !== -1) {
      const before = val.slice(0, commaIdx);
      const after = val.slice(commaIdx + 1);
      const parts = before.split(/[, ]+/).map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        const next = dedupe([...value, ...parts]);
        onChange(next);
      }
      setInput(after);
      return;
    }
    if (val.endsWith(" ") && val.trim().length > 0) {
      const parts = val.split(/[ ]+/).map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        const next = dedupe([...value, ...parts]);
        onChange(next);
      }
      setInput("");
      return;
    }
    setInput(val);
  };

  const removeTag = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
  };

  const filteredSuggestions = React.useMemo(() => {
    if (!suggestions || !input.trim() || !focused) return [];
    const lower = input.trim().toLowerCase();
    return suggestions.filter(
      (s) =>
        s.toLowerCase().includes(lower) &&
        !value.some((v) => v.toLowerCase() === s.toLowerCase()),
    );
  }, [suggestions, input, value, focused]);

  const showDropdown = focused && filteredSuggestions.length > 0;

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex min-h-[36px] flex-wrap items-center gap-1.5 rounded-lg border px-2.5 py-1.5",
          "border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] text-[var(--color-text-primary)]",
          "focus-within:border-[var(--color-periwinkle)]/50 focus-within:ring-1 focus-within:ring-[var(--color-periwinkle)]/30",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            data-testid="tag-chip"
            className="inline-flex items-center gap-1 rounded-full bg-[rgb(138_133_245_/15%)] px-3 py-1 text-sm text-[var(--color-periwinkle)]"
          >
            {tag}
            <button
              type="button"
              data-testid="tag-remove"
              aria-label={t("tagInput.removeTag", { tag })}
              className="ml-0.5 rounded-full p-0.5 hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 150);
            if (input.trim()) addTags(input);
          }}
          placeholder={placeholder}
          className="min-w-[80px] flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
        />
      </div>
      {showDropdown && (
        <ul
          data-testid="tag-suggestions"
          className={cn(
            "absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border py-1",
            "bg-[rgb(18_18_26_/95%)] border-[rgb(212_218_245_/12%)]",
          )}
        >
          {filteredSuggestions.map((s) => (
            <li
              key={s}
              className="cursor-pointer px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-periwinkle)]/10"
              onMouseDown={(e) => {
                e.preventDefault();
                const trimmed = s.trim();
                const next = dedupe([...value, trimmed]);
                onChange(next);
                setInput("");
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type { TagInputProps };
