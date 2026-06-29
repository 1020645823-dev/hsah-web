"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/product/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { getStoredAdminToken } from "@/lib/admin";
import { fetchAuditLogs } from "@/lib/admin-analytics";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";
import type { AuditLog } from "@/types/analytics";

const RESOURCE_FILTERS = ["asset", "access_request", "role", "policy", "user"];

export function AuditLogTable() {
  const t = useTranslations("Admin");
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [resourceType, setResourceType] = useState<string>("");
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    fetchAuditLogs(token, { resourceType: resourceType || undefined, limit: 50 })
      .then((res) => {
        if (canceled) return;
        if (!res.ok) {
          setError(parseApiError(res.data, res.status));
          setLogs([]);
        } else {
          setError(null);
          setLogs(res.data.items);
        }
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
        setLogs([]);
      })
      .finally(() => {
        if (!canceled) setIsLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [token, resourceType]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("audit.eyebrow")}
        title={t("audit.title")}
        summary={t("audit.summary")}
      />

      {error && (
        <ErrorAlert
          error={error}
          onRetry={error.retryable ? () => setError(null) : undefined}
          onDismiss={() => setError(null)}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={resourceType === "" ? "secondary" : "outline"}
          onClick={() => setResourceType("")}
        >
          All
        </Button>
        {RESOURCE_FILTERS.map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={resourceType === value ? "secondary" : "outline"}
            onClick={() => setResourceType(value)}
          >
            {value}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Card className="border-border/70 bg-card/90">
          <CardContent className="p-0">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="grid grid-cols-[140px_120px_1fr_160px] gap-4 border-b border-border/40 px-4 py-3 last:border-0">
                <div className="h-4 animate-pulse rounded bg-muted" />
                <div className="h-4 animate-pulse rounded bg-muted" />
                <div className="h-4 animate-pulse rounded bg-muted" />
                <div className="h-4 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <p className="rounded-xl border border-border/70 bg-card/90 px-6 py-10 text-center text-sm text-muted-foreground">
          {t("audit.empty")}
        </p>
      ) : (
        <Card className="border-border/70 bg-card/90">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">{t("audit.action")}</th>
                  <th className="px-4 py-3">{t("audit.resourceType")}</th>
                  <th className="px-4 py-3">{t("audit.summary")}</th>
                  <th className="px-4 py-3">{t("audit.timestamp")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.resource_type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.summary}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
