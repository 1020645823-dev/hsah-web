"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/product/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ErrorAlert } from "@/components/error-alert";
import { adminRequest, getStoredAdminToken } from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";
import type { AccessRequest, AccessRequestStatus } from "@/types/access-request";

type ListResponse = {
  items: AccessRequest[];
  total: number;
  limit: number;
  offset: number;
};

const STATUS_FILTERS: AccessRequestStatus[] = ["pending", "approved", "rejected"];

export function AccessRequestQueue() {
  const t = useTranslations("Admin");
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<AccessRequestStatus>("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    adminRequest<ListResponse>(
      `/api/v1/admin/access-requests?status=${statusFilter}&limit=50`,
      token,
      { method: "GET" },
    )
      .then((res) => {
        if (canceled) return;
        if (!res.ok) {
          setError(parseApiError(res.data, res.status));
          setRequests([]);
        } else {
          setRequests(res.data.items);
        }
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
        setRequests([]);
      });
    return () => {
      canceled = true;
    };
  }, [token, statusFilter]);

  async function decide(request: AccessRequest, decision: "approve" | "reject", reason: string) {
    if (!token) return;
    setBusyId(request.id);
    const body = decision === "reject" ? JSON.stringify({ reason }) : JSON.stringify({ reason });
    const res = await adminRequest<AccessRequest>(
      `/api/v1/admin/access-requests/${request.id}/${decision}`,
      token,
      { method: "POST", body },
    );
    setBusyId(null);
    setRejectingId(null);
    setRejectReason("");
    if (!res.ok) {
      setError(parseApiError(res.data, res.status));
      return;
    }
    setError(null);
    setRequests((current) => current.filter((item) => item.id !== request.id));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("accessRequests.eyebrow")}
        title={t("accessRequests.title")}
        summary={t("accessRequests.summary")}
      />

      {error && (
        <ErrorAlert
          error={error}
          onRetry={error.retryable ? () => setError(null) : undefined}
          onDismiss={() => setError(null)}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={statusFilter === value ? "secondary" : "outline"}
            onClick={() => setStatusFilter(value)}
          >
            {value}
          </Button>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="rounded-xl border border-border/70 bg-card/90 px-6 py-10 text-center text-sm text-muted-foreground">
          {t("accessRequests.empty")}
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-border/70 bg-card/90">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base text-foreground">{request.purpose}</CardTitle>
                  <StatusBadge status={request.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <span className="text-foreground/70">{t("accessRequests.role")}:</span>{" "}
                  {request.role || "—"}
                </p>
                <p>
                  <span className="text-foreground/70">{t("accessRequests.requestedAt")}:</span>{" "}
                  {request.created_at ? new Date(request.created_at).toLocaleString() : "—"}
                </p>

                {rejectingId === request.id ? (
                  <div className="space-y-3 rounded-xl border border-border/70 bg-background/80 p-4">
                    <label htmlFor={`reject-reason-${request.id}`} className="block text-sm font-medium text-foreground">
                      {t("reviewActions.rejectReasonPrompt")}
                    </label>
                    <Textarea
                      id={`reject-reason-${request.id}`}
                      className="min-h-[88px]"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!rejectReason.trim() || busyId === request.id}
                        onClick={() => decide(request, "reject", rejectReason)}
                      >
                        {t("accessRequests.reject")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {statusFilter === "pending" && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyId === request.id}
                          onClick={() => decide(request, "approve", "")}
                        >
                          {t("accessRequests.approve")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === request.id}
                          onClick={() => {
                            setRejectingId(request.id);
                            setRejectReason("");
                          }}
                        >
                          {t("accessRequests.reject")}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_BADGE_CLASS: Record<AccessRequestStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400",
  rejected: "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-400",
};

function StatusBadge({ status }: { status: AccessRequestStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium uppercase ${STATUS_BADGE_CLASS[status]}`}
    >
      {status}
    </span>
  );
}
