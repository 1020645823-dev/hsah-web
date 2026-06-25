import Link from "next/link";

import {
  PublicBulletSection,
  PublicMetricStrip,
  PublicRelatedLinks,
  PublicSectionHero,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { aboutHighlights } from "@/lib/public-content";

export default function AboutPage() {
  return (
    <PublicSiteShell ctaHref="/community" ctaLabel="Join Community">
      <div className="space-y-8">
        <PublicSectionHero
          eyebrow="ABOUT"
          title="A public content layer that helps teams align before they commit to build."
          summary="The hub connects scenario framing, architecture direction, editorial insight, and community participation so teams can move from curiosity to execution with less ambiguity."
          actions={
            <>
              <Link
                href="/assets"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-electric-purple)] px-6 text-sm font-medium text-white"
              >
                Explore Assets
              </Link>
              <Link
                href="/insights"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[rgb(212_218_245_/20%)] px-6 text-sm font-medium text-[var(--color-text-primary)]"
              >
                Read Insights
              </Link>
            </>
          }
        />

        <PublicMetricStrip
          items={[
            { value: "Scenario-led", label: "Discovery approach" },
            { value: "Reference-first", label: "Architecture posture" },
            { value: "Editorial", label: "Content mode" },
            { value: "Community-backed", label: "Learning model" },
          ]}
        />

        <div className="grid gap-5 md:grid-cols-3">
          {aboutHighlights.map((item) => (
            <div
              key={item.title}
              className="rounded-[26px] border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/72%)] p-6 shadow-[var(--shadow-card)]"
            >
              <div className="text-lg font-semibold text-[var(--color-text-primary)]">{item.title}</div>
              <div className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{item.description}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <PublicBulletSection
            title="How the platform is used"
            items={[
              "Stakeholders browse scenarios to align on business value and workflow change.",
              "Architecture teams use reference patterns to reduce design churn before delivery begins.",
              "Program leaders share insight articles to align controls, ownership, and rollout expectations.",
              "Working groups and labs create a repeatable feedback loop across teams and sectors.",
            ]}
          />
          <PublicRelatedLinks
            title="Start from the section that fits your need"
            links={[
              {
                href: "/scenarios",
                label: "Start with scenarios",
                description: "Use business journeys when the problem statement is still forming.",
              },
              {
                href: "/architecture",
                label: "Start with architecture",
                description: "Use reference views when the delivery model and controls need alignment.",
              },
              {
                href: "/community",
                label: "Start with community",
                description: "Use programs and labs when teams need peer exchange and practical review.",
              },
              {
                href: "/assets",
                label: "Go to assets",
                description: "Use the asset library when the team is ready for implementation-oriented exploration.",
              },
            ]}
          />
        </div>
      </div>
    </PublicSiteShell>
  );
}
