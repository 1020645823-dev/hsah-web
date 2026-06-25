# Policy Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Admin policy creation wizard at `/admin/policies/wizard` with templates and step-by-step validation, submitting to the existing `POST /api/v1/admin/policies` endpoint and linking back to `/admin/policies`.

**Architecture:** Keep wizard logic (templates, normalization, payload building, validation) in a pure TypeScript helper with Vitest tests. Build the UI as a client page that reuses existing `adminRequest` and token handling. Preserve the existing `/admin/policies` create form as fallback while adding a “Create with Wizard” CTA.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui primitives, Vitest

---

## File Map

- Create: `src/lib/admin-policy-wizard.ts` (templates, normalization, draft → payload)
- Test: `src/lib/admin-policy-wizard.test.ts`
- Create: `src/app/admin/policies/wizard/page.tsx` (wizard UI)
- Modify: `src/app/admin/policies/page.tsx` (add entry CTA)
- Reuse: `src/lib/admin.ts` (`adminRequest`, `getStoredAdminToken`, `getErrorMessage`, `extractArrayPayload`, `parseAdminRole`)

## Data Contracts (Existing)

- `GET /api/v1/admin/roles` → `[{ id, name, ... }]` used only for role-name suggestions.
- `POST /api/v1/admin/policies` payload:

```json
{
  "name": "string",
  "effect": "allow | deny",
  "permissions": ["string"],
  "role_names": ["string"],
  "resource_type": "string | null",
  "resource_visibility": "string | null"
}
```

## Wizard UX (Phase 1)

- Step 0: Template
- Step 1: Basics (`name`, `effect`)
- Step 2: Permissions (`permissions[]`)
- Step 3: Scope & Review (`role_names[]`, `resource_type`, `resource_visibility`, submit)

---

### Task 1: Add wizard helper + tests (templates & normalization)

**Files:**
- Create: `src/lib/admin-policy-wizard.ts`
- Test: `src/lib/admin-policy-wizard.test.ts`

- [ ] **Step 1: Write failing tests for normalization and templates**

```ts
import { describe, expect, it } from "vitest";
import {
  applyWizardTemplate,
  normalizeCommaList,
  normalizePermissions,
  type PolicyWizardDraft,
} from "./admin-policy-wizard";

describe("admin-policy-wizard helpers", () => {
  it("normalizeCommaList trims, removes empties, de-duplicates", () => {
    expect(normalizeCommaList(" a, b , ,a,  ")).toEqual(["a", "b"]);
  });

  it("normalizePermissions accepts comma text and returns stable list", () => {
    expect(normalizePermissions("assets.read, assets.write")).toEqual(["assets.read", "assets.write"]);
  });

  it("applyWizardTemplate sets effect, permissions and resource scope", () => {
    const draft: PolicyWizardDraft = {
      name: "",
      effect: "allow",
      permissionsText: "",
      permissions: [],
      roleNamesText: "",
      roleNames: [],
      resourceType: "",
      resourceVisibility: "",
    };

    const next = applyWizardTemplate(draft, "deny-public-asset-write");
    expect(next.effect).toBe("deny");
    expect(next.permissions).toEqual(["assets.write"]);
    expect(next.resourceType).toBe("asset");
    expect(next.resourceVisibility).toBe("public");
  });
});
```

- [ ] **Step 2: Run tests to confirm failure**

Run:

```bash
npm run test -- src/lib/admin-policy-wizard.test.ts
```

Expected: FAIL with module not found or missing exports.

- [ ] **Step 3: Implement the helper module to make tests pass**

