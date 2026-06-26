import { notFound } from "next/navigation";

import {
  PublicBulletSection,
  PublicDetailHero,
  PublicProseSection,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { getInsightBySlug } from "@/lib/public-content";

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const insight = getInsightBySlug(slug);

  if (!insight) {
    notFound();
  }

  return (
    <PublicSiteShell ctaHref="/community" ctaLabel="Join Programs">
      <div className="space-y-8">
        <PublicDetailHero
          backHref="/insights"
          backLabel="All Insights"
          eyebrow={insight.category.toUpperCase()}
          title={insight.title}
          summary={insight.summary}
          meta={[`${insight.publishDate} · ${insight.readTime}`]}
        />

        <PublicBulletSection
          title="Key Points"
          items={insight.keyPoints}
        />

        <PublicProseSection
          title="Body"
          items={insight.bodySections}
        />
      </div>
    </PublicSiteShell>
  );
}
