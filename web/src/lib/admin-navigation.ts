import type { LucideIcon } from "lucide-react";
import { Activity, Inbox, LayoutDashboard, Package, Shield } from "lucide-react";

export type AdminNavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const adminNavigation = [
  {
    href: "/admin",
    label: "Overview",
    description: "运营总览、治理指标与快捷入口。",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/assets",
    label: "Assets",
    description: "内容资产、发布状态与治理操作。",
    icon: Package,
  },
  {
    href: "/admin/access",
    label: "Access Matrix",
    description: "用户、角色、策略与权限矩阵联查。",
    icon: Shield,
  },
  {
    href: "/admin/access-requests",
    label: "Access Requests",
    description: "处理用户对受限交付内容的访问申请。",
    icon: Inbox,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    description: "内容、体验、流程与治理运营指标。",
    icon: Activity,
  },
] as const satisfies readonly AdminNavigationItem[];

function normalizeAdminPath(pathname: string | null | undefined) {
  if (!pathname || pathname === "/admin") return "/admin";
  if (pathname.endsWith("/") && pathname.length > 1) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function getAdminNavigationItem(pathname: string | null | undefined) {
  const normalizedPath = normalizeAdminPath(pathname);

  return adminNavigation.find((item) => {
    if (item.href === "/admin") {
      return normalizedPath === "/admin";
    }
    return normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`);
  });
}
