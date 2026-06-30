"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export function ContentLaneGrid() {
  const t = useTranslations("ContentLanes");
  const items = t.raw("items") as Record<string, { href: string; title: string; summary: string; audience: string }>;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-[0.18em] text-primary">{t("eyebrow")}</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">{t("title")}</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
          {t("summary")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(items).map(([key, lane]) => (
          <Link
            key={key}
            href={lane.href}
            className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-card-hover)] active:translate-y-px"
          >
            <p className="text-xs font-medium tracking-[0.18em] text-primary">{lane.audience}</p>
            <h3 className="mt-4 text-xl font-semibold text-foreground">{lane.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{lane.summary}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground">
              {t("browseAll")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
