import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { RouteGuard } from "@/components/route-guard";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = await getTranslations("Admin");
  return (
    <RouteGuard>
      <AdminShell pageTitle={t("layout.defaultTitle")}>{children}</AdminShell>
    </RouteGuard>
  );
}
