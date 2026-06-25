"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminRequest,
  extractArrayPayload,
  formatJson,
  getErrorMessage,
  getStoredAdminToken,
  isAdminRecord,
  parseAdminRole,
  pickStringArray,
} from "@/lib/admin";
import {
  applyWizardTemplate,
  buildPolicyCreatePayload,
  normalizePermissions,
  normalizeRoleNames,
  validateWizardDraft,
  type PolicyWizardDraft,
  type PolicyWizardTemplateId,
} from "@/lib/admin-policy-wizard";

type Step = 0 | 1 | 2 | 3;

const STEPS: Array<{ id: Step; label: string; title: string }> = [
  { id: 0, label: "Template", title: "Choose Template" },
  { id: 1, label: "Basics", title: "Basics" },
  { id: 2, label: "Permissions", title: "Permissions" },
  { id: 3, label: "Scope & Review", title: "Scope & Review" },
];

const DEFAULT_DRAFT: PolicyWizardDraft = {
  name: "",
  effect: "allow",
  permissionsText: "",
  permissions: [],
  roleNamesText: "",
  roleNames: [],
  resourceType: "",
  resourceVisibility: "",
};

const TEMPLATE_OPTIONS: Array<{
  id: PolicyWizardTemplateId;
  title: string;
  summary: string;
  highlights: string[];
}> = [
  {
    id: "blank",
    title: "Blank",
    summary: "从零开始填写 effect、permissions 与作用域。",
    highlights: ["effect: keep current", "permissions: empty", "scope: empty"],
  },
  {
    id: "allow-public-asset-read",
    title: "Allow Public Asset Read",
    summary: "允许读取 public asset。",
    highlights: ["effect: allow", "permissions: assets.read", "scope: asset / public"],
  },
  {
    id: "deny-restricted-asset-read",
    title: "Deny Restricted Asset Read",
    summary: "拒绝读取 restricted asset。",
    highlights: ["effect: deny", "permissions: assets.read", "scope: asset / restricted"],
  },
  {
    id: "deny-public-asset-write",
    title: "Deny Public Asset Write",
    summary: "拒绝写入 public asset。",
    highlights: ["effect: deny", "permissions: assets.write", "scope: asset / public"],
  },
];

const PERMISSION_SUGGESTIONS = ["assets.read", "assets.write", "admin.read", "admin.write"];

