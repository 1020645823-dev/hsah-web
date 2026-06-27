"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { getHomepageFeaturedAssetSlugs } from "@/lib/public-content";

export function HomepageFeaturedAssets() {
  const t = useTranslations("FeaturedAssets");
  const tArch = useTranslations("Architectures");
  const slugs = getHomepageFeaturedAssetSlugs();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-[0.18em] text-primary">{t("eyebrow")}</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">{t("title")}</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
          {t("summary")}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {slugs.map((slug) => {
          const item = tArch.raw(`items.${slug}`) as Record<string, unknown>;
          return (
            <Link
              key={slug}
              href={`/architecture/${slug}`}
              className="group rounded-2xl border border-border bg-card p-6 text-foreground shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-primary/30"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs tracking-[0.18em] text-muted-foreground">
                <span>{item.eyebrow as string}</span>
                <span>{item.focus as string}</span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight">{item.title as string}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{item.summary as string}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(item.tags as string[]).slice(0, 2).map((tag) => (
                  <span key={tag} className="rounded-md border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                {t("viewAsset")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
