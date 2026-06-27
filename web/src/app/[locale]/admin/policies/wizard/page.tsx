"use client";

import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PolicyWizard } from "@/components/admin/policy-wizard";

export default function PolicyWizardPage() {
  const t = useTranslations("Admin");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("policyWizard.eyebrow")}
        title={t("policyWizard.title")}
        summary={t("policyWizard.summary")}
      />

      <Card className="border-border/70 bg-card/90">
        <CardContent className="p-6">
          <PolicyWizard />
        </CardContent>
      </Card>
    </div>
  );
}
