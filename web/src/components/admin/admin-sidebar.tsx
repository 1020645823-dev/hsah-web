"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavigation, getAdminNavigationItem } from "@/lib/admin-navigation";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();
  const activeItem = getAdminNavigationItem(pathname);

  return (
    <aside className="border-r border-border/70 bg-[rgb(12_14_22_/96%)]">
      <div className="flex h-full flex-col gap-6 px-4 py-5">
        <div className="space-y-2 border-b border-border/70 pb-4">
          <p className="text-xs font-medium tracking-[0.18em] text-primary">HSAH ADMIN</p>
          <div>
            <p className="text-lg font-semibold text-foreground">Operations workspace</p>
            <p className="text-sm text-muted-foreground">
              持续管理资产、模板、身份与访问控制。
            </p>
          </div>
        </div>

        <nav aria-label="Admin sections" className="space-y-1">
          {adminNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem?.href === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "flex rounded-xl border px-3 py-3 transition-colors duration-150",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <span className="mt-0.5 mr-3 rounded-lg bg-background/80 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
