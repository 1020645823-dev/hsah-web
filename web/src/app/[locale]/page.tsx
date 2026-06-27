import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  PublicMetricStrip,
  PublicSectionHero,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { ContentLaneGrid } from "@/components/public/content-lane-grid";
import { HomepageFeaturedAssets } from "@/components/public/homepage-featured-assets";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <PublicSiteShell ctaHref="/auth/login" ctaLabel={t("ctaLabel")}>
      <div className="space-y-10">
        <PublicSectionHero
          eyebrow={t("heroEyebrow")}
          title={t("heroTitle")}
          summary={t("heroSummary")}
          actions={
            <>
              <Link
                href="/assets"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-7 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:gap-3 hover:bg-primary/90"
              >
                {t("primaryCta")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-background px-7 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted"
              >
                {t("secondaryCta")}
              </Link>
            </>
          }
        />

        <PublicMetricStrip
          items={[
            { value: t("metrics.assets.value"), label: t("metrics.assets.label") },
            { value: t("metrics.industries.value"), label: t("metrics.industries.label") },
            { value: t("metrics.lanes.value"), label: t("metrics.lanes.label") },
            { value: t("metrics.entry.value"), label: t("metrics.entry.label") },
          ]}
        />

        <ContentLaneGrid />

        <HomepageFeaturedAssets />

        <div className="rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-card)] md:p-8">
          <div className="grid gap-6 md:grid-cols-[1.3fr_0.9fr] md:items-center">
            <div>
              <div className="text-xs font-medium tracking-[0.18em] text-primary">{t("valueEyebrow")}</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-foreground">
                {t("valueTitle")}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {t("valueSummary")}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/assets"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-all duration-150 hover:gap-3 hover:bg-primary/90"
              >
                {t("goToLibrary")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/scenarios"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t("browseScenarios")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicSiteShell>
  );
}
