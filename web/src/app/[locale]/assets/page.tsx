import { PublicSiteShell } from "@/components/public-site-shell";
import { fetchPublicAssets, parseAssetQueryFromSearchParams } from "@/lib/public-assets";
import { ErrorAlert } from "@/components/error-alert";

import { AssetsClient } from "./assets-client";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const initialQuery = parseAssetQueryFromSearchParams(resolvedSearchParams);
  const fetchResult = await fetchPublicAssets(initialQuery);
  const clientKey = JSON.stringify(initialQuery);

  if (!fetchResult.ok) {
    return (
      <PublicSiteShell ctaHref="/auth/login" ctaLabel="Sign in">
        <div className="space-y-8">
          <ErrorAlert error={fetchResult.error} />
        </div>
      </PublicSiteShell>
    );
  }

  return (
    <PublicSiteShell ctaHref="/auth/login" ctaLabel="Sign in">
      <AssetsClient key={clientKey} initialResponse={fetchResult.data} initialQuery={initialQuery} />
    </PublicSiteShell>
  );
}
