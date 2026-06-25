"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FileText, LayoutTemplate, Package, ShieldCheck, User } from "lucide-react";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { adminRequest, getStoredAdminToken } from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";
import { adminNavigation } from "@/lib/admin-navigation";

type Overview = { users: number; assets: number };

const quickActionDefinitions = [
  {
    href: "/admin/assets/new",
    title: "Create asset",
    description: "启动新资产草稿并进入内容治理流程。",
    icon: Package,
  },
  {
    href: "/admin/templates",
    title: "Manage templates",
    description: "更新可复用模板，统一结构与块级基线。",
    icon: LayoutTemplate,
  },
  {
    href: "/admin/simulator",
    title: "Policy simulator",
    description: "快速验证一条鉴权请求在当前策略下的结果。",
    icon: ShieldCheck,
  },
] as const;

const recentDrafts = [
  {
    href: "/admin/assets",
    title: "Asset drafts queue",
    description: "集中处理待发布资产、补齐元数据并推进上线。",
    cta: "Review assets",
  },
  {
    href: "/admin/templates",
    title: "Template baseline refresh",
    description: "确保新资产默认继承统一模板与内容块结构。",
    cta: "Open templates",
  },
  {
    href: "/admin/policies",
    title: "Policy review window",
    description: "联动角色与策略页面，收敛访问控制变更风险。",
    cta: "Inspect policies",
  },
] as const;

export default function AdminPage() {
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

  const quickActions = quickActionDefinitions.map((item) => {
    const navigationItem = adminNavigation.find((entry) => entry.href === item.href);
    return {
      ...item,
      description: navigationItem?.description ?? item.description,
    };
  });

  const kpiCards = [
    {
      title: "Managed assets",
      value: overview?.assets ?? "—",
      description: "后台已纳入运营与发布治理的内容资产。",
      icon: Package,
    },
    {
      title: "Admin users",
      value: overview?.users ?? "—",
      description: "具备后台访问能力的账号与运维身份。",
      icon: User,
    },
    {
      title: "Governance surfaces",
      value: adminNavigation.length,
      description: "已接入统一壳层与导航元数据的后台模块。",
      icon: FileText,
    },
    {
      title: "Protected routes",
      value: "100%",
      description: "所有 `/admin` 路由经由 `RouteGuard` 保护。",
      icon: ShieldCheck,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ADMIN"
        title="Operations overview"
        summary="Monitor content health, recent work, and access-control surfaces from one workspace."
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
            <p className="text-xs font-medium tracking-[0.18em] text-primary">FLOW</p>
            <CardTitle className="text-xl text-foreground">Recent drafts</CardTitle>
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
              <p className="text-xs font-medium tracking-[0.18em] text-primary">ACTIONS</p>
              <CardTitle className="text-xl text-foreground">Quick actions</CardTitle>
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
              <p className="text-xs font-medium tracking-[0.18em] text-primary">GOVERNANCE</p>
              <CardTitle className="text-xl text-foreground">Health highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-4">
                Shell, sidebar, topbar, and overview now share one operational frame.
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-4">
                Navigation metadata is centralized for overview, assets, templates, and access pages.
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-4">
                `RouteGuard` remains the only entry point for protected admin routes.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
