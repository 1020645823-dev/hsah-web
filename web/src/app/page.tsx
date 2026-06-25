import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  PublicMetricStrip,
  PublicSectionHero,
  PublicSiteShell,
} from "@/components/public-site-shell";
import { ContentLaneGrid } from "@/components/public/content-lane-grid";
import { HomepageFeaturedAssets } from "@/components/public/homepage-featured-assets";

export default function Home() {
  return (
    <PublicSiteShell ctaHref="/auth/login" ctaLabel="Sign in">
      <div className="space-y-10">
        <PublicSectionHero
          eyebrow="HSAH PLATFORM"
          title="A branded content platform for AI delivery assets"
          summary="Move from discovery to reuse through scenarios, architectures, insights, and implementation-ready assets with one shared public shell."
          actions={
            <>
              <Link
                href="/assets"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-sm font-semibold text-[#1c1967] shadow-lg shadow-black/15 transition-all duration-200 hover:gap-3 hover:bg-white/95 hover:shadow-xl hover:shadow-black/20"
              >
                Explore Asset Library
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 bg-white/8 px-7 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/15 hover:border-white/35"
              >
                See Platform Overview
              </Link>
            </>
          }
        />

        <PublicMetricStrip
          items={[
            { value: "150+", label: "Solution assets and demos" },
            { value: "12", label: "Industry lenses and operating contexts" },
            { value: "4", label: "Role-based content lanes" },
            { value: "1", label: "Unified public entry point" },
          ]}
        />

        <ContentLaneGrid />

        <HomepageFeaturedAssets />

        <div className="rounded-[28px] border border-border bg-card p-7 shadow-[var(--shadow-card)] md:p-8">
          <div className="grid gap-6 md:grid-cols-[1.3fr_0.9fr] md:items-center">
            <div>
              <div className="text-xs font-medium tracking-[0.18em] text-primary">PLATFORM VALUE</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-foreground">
                Align stakeholders, then move into implementation detail.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                The homepage now frames the product, exposes real featured assets, and sends every role into the most
                relevant content lane before they enter the library.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/assets"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-all duration-150 hover:gap-3 hover:bg-primary/90"
              >
                Go to Asset Library
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/scenarios"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Browse Scenarios
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicSiteShell>
  );
}
