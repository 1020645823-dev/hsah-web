"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { getStoredAdminToken } from "@/lib/admin";
import { fetchAnalyticsOverview } from "@/lib/admin-analytics";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";
import type { AnalyticsOverview } from "@/types/analytics";

type MetricEntry = { label: string; value: number | string; magnitude: number };

function magnitudeOf(value: number | string): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function AnalyticsDashboard() {
  const t = useTranslations("Admin");
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<ApiErrorInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    fetchAnalyticsOverview(token)
      .then((res) => {
        if (canceled) return;
        if (!res.ok) {
          setError(parseApiError(res.data, res.status));
          setOverview(null);
        } else {
          setError(null);
          setOverview(res.data);
        }
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
        setOverview(null);
      });
    return () => {
      canceled = true;
    };
  }, [token]);

  const sections: { title: string; entries: MetricEntry[] }[] = overview
    ? [
        {
          title: t("analytics.contentSection"),
          entries: [
            { label: "Total", value: overview.content.total_assets, magnitude: overview.content.total_assets },
            { label: "Published", value: overview.content.published_assets, magnitude: overview.content.published_assets },
            { label: "Reviewing", value: overview.content.reviewing_assets, magnitude: overview.content.reviewing_assets },
            { label: "Low quality", value: overview.content.low_quality_assets, magnitude: overview.content.low_quality_assets },
          ],
        },
        {
          title: t("analytics.experienceSection"),
          entries: [
            { label: "Views", value: overview.experience.views, magnitude: overview.experience.views },
            { label: "Favorites", value: overview.experience.favorites, magnitude: overview.experience.favorites },
            { label: "Feedback", value: overview.experience.feedback, magnitude: overview.experience.feedback },
            { label: "Access requests", value: overview.experience.access_requests, magnitude: overview.experience.access_requests },
          ],
        },
        {
          title: t("analytics.workflowSection"),
          entries: [
            { label: "Review records", value: overview.workflow.review_records, magnitude: overview.workflow.review_records },
            { label: "Rejects", value: overview.workflow.rejects, magnitude: overview.workflow.rejects },
            { label: "Approved", value: overview.workflow.approved_requests, magnitude: overview.workflow.approved_requests },
            { label: "Rejected", value: overview.workflow.rejected_requests, magnitude: overview.workflow.rejected_requests },
          ],
        },
        {
          title: t("analytics.qualitySection"),
          entries: [
            { label: "Average score", value: overview.quality.average_score, magnitude: overview.quality.average_score },
            { label: "Low quality assets", value: overview.quality.low_quality_assets, magnitude: overview.quality.low_quality_assets },
          ],
        },
        {
          title: t("analytics.governanceSection"),
          entries: [
            { label: "Pending", value: overview.governance.pending_access_requests, magnitude: overview.governance.pending_access_requests },
            { label: "Total requests", value: overview.governance.total_access_requests, magnitude: overview.governance.total_access_requests },
          ],
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("analytics.eyebrow")}
        title={t("analytics.title")}
        summary={t("analytics.summary")}
      />

      {error && (
        <ErrorAlert
          error={error}
          onRetry={error.retryable ? () => setError(null) : undefined}
          onDismiss={() => setError(null)}
        />
      )}

      {!overview && !error ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border/70 bg-card/90 p-5">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const max = Math.max(1, ...section.entries.map((e) => magnitudeOf(e.value)));
          return (
            <Card key={section.title} className="border-border/70 bg-card/90">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base text-foreground">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.entries.map((entry) => {
                  const pct = Math.round((magnitudeOf(entry.value) / max) * 100);
                  return (
                    <div key={entry.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{entry.label}</span>
                        <span className="font-medium text-foreground">{entry.value}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(pct, entry.value === 0 ? 0 : 4)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
