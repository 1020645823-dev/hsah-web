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
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
      <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="grid grid-cols-[40px_1fr_120px_120px_120px_140px_100px] items-center gap-4 px-5 py-4">
      <div className="h-4 animate-pulse rounded bg-muted" />
      <div className="h-4 animate-pulse rounded bg-muted" />
      <div className="h-4 animate-pulse rounded bg-muted" />
      <div className="h-4 animate-pulse rounded bg-muted" />
      <div className="h-4 animate-pulse rounded bg-muted" />
      <div className="h-4 animate-pulse rounded bg-muted" />
      <div className="h-4 animate-pulse rounded bg-muted" />
    </div>
  );
}

function TextLineSkeleton({ width = "100%" }: { width?: string }) {
  return (
    <div
      className="h-4 animate-pulse rounded bg-muted"
      style={{ width }}
    />
  );
}

function BlockSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
      <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
      <div className="h-20 w-full animate-pulse rounded bg-muted" />
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

export function AssetCardSkeleton() {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="h-[19px] w-20 animate-pulse rounded-md bg-muted" />
        <div className="h-[19px] w-16 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="mt-4 flex-1 space-y-3">
        <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="h-7 w-14 animate-pulse rounded-full border border-border/60 bg-muted" />
        <div className="h-7 w-14 animate-pulse rounded-full bg-muted" />
        <div className="h-7 w-10 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="mt-4 h-4 w-24 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function AssetListSkeleton() {
  return (
    <div className="group flex items-center gap-5 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-[19px] w-20 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="h-6 w-14 animate-pulse rounded-full border border-border/60 bg-muted" />
          <div className="h-6 w-14 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-10 animate-pulse rounded-full bg-muted" />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="h-[19px] w-16 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function AssetGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <AssetCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AssetListViewSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <AssetListSkeleton key={i} />
      ))}
    </div>
  );
}
