import { getTranslations } from "next-intl/server";

import { PublicSiteShell } from "@/components/public-site-shell";
import { fetchPublicAssets, parseAssetQueryFromSearchParams } from "@/lib/public-assets";
import { ErrorAlert } from "@/components/error-alert";

import { AssetsClient } from "./assets-client";

export default async function AssetsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Assets" });

  const resolvedSearchParams = await searchParams;
  const initialQuery = parseAssetQueryFromSearchParams(resolvedSearchParams);
  const fetchResult = await fetchPublicAssets(initialQuery);
  const clientKey = JSON.stringify(initialQuery);

  if (!fetchResult.ok) {
    return (
      <PublicSiteShell ctaHref="/auth/login" ctaLabel={t("ctaLabel")}>
        <div className="space-y-8">
          <ErrorAlert error={fetchResult.error} />
        </div>
      </PublicSiteShell>
    );
  }

  return (
    <PublicSiteShell ctaHref="/auth/login" ctaLabel={t("ctaLabel")}>
      <AssetsClient key={clientKey} initialResponse={fetchResult.data} initialQuery={initialQuery} />
    </PublicSiteShell>
  );
}
