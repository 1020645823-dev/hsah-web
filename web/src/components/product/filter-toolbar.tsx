"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

type FilterToolbarProps = {
  children: ReactNode;
  resultsLabel: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  extraControls?: ReactNode;
};

export function FilterToolbar({
  children,
  resultsLabel,
  primaryAction,
  secondaryAction,
  extraControls,
}: FilterToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="sticky top-0 z-20 rounded-2xl border border-border bg-background/95 p-4 shadow-sm backdrop-blur">
      {/* Mobile header: toggle + results (only visible below sm) */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:hidden">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="filter-panel"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <p className="text-sm text-foreground/70">{resultsLabel}</p>
      </div>

      {/* Collapsible filter panel on mobile; always visible on sm+ */}
      <div
        id="filter-panel"
        className={`space-y-4 ${isExpanded ? "block" : "hidden"} sm:block`}
      >
        {/* Filters grid: 1 col mobile, 2 cols sm, 3 cols md, 5 cols xl */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {children}
        </div>

        {/* Bottom bar: results + actions (only visible on sm+) */}
        <div className="hidden flex-col gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-foreground/70">{resultsLabel}</p>
          <div className="flex flex-wrap items-center gap-3">
            {secondaryAction}
            {primaryAction}
            {extraControls}
          </div>
        </div>
      </div>
    </div>
  );
}
