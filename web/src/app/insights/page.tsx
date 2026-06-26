import Link from "next/link";

import {
  PublicContentCard,
  PublicMetricStrip,
  PublicSectionHero,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { insights } from "@/lib/public-content";

export default function InsightsPage() {
  return (
    <PublicSiteShell ctaHref="/about" ctaLabel="About the Platform">
      <div className="space-y-8">
        <PublicSectionHero
          eyebrow="INSIGHTS"
          title="Concise perspectives for teams moving from exploration to delivery."
          summary="Short-form thinking on portfolio design, knowledge systems, control models, and experience design for enterprise AI."
          actions={
            <>
              <Link
                href="/architecture"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Review Architectures
              </Link>
              <Link
                href="/community"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Join Programs
              </Link>
            </>
          }
        />

        <PublicMetricStrip
          items={[
            { value: `${insights.length}`, label: "Published perspectives" },
            { value: "5-6", label: "Minute average read time" },
            { value: "Editorial", label: "Format style" },
            { value: "Actionable", label: "Decision support" },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {insights.map((item) => (
            <PublicContentCard
              key={item.slug}
              href={`/insights/${item.slug}`}
              eyebrow={item.category.toUpperCase()}
              title={item.title}
              summary={item.summary}
              meta={`${item.publishDate} · ${item.readTime}`}
              tags={item.keyPoints.slice(0, 2)}
            />
          ))}
        </div>
      </div>
    </PublicSiteShell>
  );
}
