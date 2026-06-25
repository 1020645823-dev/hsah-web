"use client";

import { type LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10">
      <Icon
        className="h-12 w-12 text-[var(--color-text-tertiary)]"
        strokeWidth={1.5}
      />
      <div className="text-center">
        <p className="text-lg font-medium text-[var(--color-text-primary)]">
          {title}
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded-lg bg-[var(--color-electric-purple)] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
