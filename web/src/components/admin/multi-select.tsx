"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Popover } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";
import type { TaxonomyOption } from "@/lib/asset-taxonomy";

type MultiSelectProps = {
  options: TaxonomyOption[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Resolve an option's localized label. */
  getLabel: (option: TaxonomyOption) => string;
  placeholder?: string;
};

/**
 * Multi-select dropdown backed by Base UI Popover. Renders a trigger chip
 * summarizing the selection and a checkbox panel inside the popover.
 */
export function MultiSelect({ options, value, onChange, getLabel, placeholder }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedSet = new Set(value);

  function toggle(optionValue: string) {
    const next = selectedSet.has(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(next);
  }

  const selectedLabels = options
    .filter((o) => selectedSet.has(o.value))
    .map((o) => getLabel(o));
  const summary =
    selectedLabels.length === 0
      ? (placeholder ?? "")
      : selectedLabels.length <= 2
        ? selectedLabels.join("、")
        : `${selectedLabels.length} 项已选`;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-input/40 px-3 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-input/60 focus:border-[var(--color-electric-purple)] focus:outline-none"
      >
        <span className={cn("truncate", selectedLabels.length === 0 && "text-[var(--color-text-tertiary)]")}>
          {summary || placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[var(--color-text-tertiary)]" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} className="z-50">
          <Popover.Popup className="max-h-72 w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg outline-none">
            {options.map((option) => {
              const checked = selectedSet.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--color-text-primary)] transition-colors hover:bg-muted"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                      checked
                        ? "border-[var(--color-electric-purple)] bg-[var(--color-electric-purple)] text-white"
                        : "border-border",
                    )}
                  >
                    {checked ? <Check className="size-3" /> : null}
                  </span>
                  <span className="truncate">{getLabel(option)}</span>
                </button>
              );
            })}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
