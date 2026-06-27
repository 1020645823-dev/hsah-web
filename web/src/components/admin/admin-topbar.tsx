"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Menu, X, LogOut } from "lucide-react";

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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t("topbar.toggleMenu")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{pageTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
        <div className="border-t border-border/70 bg-background/90 px-4 py-3 md:hidden">
          <p className="text-sm text-muted-foreground">{t("topbar.mobileMenuPlaceholder")}</p>
        </div>
      )}
    </header>
  );
}
