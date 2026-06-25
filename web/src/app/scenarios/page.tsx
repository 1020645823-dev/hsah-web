import Link from "next/link";

import {
  PublicContentCard,
  PublicMetricStrip,
  PublicSectionHero,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { scenarios } from "@/lib/public-content";

export default function ScenariosPage() {
  return (
    <PublicSiteShell ctaHref="/architecture" ctaLabel="View Architectures">
      <div className="space-y-8">
        <PublicSectionHero
          eyebrow="SCENARIOS"
          title="Scenario-led views of where AI creates operational lift."
          summary="Explore business journeys that connect user need, operating friction, governance expectations, and delivery value."
          actions={
            <>
              <Link
                href="/architecture"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-electric-purple)] px-6 text-sm font-medium text-white"
              >
                Explore Architecture
              </Link>
              <Link
                href="/community"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[rgb(212_218_245_/20%)] px-6 text-sm font-medium text-[var(--color-text-primary)]"
              >
                Join the Community
              </Link>
            </>
          }
        />

        <PublicMetricStrip
          items={[
            { value: `${scenarios.length}`, label: "Scenario plays" },
            { value: "3", label: "Transformation phases per play" },
            { value: "Outcome-led", label: "Planning lens" },
            { value: "Ready", label: "For detail review" },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {scenarios.map((item) => (
            <PublicContentCard
              key={item.slug}
              href={`/scenarios/${item.slug}`}
              eyebrow={item.industry.toUpperCase()}
              title={item.title}
              summary={item.summary}
              meta={item.businessOutcome}
              tags={item.tags}
            />
          ))}
        </div>
      </div>
    </PublicSiteShell>
  );
}
