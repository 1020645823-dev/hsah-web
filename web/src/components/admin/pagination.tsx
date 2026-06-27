"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

type PaginationProps = {
  total: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export function Pagination({
  total,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const t = useTranslations("Admin");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  function getPageNumbers(): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (safePage > 3) pages.push("ellipsis");
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 text-sm text-[var(--color-text-secondary)]">
      <div className="flex items-center gap-3">
        <span>
          {t("pagination.totalItems", { total })}，{t("pagination.pageIndicator", { currentPage: safePage, totalPages })}
        </span>
        {onPageSizeChange ? (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] px-2 py-1 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {t("pagination.perPage", { size })}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="flex items-center gap-1 rounded-md border border-[rgb(212_218_245_/12%)] px-2 py-1 text-xs text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t("pagination.previous")}
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-1 text-xs text-[var(--color-text-tertiary)]"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={
                  item === safePage
                    ? "rounded-md bg-[var(--color-electric-purple)] px-3 py-1 text-xs font-medium text-white"
                    : "rounded-md border border-[rgb(212_218_245_/12%)] px-3 py-1 text-xs text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-white/5"
                }
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="flex items-center gap-1 rounded-md border border-[rgb(212_218_245_/12%)] px-2 py-1 text-xs text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("pagination.next")}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
