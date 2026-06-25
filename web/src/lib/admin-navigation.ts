import type { LucideIcon } from "lucide-react";
import {
  Blocks,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Package,
  Search,
  Shield,
  User,
} from "lucide-react";

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
    href: "/admin/templates",
    label: "Templates",
    description: "模板库、结构复用与内容基线。",
    icon: LayoutTemplate,
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "账号活跃度、可用性与 MFA 视图。",
    icon: User,
  },
  {
    href: "/admin/roles",
    label: "Roles",
    description: "角色定义、职责边界与授权范围。",
    icon: Shield,
  },
  {
    href: "/admin/policies",
    label: "Policies",
    description: "访问规则、条件组合与执行口径。",
    icon: FileText,
  },
  {
    href: "/admin/matrix",
    label: "Matrix",
    description: "角色与权限矩阵联查视图。",
    icon: Blocks,
  },
  {
    href: "/admin/simulator",
    label: "Simulator",
    description: "鉴权请求验证与策略回放。",
    icon: Search,
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
