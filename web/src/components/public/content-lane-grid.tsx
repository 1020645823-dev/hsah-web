import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { homepageContentLanes } from "@/lib/public-content";

export function ContentLaneGrid() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-[0.18em] text-primary">CONTENT LANES</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Choose your path</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
          Start with the lens that matches your role, then move deeper into assets, decisions, and reuse patterns.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {homepageContentLanes.map((lane) => (
          <Link
            key={lane.href}
            href={lane.href}
            className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-primary/30"
          >
            <p className="text-xs font-medium tracking-[0.18em] text-primary">{lane.audience}</p>
            <h3 className="mt-4 text-xl font-semibold text-foreground">{lane.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{lane.summary}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground">
              Open lane
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
