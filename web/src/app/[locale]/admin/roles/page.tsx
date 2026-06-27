"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Shield, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { adminRequest, getStoredAdminToken } from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";

import type { Role } from "@/types/role";

export default function AdminRolesPage() {
  const t = useTranslations("Admin");
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<ApiErrorInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    adminRequest<{ roles: Role[] }>("/api/v1/admin/roles", token, { method: "GET" })
      .then((data) => {
        if (canceled) return;
        if (!data.ok) {
          setError(parseApiError(data.data, data.status));
          setRoles([]);
        } else {
          setError(null);
          setRoles(data.data.roles ?? []);
        }
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
        setRoles([]);
      });
    return () => {
      canceled = true;
    };
  }, [token]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("roles.eyebrow")}
        title={t("roles.title")}
        summary={t("roles.summary")}
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
              <p className="text-sm text-muted-foreground">{t("roles.totalRoles")}</p>
              <CardTitle className="text-3xl font-semibold text-foreground">
                {roles.length}
              </CardTitle>
            </div>
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("roles.totalRolesDescription")}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{t("roles.allRoles")}</h2>

        {roles.length === 0 ? (
          <div className="rounded-xl border border-border/70 bg-card/90 px-6 py-10 text-center text-sm text-muted-foreground">
            {t("roles.empty")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id} className="border-border/70 bg-card/90">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base text-foreground">{role.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{role.id}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {t("roles.permissions")}: {role.permissions.length}
                  </p>
                  <p>
                    {t("roles.created")}: {new Date(role.created_at).toLocaleDateString()}
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
