"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import {
  fetchOperationsOverview,
  fetchOperationsTasks,
  fetchRecentActivities,
} from "@/lib/admin-operations";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";
import type {
  OperationsOverview,
  OperationsTasks,
  RecentActivities,
} from "@/types/operations";

const PRIORITY_CLASSES: Record<string, string> = {
  high: "bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20",
  medium: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20",
};

export function OperationsWorkbench({ token }: { token: string }) {
  const t = useTranslations("Admin");
  const [overview, setOverview] = useState<OperationsOverview | null>(null);
  const [tasks, setTasks] = useState<OperationsTasks | null>(null);
  const [activities, setActivities] = useState<RecentActivities | null>(null);
  const [error, setError] = useState<ApiErrorInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    Promise.all([
      fetchOperationsOverview(token),
      fetchOperationsTasks(token),
      fetchRecentActivities(token),
    ])
      .then(([overviewRes, tasksRes, activitiesRes]) => {
        if (canceled) return;
        const failure = [overviewRes, tasksRes, activitiesRes].find((r) => !r.ok);
        if (failure && !failure.ok) {
          setError(parseApiError(failure.data, failure.status));
          return;
        }
        setError(null);
        if (overviewRes.ok) setOverview(overviewRes.data);
        if (tasksRes.ok) setTasks(tasksRes.data);
        if (activitiesRes.ok) setActivities(activitiesRes.data);
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
      });
    return () => {
      canceled = true;
    };
  }, [token]);

  const metrics = overview
    ? [
        { label: t("operations.totalAssets"), value: overview.total_assets },
        { label: t("operations.publishedAssets"), value: overview.published_assets },
        { label: t("operations.reviewingAssets"), value: overview.reviewing_assets },
        { label: t("operations.lowQualityAssets"), value: overview.low_quality_assets },
        { label: t("operations.pendingAccessRequests"), value: overview.pending_access_requests },
      ]
    : [];

  return (
    <div className="space-y-8">
      {error && (
        <ErrorAlert
          error={error}
          onRetry={error.retryable ? () => setError(null) : undefined}
          onDismiss={() => setError(null)}
        />
      )}

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {!overview
          ? Array.from({ length: 5 }, (_, i) => (
              <Card key={i} className="border-border/70 bg-card/90">
                <CardContent className="space-y-2 py-5">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-14 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))
          : metrics.map((metric) => (
              <Card key={metric.label} className="border-border/70 bg-card/90">
                <CardContent className="space-y-1 py-5">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-3xl font-semibold text-foreground">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <p className="flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-primary">
              <AlertCircle className="h-3.5 w-3.5" />
              {t("operations.taskQueueLabel")}
            </p>
            <CardTitle className="text-xl text-foreground">{t("operations.taskQueue")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks?.items?.length ? (
              <p className="text-xs text-muted-foreground">
                {t("operations.taskCount", { shown: tasks.items.length, total: tasks.total })}
              </p>
            ) : null}
            {!tasks?.items?.length ? (
              <p className="rounded-xl border border-border/70 bg-background/80 px-4 py-6 text-sm text-muted-foreground">
                {t("operations.noTasks")}
              </p>
            ) : (
              tasks.items.map((task) => (
                <a
                  key={task.asset_id}
                  href={task.target_url}
                  className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/80 px-4 py-4 transition-colors hover:bg-muted/40 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{task.reason}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      PRIORITY_CLASSES[task.priority] ?? PRIORITY_CLASSES.medium
                    }`}
                  >
                    {task.priority}
                  </span>
                </a>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <p className="flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-primary">
              <Clock className="h-3.5 w-3.5" />
              {t("operations.recentActivityLabel")}
            </p>
            <CardTitle className="text-xl text-foreground">
              {t("operations.recentActivity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!activities?.items?.length ? (
              <p className="rounded-xl border border-border/70 bg-background/80 px-4 py-6 text-sm text-muted-foreground">
                {t("operations.noActivity")}
              </p>
            ) : (
              activities.items.slice(0, 6).map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-xl border border-border/70 bg-background/80 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{activity.asset_title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activity.action}: {activity.from_status ?? "—"} → {activity.to_status}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
