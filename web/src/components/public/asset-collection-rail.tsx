"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FolderOpen } from "lucide-react";

import type { PublicCollectionSummary } from "@/lib/public-assets";

export function AssetCollectionRail({ collections }: { collections: PublicCollectionSummary[] }) {
  const t = useTranslations("Assets");

  if (!collections || collections.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <FolderOpen className="h-5 w-5 text-primary" />
        {t("collectionsTitle")}
      </h2>
      <p className="text-sm text-muted-foreground">{t("collectionsSummary")}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/assets/collections/${collection.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-[var(--shadow-card-hover)]"
          >
            {collection.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={collection.cover_url}
                alt=""
                aria-hidden="true"
                className="h-32 w-full object-cover"
              />
            ) : (
              <div className="h-2 w-full bg-gradient-to-r from-primary/40 to-primary/10" />
            )}
            <div className="space-y-1 p-5">
              <h3 className="text-base font-semibold text-card-foreground transition-colors group-hover:text-primary">
                {collection.title}
              </h3>
              {collection.summary && (
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {collection.summary}
                </p>
              )}
              <p className="pt-2 text-xs font-medium text-muted-foreground">
                {t("collectionItemCount", { count: collection.item_count })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
