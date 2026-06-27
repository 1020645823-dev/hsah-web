"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LayoutTemplate } from "lucide-react";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { adminRequest, getStoredAdminToken } from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";

import type { Template } from "@/types/template";

export default function AdminTemplatesPage() {
  const t = useTranslations("Admin");
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<ApiErrorInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    adminRequest<{ templates: Template[] }>("/api/v1/admin/templates", token, { method: "GET" })
      .then((data) => {
        if (canceled) return;
        if (!data.ok) {
          setError(parseApiError(data.data, data.status));
          setTemplates([]);
        } else {
          setError(null);
          setTemplates(data.data.templates ?? []);
        }
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
        setTemplates([]);
      });
    return () => {
      canceled = true;
    };
  }, [token]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("templates.eyebrow")}
        title={t("templates.title")}
        summary={t("templates.summary")}
      />

      {error && (
        <ErrorAlert
          error={error}
          onRetry={error.retryable ? () => setError(null) : undefined}
          onDismiss={() => setError(null)}
        />
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("templates.totalTemplates")}</p>
              <CardTitle className="text-3xl font-semibold text-foreground">
                {templates.length}
              </CardTitle>
            </div>
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <LayoutTemplate className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("templates.totalTemplatesDescription")}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{t("templates.allTemplates")}</h2>

        {templates.length === 0 ? (
          <div className="rounded-xl border border-border/70 bg-card/90 px-6 py-10 text-center text-sm text-muted-foreground">
            {t("templates.empty")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="border-border/70 bg-card/90">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base text-foreground">{template.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{template.id}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {t("templates.version")}: {template.version}
                  </p>
                  <p>
                    {t("templates.created")}: {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
