"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Film } from "lucide-react";
import { useTranslations } from "next-intl";

import { Tabs, TabsList, TabsTrigger, TabsPanel } from "@/components/ui/tabs";
import { AssetVideoPlayer, type VideoItem } from "@/components/asset-video-player";
import { RelatedAssets } from "@/components/public/related-assets";
import { AssetFeedbackForm } from "@/components/public/asset-feedback-form";
import { AssetEngagementBar } from "@/components/public/asset-engagement-bar";

type AssetDetailViewProps = {
  slug: string;
  assetId?: string;
  authToken?: string | null;
  sharedFields?: {
    introduction?: string;
    useCases?: string[];
    liveDemoUrl?: string;
    videos?: VideoItem[];
  };
  salesFields?: {
    valueSummary?: string;
    differentiators?: string[];
    outcomes?: string[];
  };
};

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
        {sharedFields.liveDemoUrl ? (
          <div>
            <Link
              href={sharedFields.liveDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("openLiveDemo")}
            </Link>
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

type PublicAttachment = {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  kind: "image" | "video" | "document";
  download_url: string;
};

function MediaPanel({ slug, videos }: { slug: string; videos?: VideoItem[] }) {
  const t = useTranslations("AssetDetail");
  const [attachments, setAttachments] = useState<PublicAttachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/v1/assets/${slug}/attachments`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: PublicAttachment[]) => {
        if (cancelled) return;
        setAttachments(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setAttachments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const documents = attachments.filter((a) => a.kind === "document");

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <Tabs defaultValue="videos">
      <TabsList>
        <TabsTrigger value="videos">{t("mediaVideos")}</TabsTrigger>
        <TabsTrigger value="documents">{t("mediaDocuments")}</TabsTrigger>
      </TabsList>

      <TabsPanel value="videos">
        {videos && videos.length > 0 ? (
          <AssetVideoPlayer videos={videos} />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {t("noVideos")}
          </div>
        )}
      </TabsPanel>

      <TabsPanel value="documents">
        {loading ? (
          <div className="grid gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {t("noDocuments")}
          </div>
        ) : (
          <div className="grid gap-3">
            {documents.map((doc) => {
              const isPdf = doc.content_type === "application/pdf";
              return (
                <a
                  key={doc.id}
                  href={doc.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {isPdf ? <FileText className="size-5" /> : <Film className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium text-foreground">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(doc.size_bytes)}</p>
                  </div>
                  <ExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                </a>
              );
            })}
          </div>
        )}
      </TabsPanel>
    </Tabs>
  );
}

export function AssetDetailView({
  slug,
  assetId,
  authToken,
  sharedFields = {},
  salesFields = {},
}: AssetDetailViewProps) {
  const EngagementSection = assetId ? (
    <div className="space-y-6 border-t border-border/60 pt-6">
      <AssetEngagementBar assetId={assetId} token={authToken} />
      <AssetFeedbackForm assetId={assetId} token={authToken} />
      <RelatedAssets assetId={assetId} />
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <SharedDetailPanel sharedFields={sharedFields} />
      <SalesDetailPanel salesFields={salesFields} />
      <MediaPanel slug={slug} videos={sharedFields.videos} />
      {EngagementSection}
    </div>
  );
}
