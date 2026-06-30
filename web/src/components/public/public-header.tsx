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
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/65">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3.5 md:px-8">
        <Link href="/" className="group flex items-center gap-3 text-foreground">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 transition-all duration-300 group-hover:bg-primary/15 group-hover:ring-primary/25">
            <Blocks className="size-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">{t("PublicSite.brandName")}</span>
            <span className="text-sm font-semibold tracking-tight">{t("PublicSite.brandTagline")}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {allNavLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative rounded-lg px-3 py-2 text-sm transition-colors duration-200 hover:text-foreground",
                isActive(item.href) ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-primary transition-all duration-300",
                  isActive(item.href) ? "opacity-100" : "opacity-0",
                )}
              />
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/auth/login" className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            {t("Common.signIn")}
          </Link>
          <Link
            href={ctaHref}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 active:translate-y-px active:scale-[0.98]"
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
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-all hover:bg-muted active:scale-[0.96]"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-card/95 backdrop-blur-xl px-6 py-3 lg:hidden md:px-8"
        >
          <nav className="flex flex-col">
            {allNavLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3">
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
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:translate-y-px"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
