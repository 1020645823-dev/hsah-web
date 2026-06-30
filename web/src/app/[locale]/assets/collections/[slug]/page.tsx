import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PublicSiteShell } from "@/components/public-site-shell";
import { ErrorAlert } from "@/components/error-alert";
import { fetchPublicCollectionDetail } from "@/lib/public-assets";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Assets" });
  const result = await fetchPublicCollectionDetail(slug);

  if (!result.ok) {
    if (result.error.status === 404) {
      notFound();
    }
    return (
      <PublicSiteShell ctaHref="/auth/login" ctaLabel={t("ctaLabel")}>
        <ErrorAlert error={result.error} />
      </PublicSiteShell>
    );
  }

  const collection = result.data;

  return (
    <PublicSiteShell ctaHref="/auth/login" ctaLabel={t("ctaLabel")}>
      <div className="space-y-8">
        <div className="space-y-2">
          <Link
            href="/assets"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {t("collectionsTitle")}
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{collection.title}</h1>
          {collection.summary && (
            <p className="text-base leading-relaxed text-muted-foreground">{collection.summary}</p>
          )}
        </div>

        {collection.items.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            {t("collectionEmpty")}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collection.items.map((item) => (
              <Link
                key={item.id}
                href={`/assets/${item.slug}`}
                className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-border hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold leading-snug text-card-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {item.short_description}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {item.cloud_providers.map((provider) => (
                    <span
                      key={provider}
                      className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {provider.toUpperCase()}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicSiteShell>
  );
}
