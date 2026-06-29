"use client";

import { useTranslations } from "next-intl";

export function PolicyWizard() {
  const t = useTranslations("Admin");

  return (
    <div className="space-y-6">
      <div className="text-sm text-[var(--color-text-secondary)]">
        {t("policyWizard.descriptionLong")}
      </div>
      <div className="rounded-lg border border-border bg-input/30 p-6">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Policy wizard implementation coming soon.
        </p>
      </div>
    </div>
  );
}
