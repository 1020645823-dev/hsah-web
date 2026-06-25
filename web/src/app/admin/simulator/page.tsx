"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminRequest,
  formatJson,
  getStoredAdminToken,
  isAdminRecord,
  pickString,
} from "@/lib/admin";

const defaultPayload = {
  permission: "assets.read",
  resource_type: "asset",
  resource_visibility: "public",
};

export default function AdminSimulatorPage() {
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [payloadText, setPayloadText] = useState(() => JSON.stringify(defaultPayload, null, 2));
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("登录已失效，请重新登录后重试。");
      return;
    }

    setError(null);
    setRequestError(null);
    setSubmitting(true);

    let payload: unknown;
    try {
      payload = JSON.parse(payloadText) as unknown;
    } catch {
      setSubmitting(false);
      setRequestError("请求 JSON 格式不合法，请修正后再提交。");
      return;
    }

    const response = await adminRequest<unknown>("/api/v1/admin/permissions/simulate", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    setResult(response.data);
    if (!response.ok) {
      setError(response.message);
      return;
    }
  }

  const decisionLabel = isAdminRecord(result) ? pickString(result, ["decision", "effect", "result"]) : null;
  const reasonLabel = isAdminRecord(result) ? pickString(result, ["reason"]) : null;
  const matchedRoles =
    isAdminRecord(result) && Array.isArray(result.matched_roles)
      ? result.matched_roles.filter((item): item is string => typeof item === "string")
      : [];
  const matchedPolicies =
    isAdminRecord(result) && Array.isArray(result.matched_policies)
      ? result.matched_policies
          .filter(isAdminRecord)
          .map((item) => pickString(item, ["name", "id"]))
          .filter((item): item is string => Boolean(item))
      : [];
  const missingPermissions =
    isAdminRecord(result) && Array.isArray(result.missing_permissions)
      ? result.missing_permissions.filter((item): item is string => typeof item === "string")
      : [];

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              ADMIN / SIMULATOR
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Permission Simulator
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              直接向 `/api/v1/admin/permissions/simulate` 提交 JSON 载荷，页面提炼决策摘要并保留完整响应。
            </div>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            ← Back
          </Link>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
            <CardHeader>
              <CardTitle className="text-[var(--color-text-primary)]">Request Payload</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="simulator-payload" className="text-[var(--color-text-primary)]">
                    Simulation JSON
                  </Label>
                  <Textarea
                    id="simulator-payload"
                    value={payloadText}
                    onChange={(event) => setPayloadText(event.target.value)}
                    className="min-h-[420px] font-mono text-xs leading-6 text-[var(--color-periwinkle)]"
                    spellCheck={false}
                  />
                  <div className="text-sm leading-6 text-[var(--color-text-secondary)]">
                    默认载荷仅用于占位联调。若后端字段不同，可直接在此输入真实请求体。
                  </div>
                </div>

                {requestError ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    {requestError}
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Run Simulation"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPayloadText(JSON.stringify(defaultPayload, null, 2));
                      setRequestError(null);
                    }}
                  >
                    Reset Payload
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
              <CardHeader>
                <CardTitle className="text-[var(--color-text-primary)]">Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-semibold text-[var(--color-text-primary)]">
                  {decisionLabel ?? "—"}
                </div>
                <div className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  当前已按后端真实 schema 对齐 `decision / matched_roles / matched_policies / missing_permissions / reason`。
                </div>
                <div className="space-y-2">
                  <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                    MATCHED ROLES
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matchedRoles.length > 0 ? (
                      matchedRoles.map((reason) => (
                        <span
                          key={reason}
                          className="rounded-full bg-[rgb(123_63_242_/12%)] px-3 py-1 text-xs text-[var(--color-periwinkle)]"
                        >
                          {reason}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        暂无命中角色
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                    MATCHED POLICIES
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matchedPolicies.length > 0 ? (
                      matchedPolicies.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-[rgb(212_218_245_/10%)] px-3 py-1 text-xs text-[var(--color-text-primary)]"
                        >
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        暂无命中策略
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                    MISSING PERMISSIONS
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {missingPermissions.length > 0 ? (
                      missingPermissions.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-200"
                        >
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        无缺失权限
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  {reasonLabel ? `Reason: ${reasonLabel}` : "Reason: —"}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
              <CardHeader>
                <CardTitle className="text-[var(--color-text-primary)]">Raw Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="min-h-[360px] overflow-x-auto rounded-2xl bg-black/20 p-4 text-xs leading-6 text-[var(--color-periwinkle)]">
                  {result ? formatJson(result) : "Submit a simulation request to inspect the response."}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
