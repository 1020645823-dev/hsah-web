import Link from "next/link";

import {
  PublicContentCard,
  PublicMetricStrip,
  PublicSectionHero,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { architectures } from "@/lib/public-content";

export default function ArchitecturePage() {
  return (
    <PublicSiteShell ctaHref="/scenarios" ctaLabel="Browse Scenarios">
      <div className="space-y-8">
        <PublicSectionHero
          eyebrow="ARCHITECTURE"
          title="Reference architectures that keep AI programs operable, governed, and reusable."
          summary="Use these viewpoints to frame core layers, ownership boundaries, and rollout risks before implementation starts."
          actions={
            <>
              <Link
                href="/insights"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Read Insights
              </Link>
              <Link
                href="/about"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Learn About the Hub
              </Link>
            </>
          }
        />

        <PublicMetricStrip
          items={[
            { value: `${architectures.length}`, label: "Reference architectures" },
            { value: "4", label: "Core layers per pattern" },
            { value: "Control-aware", label: "Design principle" },
            { value: "Reusable", label: "Across scenarios" },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {architectures.map((item) => (
            <PublicContentCard
              key={item.slug}
              href={`/architecture/${item.slug}`}
              eyebrow={item.eyebrow.toUpperCase()}
              title={item.title}
              summary={item.summary}
              meta={item.focus}
              tags={item.tags}
            />
          ))}
        </div>
      </div>
    </PublicSiteShell>
  );
}
