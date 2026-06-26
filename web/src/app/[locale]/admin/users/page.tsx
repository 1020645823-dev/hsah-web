"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { createUser, updateUser, deleteUser, adminPaginatedRequest, extractPaginatedPayload, extractArrayPayload } from "@/lib/admin";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { UserFormModal } from "@/components/admin/user-form-modal";
import { Pagination } from "@/components/admin/pagination";
import { Skeleton } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { User } from "lucide-react";
import { BatchActionBar } from "@/components/admin/batch-action-bar";

type UserRow = {
  id: string;
  email: string;
  is_active: boolean;
  two_factor_enabled: boolean;
};

export default function AdminUsersPage() {
  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("hsah_token");
  });
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [formError, setFormError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await adminPaginatedRequest<UserRow>(
        "/api/v1/admin/users",
        token,
        { limit: pageSize, offset },
      );
      if (!result.ok) {
        setMessage({ type: "error", text: result.message });
        setRows([]);
        setTotal(0);
        return;
      }
      const paginated = extractPaginatedPayload<UserRow>(result.data);
      if (paginated) {
        setRows(paginated.items);
        setTotal(paginated.total);
      } else {
        const fallback = extractArrayPayload(result.data, ["users"]) as UserRow[];
        setRows(fallback);
        setTotal(fallback.length);
      }
    } catch {
      setMessage({ type: "error", text: "获取用户列表失败，请检查网络连接。" });
    } finally {
      setLoading(false);
    }
  }, [token, pageSize, offset]);

  const didInitRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (didInitRef.current) return;
    didInitRef.current = true;
    fetchUsers();
  }, [token, fetchUsers]);

  useEffect(() => {
    if (!didInitRef.current) return;
    fetchUsers();
  }, [page, pageSize, fetchUsers]);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function openCreate() {
    setFormMode("create");
    setEditingUser(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(user: UserRow) {
    setFormMode("edit");
    setEditingUser(user);
    setFormError("");
    setFormOpen(true);
  }

  async function handleFormSubmit(data: { email: string; password: string; is_active: boolean; is_2fa_enabled: boolean }) {
    if (!token) return;
    setFormError("");

    if (formMode === "create") {
      const res = await createUser(token, {
        email: data.email.trim(),
        password: data.password,
        is_active: data.is_active,
        is_2fa_enabled: data.is_2fa_enabled,
      });
      if (!res.ok) {
        setFormError(res.message);
        return;
      }
      showMessage("success", "用户创建成功");
      setFormOpen(false);
      fetchUsers();
    } else if (editingUser) {
      const res = await updateUser(token, editingUser.id, {
        email: data.email.trim(),
        is_active: data.is_active,
        is_2fa_enabled: data.is_2fa_enabled,
      });
      if (!res.ok) {
        setFormError(res.message);
        return;
      }
      showMessage("success", "用户更新成功");
      setFormOpen(false);
      setEditingUser(null);
      fetchUsers();
    }
  }

  function openDelete(user: UserRow) {
    setDeletingUser(user);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!token || !deletingUser) return;
    const res = await deleteUser(token, deletingUser.id);
    if (!res.ok) {
      showMessage("error", res.message);
    } else {
      showMessage("success", "用户已删除");
      fetchUsers();
    }
    setConfirmOpen(false);
    setDeletingUser(null);
  }

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
      return new Set(rows.map((r) => r.id));
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleBatchDelete() {
    if (!token || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const results = await Promise.all(ids.map((id) => deleteUser(token, id)));
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      showMessage("error", `批量删除失败：${failed.length} 个用户删除出错`);
    } else {
      showMessage("success", `已删除 ${ids.length} 个用户`);
    }
    setSelectedIds(new Set());
    setBatchConfirmOpen(false);
    fetchUsers();
  }

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < rows.length;

  const userRows = useMemo(() => {
    return rows.map((u) => {
      const isSelected = selectedIds.has(u.id);
      return (
        <div
          key={u.id}
          className="grid grid-cols-[40px_1fr_140px_120px_120px] items-center gap-4 px-5 py-4 text-sm text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-white/[2%]"
        >
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(u.id)}
              className="h-4 w-4 cursor-pointer accent-[var(--color-electric-purple)]"
            />
          </div>
          <div className="truncate">{u.email}</div>
          <div className="text-[var(--color-text-secondary)]">
            {u.two_factor_enabled ? "Enabled" : "Disabled"}
          </div>
          <div className="text-[var(--color-text-secondary)]">
            {u.is_active ? "Active" : "Disabled"}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => openEdit(u)}
              className="rounded-md border border-[rgb(212_218_245_/12%)] px-3 py-1 text-xs text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50"
            >
              编辑
            </button>
            <button
              onClick={() => openDelete(u)}
              className="rounded-md border border-red-500/20 px-3 py-1 text-xs text-red-400 transition-colors duration-150 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-400/50"
            >
              删除
            </button>
          </div>
        </div>
      );
    });
  }, [rows, selectedIds]);

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              ADMIN / USERS
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">Users</div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={openCreate}
              className="rounded-lg bg-[var(--color-electric-purple)] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50"
            >
              创建用户
            </button>
            <Link
              href="/admin"
              className="text-sm text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-[var(--color-text-primary)]"
            >
              ← Back
            </Link>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-500"
                : "border-red-500/30 bg-red-500/10 text-red-500"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[600px] overflow-hidden rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
            <div className="grid grid-cols-[40px_1fr_140px_120px_120px] gap-4 border-b border-[rgb(212_218_245_/12%)] px-5 py-3 text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 cursor-pointer accent-[var(--color-electric-purple)]"
                />
              </div>
              <div>Email</div>
              <div>2FA</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y divide-[rgb(212_218_245_/10%)]">
              {loading ? (
                <Skeleton variant="table-row" count={4} className="px-5 py-8" />
              ) : (
                userRows
              )}
              {!loading && rows.length === 0 ? (
                <EmptyState
                  icon={User}
                  title="暂无用户"
                  description="点击上方「创建用户」按钮添加第一个用户。"
                  action={{ label: "创建用户", onClick: openCreate }}
                />
              ) : null}
            </div>
            <div className="border-t border-[rgb(212_218_245_/10%)]">
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
      </div>

      <UserFormModal
        isOpen={formOpen}
        mode={formMode}
        initialData={
          editingUser
            ? {
                email: editingUser.email,
                is_active: editingUser.is_active,
                is_2fa_enabled: editingUser.two_factor_enabled,
              }
            : undefined
        }
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setFormOpen(false);
          setEditingUser(null);
          setFormError("");
        }}
        submitError={formError}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        title="确认删除"
        message={deletingUser ? `确定要删除用户 "${deletingUser.email}" 吗？此操作不可撤销。` : "确定要删除此用户吗？"}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeletingUser(null);
        }}
      />

      <ConfirmDialog
        isOpen={batchConfirmOpen}
        title="确认批量删除"
        message={`确定要删除选中的 ${selectedIds.size} 个用户吗？此操作不可撤销。`}
        onConfirm={handleBatchDelete}
        onCancel={() => {
          setBatchConfirmOpen(false);
        }}
      />

      <BatchActionBar
        selectedCount={selectedIds.size}
        onDelete={() => setBatchConfirmOpen(true)}
        onClear={clearSelection}
      />
    </div>
  );
}
