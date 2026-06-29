import { getTranslations } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export default async function AdminAnalyticsPage() {
  const t = await getTranslations("Admin");
  return (
    <AdminShell pageTitle={t("analytics.title")}>
      <AnalyticsDashboard />
    </AdminShell>
  );
}
