import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  PublicContentCard,
  PublicMetricStrip,
  PublicSectionHero,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { getMessageItemKey, scenarioSlugs } from "@/lib/public-content";

export default async function ScenariosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Scenarios" });

  return (
    <PublicSiteShell ctaHref="/architecture" ctaLabel={t("viewArchitectures")}>
      <div className="space-y-8">
        <PublicSectionHero
          eyebrow={t("eyebrow")}
          title={t("title")}
          summary={t("summary")}
          actions={
            <>
              <Link
                href="/architecture"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:translate-y-px"
              >
                {t("viewArchitectures")}
              </Link>
              <Link
                href="/community"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground transition-all hover:bg-muted active:translate-y-px"
              >
                {t("joinCommunity")}
              </Link>
            </>
          }
        />

        <PublicMetricStrip
          items={[
            { value: `${scenarioSlugs.length}`, label: t("allScenarios") },
            { value: "3", label: t("phasesPerScenario") },
            { value: "3", label: t("industriesServed") },
            { value: "3", label: t("outcomesTracked") },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {scenarioSlugs.map((slug) => {
            const item = t.raw(`items.${getMessageItemKey(slug)}`) as Record<string, unknown>;
            return (
              <PublicContentCard
                key={slug}
                href={`/scenarios/${slug}`}
                eyebrow={(item.industry as string).toUpperCase()}
                title={item.title as string}
                summary={item.summary as string}
                meta={item.businessOutcome as string}
                tags={item.tags as string[]}
              />
            );
          })}
        </div>
      </div>
    </PublicSiteShell>
  );
}
