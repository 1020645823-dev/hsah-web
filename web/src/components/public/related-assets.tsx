"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { fetchRelatedAssets, type RelatedAsset } from "@/lib/asset-engagement";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";

export function RelatedAssets({ assetId }: { assetId: string }) {
  const t = useTranslations("AssetDetail");
  const [assets, setAssets] = useState<RelatedAsset[]>([]);
  const [error, setError] = useState<ApiErrorInfo | null>(null);

  useEffect(() => {
    let canceled = false;
    fetchRelatedAssets(assetId)
      .then((res) => {
        if (canceled) return;
        if (!res.ok) {
          setError(parseApiError(res.error));
          setAssets([]);
        } else {
          setAssets(res.data);
        }
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
      });
    return () => {
      canceled = true;
    };
  }, [assetId]);

  if (error && assets.length === 0) {
    return null;
  }
  if (assets.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{t("relatedAssets")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {assets.map((asset) => (
          <Link
            key={asset.id}
            href={`/assets/${asset.slug}`}
            className="rounded-xl border border-border/70 bg-card/90 p-4 transition-colors hover:bg-muted/40"
          >
            <p className="text-sm font-medium text-foreground">{asset.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {asset.short_description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
