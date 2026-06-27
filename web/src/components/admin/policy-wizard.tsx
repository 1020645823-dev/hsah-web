"use client";

import { useTranslations } from "next-intl";

export function PolicyWizard() {
  const t = useTranslations("Admin");

  return (
    <div className="space-y-6">
      <div className="text-sm text-[var(--color-text-secondary)]">
        {t("policyWizard.descriptionLong")}
      </div>
      <div className="rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/3%)] p-6">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Policy wizard implementation coming soon.
        </p>
      </div>
    </div>
  );
}
