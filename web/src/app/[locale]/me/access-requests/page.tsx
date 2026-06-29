import { getTranslations } from "next-intl/server";

import { PublicSiteShell } from "@/components/public-site-shell";
import { MyAccessRequests } from "@/components/public/my-access-requests";

export default async function MyAccessRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AssetDetail" });
  return (
    <PublicSiteShell ctaHref="/assets" ctaLabel={t("ctaLabel")}>
      <MyAccessRequests />
    </PublicSiteShell>
  );
}
