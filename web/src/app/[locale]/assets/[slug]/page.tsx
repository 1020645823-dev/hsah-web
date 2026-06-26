import { notFound } from "next/navigation";

import { PublicSiteShell, PublicDetailHero } from "@/components/public-site-shell";
import { ContentBlockRenderer } from "@/components/content-block-renderer";
import type { ContentBlock } from "@/lib/admin-content-blocks";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type AssetDetail = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  short_description: string;
  cloud_providers: string[];
  industries: string[];
  technologies: string[];
  asset_type: string;
  status: string;
  visibility: string;
  content_blocks: ContentBlock[];
};

async function fetchAsset(slug: string): Promise<AssetDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/assets/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as AssetDetail;
  } catch {
    return null;
  }
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const asset = await fetchAsset(slug);

  if (!asset) {
    notFound();
  }

  const metaItems: string[] = [
    asset.asset_type,
    asset.status,
    asset.visibility,
    ...asset.cloud_providers,
    ...asset.industries,
  ].filter(Boolean);

  return (
    <PublicSiteShell ctaHref="/assets" ctaLabel="Explore Assets">
      <div className="space-y-8">
        <PublicDetailHero
          backHref="/assets"
          backLabel="Back to Assets"
          eyebrow={asset.asset_type.toUpperCase()}
          title={asset.title}
          summary={asset.subtitle || asset.short_description}
          meta={metaItems}
          tags={asset.technologies}
        />

        <ContentBlockRenderer blocks={asset.content_blocks} />
      </div>
    </PublicSiteShell>
  );
}
