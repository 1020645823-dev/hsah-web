"use client";

import { useEffect, useState } from "react";

import { AssetDetailView } from "@/components/asset-detail-view";
import { getStoredAdminToken } from "@/lib/admin";
import { fetchPublicAssetDetail, type PublicAssetDetail } from "@/lib/public-assets";

type PublicAssetDetailClientProps = {
  slug: string;
  initialAsset: PublicAssetDetail;
};

export function PublicAssetDetailClient({
  slug,
  initialAsset,
}: PublicAssetDetailClientProps) {
  const [asset, setAsset] = useState(initialAsset);
  const sharedFields = asset.shared_fields ?? {};
  const salesFields = asset.sales_fields ?? {};

  useEffect(() => {
    const token = getStoredAdminToken();
    if (!token) return;

    let cancelled = false;
    fetchPublicAssetDetail(slug, token).then((result) => {
      if (cancelled || !result.ok) return;
      setAsset(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <AssetDetailView
      slug={asset.slug}
      assetId={asset.id}
      sharedFields={{
        introduction: sharedFields.introduction,
        useCases: sharedFields.use_cases,
        liveDemoUrl: sharedFields.live_demo_url ?? undefined,
        videos: (sharedFields.videos ?? []).map((v) => ({
          id: v.id,
          title: v.title,
          videoUrl: v.video_url,
          posterUrl: v.poster_url ?? undefined,
          description: v.description ?? undefined,
          isPrimary: v.is_primary ?? undefined,
        })),
      }}
      salesFields={{
        valueSummary: salesFields.value_summary,
        differentiators: salesFields.differentiators,
        outcomes: salesFields.outcomes,
      }}
    />
  );
}