```ts
export type PolicyWizardEffect = "allow" | "deny";

export type PolicyWizardTemplateId =
  | "blank"
  | "allow-public-asset-read"
  | "deny-restricted-asset-read"
  | "deny-public-asset-write";

export type PolicyWizardDraft = {
  name: string;
  effect: PolicyWizardEffect;
  permissionsText: string;
  permissions: string[];
  roleNamesText: string;
  roleNames: string[];
  resourceType: string;
  resourceVisibility: string;
};

export function normalizeCommaList(input: string) {
  const items = input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set(items)];
}

export function normalizePermissions(input: string) {
  return normalizeCommaList(input);
}

export function normalizeRoleNames(input: string) {
  return normalizeCommaList(input);
}

export function applyWizardTemplate(draft: PolicyWizardDraft, templateId: PolicyWizardTemplateId): PolicyWizardDraft {
  if (templateId === "allow-public-asset-read") {
    return {
      ...draft,
      effect: "allow",
      permissionsText: "assets.read",
      permissions: ["assets.read"],
      resourceType: "asset",
      resourceVisibility: "public",
    };
  }

  if (templateId === "deny-restricted-asset-read") {
    return {
      ...draft,
      effect: "deny",
      permissionsText: "assets.read",
      permissions: ["assets.read"],
      resourceType: "asset",
      resourceVisibility: "restricted",
    };
  }

  if (templateId === "deny-public-asset-write") {
    return {
      ...draft,
      effect: "deny",
      permissionsText: "assets.write",
      permissions: ["assets.write"],
      resourceType: "asset",
      resourceVisibility: "public",
    };
  }

  return {
    ...draft,
    permissionsText: "",
    permissions: [],
    roleNamesText: "",
    roleNames: [],
    resourceType: "",
    resourceVisibility: "",
  };
}

export function buildPolicyCreatePayload(draft: PolicyWizardDraft) {
  return {
    name: draft.name.trim(),
    effect: draft.effect,
    permissions: draft.permissions,
    role_names: draft.roleNames,
    resource_type: draft.resourceType.trim() ? draft.resourceType.trim() : null,
    resource_visibility: draft.resourceVisibility.trim() ? draft.resourceVisibility.trim() : null,
  };
}

export function validateWizardDraft(draft: PolicyWizardDraft, step: 0 | 1 | 2 | 3) {
  if (step >= 1) {
    if (!draft.name.trim()) return { ok: false as const, message: "请填写策略名称。" };
    if (draft.effect !== "allow" && draft.effect !== "deny") return { ok: false as const, message: "请选择 effect。" };
  }

  if (step >= 2) {
    if (draft.permissions.length < 1) return { ok: false as const, message: "至少需要 1 个 permission。" };
  }

  return { ok: true as const };
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run:

```bash
npm run test -- src/lib/admin-policy-wizard.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin-policy-wizard.ts src/lib/admin-policy-wizard.test.ts
git commit -m "feat: add policy wizard helper and tests"
```

---

### Task 2: Add wizard route shell + step indicator

**Files:**
- Create: `src/app/admin/policies/wizard/page.tsx`

- [ ] **Step 1: Create the client page shell with existing Admin auth redirect**

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminRequest,
  extractArrayPayload,
  getErrorMessage,
  getStoredAdminToken,
  parseAdminRole,
  type AdminRecord,
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

export default function AdminPolicyWizardPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [step, setStep] = useState<Step>(0);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [draft, setDraft] = useState<PolicyWizardDraft>(() => ({
    name: "",
    effect: "allow",
    permissionsText: "",
    permissions: [],
    roleNamesText: "",
    roleNames: [],
    resourceType: "",
    resourceVisibility: "",
  }));

  useEffect(() => {
    if (!token) router.replace("/auth/login");
  }, [router, token]);

  useEffect(() => {
    if (!token) return;
    const currentToken = token;
    let canceled = false;

    async function hydrate() {
      setLoadingRoles(true);
      const result = await adminRequest<unknown>("/api/v1/admin/roles", currentToken, { method: "GET" });
      if (canceled) return;
      if (!result.ok) {
        setRoles([]);
        setLoadingRoles(false);
        return;
      }
      const rows = extractArrayPayload(result.data, ["roles"]);
      const parsed = rows.map(parseAdminRole);
      setRoles(parsed);
      setLoadingRoles(false);
    }

    void hydrate();
    return () => {
      canceled = true;
    };
  }, [token]);

  const stepError = useMemo(() => {
    const result = validateWizardDraft(draft, step);
    return result.ok ? null : result.message;
  }, [draft, step]);

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              ADMIN / POLICIES / WIZARD
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">Policy Wizard</div>
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

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {[
            { id: 0 as const, label: "Template" },
            { id: 1 as const, label: "Basics" },
            { id: 2 as const, label: "Permissions" },
            { id: 3 as const, label: "Scope & Review" },
          ].map((item) => (
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

        <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text-primary)]">
              {step === 0
                ? "Choose Template"
                : step === 1
                  ? "Basics"
                  : step === 2
                    ? "Permissions"
                    : "Scope & Review"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm text-[var(--color-text-secondary)]">
              页面骨架已就绪，任务3将填充每一步的表单与提交逻辑。
            </div>

            {stepError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {stepError}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => setStep((s) => (s > 0 ? ((s - 1) as Step) : s))}>
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Button type="button" onClick={() => setStep((s) => (s < 3 ? ((s + 1) as Step) : s))}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint to ensure the route compiles**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/policies/wizard/page.tsx
git commit -m "feat: add policy wizard route shell"
```

---

### Task 3: Implement step contents (template → basics → permissions → scope/review)

**Files:**
- Modify: `src/app/admin/policies/wizard/page.tsx`

- [ ] **Step 1: Implement Step 0 template cards**

