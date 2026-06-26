"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminRequest,
  adminPaginatedRequest,
  deletePolicy,
  extractArrayPayload,
  extractPaginatedPayload,
  formatDateLabel,
  formatJson,
  getErrorMessage,
  getStoredAdminToken,
  pickBoolean,
  pickString,
  pickStringArray,
  updatePolicy,
  type AdminRecord,
} from "@/lib/admin";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Pagination } from "@/components/admin/pagination";
import { BatchActionBar } from "@/components/admin/batch-action-bar";
import { Skeleton } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { FileText } from "lucide-react";

function summarizePolicy(policy: AdminRecord, index: number) {
  const name = pickString(policy, ["name", "policy_name", "slug", "id"]) ?? `Policy ${index + 1}`;
  const description =
    pickString(policy, ["description", "summary", "reason"]) ??
    "Role-scoped policy rule for admin authorization.";
  const effect =
    pickString(policy, ["effect", "decision", "result", "status"]) ??
    (pickBoolean(policy, ["allow", "allowed"]) === true ? "allow" : "unspecified");
  const subjects = pickStringArray(policy, ["role_names", "subjects", "principals", "roles", "identities"]);
  const actions = pickStringArray(policy, ["actions", "permissions", "operations"]);
  const resources = [
    pickString(policy, ["resource_type"]),
    pickString(policy, ["resource_visibility"]),
    ...pickStringArray(policy, ["resources", "targets", "assets"]),
  ].filter((value): value is string => Boolean(value));
  const conditions = pickStringArray(policy, ["conditions", "constraints", "rules"]);
  const updatedAt = formatDateLabel(policy.updated_at ?? policy.modified_at ?? policy.created_at);

  return { name, description, effect, subjects, actions, resources, conditions, updatedAt };
}

