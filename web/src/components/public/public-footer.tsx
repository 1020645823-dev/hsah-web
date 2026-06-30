"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { publicNavLinks } from "@/lib/public-content";

export function PublicFooter() {
  const t = useTranslations();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:px-8">
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{t("Footer.aboutHub")}</p>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            {t("Footer.aboutHubDescription")}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{t("Footer.sections")}</p>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground md:gap-2">
            {publicNavLinks.map((item) => (
              <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center transition-colors hover:text-foreground md:min-h-0">
                {t(item.label)}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{t("Footer.startHere")}</p>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground md:gap-2">
            <Link href="/assets" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground md:min-h-0">
              {t("Footer.assetLibrary")}
            </Link>
            <Link href="/auth/login" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground md:min-h-0">
              {t("Footer.signIn")}
            </Link>
            <Link href="/about" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground md:min-h-0">
              {t("Footer.aboutPlatform")}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground md:flex-row md:px-8">
          <span>{t("Footer.rights")}</span>
          <span className="text-muted-foreground/70">{t("Footer.builtWith")}</span>
        </div>
      </div>
    </footer>
  );
}
