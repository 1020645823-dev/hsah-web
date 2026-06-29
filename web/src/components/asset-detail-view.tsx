"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { ContentBlockRenderer } from "@/components/content-block-renderer";
import { normalizeContentAudience, type ContentBlock } from "@/lib/admin-content-blocks";
import { cn } from "@/lib/utils";
import { AssetVideoPlayer, type VideoItem } from "@/components/asset-video-player";
import { RelatedAssets } from "@/components/public/related-assets";
import { AssetFeedbackForm } from "@/components/public/asset-feedback-form";
import { AccessRequestForm } from "@/components/public/access-request-form";
import { AssetEngagementBar } from "@/components/public/asset-engagement-bar";

type AssetMode = "sales" | "delivery";
type DeliveryAccess = "granted" | "signin_required" | "request_access";

type AssetDetailViewProps = {
  blocks: ContentBlock[];
  assetId?: string;
  authToken?: string | null;
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

function resolveDeliveryAccessConfig(access: DeliveryAccess) {
  if (access === "signin_required") {
    return {
      href: "/auth/login",
      labelKey: "signIn" as const,
      descriptionKey: "signinRequiredDescription" as const,
    };
  }

  return {
    href: "mailto:hsah.admin@example.com?subject=Delivery%20access%20request",
    labelKey: "requestAccess" as const,
    descriptionKey: "requestAccessDescription" as const,
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
  const t = useTranslations("AssetDetail");
  const tCommon = useTranslations("Common");
  const config = resolveDeliveryAccessConfig(access);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-primary uppercase">
            <LockKeyhole className="size-3.5" />
            {t("controlledDeliveryContent")}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{t("deliveryAccessTitle")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(config.descriptionKey)}
            </p>
          </div>
        </div>
        <Link
          href={config.href}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {tCommon(config.labelKey)}
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
      <h3 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">{title}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-sm text-foreground">
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
  const t = useTranslations("AssetDetail");
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
          <div className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{t("sharedContext")}</div>
          {sharedFields.introduction ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{sharedFields.introduction}</p>
          ) : null}
        </div>
        {useCases.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("useCases")}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {useCases.map((item) => (
                <span key={item} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-sm text-foreground">
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
                {t("watchDemoVideo")}
              </Link>
            ) : null}
            {sharedFields.liveDemoUrl ? (
              <Link
                href={sharedFields.liveDemoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("openLiveDemo")}
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
  const t = useTranslations("AssetDetail");
  const differentiators = salesFields.differentiators ?? [];
  const outcomes = salesFields.outcomes ?? [];
  const hasContent = Boolean(salesFields.valueSummary) || differentiators.length > 0 || outcomes.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-4">
      {salesFields.valueSummary ? (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">{t("salesValue")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{salesFields.valueSummary}</p>
        </section>
      ) : null}
      <DetailSection title={t("differentiators")} items={differentiators} />
      <DetailSection title={t("outcomes")} items={outcomes} />
    </div>
  );
}

function DeliveryDetailPanel({
  deliveryFields,
}: {
  deliveryFields: NonNullable<AssetDetailViewProps["deliveryFields"]>;
}) {
  const t = useTranslations("AssetDetail");
  const prerequisites = deliveryFields.prerequisites ?? [];
  const rolloutSteps = deliveryFields.rolloutSteps ?? [];
  const hasContent =
    Boolean(deliveryFields.implementationSummary) || prerequisites.length > 0 || rolloutSteps.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-4">
      {deliveryFields.implementationSummary ? (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">{t("implementation")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{deliveryFields.implementationSummary}</p>
        </section>
      ) : null}
      <DetailSection title={t("prerequisites")} items={prerequisites} />
      <DetailSection title={t("rolloutSteps")} items={rolloutSteps} />
    </div>
  );
}

export function AssetDetailView({
  blocks,
  assetId,
  authToken,
  deliveryAccess = "request_access",
  sharedFields = {},
  salesFields = {},
  deliveryFields = null,
}: AssetDetailViewProps) {
  const t = useTranslations("AssetDetail");
  const [mode, setMode] = useState<AssetMode>("sales");
  const showDeliveryMode = useMemo(
    () => hasDeliveryBlocks(blocks) || deliveryAccess === "granted" || Boolean(deliveryFields),
    [blocks, deliveryAccess, deliveryFields],
  );

  const EngagementSection = assetId ? (
    <div className="space-y-6 border-t border-border/60 pt-6">
      <AssetEngagementBar assetId={assetId} token={authToken} />
      {deliveryAccess === "request_access" && (
        <AccessRequestForm assetId={assetId} token={authToken} />
      )}
      <AssetFeedbackForm assetId={assetId} token={authToken} />
      <RelatedAssets assetId={assetId} />
    </div>
  ) : null;

  if (!showDeliveryMode) {
    return (
      <div className="space-y-6">
        <SharedDetailPanel sharedFields={sharedFields} />
        {sharedFields.videos && sharedFields.videos.length > 0 && (
          <AssetVideoPlayer videos={sharedFields.videos} />
        )}
        <SalesDetailPanel salesFields={salesFields} />
        <ContentBlockRenderer blocks={blocks} mode="sales" />
        {EngagementSection}
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
            <div className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-primary uppercase">
              <ShieldCheck className="size-3.5" />
              {t("viewMode")}
            </div>
            <h2 className="text-xl font-semibold text-foreground">{t("chooseLens")}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{t("lensSummary")}</p>
          </div>
          <div className="inline-flex gap-2 rounded-xl border border-border bg-muted/40 p-1">
            <ModeButton active={mode === "sales"} label={t("sales")} onClick={() => setMode("sales")} />
            <ModeButton active={mode === "delivery"} label={t("delivery")} onClick={() => setMode("delivery")} />
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
      {EngagementSection}
    </div>
  );
}
