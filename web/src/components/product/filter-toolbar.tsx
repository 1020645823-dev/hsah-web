"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

type FilterToolbarProps = {
  children: ReactNode;
  resultsLabel: string;
  persistentControl?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  extraControls?: ReactNode;
};

export function FilterToolbar({
  children,
  resultsLabel,
  persistentControl,
  primaryAction,
  secondaryAction,
  extraControls,
}: FilterToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="sticky top-[73px] z-20 rounded-2xl border border-border bg-background/95 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:hidden">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="filter-panel"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
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

      {persistentControl ? <div className="mt-4 sm:mt-0">{persistentControl}</div> : undefined}

      <div
        id="filter-panel"
        className={`space-y-4 ${isExpanded ? "mt-4 block" : "hidden"} sm:mt-4 sm:block`}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {children}
        </div>

        <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:hidden">
          {extraControls ? <div className="flex flex-col gap-3">{extraControls}</div> : undefined}
          <div className="flex flex-wrap items-center gap-3">
            {secondaryAction}
            {primaryAction}
          </div>
        </div>

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
