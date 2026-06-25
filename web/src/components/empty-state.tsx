"use client";

import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
};

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  actions?: EmptyStateAction[];
};

export function EmptyState({ icon: Icon, title, description, action, actions }: EmptyStateProps) {
  const allActions = actions ?? (action ? [action] : []);

  return (
    <div className="flex flex-col items-center gap-5 px-6 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Icon
          className="h-8 w-8 text-muted-foreground"
          strokeWidth={1.5}
        />
      </div>
      <div className="max-w-sm text-center">
        <p className="text-lg font-semibold text-foreground">
          {title}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {allActions.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {allActions.map((a, i) => (
            <Button
              key={i}
              type="button"
              variant={a.variant ?? "default"}
              onClick={a.onClick}
            >
              {a.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
