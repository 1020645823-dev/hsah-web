"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Blocks } from "lucide-react";

import { publicNavLinks } from "@/lib/public-content";
import { ThemeToggle } from "@/components/theme-toggle";

type PublicHeaderProps = {
  ctaHref: string;
  ctaLabel: string;
};

export function PublicHeader({ ctaHref, ctaLabel }: PublicHeaderProps) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/88 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-3 text-foreground">
          <span className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-muted/40">
            <Blocks className="size-4" />
          </span>
          <span className="space-y-0.5">
            <span className="block text-[11px] tracking-[0.18em] text-muted-foreground">HYPERSCALER ASSET HUB</span>
            <span className="block text-sm font-medium">AI delivery content platform</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          <Link
            href="/assets"
            aria-current={isActive("/assets") ? "page" : undefined}
            className={`text-sm transition-colors hover:text-foreground ${
              isActive("/assets") ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Assets
          </Link>
          {publicNavLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`text-sm transition-colors hover:text-foreground ${
                isActive(item.href) ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link
            href={ctaHref}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-transform hover:-translate-y-0.5"
          >
            {ctaLabel}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