```tsx
const templates: Array<{ id: PolicyWizardTemplateId; title: string; summary: string }> = [
  { id: "blank", title: "Blank", summary: "从空白开始配置 effect、权限和作用域。" },
  { id: "allow-public-asset-read", title: "Allow public asset read", summary: "allow + assets.read + asset/public" },
  { id: "deny-restricted-asset-read", title: "Deny restricted asset read", summary: "deny + assets.read + asset/restricted" },
  { id: "deny-public-asset-write", title: "Deny public asset write", summary: "deny + assets.write + asset/public" },
];

function handleSelectTemplate(templateId: PolicyWizardTemplateId) {
  setDraft((current) => applyWizardTemplate(current, templateId));
  setStep(1);
}
```

- [ ] **Step 2: Implement Step 1 basics**

```tsx
<div className="grid gap-5 md:grid-cols-2">
  <div className="space-y-2">
    <Label htmlFor="wizard-name" className="text-[var(--color-text-primary)]">Policy Name</Label>
    <Input
      id="wizard-name"
      value={draft.name}
      onChange={(e) => setDraft((c) => ({ ...c, name: e.target.value }))}
      placeholder="allow-public-asset-read"
      required
    />
  </div>
  <div className="space-y-2">
    <Label className="text-[var(--color-text-primary)]">Effect</Label>
    <div className="flex gap-3">
      {(["allow", "deny"] as const).map((effect) => (
        <button
          key={effect}
          type="button"
          onClick={() => setDraft((c) => ({ ...c, effect }))}
          className={
            draft.effect === effect
              ? "rounded-full border border-[rgb(123_63_242_/45%)] bg-[rgb(123_63_242_/18%)] px-4 py-2 text-sm text-[var(--color-text-primary)]"
              : "rounded-full border border-[rgb(212_218_245_/12%)] bg-transparent px-4 py-2 text-sm text-[var(--color-text-secondary)]"
          }
        >
          {effect}
        </button>
      ))}
    </div>
  </div>
</div>
```

- [ ] **Step 3: Implement Step 2 permissions with chips and suggestions**

```tsx
function applyPermissionsText(nextText: string) {
  const permissions = normalizePermissions(nextText);
  setDraft((c) => ({ ...c, permissionsText: nextText, permissions }));
}
```

```tsx
<div className="space-y-2">
  <Label htmlFor="wizard-permissions" className="text-[var(--color-text-primary)]">Permissions</Label>
  <Input
    id="wizard-permissions"
    value={draft.permissionsText}
    onChange={(e) => applyPermissionsText(e.target.value)}
    placeholder="assets.read, assets.write"
  />
  <div className="flex flex-wrap gap-2 pt-2">
    {draft.permissions.map((permission) => (
      <span
        key={permission}
        className="rounded-full bg-[rgb(212_218_245_/10%)] px-3 py-1 text-xs text-[var(--color-text-primary)]"
      >
        {permission}
      </span>
    ))}
  </div>
  <div className="flex flex-wrap gap-2 pt-2">
    {["assets.read", "assets.write", "assets.manage"].map((suggestion) => (
      <button
        key={suggestion}
        type="button"
        onClick={() => applyPermissionsText([...draft.permissions, suggestion].join(", "))}
        className="rounded-full border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-3 py-1 text-xs text-[var(--color-periwinkle)] transition-colors hover:border-[rgb(123_63_242_/40%)]"
      >
        + {suggestion}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Implement Step 3 scope & review**

```tsx
function applyRoleNamesText(nextText: string) {
  const roleNames = normalizeRoleNames(nextText);
  setDraft((c) => ({ ...c, roleNamesText: nextText, roleNames }));
}
```

```tsx
const payload = buildPolicyCreatePayload(draft);
```

```tsx
<div className="grid gap-5 md:grid-cols-2">
  <div className="space-y-2">
    <Label htmlFor="wizard-role-names" className="text-[var(--color-text-primary)]">Role Names</Label>
    <Input
      id="wizard-role-names"
      value={draft.roleNamesText}
      onChange={(e) => applyRoleNamesText(e.target.value)}
      placeholder="ops, audit"
    />
    <div className="flex flex-wrap gap-2 pt-2">
      {loadingRoles ? (
        <span className="text-sm text-[var(--color-text-secondary)]">Loading roles…</span>
      ) : roles.length > 0 ? (
        roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => applyRoleNamesText([...draft.roleNames, role.name].join(", "))}
            className="rounded-full border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-3 py-1 text-xs text-[var(--color-periwinkle)] transition-colors hover:border-[rgb(123_63_242_/40%)]"
          >
            + {role.name}
          </button>
        ))
      ) : (
        <span className="text-sm text-[var(--color-text-secondary)]">No role suggestions loaded.</span>
      )}
    </div>
  </div>
  <div className="grid gap-5 md:grid-cols-2">
    <div className="space-y-2">
      <Label htmlFor="wizard-resource-type" className="text-[var(--color-text-primary)]">Resource Type</Label>
      <Input
        id="wizard-resource-type"
        value={draft.resourceType}
        onChange={(e) => setDraft((c) => ({ ...c, resourceType: e.target.value }))}
        placeholder="asset"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="wizard-resource-visibility" className="text-[var(--color-text-primary)]">Resource Visibility</Label>
      <Input
        id="wizard-resource-visibility"
        value={draft.resourceVisibility}
        onChange={(e) => setDraft((c) => ({ ...c, resourceVisibility: e.target.value }))}
        placeholder="public"
      />
    </div>
  </div>
