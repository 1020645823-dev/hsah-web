import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getHomepageFeaturedAssets } from "@/lib/public-content";

export function HomepageFeaturedAssets() {
  const featuredAssets = getHomepageFeaturedAssets();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-[0.18em] text-primary">CURATED PICKS</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Featured assets</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
          Jump straight into reusable reference assets that frame trust, orchestration, and knowledge delivery.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {featuredAssets.map((asset) => (
          <Link
            key={asset.href}
            href={asset.href}
            className="group rounded-2xl border border-border bg-card p-6 text-foreground shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-primary/30"
          >
            <div className="flex flex-wrap items-center gap-3 text-xs tracking-[0.18em] text-muted-foreground">
              <span>{asset.eyebrow}</span>
              <span>{asset.audience}</span>
            </div>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight">{asset.title}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{asset.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {asset.tags.map((tag) => (
                <span key={tag} className="rounded-md border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground">
              View asset details
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