export default function AdminPolicyWizardPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [step, setStep] = useState<Step>(0);
  const [templateId, setTemplateId] = useState<PolicyWizardTemplateId>("blank");
  const [draft, setDraft] = useState<PolicyWizardDraft>(() => DEFAULT_DRAFT);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<Array<ReturnType<typeof parseAdminRole>>>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const currentToken = token;
    let canceled = false;

    async function hydrateRoles() {
      setLoadingRoles(true);
      setRolesError(null);

      const result = await adminRequest<unknown>("/api/v1/admin/roles", currentToken, { method: "GET" });
      if (canceled) return;

      if (!result.ok) {
        setRoles([]);
        setRolesError(getErrorMessage(result.data, result.status));
        setLoadingRoles(false);
        return;
      }

      const rows = extractArrayPayload(result.data, ["roles"]);
      setRoles(rows.map(parseAdminRole));
      setLoadingRoles(false);
    }

    void hydrateRoles();

    return () => {
      canceled = true;
    };
  }, [token]);

  const activeStepMeta = useMemo(() => {
    return STEPS.find((item) => item.id === step) ?? STEPS[0];
  }, [step]);

  const canGoBack = step > 0;
  const stepValidation = useMemo(() => validateWizardDraft(draft, step), [draft, step]);
  const submitValidation = useMemo(() => validateWizardDraft(draft, 3), [draft]);
  const canGoNext = step < 3 && stepValidation.ok;
  const canSubmit = step === 3 && submitValidation.ok;

  const payloadPreview = useMemo(() => {
    return buildPolicyCreatePayload(draft);
  }, [draft]);

  const roleNameSuggestions = useMemo(() => {
    const names = roles.map((role) => role.name).filter(Boolean);
    return [...new Set(names)];
  }, [roles]);

  function applyDraftTemplate(nextTemplateId: PolicyWizardTemplateId) {
    setTemplateId(nextTemplateId);
    setDraft((current) => applyWizardTemplate(current, nextTemplateId));
    setLocalNotice(null);
    setSubmitError(null);
  }

  function upsertCommaToken(list: string[], token: string) {
    if (!token.trim()) return list;
    const next = new Set(list);
    next.add(token.trim());
    return [...next];
  }

  function removeToken(list: string[], token: string) {
    return list.filter((item) => item !== token);
  }

  function renderTokenChips(tokens: string[], onRemove: (token: string) => void) {
    if (tokens.length === 0) {
      return <div className="text-sm text-[var(--color-text-secondary)]">暂无内容</div>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {tokens.map((tokenValue) => (
          <span
            key={tokenValue}
            className="inline-flex items-center gap-2 rounded-full border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-3 py-1 text-xs text-[var(--color-text-primary)]"
          >
            <span className="max-w-[22rem] truncate">{tokenValue}</span>
            <button
              type="button"
              className="rounded-full p-0.5 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              onClick={() => {
                onRemove(tokenValue);
                setLocalNotice(null);
                setSubmitError(null);
              }}
              aria-label={`remove-${tokenValue}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
    );
  }

  function renderRolePrefetchCallout() {
    return (
      <div className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/10 px-4 py-4 text-sm text-[var(--color-text-secondary)]">
        {loadingRoles ? (
          <div>正在预加载角色列表...</div>
        ) : roleNameSuggestions.length > 0 ? (
          <div className="space-y-2">
            <div>已预加载 {roleNameSuggestions.length} 个角色，可用作 role_names 建议。</div>
            <div className="flex flex-wrap gap-2">
              {roleNameSuggestions.slice(0, 10).map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-[rgb(212_218_245_/10%)] px-3 py-1 text-xs text-[var(--color-text-primary)]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div>角色接口未返回可用数据，仍可手动输入 role_names。</div>
        )}
      </div>
    );
  }

  function renderStep0() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {TEMPLATE_OPTIONS.map((option) => {
            const selected = option.id === templateId;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => applyDraftTemplate(option.id)}
                className={
                  selected
                    ? "rounded-2xl border border-[rgb(123_63_242_/45%)] bg-[rgb(123_63_242_/10%)] px-5 py-5 text-left text-[var(--color-text-primary)] shadow-[0_0_0_1px_rgb(123_63_242_/10%)] transition-colors"
                    : "rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/2%)] px-5 py-5 text-left text-[var(--color-text-primary)] transition-colors hover:border-[rgb(123_63_242_/35%)]"
                }
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{option.title}</div>
                      <div className="text-sm leading-6 text-[var(--color-text-secondary)]">
                        {option.summary}
                      </div>
                    </div>
                    {selected ? (
                      <span className="rounded-full border border-[rgb(123_63_242_/40%)] bg-[rgb(123_63_242_/18%)] px-3 py-1 text-xs">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {option.highlights.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-[rgb(212_218_245_/10%)] px-3 py-1 text-xs text-[var(--color-text-secondary)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/15 px-4 py-4 text-sm text-[var(--color-text-secondary)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
              CURRENT DRAFT
            </span>
            <span className="rounded-full bg-[rgb(212_218_245_/10%)] px-3 py-1 text-xs text-[var(--color-text-primary)]">
              effect: {draft.effect}
            </span>
            <span className="rounded-full bg-[rgb(212_218_245_/10%)] px-3 py-1 text-xs text-[var(--color-text-primary)]">
              permissions: {draft.permissions.length}
            </span>
            <span className="rounded-full bg-[rgb(212_218_245_/10%)] px-3 py-1 text-xs text-[var(--color-text-primary)]">
              role_names: {draft.roleNames.length}
            </span>
          </div>
        </div>
      </div>
    );
  }

  function renderStep1() {
    return (
      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wizard-policy-name" className="text-[var(--color-text-primary)]">
              Policy Name
            </Label>
            <Input
              id="wizard-policy-name"
              value={draft.name}
              onChange={(event) => {
                const value = event.target.value;
                setDraft((current) => ({ ...current, name: value }));
                setLocalNotice(null);
                setSubmitError(null);
              }}
              placeholder="allow-public-asset-read"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--color-text-primary)]">Effect</Label>
            <div className="flex flex-wrap gap-3">
              {(["allow", "deny"] as const).map((effect) => (
                <button
                  key={effect}
                  type="button"
                  onClick={() => {
                    setDraft((current) => ({ ...current, effect }));
                    setLocalNotice(null);
                    setSubmitError(null);
                  }}
                  className={
                    draft.effect === effect
                      ? "rounded-full border border-[rgb(123_63_242_/45%)] bg-[rgb(123_63_242_/18%)] px-4 py-2 text-sm text-[var(--color-text-primary)]"
                      : "rounded-full border border-[rgb(212_218_245_/12%)] bg-transparent px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:border-[rgb(123_63_242_/35%)]"
                  }
                >
                  {effect}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!stepValidation.ok ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {stepValidation.message}
          </div>
        ) : null}
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="wizard-permissions" className="text-[var(--color-text-primary)]">
            Permissions（逗号分隔）
          </Label>
          <Input
            id="wizard-permissions"
            value={draft.permissionsText}
            onChange={(event) => {
              const value = event.target.value;
              setDraft((current) => ({
                ...current,
                permissionsText: value,
                permissions: normalizePermissions(value),
              }));
              setLocalNotice(null);
              setSubmitError(null);
            }}
            placeholder="assets.read, admin.read"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {PERMISSION_SUGGESTIONS.map((permission) => (
              <button
                key={permission}
                type="button"
                className="rounded-full border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-3 py-1 text-xs text-[var(--color-periwinkle)] transition-colors hover:border-[rgb(123_63_242_/40%)]"
                onClick={() => {
                  setDraft((current) => {
                    const next = upsertCommaToken(current.permissions, permission);
                    return {
                      ...current,
                      permissions: next,
                      permissionsText: next.join(", "),
                    };
                  });
                  setLocalNotice(null);
                  setSubmitError(null);
                }}
              >
                + {permission}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
            CURRENT PERMISSIONS
          </div>
          {renderTokenChips(draft.permissions, (tokenValue) => {
            setDraft((current) => {
              const next = removeToken(current.permissions, tokenValue);
              return { ...current, permissions: next, permissionsText: next.join(", ") };
            });
            setSubmitError(null);
          })}
        </div>

        {!stepValidation.ok ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {stepValidation.message}
          </div>
        ) : null}
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-6">
        {renderRolePrefetchCallout()}

        <div className="space-y-2">
          <Label htmlFor="wizard-role-names" className="text-[var(--color-text-primary)]">
            Role Names（逗号分隔）
          </Label>
          <Input
            id="wizard-role-names"
            value={draft.roleNamesText}
            onChange={(event) => {
              const value = event.target.value;
              setDraft((current) => ({
                ...current,
                roleNamesText: value,
                roleNames: normalizeRoleNames(value),
              }));
              setLocalNotice(null);
              setSubmitError(null);
            }}
            placeholder="role-a, role-b"
          />

          {roleNameSuggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {roleNameSuggestions.slice(0, 16).map((name) => (
                <button
                  key={name}
                  type="button"
                  className="rounded-full border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-3 py-1 text-xs text-[var(--color-periwinkle)] transition-colors hover:border-[rgb(123_63_242_/40%)]"
                  onClick={() => {
                    setDraft((current) => {
                      const next = upsertCommaToken(current.roleNames, name);
                      return { ...current, roleNames: next, roleNamesText: next.join(", ") };
                    });
                    setLocalNotice(null);
                    setSubmitError(null);
                  }}
                >
                  + {name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">CURRENT ROLES</div>
          {renderTokenChips(draft.roleNames, (tokenValue) => {
            setDraft((current) => {
              const next = removeToken(current.roleNames, tokenValue);
              return { ...current, roleNames: next, roleNamesText: next.join(", ") };
            });
            setSubmitError(null);
          })}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wizard-resource-type" className="text-[var(--color-text-primary)]">
              Resource Type
            </Label>
            <Input
              id="wizard-resource-type"
              value={draft.resourceType}
              onChange={(event) => {
                const value = event.target.value;
                setDraft((current) => ({ ...current, resourceType: value }));
                setLocalNotice(null);
                setSubmitError(null);
              }}
              placeholder="asset"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-resource-visibility" className="text-[var(--color-text-primary)]">
              Resource Visibility
            </Label>
            <Input
              id="wizard-resource-visibility"
              value={draft.resourceVisibility}
              onChange={(event) => {
                const value = event.target.value;
                setDraft((current) => ({ ...current, resourceVisibility: value }));
                setLocalNotice(null);
                setSubmitError(null);
              }}
              placeholder="public"
            />
          </div>
        </div>

        <details className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/15 px-4 py-3">
          <summary className="cursor-pointer text-sm text-[var(--color-text-secondary)]">
            预览创建 payload（JSON）
          </summary>
          <pre className="mt-3 overflow-x-auto text-xs leading-6 text-[var(--color-periwinkle)]">
            {formatJson(payloadPreview)}
          </pre>
        </details>

        {localNotice ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>{localNotice}</div>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/policies")}
              >
                Back to Policies
              </Button>
            </div>
          </div>
        ) : null}

        {submitError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {submitError}
          </div>
        ) : null}

        {!submitValidation.ok ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {submitValidation.message}
          </div>
        ) : null}
      </div>
    );
  }

  function getSubmitErrorMessage(data: unknown, status?: number) {
    const raw = getErrorMessage(data, status);
    if (raw.includes("policy_already_exists")) {
      return "策略名称已存在，请更换名称后重试。";
    }
    if (raw.includes("invalid_role_names")) {
      if (isAdminRecord(data) && isAdminRecord(data.detail)) {
        const missing = pickStringArray(data.detail, ["role_names"]);
        if (missing.length > 0) {
          return `包含无效角色名：${missing.join(", ")}。请刷新角色列表或更正后重试。`;
        }
      }
      return "包含无效角色名，请刷新角色列表或更正后重试。";
    }
    return raw;
  }

  async function handleSubmit() {
    if (!token) return;
    if (!submitValidation.ok) return;
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    setLocalNotice(null);

    const result = await adminRequest<unknown>("/api/v1/admin/policies", token, {
      method: "POST",
      body: JSON.stringify(buildPolicyCreatePayload(draft)),
    });

    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(getSubmitErrorMessage(result.data, result.status));
      return;
    }

    setLocalNotice("Policy 创建成功。");
  }

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              ADMIN / POLICIES / WIZARD
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Policy Wizard
            </div>
            <div className="max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
              分步创建访问策略：模板 → 基础信息 → 权限 → 作用域与确认。
            </div>
          </div>
          <Link
            href="/admin/policies"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            ← Back
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {STEPS.map((item) => (
            <span
              key={item.id}
              className={
                step === item.id
                  ? "rounded-full border border-[rgb(123_63_242_/45%)] bg-[rgb(123_63_242_/18%)] px-4 py-2 text-sm text-[var(--color-text-primary)]"
                  : "rounded-full border border-[rgb(212_218_245_/12%)] bg-transparent px-4 py-2 text-sm text-[var(--color-text-secondary)]"
              }
            >
              {item.label}
            </span>
          ))}
        </div>

        {rolesError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {rolesError}
          </div>
        ) : null}

        <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
          <CardHeader className="space-y-4">
            <CardTitle className="text-[var(--color-text-primary)]">{activeStepMeta.title}</CardTitle>
            <div className="text-sm leading-6 text-[var(--color-text-secondary)]">
              草稿会在各步骤间保持同步；Next / Submit 会根据当前步骤校验结果启用或禁用。
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 0 ? renderStep0() : null}
            {step === 1 ? renderStep1() : null}
            {step === 2 ? renderStep2() : null}
            {step === 3 ? renderStep3() : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={!canGoBack || submitting}
                onClick={() => {
                  setStep((current) => (current > 0 ? ((current - 1) as Step) : current));
                  setLocalNotice(null);
                  setSubmitError(null);
                }}
              >
                Back
              </Button>
              <div className="flex items-center gap-3">
                {step < 3 ? (
                  <Button
                    type="button"
                    disabled={!canGoNext || submitting}
                    onClick={() => {
                      if (!stepValidation.ok) return;
                      setStep((current) => (current < 3 ? ((current + 1) as Step) : current));
                      setLocalNotice(null);
                      setSubmitError(null);
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={!canSubmit || submitting}
                    onClick={() => {
                      void handleSubmit();
                    }}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
