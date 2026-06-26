import { notFound } from "next/navigation";

import {
  PublicBulletSection,
  PublicDetailHero,
  PublicProseSection,
  PublicRelatedLinks,
  PublicSiteShell,
} from "@/components/public-site-shell";
import {
  getArchitectureBySlug,
  scenarios,
} from "@/lib/public-content";

export default async function ArchitectureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const architecture = getArchitectureBySlug(slug);

  if (!architecture) {
    notFound();
  }

  const relatedScenarios = scenarios.filter((s) =>
    architecture.relatedScenarioSlugs.includes(s.slug),
  );

  return (
    <PublicSiteShell ctaHref="/scenarios" ctaLabel="Browse Scenarios">
      <div className="space-y-8">
        <PublicDetailHero
          backHref="/architecture"
          backLabel="All Architectures"
          eyebrow={architecture.eyebrow.toUpperCase()}
          title={architecture.title}
          summary={architecture.summary}
          meta={[architecture.focus]}
          tags={architecture.tags}
        />

        <PublicProseSection
          title="Architecture Layers"
          items={architecture.layers}
        />

        <PublicBulletSection
          title="Governance"
          items={architecture.governance}
        />

        <PublicBulletSection
          title="Deployment Notes"
          items={architecture.deploymentNotes}
        />

        {relatedScenarios.length > 0 && (
          <PublicRelatedLinks
            title="Related Scenarios"
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
