import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  PublicBulletSection,
  PublicMetricStrip,
  PublicRelatedLinks,
  PublicSectionHero,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { aboutHighlightKeys } from "@/lib/public-content";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });

  return (
    <PublicSiteShell ctaHref="/community" ctaLabel={t("joinCommunity")}>
      <div className="space-y-8">
        <PublicSectionHero
          eyebrow={t("eyebrow")}
          title={t("title")}
          summary={t("summary")}
          actions={
            <>
              <Link
                href="/assets"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("exploreAssets")}
              </Link>
              <Link
                href="/insights"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t("readInsights")}
              </Link>
            </>
          }
        />

        <PublicMetricStrip
          items={[
            { value: t("metrics.discoveryApproach.value"), label: t("metrics.discoveryApproach.label") },
            { value: t("metrics.architecturePosture.value"), label: t("metrics.architecturePosture.label") },
            { value: t("metrics.contentMode.value"), label: t("metrics.contentMode.label") },
            { value: t("metrics.learningModel.value"), label: t("metrics.learningModel.label") },
          ]}
        />

        <div className="grid gap-5 md:grid-cols-3">
          {aboutHighlightKeys.map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
            >
              <div className="text-lg font-semibold text-foreground">{t(`highlights.${key}.title`)}</div>
              <div className="mt-3 text-sm leading-6 text-muted-foreground">{t(`highlights.${key}.description`)}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <PublicBulletSection
            title={t("howUsedTitle")}
            items={[
              t("howUsedItems.0"),
              t("howUsedItems.1"),
              t("howUsedItems.2"),
              t("howUsedItems.3"),
            ]}
          />
          <PublicRelatedLinks
            title={t("startFromSection")}
            links={[
              {
                href: "/scenarios",
                label: t("startWithScenarios.label"),
                description: t("startWithScenarios.description"),
              },
              {
                href: "/architecture",
                label: t("startWithArchitecture.label"),
                description: t("startWithArchitecture.description"),
              },
              {
                href: "/community",
                label: t("startWithCommunity.label"),
                description: t("startWithCommunity.description"),
              },
              {
                href: "/assets",
                label: t("goToAssets.label"),
                description: t("goToAssets.description"),
              },
            ]}
          />
        </div>
      </div>
    </PublicSiteShell>
  );
}
