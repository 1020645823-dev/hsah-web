"use client";

import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getAdminNavigationItem } from "@/lib/admin-navigation";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AdminShellProps = {
  pageTitle: string;
  children: ReactNode;
};

export function AdminShell({ pageTitle, children }: AdminShellProps) {
  const pathname = usePathname();
  const navigationItem = getAdminNavigationItem(pathname);

  const breadcrumb =
    pathname === "/admin"
      ? [{ label: "Admin", href: "/admin" }]
      : navigationItem
        ? [
            { label: "Admin", href: "/admin" },
            { label: navigationItem.label, href: navigationItem.href },
          ]
        : undefined;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar breadcrumb={breadcrumb} pageTitle={pageTitle} />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
