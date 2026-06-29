"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatrixCell } from "@/lib/admin-permission-matrix";

type PermissionMatrixSelection = {
  permission: string;
  roleName: string;
  decision: MatrixCell["decision"];
  reason: MatrixCell["reason"];
  matchedPolicies: MatrixCell["matchedPolicies"];
};

type PermissionMatrixDetailProps = {
  selection: PermissionMatrixSelection | null;
};

function describeReason(reason: MatrixCell["reason"], t: (key: string) => string) {
  if (reason === "matched_deny_policy") return t("permissionMatrixDetail.reasonDeny");
  if (reason === "matched_allow_policy") return t("permissionMatrixDetail.reasonAllow");
  return t("permissionMatrixDetail.reasonImplicit");
}

function getDecisionTone(decision: MatrixCell["decision"]) {
  if (decision === "deny") return "bg-red-500/12 text-red-200";
  if (decision === "allow") return "bg-emerald-500/12 text-emerald-200";
  return "bg-muted/80 text-[var(--color-text-primary)]";
}

export function PermissionMatrixDetail({ selection }: PermissionMatrixDetailProps) {
  const t = useTranslations("Admin");

  if (!selection) {
    return (
      <Card className="border-border bg-muted backdrop-blur-[24px]">
        <CardHeader>
          <CardTitle className="text-[var(--color-text-primary)]">{t("permissionMatrixDetail.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-[var(--color-text-secondary)]">
          <div>{t("permissionMatrixDetail.emptyDescription")}</div>
          <div className="rounded-2xl border border-border/80 bg-black/10 px-4 py-3 text-xs tracking-[0.12em] text-[var(--color-periwinkle)]">
            {t("permissionMatrixDetail.clickHint")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-muted backdrop-blur-[24px]">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
              {t("permissionMatrixDetail.selectedCell")}
            </div>
            <CardTitle className="text-[var(--color-text-primary)]">{selection.permission}</CardTitle>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs ${getDecisionTone(selection.decision)}`}>
            {selection.decision}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">{t("permissionMatrixDetail.role")}</div>
            <div className="text-sm text-[var(--color-text-primary)]">{selection.roleName}</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">{t("permissionMatrixDetail.reason")}</div>
            <div className="text-sm leading-6 text-[var(--color-text-secondary)]">
              {describeReason(selection.reason, t)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
            {t("permissionMatrixDetail.matchedPolicies")}
          </div>
          {selection.matchedPolicies.length > 0 ? (
            <div className="space-y-3">
              {selection.matchedPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="rounded-2xl border border-border/80 bg-black/10 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-[var(--color-text-primary)]">{policy.name}</div>
                    <span className={`rounded-full px-3 py-1 text-xs ${getDecisionTone(policy.effect)}`}>
                      {policy.effect}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-[var(--color-text-secondary)]">{policy.id}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/80 bg-black/10 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              {t("permissionMatrixDetail.noPolicies")}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
            {t("permissionMatrixDetail.relatedViews")}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/admin/roles"
              className="rounded-2xl border border-border/80 bg-black/10 px-4 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:border-[rgb(123_63_242_/35%)]"
            >
              {t("permissionMatrixDetail.openRoles")}
            </Link>
            <Link
              href="/admin/policies"
              className="rounded-2xl border border-border/80 bg-black/10 px-4 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:border-[rgb(123_63_242_/35%)]"
            >
              {t("permissionMatrixDetail.openPolicies")}
            </Link>
            <Link
              href="/admin/simulator"
              className="rounded-2xl border border-border/80 bg-black/10 px-4 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:border-[rgb(123_63_242_/35%)]"
            >
              {t("permissionMatrixDetail.openSimulator")}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