function TonePill({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const className = lower.includes("deny")
    ? "bg-red-500/12 text-red-200"
    : lower.includes("allow")
      ? "bg-emerald-500/12 text-emerald-200"
      : "bg-[rgb(212_218_245_/10%)] text-[var(--color-text-primary)]";

  return <span className={`rounded-full px-3 py-1 text-xs ${className}`}>{label}</span>;
}

export default function AdminPoliciesPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [rows, setRows] = useState<AdminRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleRows, setRoleRows] = useState<AdminRecord[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    effect: "allow" as "allow" | "deny",
    permissionsText: "assets.read",
    roleNamesText: "",
    resourceType: "asset",
    resourceVisibility: "public",
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const loadPolicies = useCallback(async (currentToken: string) => {
    const result = await adminPaginatedRequest<AdminRecord>("/api/v1/admin/policies", currentToken, {
      limit: pageSize,
      offset,
    });
    if (!result.ok) {
      setRows([]);
      setTotal(0);
      setError(result.message);
      return;
    }

    const paginated = extractPaginatedPayload<AdminRecord>(result.data);
    if (paginated) {
      setRows(paginated.items);
      setTotal(paginated.total);
    } else {
      const fallback = extractArrayPayload(result.data, ["policies"]);
      setRows(fallback);
      setTotal(fallback.length);
    }
    setError(null);
  }, [pageSize, offset]);

  const loadRoles = useCallback(async (currentToken: string) => {
    const result = await adminRequest<unknown>("/api/v1/admin/roles", currentToken, { method: "GET" });
    if (!result.ok) {
      setRoleRows([]);
      return;
    }
    setRoleRows(extractArrayPayload(result.data, ["roles"]));
  }, []);

  const didInitRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (didInitRef.current) return;
    didInitRef.current = true;
    const currentToken = token;
    let canceled = false;
    async function hydrate() {
      await Promise.all([loadPolicies(currentToken), loadRoles(currentToken)]);
      if (!canceled) setLoading(false);
    }
    void hydrate();
    return () => { canceled = true; };
  }, [token, loadPolicies, loadRoles]);

  useEffect(() => {
    if (!token) return;
    if (!didInitRef.current) return;
    loadPolicies(token);
  }, [page, pageSize, token, loadPolicies]);

  function resetForm() {
    setForm({
      name: "",
      effect: "allow",
      permissionsText: "assets.read",
      roleNamesText: "",
      resourceType: "asset",
      resourceVisibility: "public",
    });
    setEditingPolicyId(null);
  }

  function startEdit(policy: AdminRecord) {
    const id = pickString(policy, ["id", "slug", "name"]) ?? "";
    const name = pickString(policy, ["name", "policy_name", "slug"]) ?? "";
    const effect = pickString(policy, ["effect", "decision", "result"]) === "deny" ? "deny" : "allow";
    const permissions = pickStringArray(policy, ["permissions", "actions", "operations"]);
    const roleNames = pickStringArray(policy, ["role_names", "roles", "subjects", "principals"]);
    const resourceType = pickString(policy, ["resource_type"]) ?? "";
    const resourceVisibility = pickString(policy, ["resource_visibility"]) ?? "";

    setForm({
      name,
      effect: effect as "allow" | "deny",
      permissionsText: permissions.join(", "),
      roleNamesText: roleNames.join(", "),
      resourceType,
      resourceVisibility,
    });
    setEditingPolicyId(id);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  async function handleCreatePolicy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const permissions = form.permissionsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const roleNames = form.roleNamesText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const result = await adminRequest<unknown>("/api/v1/admin/policies", token, {
      method: "POST",
      body: JSON.stringify({
        name: form.name.trim(),
        effect: form.effect,
        permissions,
        role_names: roleNames,
        resource_type: form.resourceType.trim() || null,
        resource_visibility: form.resourceVisibility.trim() || null,
      }),
    });

    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(getErrorMessage(result.data, result.status));
      return;
    }

    resetForm();
    setSubmitSuccess("Policy created successfully.");
    await loadPolicies(token);
  }

  async function handleUpdatePolicy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !editingPolicyId) return;

    const permissions = form.permissionsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const roleNames = form.roleNamesText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const result = await updatePolicy(token, editingPolicyId, {
      name: form.name.trim(),
      effect: form.effect,
      permissions,
      role_names: roleNames,
      resource_type: form.resourceType.trim() || null,
      resource_visibility: form.resourceVisibility.trim() || null,
    });

    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(getErrorMessage(result.data, result.status));
      return;
    }

    resetForm();
    setSubmitSuccess("Policy updated successfully.");
    await loadPolicies(token);
  }

  const handleDeletePolicy = useCallback(async (policyId: string) => {
    if (!token) return;
    setDeletingPolicyId(policyId);
    setSubmitError(null);
    setSubmitSuccess(null);

    const result = await deletePolicy(token, policyId);
    setDeletingPolicyId(null);

    if (!result.ok) {
      setSubmitError(getErrorMessage(result.data, result.status));
      return;
    }

    setSubmitSuccess("Policy deleted successfully.");
    await loadPolicies(token);
  }, [token, loadPolicies]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (prev.size === rows.length && rows.length > 0) {
        return new Set();
      }
      return new Set(
        rows.map((policy, index) => pickString(policy, ["id", "name", "slug"]) ?? `policy-${index}`)
      );
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleBatchDelete() {
    if (!token || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const results = await Promise.all(ids.map((id) => deletePolicy(token, id)));
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      setSubmitError(`批量删除失败：${failed.length} 个策略删除出错`);
    } else {
      setSubmitSuccess(`已删除 ${ids.length} 个策略`);
    }
    setSelectedIds(new Set());
    setBatchConfirmOpen(false);
    await loadPolicies(token);
  }

  const isEditing = editingPolicyId !== null;

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < rows.length;

  const policyCards = useMemo(() => {
    return rows.map((policy, index) => {
      const summary = summarizePolicy(policy, index);
      const policyId = pickString(policy, ["id", "name", "slug"]) ?? `policy-${index}`;
      const isConfirmingDelete = deletingPolicyId === policyId;
      const isSelected = selectedIds.has(policyId);
      return (
        <Card
          key={policyId}
          className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px] transition-all duration-200 hover:border-[rgb(123_63_242_/30%)]"
        >
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(policyId)}
                    className="h-4 w-4 cursor-pointer accent-[var(--color-electric-purple)]"
                  />
                  <CardTitle className="text-[var(--color-text-primary)]">
                    {summary.name}
                  </CardTitle>
                </div>
                <div className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  {summary.description}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TonePill label={summary.effect} />
                <button
                  type="button"
                  onClick={() => startEdit(policy)}
                  className="rounded-md border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-2 py-1 text-xs text-[var(--color-periwinkle)] transition-colors duration-150 hover:border-[rgb(123_63_242_/40%)] focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    isConfirmingDelete
                      ? handleDeletePolicy(policyId)
                      : setDeletingPolicyId(policyId)
                  }
                  disabled={submitting && isConfirmingDelete}
                  className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-200 transition-colors duration-150 hover:border-red-500/40 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                >
                  {isConfirmingDelete ? "Confirm" : "Delete"}
                </button>
                {isConfirmingDelete ? (
                  <button
                    type="button"
                    onClick={() => setDeletingPolicyId(null)}
                    className="rounded-md border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-2 py-1 text-xs text-[var(--color-text-secondary)] transition-colors duration-150 hover:border-[rgb(123_63_242_/40%)] focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  SUBJECTS
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.subjects.length > 0 ? (
                    summary.subjects.map((item) => <TonePill key={item} label={item} />)
                  ) : (
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      No subject scope
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  UPDATED
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  {summary.updatedAt}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  ACTIONS
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.actions.length > 0 ? (
                    summary.actions.map((item) => <TonePill key={item} label={item} />)
                  ) : (
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      No actions
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  RESOURCES
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.resources.length > 0 ? (
                    summary.resources.map((item) => <TonePill key={item} label={item} />)
                  ) : (
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      No resources
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  CONDITIONS
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.conditions.length > 0 ? (
                    summary.conditions.map((item) => <TonePill key={item} label={item} />)
                  ) : (
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      No conditions
                    </span>
                  )}
                </div>
              </div>
            </div>

            <details className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/15 px-4 py-3">
              <summary className="cursor-pointer text-sm text-[var(--color-text-secondary)]">
                查看原始策略返回
              </summary>
              <pre className="mt-3 overflow-x-auto text-xs leading-6 text-[var(--color-periwinkle)]">
                {formatJson(policy)}
              </pre>
            </details>
          </CardContent>
        </Card>
      );
    });
  }, [rows, deletingPolicyId, submitting, selectedIds, handleDeletePolicy]);

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              ADMIN / POLICIES
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">Policies</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              展示策略作用域、主体范围、资源约束与条件摘要，并保留原始响应以便继续细化字段映射。
            </div>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-[var(--color-text-primary)]"
          >
            ← Back
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px] transition-all duration-200 hover:border-[rgb(123_63_242_/30%)]">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-[var(--color-text-primary)]">
              {isEditing ? "Edit Policy" : "Create Policy"}
            </CardTitle>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/policies/wizard")}
            >
              Create with Wizard
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-5" onSubmit={isEditing ? handleUpdatePolicy : handleCreatePolicy}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="policy-name" className="text-[var(--color-text-primary)]">
                    Policy Name
                  </Label>
                  <Input
                    id="policy-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
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
                        onClick={() => setForm((current) => ({ ...current, effect }))}
                        className={
                          form.effect === effect
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

              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="policy-permissions" className="text-[var(--color-text-primary)]">
                    Permissions
                  </Label>
                  <Input
                    id="policy-permissions"
                    value={form.permissionsText}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, permissionsText: event.target.value }))
                    }
                    placeholder="assets.read, admin.read"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policy-resource-type" className="text-[var(--color-text-primary)]">
                    Resource Type
                  </Label>
                  <Input
                    id="policy-resource-type"
                    value={form.resourceType}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, resourceType: event.target.value }))
                    }
                    placeholder="asset"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="policy-resource-visibility"
                    className="text-[var(--color-text-primary)]"
                  >
                    Resource Visibility
                  </Label>
                  <Input
                    id="policy-resource-visibility"
                    value={form.resourceVisibility}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, resourceVisibility: event.target.value }))
                    }
                    placeholder="public"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="policy-role-names" className="text-[var(--color-text-primary)]">
                  Role Names
                </Label>
                <Input
                  id="policy-role-names"
                  value={form.roleNamesText}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, roleNamesText: event.target.value }))
                  }
                  placeholder="role-a, role-b"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {roleRows.length > 0 ? (
                    roleRows.map((role, index) => {
                      const roleName = pickString(role, ["name"]) ?? `role-${index}`;
                      return (
                        <button
                          key={roleName}
                          type="button"
                          onClick={() =>
                            setForm((current) => {
                              const currentNames = current.roleNamesText
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean);
                              if (currentNames.includes(roleName)) return current;
                              return {
                                ...current,
                                roleNamesText: [...currentNames, roleName].join(", "),
                              };
                            })
                          }
                          className="rounded-full border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-3 py-1 text-xs text-[var(--color-periwinkle)] transition-colors duration-150 hover:border-[rgb(123_63_242_/40%)] focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50"
                        >
                          {roleName}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      No role suggestions loaded.
                    </span>
                  )}
                </div>
              </div>

              {submitError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {submitError}
                </div>
              ) : null}

              {submitSuccess ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {submitSuccess}
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={submitting || !form.name.trim()}>
                  {submitting
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                      ? "Update Policy"
                      : "Create Policy"}
                </Button>
                {isEditing ? (
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleSelectAll}
            className="h-4 w-4 cursor-pointer accent-[var(--color-electric-purple)]"
          />
          <span className="text-xs text-[var(--color-text-tertiary)]">
            全选（{selectedIds.size}/{rows.length}）
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {loading ? (
            <Skeleton variant="card" count={3} />
          ) : (
            policyCards
          )}
        </div>

        <Pagination
          total={total}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />

        {!loading && rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No policies found"
            description="No policies available."
          />
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={batchConfirmOpen}
        title="确认批量删除"
        message={`确定要删除选中的 ${selectedIds.size} 个策略吗？此操作不可撤销。`}
        onConfirm={handleBatchDelete}
        onCancel={() => setBatchConfirmOpen(false)}
      />

      <BatchActionBar
        selectedCount={selectedIds.size}
        onDelete={() => setBatchConfirmOpen(true)}
        onClear={clearSelection}
      />
    </div>
  );
}
