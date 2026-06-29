"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  archiveAsset,
  approveAsset,
  publishAsset,
  rejectAsset,
  submitReview,
  unpublishAsset,
} from "@/lib/admin-asset-review";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";

const STATUS_ACTIONS: Record<string, { action: "submit" | "publish" | "unpublish" | "archive"; key: string }[]> = {
  draft: [
    { action: "submit", key: "submitReview" },
    { action: "publish", key: "publish" },
    { action: "archive", key: "archive" },
  ],
  rejected: [
    { action: "submit", key: "submitReview" },
    { action: "archive", key: "archive" },
  ],
  reviewing: [
    { action: "publish", key: "publish" },
    { action: "archive", key: "archive" },
  ],
  published: [
    { action: "unpublish", key: "unpublish" },
    { action: "archive", key: "archive" },
  ],
  archived: [],
};

export function AssetReviewActions({
  assetId,
  status,
  token,
}: {
  assetId: string;
  status: string;
  token: string;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const actions = STATUS_ACTIONS[status] ?? [];

  async function run(action: "submit" | "publish" | "unpublish" | "archive") {
    setBusy(true);
    setError(null);
    let res;
    if (action === "submit") res = await submitReview(assetId, token);
    else if (action === "publish") res = await publishAsset(assetId, token);
    else if (action === "unpublish") res = await unpublishAsset(assetId, token);
    else res = await archiveAsset(assetId, token);
    setBusy(false);
    if (!res.ok) {
      setError(parseApiError(res.data, res.status));
      return;
    }
    router.refresh();
  }

  async function runApprove() {
    setBusy(true);
    setError(null);
    const res = await approveAsset(assetId, token);
    setBusy(false);
    if (!res.ok) {
      setError(parseApiError(res.data, res.status));
      return;
    }
    router.refresh();
  }

  async function runReject() {
    if (!rejectReason.trim()) return;
    setBusy(true);
    setError(null);
    const res = await rejectAsset(assetId, token, rejectReason);
    setBusy(false);
    if (!res.ok) {
      setError(parseApiError(res.data, res.status));
      return;
    }
    setRejectMode(false);
    setRejectReason("");
    router.refresh();
  }

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-1">
        <p className="text-xs font-medium tracking-[0.18em] text-primary">REVIEW</p>
        <CardTitle className="text-base text-foreground">{t("reviewActions.submitReview")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error && <p className="text-destructive">{error.message}</p>}

        {status === "reviewing" && !rejectMode && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={runApprove}>
              {t("reviewActions.approve")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setRejectMode(true)}
            >
              {t("reviewActions.reject")}
            </Button>
          </div>
        )}

        {rejectMode && (
          <div className="space-y-3 rounded-xl border border-border/70 bg-background/80 p-4">
            <label htmlFor={`reject-reason-${assetId}`} className="block text-sm font-medium text-foreground">
              {t("reviewActions.rejectReasonPrompt")}
            </label>
            <Textarea
              id={`reject-reason-${assetId}`}
              className="min-h-[88px]"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={!rejectReason.trim() || busy}
                onClick={runReject}
              >
                {t("reviewActions.confirmReject")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setRejectMode(false);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {actions.length > 0 && !rejectMode && (
          <div className="flex flex-wrap gap-2">
            {actions.map(({ action, key }) => (
              <Button
                key={action}
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => run(action)}
              >
                {t(`reviewActions.${key}`)}
              </Button>
            ))}
          </div>
        )}

        {actions.length === 0 && status !== "reviewing" && (
          <p className="text-muted-foreground">{status}</p>
        )}
      </CardContent>
    </Card>
  );
}
