"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";

type LocaleSwitcherProps = {
  locale: string;
};

export function LocaleSwitcher({ locale }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale() {
    const target = locale === "en" ? "zh" : "en";
    router.replace(pathname, { locale: target });
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      aria-label={locale === "en" ? "Switch to Chinese" : "Switch to English"}
    >
      <Globe className="size-4" />
      {locale === "en" ? "中文" : "EN"}
    </button>
  );
}
