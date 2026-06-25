"use client";

import { cn } from "@/lib/utils";

type SkeletonVariant = "card" | "table-row" | "text-line" | "block";

type SkeletonProps = {
  variant: SkeletonVariant;
  count?: number;
  className?: string;
};

function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] p-5">
      <div className="h-5 w-1/3 animate-pulse rounded bg-[rgb(255_255_255_/8%)]" />
      <div className="h-4 w-full animate-pulse rounded bg-[rgb(255_255_255_/5%)]" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-[rgb(255_255_255_/5%)]" />
      <div className="h-4 w-4/6 animate-pulse rounded bg-[rgb(255_255_255_/5%)]" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="grid grid-cols-[40px_1fr_120px_120px_120px_140px_100px] items-center gap-4 px-5 py-4">
      <div className="h-4 animate-pulse rounded bg-[rgb(255_255_255_/5%)]" />
      <div className="h-4 animate-pulse rounded bg-[rgb(255_255_255_/5%)]" />
      <div className="h-4 animate-pulse rounded bg-[rgb(255_255_255_/5%)]" />
      <div className="h-4 animate-pulse rounded bg-[rgb(255_255_255_/5%)]" />
      <div className="h-4 animate-pulse rounded bg-[rgb(255_255_255_/5%)]" />
      <div className="h-4 animate-pulse rounded bg-[rgb(255_255_255_/5%)]" />
      <div className="h-4 animate-pulse rounded bg-[rgb(255_255_255_/5%)]" />
    </div>
  );
}

function TextLineSkeleton({ width = "100%" }: { width?: string }) {
  return (
    <div
      className="h-4 animate-pulse rounded bg-[rgb(255_255_255_/5%)]"
      style={{ width }}
    />
  );
}

function BlockSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-[rgb(212_218_245_/10%)] bg-[rgb(18_18_26_/50%)] p-4">
      <div className="h-4 w-1/4 animate-pulse rounded bg-[rgb(255_255_255_/8%)]" />
      <div className="h-20 w-full animate-pulse rounded bg-[rgb(255_255_255_/5%)]" />
    </div>
  );
}

export function Skeleton({ variant, count = 1, className }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((index) => {
        switch (variant) {
          case "card":
            return <CardSkeleton key={index} />;
          case "table-row":
            return <TableRowSkeleton key={index} />;
          case "text-line":
            return <TextLineSkeleton key={index} />;
          case "block":
            return <BlockSkeleton key={index} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
