import { getTranslations } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { AuditLogTable } from "@/components/admin/audit-log-table";

export default async function AdminAuditLogsPage() {
  const t = await getTranslations("Admin");
  return (
    <AdminShell pageTitle={t("audit.title")}>
      <AuditLogTable />
    </AdminShell>
  );
}
