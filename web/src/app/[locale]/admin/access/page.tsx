"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Shield, ShieldCheck, User as UserIcon } from "lucide-react";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { Tabs, TabsList, TabsTrigger, TabsPanel } from "@/components/ui/tabs";
import { adminRequest, getStoredAdminToken } from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

import type { User } from "@/types/user";
import type { Role } from "@/types/role";
import type { Policy } from "@/types/policy";

export default function AdminAccessPage() {
  const t = useTranslations("Admin");
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  // Nothing to load when there is no token, so skip the loading state in that case.
  const [loading, setLoading] = useState(() => Boolean(token));

  useEffect(() => {
    if (!token) {
      return;
    }
    let canceled = false;
    Promise.all([
      adminRequest<{ users: User[] }>("/api/v1/admin/users", token, { method: "GET" }),
      adminRequest<{ roles: Role[] }>("/api/v1/admin/roles", token, { method: "GET" }),
      adminRequest<{ policies: Policy[] }>("/api/v1/admin/policies", token, { method: "GET" }),
    ])
      .then(([usersRes, rolesRes, policiesRes]) => {
        if (canceled) return;
        const failed = [usersRes, rolesRes, policiesRes].find((r) => !r.ok);
        if (failed) {
          setError(parseApiError(failed.data, failed.status));
          setUsers([]);
          setRoles([]);
          setPolicies([]);
        } else {
          setError(null);
          setUsers(usersRes.ok ? (usersRes.data.users ?? []) : []);
          setRoles(rolesRes.ok ? (rolesRes.data.roles ?? []) : []);
          setPolicies(policiesRes.ok ? (policiesRes.data.policies ?? []) : []);
        }
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [token]);

  // Derive the permission matrix from role definitions on the client. The
  // legacy /admin/matrix endpoint did not exist on the backend, so this replaces
  // a broken call with a deterministic view computed from role.permissions[].
  const permissionColumns = useMemo(() => {
    const set = new Set<string>();
    for (const role of roles) {
      for (const perm of role.permissions ?? []) set.add(perm);
    }
    return Array.from(set).sort();
  }, [roles]);

  function statusBadge(status: string) {
    return cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ring-1",
      status === "active"
        ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
        : "bg-amber-500/10 text-amber-600 ring-amber-500/20",
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("access.eyebrow")}
        title={t("access.title")}
        summary={t("access.summary")}
      />

      {error && (
        <ErrorAlert
          error={error}
          onRetry={error.retryable ? () => setError(null) : undefined}
          onDismiss={() => setError(null)}
        />
      )}

      <Tabs defaultValue="matrix">
        <TabsList>
          <TabsTrigger value="matrix">{t("access.tabMatrix")}</TabsTrigger>
          <TabsTrigger value="users">{t("access.tabUsers")}</TabsTrigger>
          <TabsTrigger value="roles">{t("access.tabRoles")}</TabsTrigger>
          <TabsTrigger value="policies">{t("access.tabPolicies")}</TabsTrigger>
        </TabsList>

        {/* Matrix tab */}
        <TabsPanel value="matrix">
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("access.matrixDescription")}</p>

            {loading ? (
              <MatrixSkeleton />
            ) : roles.length === 0 ? (
              <EmptyState label={t("access.noRoles")} />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/90">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {t("access.role")}
                      </th>
                      {permissionColumns.map((permission) => (
                        <th
                          key={permission}
                          className="px-4 py-3 text-left font-medium text-muted-foreground"
                        >
                          {permission}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id} className="border-b border-border/70 last:border-b-0">
                        <td className="px-4 py-3 font-medium text-foreground">{role.name}</td>
                        {permissionColumns.map((permission) => {
                          const allowed = role.permissions?.includes(permission);
                          return (
                            <td key={permission} className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
                                  allowed
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {allowed ? t("access.allowed") : t("access.denied")}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </TabsPanel>

        {/* Users tab */}
        <TabsPanel value="users">
          <section className="space-y-4">
            <CountHeader
              icon={<UserIcon className="h-4 w-4" />}
              label={t("access.users.total")}
              count={users.length}
            />
            {loading ? (
              <GridSkeleton />
            ) : users.length === 0 ? (
              <EmptyState label={t("access.users.empty")} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {users.map((user) => (
                  <Card key={user.id} className="border-border/70 bg-card/90">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-base text-foreground">{user.name}</CardTitle>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        <span className="text-muted-foreground/70">{t("users.role")}:</span>{" "}
                        <span className="font-medium text-foreground">{user.role}</span>
                      </p>
                      <div className="flex items-center gap-3">
                        <span>
                          <span className="text-muted-foreground/70">{t("users.twoFactor")}:</span>{" "}
                          {user.mfa_enabled ? t("users.enabled") : t("users.disabled")}
                        </span>
                        <span className={statusBadge(user.status)}>{user.status}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </TabsPanel>

        {/* Roles tab */}
        <TabsPanel value="roles">
          <section className="space-y-4">
            <CountHeader
              icon={<Shield className="h-4 w-4" />}
              label={t("access.roles.total")}
              count={roles.length}
            />
            {loading ? (
              <GridSkeleton />
            ) : roles.length === 0 ? (
              <EmptyState label={t("access.roles.empty")} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {roles.map((role) => (
                  <Card key={role.id} className="border-border/70 bg-card/90">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-base text-foreground">{role.name}</CardTitle>
                      <p className="font-mono text-[11px] text-muted-foreground/80">{role.id}</p>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        {t("access.roles.permissions")}: {role.permissions?.length ?? 0}
                      </p>
                      {role.permissions && role.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {role.permissions.slice(0, 6).map((perm) => (
                            <span
                              key={perm}
                              className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                            >
                              {perm}
                            </span>
                          ))}
                          {role.permissions.length > 6 ? (
                            <span className="inline-flex items-center px-1 text-[11px] text-muted-foreground/70">
                              +{role.permissions.length - 6}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </TabsPanel>

        {/* Policies tab */}
        <TabsPanel value="policies">
          <section className="space-y-4">
            <CountHeader
              icon={<ShieldCheck className="h-4 w-4" />}
              label={t("access.policies.total")}
              count={policies.length}
            />
            {loading ? (
              <GridSkeleton />
            ) : policies.length === 0 ? (
              <EmptyState label={t("access.policies.empty")} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {policies.map((policy) => (
                  <Card key={policy.id} className="border-border/70 bg-card/90">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-base text-foreground">{policy.name}</CardTitle>
                      <p className="font-mono text-[11px] text-muted-foreground/80">{policy.id}</p>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        {t("access.policies.effect")}:{" "}
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize",
                            policy.effect === "allow"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600",
                          )}
                        >
                          {policy.effect}
                        </span>
                      </p>
                      <p>
                        {t("access.policies.created")}:{" "}
                        {new Date(policy.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </TabsPanel>
      </Tabs>
    </div>
  );
}

function CountHeader({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{count}</p>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/90 px-6 py-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function MatrixSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-card/90 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-md bg-muted/70" />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl border border-border/70 bg-card/90" />
      ))}
    </div>
  );
}
