"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Blocks, Menu, X } from "lucide-react";

import { publicNavLinks } from "@/lib/public-content";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";

type PublicHeaderProps = {
  ctaHref: string;
  ctaLabel: string;
  locale: string;
};

type NavLink = { href: string; label: string };

export function PublicHeader({ ctaHref, ctaLabel, locale }: PublicHeaderProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));

  const allNavLinks: NavLink[] = [
    { href: "/assets", label: t("Nav.assets") },
    ...publicNavLinks.map((item) => ({ href: item.href, label: t(item.label) })),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-3 text-foreground">
          <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/45">
            <Blocks className="size-4" />
          </span>
          <span className="space-y-0.5">
            <span className="block text-[11px] tracking-[0.18em] text-muted-foreground">{t("PublicSite.brandName")}</span>
            <span className="block text-sm font-medium">{t("PublicSite.brandTagline")}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {allNavLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "text-sm transition-colors hover:text-foreground",
                isActive(item.href) ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/auth/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("Common.signIn")}
          </Link>
          <Link
            href={ctaHref}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:translate-y-px"
          >
            {ctaLabel}
          </Link>
          <ThemeToggle />
          <LocaleSwitcher locale={locale} />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <LocaleSwitcher locale={locale} />
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? t("PublicSite.closeMenu") : t("PublicSite.openMenu")}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-foreground transition-all hover:bg-muted active:scale-[0.96]"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-card px-6 py-4 lg:hidden md:px-8"
        >
          <nav className="flex flex-col">
            {allNavLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "inline-flex min-h-11 items-center border-b border-border/60 py-3 text-sm transition-colors last:border-b-0",
                  isActive(item.href) ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t("Common.signIn")}
            </Link>
            <Link
              href={ctaHref}
              onClick={() => setMobileOpen(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
