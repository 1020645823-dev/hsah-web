"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Blocks } from "lucide-react";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { adminRequest, getStoredAdminToken } from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";

import type { PermissionMatrix } from "@/types/permission";

export default function AdminMatrixPage() {
  const t = useTranslations("Admin");
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [error, setError] = useState<ApiErrorInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    adminRequest<PermissionMatrix>("/api/v1/admin/matrix", token, { method: "GET" })
      .then((data) => {
        if (canceled) return;
        if (!data.ok) {
          setError(parseApiError(data.data, data.status));
          setMatrix(null);
        } else {
          setError(null);
          setMatrix(data.data ?? null);
        }
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
        setMatrix(null);
      });
    return () => {
      canceled = true;
    };
  }, [token]);

  const roleNames = matrix ? Object.keys(matrix) : [];
  const permissionNames = matrix && roleNames.length > 0 ? Object.keys(matrix[roleNames[0]] ?? {}) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("matrix.eyebrow")}
        title={t("matrix.title")}
        summary={t("matrix.summary")}
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
              <p className="text-sm text-muted-foreground">{t("matrix.totalRoles")}</p>
              <CardTitle className="text-3xl font-semibold text-foreground">
                {roleNames.length}
              </CardTitle>
            </div>
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <Blocks className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("matrix.totalRolesDescription")}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{t("matrix.permissionMatrix")}</h2>

        {roleNames.length === 0 ? (
          <div className="rounded-xl border border-border/70 bg-card/90 px-6 py-10 text-center text-sm text-muted-foreground">
            {t("matrix.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/90">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("matrix.role")}</th>
                  {permissionNames.map((permission) => (
                    <th key={permission} className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {permission}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roleNames.map((role) => (
                  <tr key={role} className="border-b border-border/70 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-foreground">{role}</td>
                    {permissionNames.map((permission) => (
                      <td key={permission} className="px-4 py-3 text-muted-foreground">
                        {matrix?.[role]?.[permission] ? t("matrix.allowed") : t("matrix.denied")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
