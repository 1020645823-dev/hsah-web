"use client";

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

function describeReason(reason: MatrixCell["reason"]) {
  if (reason === "matched_deny_policy") return "命中至少一条 deny 策略，最终决策按优先级收敛为 deny。";
  if (reason === "matched_allow_policy") return "未命中 deny，但命中 allow 策略，最终决策为 allow。";
  return "当前资源上下文下没有命中策略，结果为 implicit。";
}

function getDecisionTone(decision: MatrixCell["decision"]) {
  if (decision === "deny") return "bg-red-500/12 text-red-200";
  if (decision === "allow") return "bg-emerald-500/12 text-emerald-200";
  return "bg-[rgb(212_218_245_/10%)] text-[var(--color-text-primary)]";
}

export function PermissionMatrixDetail({ selection }: PermissionMatrixDetailProps) {
  if (!selection) {
    return (
      <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
        <CardHeader>
          <CardTitle className="text-[var(--color-text-primary)]">Cell Detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-[var(--color-text-secondary)]">
          <div>选择任意矩阵单元格后，这里会展示角色、权限、决策原因和命中策略。</div>
          <div className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/10 px-4 py-3 text-xs tracking-[0.12em] text-[var(--color-periwinkle)]">
            CLICK A CELL TO INSPECT SOURCES
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
              SELECTED CELL
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
            <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">ROLE</div>
            <div className="text-sm text-[var(--color-text-primary)]">{selection.roleName}</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">REASON</div>
            <div className="text-sm leading-6 text-[var(--color-text-secondary)]">
              {describeReason(selection.reason)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
            MATCHED POLICIES
          </div>
          {selection.matchedPolicies.length > 0 ? (
            <div className="space-y-3">
              {selection.matchedPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/10 px-4 py-3"
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
            <div className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/10 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              当前单元格未命中任何策略。
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
            RELATED VIEWS
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/admin/roles"
              className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/10 px-4 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:border-[rgb(123_63_242_/35%)]"
            >
              Open Roles
            </Link>
            <Link
              href="/admin/policies"
              className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/10 px-4 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:border-[rgb(123_63_242_/35%)]"
            >
              Open Policies
            </Link>
            <Link
              href="/admin/simulator"
              className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/10 px-4 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:border-[rgb(123_63_242_/35%)]"
            >
              Open Simulator
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
