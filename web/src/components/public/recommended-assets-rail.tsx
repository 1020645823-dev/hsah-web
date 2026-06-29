"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

import type { PublicAssetSummary } from "@/lib/public-assets";

export function RecommendedAssetsRail({ assets }: { assets: PublicAssetSummary[] }) {
  const t = useTranslations("Assets");

  if (!assets || assets.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Sparkles className="h-5 w-5 text-primary" />
        {t("recommendedTitle")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {assets.map((asset) => (
          <Link
            key={asset.id}
            href={`/assets/${asset.slug}`}
            className="group flex flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-[var(--shadow-card-hover)]"
          >
            <h3 className="text-sm font-semibold text-card-foreground transition-colors group-hover:text-primary">
              {asset.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {asset.short_description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