</div>

<details className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/10 px-4 py-3">
  <summary className="cursor-pointer text-sm text-[var(--color-text-secondary)]">Review payload</summary>
  <pre className="mt-3 overflow-x-auto text-xs leading-6 text-[var(--color-periwinkle)]">
    {JSON.stringify(payload, null, 2)}
  </pre>
</details>
```

- [ ] **Step 5: Add guarded navigation (Next disabled if invalid)**

```tsx
const validation = validateWizardDraft(draft, step);
const canGoNext = validation.ok && step < 3;
```

- [ ] **Step 6: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/policies/wizard/page.tsx
git commit -m "feat: implement policy wizard steps and templates"
```

---

### Task 4: Wire submission + success/error handling

**Files:**
- Modify: `src/app/admin/policies/wizard/page.tsx`

- [ ] **Step 1: Implement submit handler**

```tsx
async function handleSubmit() {
  if (!token) return;
  const validation = validateWizardDraft(draft, 3);
  if (!validation.ok) {
    setError(validation.message);
    return;
  }

  setSubmitting(true);
  setError(null);
  setSuccess(null);

  const result = await adminRequest<unknown>("/api/v1/admin/policies", token, {
    method: "POST",
    body: JSON.stringify(buildPolicyCreatePayload(draft)),
  });

  setSubmitting(false);

  if (!result.ok) {
    const message = getErrorMessage(result.data, result.status);
    setError(message);
    return;
  }

  setSuccess("Policy created successfully.");
}
```

- [ ] **Step 2: Add success callout and Back to Policies action**

```tsx
{success ? (
  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
    {success}
  </div>
) : null}

<Button type="button" disabled={submitting} onClick={() => router.push("/admin/policies")}>
  Back to Policies
</Button>
```

- [ ] **Step 3: Add dedicated handling for common backend errors (optional mapping)**

```tsx
if (!result.ok) {
  const raw = getErrorMessage(result.data, result.status);
  if (raw.includes("policy_already_exists")) setError("策略名称已存在，请更换名称后重试。");
  else if (raw.includes("invalid_role_names")) setError("包含无效角色名，请刷新角色列表后重试。");
  else setError(raw);
  return;
}
```

- [ ] **Step 4: Run lint and build**

Run:

```bash
npm run lint
npm run build
```

Expected: PASS with `/admin/policies/wizard` in route list.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/policies/wizard/page.tsx
git commit -m "feat: submit and success handling for policy wizard"
```

---

### Task 5: Add CTA entry from `/admin/policies`

**Files:**
- Modify: `src/app/admin/policies/page.tsx`

- [ ] **Step 1: Add CTA button linking to the wizard**

```tsx
<Link
  href="/admin/policies/wizard"
  className="inline-flex items-center justify-center rounded-full border border-[rgb(123_63_242_/45%)] bg-[rgb(123_63_242_/18%)] px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[rgb(123_63_242_/24%)]"
>
  Create with Wizard
</Link>
```

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/policies/page.tsx
git commit -m "feat: add create-with-wizard entry to policies page"
```

---

### Task 6: Final verification

**Files:**
- Modify: none

- [ ] **Step 1: Run tests**

Run:

```bash
npm run test -- src/lib/admin-policy-wizard.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint and production build**

Run:

```bash
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 3: Manual flow check**

Run:

```bash
npm run dev
```

Then verify:

```text
1. Login and open /admin/policies.
2. Click "Create with Wizard" to open /admin/policies/wizard.
3. Choose a template, set name/effect if needed.
4. Add/remove permissions via comma input and quick chips.
5. Add roles via suggestions and/or manual comma text.
6. Submit and confirm success.
7. Go back to /admin/policies and confirm the new policy appears.
8. Re-submit with same name to trigger 409, confirm user-friendly error.
```

- [ ] **Step 4: Delivery note**

```text
Record:
- changed files
- lint/build outputs
- manual verification notes
- deferred scope for Phase 2 (edit existing policies)
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: verify policy wizard delivery"
```
