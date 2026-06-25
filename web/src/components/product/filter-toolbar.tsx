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
  return (
    <div className="sticky top-0 z-20 space-y-4 rounded-2xl border border-border bg-background/95 p-4 shadow-sm backdrop-blur">
      <div className="grid gap-3 xl:grid-cols-5">{children}</div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground/70">{resultsLabel}</p>
        <div className="flex flex-wrap items-center gap-3">
          {secondaryAction}
          {primaryAction}
          {extraControls}
        </div>
      </div>
    </div>
  );
}
