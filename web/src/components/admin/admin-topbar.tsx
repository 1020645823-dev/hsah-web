"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Menu, X, LogOut, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getStoredAdminToken, clearStoredAdminToken } from "@/lib/admin";

export function AdminTopbar({ pageTitle }: { pageTitle: string }) {
  const t = useTranslations("Admin");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [token, setToken] = useState<string | null>(() => getStoredAdminToken());

  const handleLogout = () => {
    clearStoredAdminToken();
    setToken(null);
    window.location.href = `/${locale}`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t("topbar.toggleMenu")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground transition-all hover:bg-muted active:scale-[0.96] md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <Link
              href={`/${locale}/admin`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("topbar.adminHome")}
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-sm font-semibold text-foreground">{pageTitle}</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/assets`}
            className="hidden items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground sm:inline-flex"
          >
            <LayoutGrid className="h-4 w-4" />
            {t("topbar.openLibrary")}
          </Link>
          {token ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t("topbar.logout")}
            </Button>
          ) : (
            <Link href={`/${locale}/login`}>
              <Button variant="outline" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                {t("topbar.login")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur-xl md:hidden">
          <nav className="grid grid-cols-2 gap-2">
            {[
              { href: `/${locale}/admin`, label: t("topbar.adminHome") },
              { href: `/${locale}/admin/assets`, label: t("sidebar.assets") },
              { href: `/${locale}/admin/access`, label: t("sidebar.access") },
              { href: `/${locale}/admin/access-requests`, label: t("topbar.accessRequests") },
              { href: `/${locale}/admin/analytics`, label: t("topbar.analytics") },
              { href: `/${locale}/admin/audit-logs`, label: t("topbar.auditLogs") },
              { href: `/${locale}/assets`, label: t("topbar.openLibrary") },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="inline-flex min-h-10 items-center rounded-lg border border-border/70 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
