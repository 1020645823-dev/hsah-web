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
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-electric-purple)] px-6 text-sm font-medium text-white"
              >
                Read Insights
              </Link>
              <Link
                href="/about"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[rgb(212_218_245_/20%)] px-6 text-sm font-medium text-[var(--color-text-primary)]"
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
