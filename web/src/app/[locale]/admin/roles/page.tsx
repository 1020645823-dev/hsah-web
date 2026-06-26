"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  adminRequest,
  adminPaginatedRequest,
  deleteRole,
  extractArrayPayload,
  extractPaginatedPayload,
  formatDateLabel,
  formatJson,
  getErrorMessage,
  getStoredAdminToken,
  pickNumber,
  pickString,
  pickStringArray,
  updateRole,
  type AdminRecord,
} from "@/lib/admin";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Pagination } from "@/components/admin/pagination";
import { BatchActionBar } from "@/components/admin/batch-action-bar";
import { Skeleton } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Shield } from "lucide-react";

function summarizeRole(role: AdminRecord, index: number) {
  const name = pickString(role, ["name", "role_name", "slug", "id"]) ?? `Role ${index + 1}`;
  const description =
    pickString(role, ["description", "summary", "display_name"]) ?? "接口未提供角色描述。";
  const permissions = pickStringArray(role, [
    "permissions",
    "permission_names",
    "scopes",
    "actions",
  ]);
  const policies = pickStringArray(role, ["policies", "policy_names", "attached_policies"]);
  const updatedAt = formatDateLabel(role.updated_at ?? role.modified_at ?? role.created_at);
  const permissionCount =
    pickNumber(role, ["permission_count", "permissions_count", "scope_count"]) ??
    permissions.length;

  return { name, description, permissions, policies, updatedAt, permissionCount };
}

