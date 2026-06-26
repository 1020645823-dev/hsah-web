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
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Explore Architecture
              </Link>
              <Link
                href="/community"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
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
