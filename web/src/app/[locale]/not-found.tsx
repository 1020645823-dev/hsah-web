"use client";

import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { useTranslations } from "next-intl";

import { PublicSiteShell } from "@/components/public-site-shell";

export default function NotFound() {
  const t = useTranslations("NotFound");
  const tCommon = useTranslations("Common");

  return (
    <PublicSiteShell>
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <div className="text-8xl font-semibold tracking-[-0.04em] text-foreground md:text-9xl">
            404
          </div>
          <div className="mt-4 text-lg font-medium text-foreground">
            {t("title")}
          </div>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t("descriptionAlt")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:translate-y-px"
            >
              <Home className="size-4" />
              {tCommon("backToHome")}
            </Link>
            <Link
              href="/assets"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground transition-all hover:bg-muted active:translate-y-px"
            >
              {tCommon("exploreAssets")}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </PublicSiteShell>
  );
}
