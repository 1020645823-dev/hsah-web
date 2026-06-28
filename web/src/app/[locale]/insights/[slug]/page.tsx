import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  PublicBulletSection,
  PublicDetailHero,
  PublicProseSection,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { getMessageItemKey } from "@/lib/public-content";

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Insights" });

  const item = t.raw(`items.${getMessageItemKey(slug)}`) as Record<string, unknown> | undefined;
  if (!item) {
    notFound();
  }

  const keyPoints = (item.keyPoints as string[]) || [];
  const bodySections = (item.bodySections as { title: string; description: string }[]) || [];

  return (
    <PublicSiteShell ctaHref="/community" ctaLabel={t("joinCommunity")}>
      <div className="space-y-8">
        <PublicDetailHero
          backHref="/insights"
          backLabel={t("allInsights")}
          eyebrow={(item.category as string).toUpperCase()}
          title={item.title as string}
          summary={item.summary as string}
          meta={[`${item.publishDate} · ${item.readTime}`]}
        />

        <PublicBulletSection
          title={t("keyPoints")}
          items={keyPoints}
        />

        <PublicProseSection
          title={t("published")}
          items={bodySections}
        />
      </div>
    </PublicSiteShell>
  );
}