export default function AdminRolesPage() {
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [rows, setRows] = useState<AdminRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [users, setUsers] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    userIdsText: "",
  });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const loadRoles = useCallback(async (currentToken: string) => {
    const result = await adminPaginatedRequest<AdminRecord>("/api/v1/admin/roles", currentToken, {
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
      const fallback = extractArrayPayload(result.data, ["roles"]);
      setRows(fallback);
      setTotal(fallback.length);
    }
    setError(null);
  }, [pageSize, offset]);

  const loadUsers = useCallback(async (currentToken: string) => {
    const result = await adminRequest<unknown>("/api/v1/admin/users", currentToken, { method: "GET" });
    if (!result.ok) {
      setUsers([]);
      return;
    }

    setUsers(extractArrayPayload(result.data, ["users"]));
  }, []);

  const didInitRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (didInitRef.current) return;
    didInitRef.current = true;
    const currentToken = token;
    let canceled = false;
    async function hydrate() {
      await Promise.all([loadRoles(currentToken), loadUsers(currentToken)]);
      if (!canceled) setLoading(false);
    }
    void hydrate();
    return () => { canceled = true; };
  }, [token, loadRoles, loadUsers]);

  useEffect(() => {
    if (!token) return;
    if (!didInitRef.current) return;
    loadRoles(token);
  }, [page, pageSize, token, loadRoles]);

  function enterEditMode(role: AdminRecord) {
    const roleId = pickString(role, ["id", "slug", "name"]) ?? "";
    const name = pickString(role, ["name", "role_name"]) ?? "";
    const description = pickString(role, ["description", "summary"]) ?? "";
    const userIds = pickStringArray(role, ["user_ids", "users", "assigned_users"]);
    setForm({
      name,
      description,
      userIdsText: userIds.join(", "),
    });
    setEditingRoleId(roleId);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function exitEditMode() {
    setEditingRoleId(null);
    setForm({ name: "", description: "", userIdsText: "" });
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  async function handleCreateRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const userIds = form.userIdsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const result = await adminRequest<unknown>("/api/v1/admin/roles", token, {
      method: "POST",
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim() || null,
        user_ids: userIds,
      }),
    });

    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(getErrorMessage(result.data, result.status));
      return;
    }

    setForm({ name: "", description: "", userIdsText: "" });
    setSubmitSuccess("Role created successfully.");
    await loadRoles(token);
  }

  async function handleUpdateRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !editingRoleId) return;

    const userIds = form.userIdsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const result = await updateRole(token, editingRoleId, {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      user_ids: userIds.length > 0 ? userIds : undefined,
    });

    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(getErrorMessage(result.data, result.status));
      return;
    }

    setForm({ name: "", description: "", userIdsText: "" });
    setEditingRoleId(null);
    setSubmitSuccess("Role updated successfully.");
    await loadRoles(token);
  }

  const handleDeleteRole = useCallback(async (roleId: string) => {
    if (!token) return;

    setDeletingRoleId(roleId);
    setSubmitError(null);
    setSubmitSuccess(null);

    const result = await deleteRole(token, roleId);

    setDeletingRoleId(null);

    if (!result.ok) {
      setSubmitError(getErrorMessage(result.data, result.status));
      return;
    }

    setSubmitSuccess("Role deleted successfully.");
    await loadRoles(token);
  }, [token, loadRoles]);

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
        rows.map((role, index) => pickString(role, ["id", "slug", "name"]) ?? `role-${index}`)
      );
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleBatchDelete() {
    if (!token || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const results = await Promise.all(ids.map((id) => deleteRole(token, id)));
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      setSubmitError(`批量删除失败：${failed.length} 个角色删除出错`);
    } else {
      setSubmitSuccess(`已删除 ${ids.length} 个角色`);
    }
    setSelectedIds(new Set());
    setBatchConfirmOpen(false);
    await loadRoles(token);
  }

  const isEditing = editingRoleId !== null;

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < rows.length;

  const roleCards = useMemo(() => {
    return rows.map((role, index) => {
      const summary = summarizeRole(role, index);
      const roleId = pickString(role, ["id", "name", "slug"]) ?? `role-${index}`;
      const isDeleting = deletingRoleId === roleId;
      const isSelected = selectedIds.has(roleId);
      return (
        <Card
          key={roleId}
          className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px] transition-all duration-200 hover:border-[rgb(123_63_242_/30%)]"
        >
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(roleId)}
                    className="h-4 w-4 cursor-pointer accent-[var(--color-electric-purple)]"
                  />
                  <CardTitle className="text-[var(--color-text-primary)]">
                    {summary.name}
                  </CardTitle>
                </div>
                <div className="max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
                  {summary.description}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full border border-[rgb(212_218_245_/12%)] px-3 py-1 text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  {summary.permissionCount} permissions
                </div>
                <button
                  type="button"
                  onClick={() => enterEditMode(role)}
                  className="rounded-full border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-3 py-1 text-xs text-[var(--color-periwinkle)] transition-colors duration-150 hover:border-[rgb(123_63_242_/40%)] focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this role?")) {
                      void handleDeleteRole(roleId);
                    }
                  }}
                  disabled={isDeleting}
                  className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-300 transition-colors duration-150 hover:border-red-500/40 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  BOUND POLICIES
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.policies.length > 0 ? (
                    summary.policies.map((policy) => (
                      <span
                        key={policy}
                        className="rounded-full bg-[rgb(123_63_242_/12%)] px-3 py-1 text-xs text-[var(--color-periwinkle)]"
                      >
                        {policy}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      No policy metadata
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

            <div className="space-y-2">
              <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                PERMISSIONS
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.permissions.length > 0 ? (
                  summary.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded-full bg-[rgb(212_218_245_/10%)] px-3 py-1 text-xs text-[var(--color-text-primary)]"
                    >
                      {permission}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    No permission list returned
                  </span>
                )}
              </div>
            </div>

            <details className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/15 px-4 py-3">
              <summary className="cursor-pointer text-sm text-[var(--color-text-secondary)]">
                查看原始角色返回
              </summary>
              <pre className="mt-3 overflow-x-auto text-xs leading-6 text-[var(--color-periwinkle)]">
                {formatJson(role)}
              </pre>
            </details>
          </CardContent>
        </Card>
      );
    });
  }, [rows, deletingRoleId, selectedIds, handleDeleteRole]);

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              ADMIN / ROLES
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">Roles</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              展示角色定义、权限集合与策略绑定，字段优先对齐接口已知键并保留原始返回调试视图。
            </div>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-[var(--color-text-primary)]"
          >
            ← Back
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px] transition-all duration-200 hover:border-[rgb(123_63_242_/30%)]">
            <CardHeader>
              <CardTitle className="text-[var(--color-text-primary)]">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  ROLE COUNT
                </div>
                <div className="mt-2 text-4xl font-semibold text-[var(--color-text-primary)]">
                  {loading ? "…" : total}
                </div>
              </div>
              <div className="text-sm leading-6 text-[var(--color-text-secondary)]">
                当接口未返回固定 schema 时，页面仍会展示原始 JSON 以便排查字段映射。
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px] transition-all duration-200 hover:border-[rgb(123_63_242_/30%)]">
              <CardHeader>
                <CardTitle className="text-[var(--color-text-primary)]">
                  {isEditing ? "Edit Role" : "Create Role"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <form className="space-y-5" onSubmit={isEditing ? handleUpdateRole : handleCreateRole}>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="role-name" className="text-[var(--color-text-primary)]">
                        Role Name
                      </Label>
                      <Input
                        id="role-name"
                        value={form.name}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder="role-operations-manager"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role-user-ids" className="text-[var(--color-text-primary)]">
                        User IDs
                      </Label>
                      <Input
                        id="role-user-ids"
                        value={form.userIdsText}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, userIdsText: event.target.value }))
                        }
                        placeholder="uuid-1, uuid-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-description" className="text-[var(--color-text-primary)]">
                      Description
                    </Label>
                    <Textarea
                      id="role-description"
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                      className="min-h-24"
                      placeholder="Describe the ownership boundary and permission intent for this role."
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                      AVAILABLE USERS
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {users.length > 0 ? (
                        users.map((user, index) => {
                          const userId = pickString(user, ["id"]) ?? `user-${index}`;
                          const email = pickString(user, ["email"]) ?? userId;
                          return (
                            <button
                              key={userId}
                              type="button"
                              onClick={() =>
                                setForm((current) => {
                                  const currentIds = current.userIdsText
                                    .split(",")
                                    .map((item) => item.trim())
                                    .filter(Boolean);
                                  if (currentIds.includes(userId)) return current;
                                  return {
                                    ...current,
                                    userIdsText: [...currentIds, userId].join(", "),
                                  };
                                })
                              }
                              className="rounded-full border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-3 py-1 text-xs text-[var(--color-periwinkle)] transition-colors duration-150 hover:border-[rgb(123_63_242_/40%)] focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50"
                            >
                              {email}
                            </button>
                          );
                        })
                      ) : (
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          No users loaded.
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
                          ? "Update Role"
                          : "Create Role"}
                    </Button>
                    {isEditing ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={exitEditMode}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

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

            {loading ? (
              <Skeleton variant="card" count={3} />
            ) : (
              roleCards
            )}

            {!loading && rows.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No roles found"
                description="No roles available."
              />
            ) : null}

            <Pagination
              total={total}
              pageSize={pageSize}
              currentPage={page}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={batchConfirmOpen}
        title="确认批量删除"
        message={`确定要删除选中的 ${selectedIds.size} 个角色吗？此操作不可撤销。`}
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
