import { getTranslations } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { AccessRequestQueue } from "@/components/admin/access-request-queue";

export default async function AdminAccessRequestsPage() {
  const t = await getTranslations("Admin");
  return (
    <AdminShell pageTitle={t("accessRequests.title")}>
      <AccessRequestQueue />
    </AdminShell>
  );
}
