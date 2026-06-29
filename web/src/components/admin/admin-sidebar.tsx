"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Blocks } from "lucide-react";

import { adminNavigation, getAdminNavigationItem } from "@/lib/admin-navigation";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const t = useTranslations("Admin");
  const pathname = usePathname();
  const activeItem = getAdminNavigationItem(pathname);

  return (
    <aside className="h-full border-r border-border/70 bg-sidebar text-sidebar-foreground">
      <div className="flex h-full flex-col gap-5 overflow-y-auto px-3 py-5">
        <Link
          href="/admin"
          className="group flex items-center gap-3 rounded-xl px-2 pb-4 transition-colors"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary ring-1 ring-inset ring-sidebar-primary/15 transition-all duration-300 group-hover:bg-sidebar-primary/15 group-hover:ring-sidebar-primary/25">
            <Blocks className="size-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] font-medium tracking-[0.22em] text-sidebar-primary uppercase">
              {t("sidebar.brand")}
            </span>
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              {t("sidebar.workspaceTitle")}
            </span>
          </span>
        </Link>

        <p className="px-2 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
          {t("sidebar.navLabel")}
        </p>

        <nav aria-label={t("sidebar.navLabel")} className="flex-1 space-y-0.5">
          {adminNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem?.href === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary/10 text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "bg-transparent text-muted-foreground group-hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className={cn("text-sm", isActive ? "font-semibold" : "font-medium")}>
                    {item.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                {isActive && (
                  <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
