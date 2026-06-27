import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PublicSiteShell, PublicDetailHero } from "@/components/public-site-shell";
import { PublicAssetDetailClient } from "@/components/public-asset-detail-client";
import { fetchPublicAssetDetail } from "@/lib/public-assets";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "AssetDetail" });
  const assetResult = await fetchPublicAssetDetail(slug);

  if (!assetResult.ok) {
    notFound();
  }
  const asset = assetResult.data;

  const metaItems: string[] = [
    asset.asset_type,
    asset.status,
    asset.visibility,
    ...asset.cloud_providers,
    ...asset.industries,
  ].filter(Boolean);

  return (
    <PublicSiteShell ctaHref="/assets" ctaLabel={t("exploreAssets")}>
      <div className="space-y-8">
        <PublicDetailHero
          backHref="/assets"
          backLabel={t("backToAssets")}
          eyebrow={asset.asset_type.toUpperCase()}
          title={asset.title}
          summary={asset.subtitle || asset.short_description}
          meta={metaItems}
          tags={asset.technologies}
        />

        <PublicAssetDetailClient slug={slug} initialAsset={asset} />
      </div>
    </PublicSiteShell>
  );
}
