import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  PublicContentCard,
  PublicMetricStrip,
  PublicSectionHero,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { communitySlugs, getMessageItemKey } from "@/lib/public-content";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Community" });

  return (
    <PublicSiteShell ctaHref="/about" ctaLabel={t("readInsights")}>
      <div className="space-y-8">
        <PublicSectionHero
          eyebrow={t("eyebrow")}
          title={t("title")}
          summary={t("summary")}
          actions={
            <>
              <Link
                href="/insights"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:translate-y-px"
              >
                {t("readInsights")}
              </Link>
              <Link
                href="/scenarios"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground transition-all hover:bg-muted active:translate-y-px"
              >
                {t("exploreScenarios")}
              </Link>
            </>
          }
        />

        <PublicMetricStrip
          items={[
            { value: `${communitySlugs.length}`, label: t("allPrograms") },
            { value: "3", label: t("formatsOffered") },
            { value: "2", label: t("deliveryModes") },
            { value: "Monthly", label: t("cadence") },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {communitySlugs.map((slug) => {
            const item = t.raw(`items.${getMessageItemKey(slug)}`) as Record<string, unknown>;
            return (
              <PublicContentCard
                key={slug}
                href={`/community/${slug}`}
                eyebrow={(item.format as string).toUpperCase()}
                title={item.title as string}
                summary={item.summary as string}
                meta={`${item.dateLabel} · ${item.location}`}
                tags={[item.audience as string]}
              />
            );
          })}
        </div>
      </div>
    </PublicSiteShell>
  );
}
