"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Package, Plus } from "lucide-react";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { AssetCreateDrawer } from "@/components/admin/asset-create-drawer";
import { adminRequest, getStoredAdminToken } from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

import type { Asset } from "@/types/asset";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20",
  reviewing: "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20",
  rejected: "bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20",
  draft: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20",
};

function statusStyle(status: string) {
  return STATUS_STYLES[status] ?? "bg-muted text-muted-foreground ring-1 ring-border/70";
}

export default function AdminAssetsPage() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function loadAssets() {
    if (!token) return;
    adminRequest<{ items: Asset[]; total: number }>("/api/v1/admin/assets", token, { method: "GET" })
      .then((data) => {
        if (!data.ok) {
          setError(parseApiError(data.data, data.status));
          setAssets([]);
        } else {
          setError(null);
          setAssets(data.data.items ?? []);
        }
      })
      .catch(() => {
        setError(parseApiError(null, undefined));
        setAssets([]);
      });
  }

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshKey]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("assets.eyebrow")}
        title={t("assets.title")}
        summary={t("assets.summary")}
      />

      {error && (
        <ErrorAlert
          error={error}
          onRetry={error.retryable ? () => setError(null) : undefined}
          onDismiss={() => setError(null)}
        />
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("assets.totalAssets")}</p>
              <CardTitle className="text-3xl font-semibold text-foreground">{assets.length}</CardTitle>
            </div>
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <Package className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("assets.totalAssetsDescription")}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t("assets.allAssets")}</h2>
          {token && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:bg-primary/90 active:translate-y-px"
            >
              <Plus className="h-4 w-4" />
              {t("assets.createNew")}
            </button>
          )}
        </div>

        {assets.length === 0 ? (
          <div className="rounded-xl border border-border/70 bg-card/90 px-6 py-10 text-center text-sm text-muted-foreground">
            {t("assets.empty")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => {
              const assetType = asset.asset_type ?? asset.type ?? "";
              const tags = [
                ...(asset.cloud_providers ?? []),
                ...(asset.technologies ?? []),
              ].slice(0, 4);

              return (
                <Card
                  key={asset.id}
                  className="group cursor-pointer border-border/70 bg-card/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lg"
                  onClick={() => router.push(`/admin/assets/${asset.id}/edit`)}
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base text-foreground">{asset.title}</CardTitle>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize",
                          statusStyle(asset.status),
                        )}
                      >
                        {asset.status}
                      </span>
                    </div>
                    {asset.subtitle ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{asset.subtitle}</p>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {asset.short_description ? (
                      <p className="line-clamp-2 leading-relaxed">{asset.short_description}</p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {assetType ? (
                        <span className="font-medium">
                          {t("assets.type")}: {assetType}
                        </span>
                      ) : null}
                      <span className="font-mono text-[11px] text-muted-foreground/80">
                        {asset.slug}
                      </span>
                    </div>
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {token ? (
        <AssetCreateDrawer
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => {
            setCreateOpen(false);
            setRefreshKey((k) => k + 1);
          }}
          token={token}
        />
      ) : null}
    </div>
  );
}
