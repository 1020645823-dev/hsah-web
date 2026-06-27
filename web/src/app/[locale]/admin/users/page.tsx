"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { User, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { adminRequest, getStoredAdminToken } from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";

import type { User as UserType } from "@/types/user";

export default function AdminUsersPage() {
  const t = useTranslations("Admin");
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [users, setUsers] = useState<UserType[]>([]);
  const [error, setError] = useState<ApiErrorInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    adminRequest<{ users: UserType[] }>("/api/v1/admin/users", token, { method: "GET" })
      .then((data) => {
        if (canceled) return;
        if (!data.ok) {
          setError(parseApiError(data.data, data.status));
          setUsers([]);
        } else {
          setError(null);
          setUsers(data.data.users ?? []);
        }
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
        setUsers([]);
      });
    return () => {
      canceled = true;
    };
  }, [token]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("users.eyebrow")}
        title={t("users.title")}
        summary={t("users.summary")}
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
              <p className="text-sm text-muted-foreground">{t("users.totalUsers")}</p>
              <CardTitle className="text-3xl font-semibold text-foreground">
                {users.length}
              </CardTitle>
            </div>
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <User className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("users.totalUsersDescription")}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{t("users.allUsers")}</h2>

        {users.length === 0 ? (
          <div className="rounded-xl border border-border/70 bg-card/90 px-6 py-10 text-center text-sm text-muted-foreground">
            {t("users.empty")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {users.map((user) => (
              <Card key={user.id} className="border-border/70 bg-card/90">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base text-foreground">{user.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {t("users.id")}: {user.id}
                  </p>
                  <p>
                    {t("users.role")}: {user.role}
                  </p>
                  <p>
                    {t("users.mfa")}: {user.mfa_enabled ? t("users.mfaEnabled") : t("users.mfaDisabled")}
                  </p>
                  <p>
                    {t("users.status")}: {user.status}
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
