import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { cn } from "@/lib/utils";

type SectionHeroProps = {
  eyebrow: string;
  title: string;
  summary: string;
  align?: "left" | "center";
  actions?: ReactNode;
};

type MetricStripProps = {
  items: Array<{
    value: string;
    label: string;
  }>;
};

type ContentCardProps = {
  href: string;
  eyebrow: string;
  title: string;
  summary: string;
  meta?: string;
  tags?: string[];
};

type DetailHeroProps = {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  summary: string;
  meta?: string[];
  tags?: string[];
};

function GlassPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-border/70 bg-card/90 shadow-[var(--shadow-card)] backdrop-blur-[10px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PublicSiteShell({
  children,
  ctaHref = "/assets",
  ctaLabel = "Open Library",
}: {
  children: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#090b14_0%,#12172b_18rem,#f6f7fb_18rem,#f6f7fb_100%)] text-foreground">
      <PublicHeader ctaHref={ctaHref} ctaLabel={ctaLabel} />
      <div className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-7xl flex-col px-6 py-10 md:px-8">
        <main className="flex-1">{children}</main>
      </div>
      <PublicFooter />
    </div>
  );
}

export function PublicSectionHero({
  eyebrow,
  title,
  summary,
  align = "left",
  actions,
}: SectionHeroProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-[28px]", align === "center" && "text-center")}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#1c1967_0%,#3d348b_40%,#7b3ff2_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(91_82_246_/_25%),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgb(192_38_211_/_15%),transparent_50%)]" />
      <div className="relative px-7 py-12 md:px-12 md:py-16">
        <div className={cn("space-y-5", align === "center" && "mx-auto max-w-3xl")}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-white/85 uppercase backdrop-blur-sm">
            <span className="inline-block size-1.5 rounded-full bg-[#6b6ef9]" />
            {eyebrow}
          </div>
          <h1 className="max-w-4xl text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white md:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/70 md:text-lg">
            {summary}
          </p>
          {actions ? <div className="flex flex-wrap gap-3 pt-3">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function PublicMetricStrip({ items }: MetricStripProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <GlassPanel key={item.label} className="px-5 py-5">
          <div className="text-3xl font-semibold text-foreground">{item.value}</div>
          <div className="mt-2 text-sm text-muted-foreground">{item.label}</div>
        </GlassPanel>
      ))}
    </div>
  );
}

export function PublicContentCard({ href, eyebrow, title, summary, meta, tags }: ContentCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-[26px] border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="text-xs font-medium tracking-[0.18em] text-primary">{eyebrow}</div>
        {meta ? <div className="text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      <div className="mt-5">
        <h2 className="text-xl font-semibold text-foreground transition-colors group-hover:text-primary">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{summary}</p>
      </div>
      {tags?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground">
        Open details
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export function PublicDetailHero({
  backHref,
  backLabel,
  eyebrow,
  title,
  summary,
  meta,
  tags,
}: DetailHeroProps) {
  return (
    <GlassPanel className="px-7 py-8 md:px-10 md:py-10">
      <div className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="size-4 rotate-180" />
          {backLabel}
        </Link>
        <div className="text-xs font-medium tracking-[0.18em] text-primary">{eyebrow}</div>
        <h1 className="max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-0.03em] text-foreground md:text-5xl">
          {title}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">{summary}</p>
        {meta?.length ? (
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {meta.map((item) => (
              <span key={item} className="rounded-full border border-border px-3 py-1.5">
                {item}
              </span>
            ))}
          </div>
        ) : null}
        {tags?.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-primary/25 bg-primary/8 px-2.5 py-1 text-xs text-primary">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </GlassPanel>
  );
}

export function PublicProseSection({
  title,
  items,
}: {
  title: string;
  items: Array<{
    title: string;
    description: string;
  }>;
}) {
  return (
    <GlassPanel className="px-6 py-6 md:px-8">
      <div className="text-lg font-semibold text-foreground">{title}</div>
      <div className="mt-5 space-y-5">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-border bg-muted/35 p-5">
            <div className="text-sm font-medium text-foreground">{item.title}</div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

export function PublicBulletSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <GlassPanel className="px-6 py-6 md:px-8">
      <div className="text-lg font-semibold text-foreground">{title}</div>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-border bg-muted/35 px-4 py-4 text-sm leading-6 text-muted-foreground"
          >
            {item}
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

export function PublicRelatedLinks({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string; description?: string }>;
}) {
  return (
    <GlassPanel className="px-6 py-6 md:px-8">
      <div className="text-lg font-semibold text-foreground">{title}</div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-border bg-muted/35 p-5 transition-colors hover:border-primary/30"
          >
            <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              {item.label}
              <ArrowRight className="size-4" />
            </div>
            {item.description ? <div className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</div> : null}
          </Link>
        ))}
      </div>
    </GlassPanel>
  );
}
