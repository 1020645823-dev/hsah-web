import { notFound } from "next/navigation";

import {
  PublicDetailHero,
  PublicMetricStrip,
  PublicProseSection,
  PublicRelatedLinks,
  PublicSiteShell,
} from "@/components/public-site-shell";
import {
  architectures,
  getScenarioBySlug,
} from "@/lib/public-content";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scenario = getScenarioBySlug(slug);

  if (!scenario) {
    notFound();
  }

  const relatedArchitectures = architectures.filter((a) =>
    scenario.relatedArchitectureSlugs.includes(a.slug),
  );

  return (
    <PublicSiteShell ctaHref="/architecture" ctaLabel="View Architectures">
      <div className="space-y-8">
        <PublicDetailHero
          backHref="/scenarios"
          backLabel="All Scenarios"
          eyebrow={scenario.eyebrow.toUpperCase()}
          title={scenario.title}
          summary={scenario.summary}
          meta={[scenario.industry, scenario.businessOutcome]}
          tags={scenario.tags}
        />

        <PublicMetricStrip
          items={scenario.metrics.map((m) => ({
            value: m.value,
            label: m.label,
          }))}
        />

        <PublicProseSection
          title="Transformation Phases"
          items={scenario.phases}
        />

        {relatedArchitectures.length > 0 && (
          <PublicRelatedLinks
            title="Related Architectures"
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
