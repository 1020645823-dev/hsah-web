"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { getStoredAdminToken } from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";
import type { AccessRequest, AccessRequestStatus } from "@/types/access-request";

type ListResponse = {
  items: AccessRequest[];
  total: number;
  limit: number;
  offset: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const STATUS_BADGE_CLASS: Record<AccessRequestStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400",
  rejected: "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-400",
};

export function MyAccessRequests() {
  const t = useTranslations("AssetDetail");
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    fetch(`${API_BASE_URL}/api/v1/me/access-requests?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (canceled) return;
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(parseApiError(data, res.status));
          setRequests([]);
          return;
        }
        const data = (await res.json()) as ListResponse;
        setRequests(data.items);
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
        setRequests([]);
      })
      .finally(() => {
        if (!canceled) setIsLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <p className="rounded-xl border border-border/70 bg-card/90 px-6 py-10 text-center text-sm text-muted-foreground">
        {t("myRequestsSignIn")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("myRequestsEyebrow")}
        title={t("myRequestsTitle")}
        summary={t("myRequestsSummary")}
      />

      {error && (
        <ErrorAlert
          error={error}
          onRetry={error.retryable ? () => setError(null) : undefined}
          onDismiss={() => setError(null)}
        />
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-border/70 bg-card/90 p-5">
              <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <p className="rounded-xl border border-border/70 bg-card/90 px-6 py-10 text-center text-sm text-muted-foreground">
          {t("myRequestsEmpty")}
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-border/70 bg-card/90">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base text-foreground">{request.purpose}</CardTitle>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium uppercase ${STATUS_BADGE_CLASS[request.status]}`}
                  >
                    {request.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {request.role && <p>{request.role}</p>}
                {request.decision_reason && <p>{request.decision_reason}</p>}
                <p>
                  {request.created_at ? new Date(request.created_at).toLocaleString() : "—"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
