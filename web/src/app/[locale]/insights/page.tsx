import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  PublicContentCard,
  PublicMetricStrip,
  PublicSectionHero,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { insightSlugs } from "@/lib/public-content";

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Insights" });

  return (
    <PublicSiteShell ctaHref="/about" ctaLabel={t("reviewArchitectures")}>
      <div className="space-y-8">
        <PublicSectionHero
          eyebrow={t("eyebrow")}
          title={t("title")}
          summary={t("summary")}
          actions={
            <>
              <Link
                href="/architecture"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("reviewArchitectures")}
              </Link>
              <Link
                href="/community"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t("reviewArchitectures")}
              </Link>
            </>
          }
        />

        <PublicMetricStrip
          items={[
            { value: `${insightSlugs.length}`, label: t("allInsights") },
            { value: "5-6", label: t("readTime") },
            { value: t("keyPoints"), label: t("published") },
            { value: t("readTime"), label: t("keyPoints") },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {insightSlugs.map((slug) => {
            const item = t.raw(`items.${slug}`) as Record<string, unknown>;
            return (
              <PublicContentCard
                key={slug}
                href={`/insights/${slug}`}
                eyebrow={(item.category as string).toUpperCase()}
                title={item.title as string}
                summary={item.summary as string}
                meta={`${item.publishDate} · ${item.readTime}`}
                tags={(item.keyPoints as string[]).slice(0, 2)}
              />
            );
          })}
        </div>
      </div>
    </PublicSiteShell>
  );
}
