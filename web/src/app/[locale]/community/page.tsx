import Link from "next/link";

import {
  PublicContentCard,
  PublicMetricStrip,
  PublicSectionHero,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { communityItems } from "@/lib/public-content";

export default function CommunityPage() {
  return (
    <PublicSiteShell ctaHref="/about" ctaLabel="Get in Touch">
      <div className="space-y-8">
        <PublicSectionHero
          eyebrow="COMMUNITY"
          title="Programs that turn isolated delivery teams into a working learning network."
          summary="Find roundtables, labs, and recurring working groups designed for architects, operators, and product leaders."
          actions={
            <>
              <Link
                href="/insights"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Read Insights
              </Link>
              <Link
                href="/scenarios"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Explore Scenarios
              </Link>
            </>
          }
        />

        <PublicMetricStrip
          items={[
            { value: `${communityItems.length}`, label: "Programs and events" },
            { value: "Hybrid", label: "Engagement format" },
            { value: "Operators", label: "Primary audience" },
            { value: "Ongoing", label: "Participation cadence" },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {communityItems.map((item) => (
            <PublicContentCard
              key={item.slug}
              href={`/community/${item.slug}`}
              eyebrow={item.format.toUpperCase()}
              title={item.title}
              summary={item.summary}
              meta={`${item.dateLabel} · ${item.location}`}
              tags={[item.audience]}
            />
          ))}
        </div>
      </div>
    </PublicSiteShell>
  );
}
