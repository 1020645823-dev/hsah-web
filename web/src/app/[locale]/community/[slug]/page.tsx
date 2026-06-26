import { notFound } from "next/navigation";

import {
  PublicDetailHero,
  PublicProseSection,
  PublicRelatedLinks,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { getCommunityItemBySlug } from "@/lib/public-content";

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getCommunityItemBySlug(slug);

  if (!item) {
    notFound();
  }

  return (
    <PublicSiteShell ctaHref="/about" ctaLabel="Get in Touch">
      <div className="space-y-8">
        <PublicDetailHero
          backHref="/community"
          backLabel="All Community Programs"
          eyebrow={item.format.toUpperCase()}
          title={item.title}
          summary={item.summary}
          meta={[
            item.audience,
            `${item.dateLabel} · ${item.location}`,
          ]}
        />

        <PublicProseSection
          title="Agenda"
          items={item.agenda}
        />

        {item.resources.length > 0 && (
          <PublicRelatedLinks
            title="Resources"
            links={item.resources.map((r) => ({
              href: r.href,
              label: r.label,
            }))}
          />
        )}
      </div>
    </PublicSiteShell>
  );
}
