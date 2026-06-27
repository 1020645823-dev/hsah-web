"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { adminRequest, getStoredAdminToken } from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";
import { AssetEditorForm } from "@/components/admin/asset-editor-form";
import { AssetVideoManager } from "@/components/admin/asset-video-manager";

import type { Asset } from "@/types/asset";

export default function AssetEditPage() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [asset, setAsset] = useState<Asset | null>(null);
  const [error, setError] = useState<ApiErrorInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    adminRequest<{ asset: Asset }>(`/api/v1/admin/assets/${params.id}`, token, { method: "GET" })
      .then((data) => {
        if (canceled) return;
        if (!data.ok) {
          setError(parseApiError(data.data, data.status));
          setAsset(null);
        } else {
          setError(null);
          setAsset(data.data.asset ?? null);
        }
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
        setAsset(null);
      });
    return () => {
      canceled = true;
    };
  }, [token, params.id]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("assetEditor.eyebrow")}
        title={asset?.title ?? t("assetEditor.title")}
        summary={t("assetEditor.summary")}
      />

      {error && (
        <ErrorAlert
          error={error}
          onRetry={error.retryable ? () => setError(null) : undefined}
          onDismiss={() => setError(null)}
        />
      )}

      {asset && token && (
        <div className="space-y-6">
          <Card className="border-border/70 bg-card/90">
            <CardContent className="p-6">
              <AssetEditorForm
                mode="edit"
                assetId={params.id}
                token={token}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
