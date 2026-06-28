import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  PublicContentCard,
  PublicMetricStrip,
  PublicSectionHero,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { architectureSlugs, getMessageItemKey } from "@/lib/public-content";

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Architectures" });

  return (
    <PublicSiteShell ctaHref="/scenarios" ctaLabel={t("browseScenarios")}>
      <div className="space-y-8">
        <PublicSectionHero
          eyebrow={t("eyebrow")}
          title={t("title")}
          summary={t("summary")}
          actions={
            <>
              <Link
                href="/insights"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("readInsights")}
              </Link>
              <Link
                href="/about"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t("readInsights")}
              </Link>
            </>
          }
        />

        <PublicMetricStrip
          items={[
            { value: `${architectureSlugs.length}`, label: t("allArchitectures") },
            { value: "4", label: t("layers") },
            { value: t("governance"), label: t("focus") },
            { value: t("deploymentNotes"), label: t("relatedScenarios") },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {architectureSlugs.map((slug) => {
            const item = t.raw(`items.${getMessageItemKey(slug)}`) as Record<string, unknown>;
            return (
              <PublicContentCard
                key={slug}
                href={`/architecture/${slug}`}
                eyebrow={(item.eyebrow as string).toUpperCase()}
                title={item.title as string}
                summary={item.summary as string}
                meta={item.focus as string}
                tags={item.tags as string[]}
              />
            );
          })}
        </div>
      </div>
    </PublicSiteShell>
  );
}
