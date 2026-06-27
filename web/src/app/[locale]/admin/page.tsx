"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FileText, LayoutTemplate, Package, ShieldCheck, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { adminRequest, getStoredAdminToken } from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";
import { adminNavigation } from "@/lib/admin-navigation";

type Overview = { users: number; assets: number };

export default function AdminPage() {
  const t = useTranslations("Admin");
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<ApiErrorInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    adminRequest<Overview>("/api/v1/admin/overview", token, { method: "GET" })
      .then((data) => {
        if (canceled) return;
        if (!data.ok) {
          setError(parseApiError(data.data, data.status));
          setOverview(null);
        } else {
          setError(null);
          setOverview(data.data);
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

  const quickActions = [
    {
      href: "/admin/assets/new",
      title: t("quickAction.createAsset.title"),
      description: t("quickAction.createAsset.description"),
      icon: Package,
    },
    {
      href: "/admin/templates",
      title: t("quickAction.manageTemplates.title"),
      description: t("quickAction.manageTemplates.description"),
      icon: LayoutTemplate,
    },
    {
      href: "/admin/simulator",
      title: t("quickAction.policySimulator.title"),
      description: t("quickAction.policySimulator.description"),
      icon: ShieldCheck,
    },
  ] as const;

  const recentDrafts = [
    {
      href: "/admin/assets",
      title: t("recentDrafts.assetDraftsQueue.title"),
      description: t("recentDrafts.assetDraftsQueue.description"),
      cta: t("recentDrafts.assetDraftsQueue.cta"),
    },
    {
      href: "/admin/templates",
      title: t("recentDrafts.templateBaselineRefresh.title"),
      description: t("recentDrafts.templateBaselineRefresh.description"),
      cta: t("recentDrafts.templateBaselineRefresh.cta"),
    },
    {
      href: "/admin/policies",
      title: t("recentDrafts.policyReviewWindow.title"),
      description: t("recentDrafts.policyReviewWindow.description"),
      cta: t("recentDrafts.policyReviewWindow.cta"),
    },
  ] as const;

  const kpiCards = [
    {
      title: t("kpi.managedAssets.title"),
      value: overview?.assets ?? "—",
      description: t("kpi.managedAssets.description"),
      icon: Package,
    },
    {
      title: t("kpi.adminUsers.title"),
      value: overview?.users ?? "—",
      description: t("kpi.adminUsers.description"),
      icon: User,
    },
    {
      title: t("kpi.governanceSurfaces.title"),
      value: adminNavigation.length,
      description: t("kpi.governanceSurfaces.description"),
      icon: FileText,
    },
    {
      title: t("kpi.protectedRoutes.title"),
      value: "100%",
      description: t("kpi.protectedRoutes.description"),
      icon: ShieldCheck,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("overview.eyebrow")}
        title={t("overview.title")}
        summary={t("overview.summary")}
      />

      {error && (
        <ErrorAlert
          error={error}
          onRetry={error.retryable ? () => setError(null) : undefined}
          onDismiss={() => setError(null)}
        />
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="border-border/70 bg-card/90">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{item.title}</p>
                  <CardTitle className="text-3xl font-semibold text-foreground">
                    {item.value}
                  </CardTitle>
                </div>
                <span className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <p className="text-xs font-medium tracking-[0.18em] text-primary">{t("flow.label")}</p>
            <CardTitle className="text-xl text-foreground">{t("flow.recentDrafts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDrafts.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  {item.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <p className="text-xs font-medium tracking-[0.18em] text-primary">{t("actions.label")}</p>
              <CardTitle className="text-xl text-foreground">{t("actions.quickActions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.title}
                    className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-4 transition-colors hover:bg-muted/40"
                  >
                    <span className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="space-y-1">
                      <span className="block text-sm font-medium text-foreground">{item.title}</span>
                      <span className="block text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <p className="text-xs font-medium tracking-[0.18em] text-primary">{t("governance.label")}</p>
              <CardTitle className="text-xl text-foreground">{t("governance.healthHighlights")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-4">
                {t("governance.shellHighlight")}
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-4">
                {t("governance.navigationHighlight")}
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-4">
                {t("governance.routeGuardHighlight")}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
