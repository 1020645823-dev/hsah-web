"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { ContentBlockRenderer } from "@/components/content-block-renderer";
import { normalizeContentAudience, type ContentBlock } from "@/lib/admin-content-blocks";
import { cn } from "@/lib/utils";
import { AssetVideoPlayer, type VideoItem } from "@/components/asset-video-player";

type AssetMode = "sales" | "delivery";
type DeliveryAccess = "granted" | "signin_required" | "request_access";

type AssetDetailViewProps = {
  blocks: ContentBlock[];
  deliveryAccess?: DeliveryAccess;
  sharedFields?: {
    introduction?: string;
    useCases?: string[];
    demoVideoUrl?: string;
    liveDemoUrl?: string;
    videos?: VideoItem[];
  };
  salesFields?: {
    valueSummary?: string;
    differentiators?: string[];
    outcomes?: string[];
  };
  deliveryFields?: {
    implementationSummary?: string;
    prerequisites?: string[];
    rolloutSteps?: string[];
  } | null;
};

function hasDeliveryBlocks(blocks: ContentBlock[]) {
  return blocks.some((block) => normalizeContentAudience(block.audience) === "delivery");
}

function resolveDeliveryAccessCopy(access: DeliveryAccess) {
  if (access === "signin_required") {
    return {
      title: "Delivery implementation access",
      description:
        "Sign in with an approved role to review runbooks, deployment steps, and delivery notes.",
      actionHref: "/auth/login",
      actionLabel: "Sign in",
    };
  }

  return {
    title: "Delivery implementation access",
    description:
      "Request delivery access to review runbooks, deployment steps, and delivery notes.",
    actionHref: "mailto:hsah.admin@example.com?subject=Delivery%20access%20request",
    actionLabel: "Request access",
  };
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function DeliveryAccessPanel({ access }: { access: Exclude<DeliveryAccess, "granted"> }) {
  const copy = resolveDeliveryAccessCopy(access);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium tracking-[0.12em] text-secondary-foreground uppercase">
            <LockKeyhole className="size-3.5" />
            Controlled delivery content
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{copy.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.description}</p>
          </div>
        </div>
        <Link
          href={copy.actionHref}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {copy.actionLabel}
        </Link>
      </div>
    </section>
  );
}

function DetailSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">{title}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function SharedDetailPanel({
  sharedFields,
}: {
  sharedFields: NonNullable<AssetDetailViewProps["sharedFields"]>;
}) {
  const useCases = sharedFields.useCases ?? [];
  const hasContent =
    Boolean(sharedFields.introduction) ||
    useCases.length > 0 ||
    Boolean(sharedFields.demoVideoUrl) ||
    Boolean(sharedFields.liveDemoUrl) ||
    (sharedFields.videos && sharedFields.videos.length > 0);

  if (!hasContent) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="space-y-4">
        <div>
          <div className="text-xs font-medium tracking-[0.14em] text-primary uppercase">Shared context</div>
          {sharedFields.introduction ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{sharedFields.introduction}</p>
          ) : null}
        </div>
        {useCases.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-foreground">Use cases</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {useCases.map((item) => (
                <span key={item} className="rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {(sharedFields.demoVideoUrl || sharedFields.liveDemoUrl) ? (
          <div className="flex flex-wrap gap-3">
            {sharedFields.demoVideoUrl ? (
              <Link
                href={sharedFields.demoVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Watch demo video
              </Link>
            ) : null}
            {sharedFields.liveDemoUrl ? (
              <Link
                href={sharedFields.liveDemoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
              >
                Open live demo
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SalesDetailPanel({
  salesFields,
}: {
  salesFields: NonNullable<AssetDetailViewProps["salesFields"]>;
}) {
  const differentiators = salesFields.differentiators ?? [];
  const outcomes = salesFields.outcomes ?? [];
  const hasContent = Boolean(salesFields.valueSummary) || differentiators.length > 0 || outcomes.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-4">
      {salesFields.valueSummary ? (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">Sales value</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{salesFields.valueSummary}</p>
        </section>
      ) : null}
      <DetailSection title="Differentiators" items={differentiators} />
      <DetailSection title="Outcomes" items={outcomes} />
    </div>
  );
}

function DeliveryDetailPanel({
  deliveryFields,
}: {
  deliveryFields: NonNullable<AssetDetailViewProps["deliveryFields"]>;
}) {
  const prerequisites = deliveryFields.prerequisites ?? [];
  const rolloutSteps = deliveryFields.rolloutSteps ?? [];
  const hasContent =
    Boolean(deliveryFields.implementationSummary) || prerequisites.length > 0 || rolloutSteps.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-4">
      {deliveryFields.implementationSummary ? (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">Implementation</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{deliveryFields.implementationSummary}</p>
        </section>
      ) : null}
      <DetailSection title="Prerequisites" items={prerequisites} />
      <DetailSection title="Rollout steps" items={rolloutSteps} />
    </div>
  );
}

export function AssetDetailView({
  blocks,
  deliveryAccess = "request_access",
  sharedFields = {},
  salesFields = {},
  deliveryFields = null,
}: AssetDetailViewProps) {
  const [mode, setMode] = useState<AssetMode>("sales");
  const showDeliveryMode = useMemo(
    () => hasDeliveryBlocks(blocks) || deliveryAccess === "granted" || Boolean(deliveryFields),
    [blocks, deliveryAccess, deliveryFields],
  );

  if (!showDeliveryMode) {
    return (
      <div className="space-y-6">
        <SharedDetailPanel sharedFields={sharedFields} />
        {sharedFields.videos && sharedFields.videos.length > 0 && (
          <AssetVideoPlayer videos={sharedFields.videos} />
        )}
        <SalesDetailPanel salesFields={salesFields} />
        <ContentBlockRenderer blocks={blocks} mode="sales" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SharedDetailPanel sharedFields={sharedFields} />
      {sharedFields.videos && sharedFields.videos.length > 0 && (
        <AssetVideoPlayer videos={sharedFields.videos} />
      )}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-primary uppercase">
              <ShieldCheck className="size-3.5" />
              View mode
            </div>
            <h2 className="text-xl font-semibold text-foreground">Choose the lens for this asset</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Sales focuses on value framing. Delivery reveals implementation guidance when access is granted.
            </p>
          </div>
          <div className="inline-flex gap-2 rounded-xl border border-border bg-muted/35 p-1">
            <ModeButton active={mode === "sales"} label="Sales" onClick={() => setMode("sales")} />
            <ModeButton active={mode === "delivery"} label="Delivery" onClick={() => setMode("delivery")} />
          </div>
        </div>
      </section>

      {mode === "delivery" && deliveryAccess !== "granted" ? (
        <DeliveryAccessPanel access={deliveryAccess} />
      ) : (
        <div className="space-y-6">
          {mode === "sales" ? (
            <SalesDetailPanel salesFields={salesFields} />
          ) : deliveryFields ? (
            <DeliveryDetailPanel deliveryFields={deliveryFields} />
          ) : null}
          <ContentBlockRenderer blocks={blocks} mode={mode} />
        </div>
      )}
    </div>
  );
}
