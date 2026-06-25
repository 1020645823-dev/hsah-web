import { PublicSiteShell } from "@/components/public-site-shell";
import { fetchPublicAssets, parseAssetQueryFromSearchParams } from "@/lib/public-assets";

import { AssetsClient } from "./assets-client";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const initialQuery = parseAssetQueryFromSearchParams(resolvedSearchParams);
  const initialResponse = await fetchPublicAssets(initialQuery);
  const clientKey = JSON.stringify(initialQuery);

  return (
    <PublicSiteShell ctaHref="/auth/login" ctaLabel="Sign in">
      <AssetsClient key={clientKey} initialResponse={initialResponse} initialQuery={initialQuery} />
    </PublicSiteShell>
  );
}
