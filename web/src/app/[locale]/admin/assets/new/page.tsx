"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AssetEditorForm } from "@/components/admin/asset-editor-form";
import { getStoredAdminToken } from "@/lib/admin";

export default function NewAssetPage() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [token] = useState<string | null>(() => getStoredAdminToken());

  if (!token) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow={t("newAsset.eyebrow")}
          title={t("newAsset.title")}
          summary={t("newAsset.summary")}
        />
        <Card className="border-border/70 bg-card/90">
          <CardContent className="p-6">
            <p className="text-sm text-[var(--color-text-secondary)]">{t("common.unauthorized")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("newAsset.eyebrow")}
        title={t("newAsset.title")}
        summary={t("newAsset.summary")}
      />

      <Card className="border-border/70 bg-card/90">
        <CardContent className="p-6">
          <AssetEditorForm mode="create" token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
