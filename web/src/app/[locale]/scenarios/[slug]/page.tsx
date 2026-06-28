import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  PublicDetailHero,
  PublicMetricStrip,
  PublicProseSection,
  PublicRelatedLinks,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { getMessageItemKey } from "@/lib/public-content";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Scenarios" });
  const tArch = await getTranslations({ locale, namespace: "Architectures" });

  const item = t.raw(`items.${getMessageItemKey(slug)}`) as Record<string, unknown> | undefined;
  if (!item) {
    notFound();
  }

  const relatedSlugs = item.relatedArchitectureSlugs as string[];
  const relatedArchitectures = relatedSlugs
    .map((s) => {
      const arch = tArch.raw(`items.${getMessageItemKey(s)}`) as Record<string, unknown> | undefined;
      if (!arch) return null;
      return { slug: s, title: arch.title as string, summary: arch.summary as string };
    })
    .filter((a): a is { slug: string; title: string; summary: string } => a !== null);

  const metrics = (item.metrics as { label: string; value: string }[]) || [];
  const phases = (item.phases as { title: string; description: string }[]) || [];

  return (
    <PublicSiteShell ctaHref="/architecture" ctaLabel={t("viewArchitectures")}>
      <div className="space-y-8">
        <PublicDetailHero
          backHref="/scenarios"
          backLabel={t("allScenarios")}
          eyebrow={(item.eyebrow as string).toUpperCase()}
          title={item.title as string}
          summary={item.summary as string}
          meta={[item.industry as string, item.businessOutcome as string]}
          tags={item.tags as string[]}
        />

        <PublicMetricStrip
          items={metrics.map((m) => ({
            value: m.value,
            label: m.label,
          }))}
        />

        <PublicProseSection
          title={t("phases")}
          items={phases}
        />

        {relatedArchitectures.length > 0 && (
          <PublicRelatedLinks
            title={t("relatedArchitectures")}
            links={relatedArchitectures.map((a) => ({
              href: `/architecture/${a.slug}`,
              label: a.title,
              description: a.summary,
            }))}
          />
        )}
      </div>
    </PublicSiteShell>
  );
}
