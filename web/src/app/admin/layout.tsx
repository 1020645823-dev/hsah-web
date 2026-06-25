import { AdminShell } from "@/components/admin/admin-shell";
import { RouteGuard } from "@/components/route-guard";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RouteGuard>
      <AdminShell pageTitle="Admin">{children}</AdminShell>
    </RouteGuard>
  );
}
