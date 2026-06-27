import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  PublicBulletSection,
  PublicDetailHero,
  PublicProseSection,
  PublicRelatedLinks,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { scenarioSlugs } from "@/lib/public-content";

export default async function ArchitectureDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Architectures" });
  const tScen = await getTranslations({ locale, namespace: "Scenarios" });

  const item = t.raw(`items.${slug}`) as Record<string, unknown> | undefined;
  if (!item) {
    notFound();
  }

  const relatedSlugs = item.relatedScenarioSlugs as string[];
  const relatedScenarios = relatedSlugs
    .map((s) => {
      const scen = tScen.raw(`items.${s}`) as Record<string, unknown> | undefined;
      if (!scen) return null;
      return { slug: s, title: scen.title as string, summary: scen.summary as string };
    })
    .filter((a): a is { slug: string; title: string; summary: string } => a !== null);

  const layers = (item.layers as { title: string; description: string }[]) || [];
  const governance = (item.governance as string[]) || [];
  const deploymentNotes = (item.deploymentNotes as string[]) || [];

  return (
    <PublicSiteShell ctaHref="/scenarios" ctaLabel={t("browseScenarios")}>
      <div className="space-y-8">
        <PublicDetailHero
          backHref="/architecture"
          backLabel={t("allArchitectures")}
          eyebrow={(item.eyebrow as string).toUpperCase()}
          title={item.title as string}
          summary={item.summary as string}
          meta={[item.focus as string]}
          tags={item.tags as string[]}
        />

        <PublicProseSection
          title={t("layers")}
          items={layers}
        />

        <PublicBulletSection
          title={t("governance")}
          items={governance}
        />

        <PublicBulletSection
          title={t("deploymentNotes")}
          items={deploymentNotes}
        />

        {relatedScenarios.length > 0 && (
          <PublicRelatedLinks
            title={t("relatedScenarios")}
            links={relatedScenarios.map((s) => ({
              href: `/scenarios/${s.slug}`,
              label: s.title,
              description: s.summary,
            }))}
          />
        )}
      </div>
    </PublicSiteShell>
  );
}
