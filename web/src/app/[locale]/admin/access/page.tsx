"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { Tabs, TabsList, TabsTrigger, TabsPanel } from "@/components/ui/tabs";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  adminRequest,
  createRole,
  createPolicy,
  createUser,
  updateRole,
  updatePolicy,
  updateUser,
  deleteRole,
  deletePolicy,
  deleteUser,
  getStoredAdminToken,
} from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

import type { User } from "@/types/user";
import type { Role } from "@/types/role";
import type { Policy } from "@/types/policy";

// Built-in roles are seeded and must not be deleted (mirrors backend guard).
const BUILTIN_ROLES = new Set(["super_admin", "editor", "reviewer", "viewer"]);

export default function AdminAccessPage() {
  const t = useTranslations("Admin");
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [loading, setLoading] = useState(() => Boolean(token));
  const [refreshKey, setRefreshKey] = useState(0);

  function loadAll() {
    if (!token) return;
    Promise.all([
      adminRequest<{ items: User[] }>("/api/v1/admin/users?limit=100", token, { method: "GET" }),
      adminRequest<{ items: Role[] }>("/api/v1/admin/roles?limit=100", token, { method: "GET" }),
      adminRequest<{ items: Policy[] }>("/api/v1/admin/policies?limit=100", token, { method: "GET" }),
    ])
      .then(([usersRes, rolesRes, policiesRes]) => {
        const failed = [usersRes, rolesRes, policiesRes].find((r) => !r.ok);
        if (failed) {
          setError(parseApiError(failed.data, failed.status));
          setUsers([]);
          setRoles([]);
          setPolicies([]);
        } else {
          setError(null);
          setUsers(usersRes.ok ? (usersRes.data.items ?? []) : []);
          setRoles(rolesRes.ok ? (rolesRes.data.items ?? []) : []);
          setPolicies(policiesRes.ok ? (policiesRes.data.items ?? []) : []);
        }
      })
      .catch(() => setError(parseApiError(null, undefined)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  // ---- create/edit/delete state ----
  const [userEditor, setUserEditor] = useState<{ open: boolean; mode: "create" | "edit"; user?: User }>({ open: false, mode: "create" });
  const [roleEditor, setRoleEditor] = useState<{ open: boolean; mode: "create" | "edit"; role?: Role }>({ open: false, mode: "create" });
  const [policyEditor, setPolicyEditor] = useState<{ open: boolean; mode: "create" | "edit"; policy?: Policy }>({ open: false, mode: "create" });
  const [confirm, setConfirm] = useState<{ open: boolean; kind: "user" | "role" | "policy"; id: string; name: string }>({ open: false, kind: "user", id: "", name: "" });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate(kind: "user" | "role" | "policy") {
    setFormError(null);
    if (kind === "user") setUserEditor({ open: true, mode: "create" });
    if (kind === "role") setRoleEditor({ open: true, mode: "create" });
    if (kind === "policy") setPolicyEditor({ open: true, mode: "create" });
  }

  async function doDelete() {
    if (!token) return;
    setBusy(true);
    const fn = confirm.kind === "user" ? deleteUser : confirm.kind === "role" ? deleteRole : deletePolicy;
    const res = await fn(token, confirm.id);
    setBusy(false);
    if (!res.ok) {
      setFormError((res as { message?: string }).message || t("access.deleteFailed"));
      setConfirm((c) => ({ ...c, open: false }));
      return;
    }
    setConfirm({ open: false, kind: "user", id: "", name: "" });
    refresh();
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={t("access.eyebrow")} title={t("access.title")} summary={t("access.summary")} />

      {error && (
        <ErrorAlert error={error} onRetry={error.retryable ? () => setError(null) : undefined} onDismiss={() => setError(null)} />
      )}
      {formError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{formError}</div>
      )}

      <Tabs defaultValue="matrix">
        <TabsList>
          <TabsTrigger value="matrix">{t("access.tabMatrix")}</TabsTrigger>
          <TabsTrigger value="users">{t("access.tabUsers")}</TabsTrigger>
          <TabsTrigger value="roles">{t("access.tabRoles")}</TabsTrigger>
          <TabsTrigger value="policies">{t("access.tabPolicies")}</TabsTrigger>
        </TabsList>

        {/* MATRIX */}
        <TabsPanel value="matrix">
          <MatrixTab roles={roles} policies={policies} loading={loading} t={t} />
        </TabsPanel>

        {/* USERS */}
        <TabsPanel value="users">
          <CrudSection
            icon={<UserIcon className="h-4 w-4" />}
            countLabel={t("access.users.total")}
            count={users.length}
            loading={loading}
            emptyLabel={t("access.users.empty")}
            onCreate={() => openCreate("user")}
            createLabel={t("access.createUser")}
            editLabel={t("access.edit")}
            deleteLabel={t("access.delete")}
            items={users.map((u) => ({
              id: u.id,
              title: u.email,
              subtitle: u.is_active ? t("users.active") : t("users.disabled"),
              tags: u.two_factor_enabled ? [t("users.twoFactor")] : [],
              canDelete: true,
              onEdit: () => { setFormError(null); setUserEditor({ open: true, mode: "edit", user: u }); },
              onDelete: () => setConfirm({ open: true, kind: "user", id: u.id, name: u.email }),
            }))}
          />
        </TabsPanel>

        {/* ROLES */}
        <TabsPanel value="roles">
          <CrudSection
            icon={<Shield className="h-4 w-4" />}
            countLabel={t("access.roles.total")}
            count={roles.length}
            loading={loading}
            emptyLabel={t("access.roles.empty")}
            onCreate={() => openCreate("role")}
            createLabel={t("access.createRole")}
            editLabel={t("access.edit")}
            deleteLabel={t("access.delete")}
            items={roles.map((r) => ({
              id: r.id,
              title: r.name,
              subtitle: r.description ?? undefined,
              tags: BUILTIN_ROLES.has(r.name) ? [t("access.builtin")] : [],
              canDelete: !BUILTIN_ROLES.has(r.name),
              onEdit: () => { setFormError(null); setRoleEditor({ open: true, mode: "edit", role: r }); },
              onDelete: () => setConfirm({ open: true, kind: "role", id: r.id, name: r.name }),
            }))}
          />
        </TabsPanel>

        {/* POLICIES */}
        <TabsPanel value="policies">
          <CrudSection
            icon={<ShieldCheck className="h-4 w-4" />}
            countLabel={t("access.policies.total")}
            count={policies.length}
            loading={loading}
            emptyLabel={t("access.policies.empty")}
            onCreate={() => openCreate("policy")}
            createLabel={t("access.createPolicy")}
            editLabel={t("access.edit")}
            deleteLabel={t("access.delete")}
            items={policies.map((p) => ({
              id: p.id,
              title: p.name,
              subtitle: `${p.effect} · ${p.role_names.length ? p.role_names.join(", ") : t("access.anyRole")}`,
              tags: p.permissions.slice(0, 5),
              canDelete: true,
              onEdit: () => { setFormError(null); setPolicyEditor({ open: true, mode: "edit", policy: p }); },
              onDelete: () => setConfirm({ open: true, kind: "policy", id: p.id, name: p.name }),
            }))}
          />
        </TabsPanel>
      </Tabs>

      {/* Editors */}
      {token && (
        <>
          <UserEditor
            key={userEditor.user?.id ?? "new"}
            open={userEditor.open}
            mode={userEditor.mode}
            user={userEditor.user}
            token={token}
            submitting={busy}
            onClose={() => setUserEditor((s) => ({ ...s, open: false }))}
            onSaved={() => { setUserEditor((s) => ({ ...s, open: false })); refresh(); }}
            onError={setFormError}
            t={t}
          />
          <RoleEditor
            key={roleEditor.role?.id ?? "new"}
            open={roleEditor.open}
            mode={roleEditor.mode}
            role={roleEditor.role}
            users={users}
            token={token}
            submitting={busy}
            onClose={() => setRoleEditor((s) => ({ ...s, open: false }))}
            onSaved={() => { setRoleEditor((s) => ({ ...s, open: false })); refresh(); }}
            onError={setFormError}
            t={t}
          />
          <PolicyEditor
            key={policyEditor.policy?.id ?? "new"}
            open={policyEditor.open}
            mode={policyEditor.mode}
            policy={policyEditor.policy}
            roles={roles}
            token={token}
            submitting={busy}
            onClose={() => setPolicyEditor((s) => ({ ...s, open: false }))}
            onSaved={() => { setPolicyEditor((s) => ({ ...s, open: false })); refresh(); }}
            onError={setFormError}
            t={t}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={confirm.open}
        title={t("access.confirmDelete")}
        message={t("access.confirmDeleteMessage", { name: confirm.name })}
        onConfirm={doDelete}
        onCancel={() => setConfirm({ open: false, kind: "user", id: "", name: "" })}
      />
    </div>
  );
}

type TFunc = ReturnType<typeof useTranslations>;

// ---------------------------------------------------------------------------
// Matrix tab
// ---------------------------------------------------------------------------

function MatrixTab({ roles, policies, loading, t }: { roles: Role[]; policies: Policy[]; loading: boolean; t: TFunc }) {
  // Derive permission columns from all allow-policies; build role×permission matrix.
  const { columns, matrix } = useMemo(() => {
    const allowPolicies = policies.filter((p) => p.effect === "allow");
    const permSet = new Set<string>();
    for (const p of allowPolicies) for (const perm of p.permissions) permSet.add(perm);
    const cols = Array.from(permSet).sort();
    const allowed = (roleName: string, perm: string) =>
      allowPolicies.some(
        (p) => (p.role_names.length === 0 || p.role_names.includes(roleName)) && p.permissions.includes(perm),
      );
    return { columns: cols, matrix: roles.map((r) => ({ role: r, cells: cols.map((c) => allowed(r.name, c)) })) };
  }, [roles, policies]);

  if (loading) return <MatrixSkeleton />;
  if (roles.length === 0) return <EmptyState label={t("access.noRoles")} />;

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("access.matrixDescription")}</p>
      <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/90">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/70">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("access.role")}</th>
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 text-left font-medium text-muted-foreground">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map(({ role, cells }) => (
              <tr key={role.id} className="border-b border-border/70 last:border-b-0">
                <td className="px-4 py-3 font-medium text-foreground">{role.name}</td>
                {cells.map((allowed, i) => (
                  <td key={columns[i]} className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium", allowed ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
                      {allowed ? t("access.allowed") : t("access.denied")}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CRUD list section
// ---------------------------------------------------------------------------

type CrudItem = {
  id: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function CrudSection({
  icon, countLabel, count, loading, emptyLabel, onCreate, createLabel, items, editLabel, deleteLabel,
}: {
  icon: React.ReactNode;
  countLabel: string;
  count: number;
  loading: boolean;
  emptyLabel: string;
  onCreate: () => void;
  createLabel: string;
  items: CrudItem[];
  editLabel: string;
  deleteLabel: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <CountHeader icon={icon} label={countLabel} count={count} />
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:bg-primary/90 active:translate-y-px"
        >
          <Plus className="h-4 w-4" />
          {createLabel}
        </button>
      </div>
      {loading ? (
        <GridSkeleton />
      ) : items.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="border-border/70 bg-card/90">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base text-foreground">{item.title}</CardTitle>
                {item.subtitle ? <p className="text-xs text-muted-foreground">{item.subtitle}</p> : null}
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {item.tags && item.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-center gap-2 pt-1">
                  <button type="button" onClick={item.onEdit} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <Pencil className="size-3" />
                    {editLabel}
                  </button>
                  {item.canDelete ? (
                    <button type="button" onClick={item.onDelete} className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-500 transition-colors hover:bg-red-500/10">
                      <Trash2 className="size-3" />
                      {deleteLabel}
                    </button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// User editor (Sheet)
// ---------------------------------------------------------------------------

function UserEditor({
  open, mode, user, token, submitting, onClose, onSaved, onError, t,
}: {
  open: boolean;
  mode: "create" | "edit";
  user?: User;
  token: string;
  submitting: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
  t: TFunc;
}) {
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [is2fa, setIs2fa] = useState(user?.two_factor_enabled ?? false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "create") {
      if (!email.trim() || !password) { onError(t("userFormModal.emailRequired")); return; }
      const res = await createUser(token, { email: email.trim(), password, is_active: isActive, is_2fa_enabled: is2fa });
      if (!res.ok) { onError((res as { message?: string }).message || t("users.fetchFailed")); return; }
    } else if (user) {
      const res = await updateUser(token, user.id, { email: email.trim(), is_active: isActive, is_2fa_enabled: is2fa });
      if (!res.ok) { onError((res as { message?: string }).message || t("users.fetchFailed")); return; }
    }
    onSaved();
  }

  const inputCls = "w-full rounded-lg border border-border bg-input/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title={mode === "create" ? t("access.createUser") : t("access.editUser")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t("userFormModal.email")}</label>
          <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@company.com" />
        </div>
        {mode === "create" ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t("userFormModal.password")}</label>
            <input className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
          </div>
        ) : null}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {t("userFormModal.enableAccount")}
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={is2fa} onChange={(e) => setIs2fa(e.target.checked)} />
            {t("userFormModal.enable2FA")}
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">{t("userFormModal.cancel")}</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("userFormModal.save")}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Role editor (Sheet)
// ---------------------------------------------------------------------------

function RoleEditor({
  open, mode, role, users, token, submitting, onClose, onSaved, onError, t,
}: {
  open: boolean;
  mode: "create" | "edit";
  role?: Role;
  users: User[];
  token: string;
  submitting: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
  t: TFunc;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selectedUsers, setSelectedUsers] = useState<string[]>(role?.user_ids ?? []);

  function toggleUser(id: string) {
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { onError(t("roles.roleName")); return; }
    const payload = { name: name.trim(), description: description.trim() || null, user_ids: selectedUsers };
    const res = mode === "create" || !role
      ? await createRole(token, payload)
      : await updateRole(token, role.id, payload);
    if (!res.ok) { onError((res as { message?: string }).message || t("users.fetchFailed")); return; }
    onSaved();
  }

  const inputCls = "w-full rounded-lg border border-border bg-input/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title={mode === "create" ? t("access.createRole") : t("access.editRole")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t("roles.roleName")}</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. content-editor" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t("roles.description_label")}</label>
          <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("roles.descriptionPlaceholder")} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t("roles.availableUsers")}</label>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {users.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">{t("roles.noUsersLoaded")}</p>
            ) : (
              users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted">
                  <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUser(u.id)} />
                  {u.email}
                </label>
              ))
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">{t("userFormModal.cancel")}</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("userFormModal.save")}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Policy editor (Sheet)
// ---------------------------------------------------------------------------

const PERMISSION_OPTIONS = [
  "asset:read",
  "asset:submit_review",
  "asset:approve",
  "asset:reject",
  "asset:publish",
  "asset:archive",
  "access_request:review",
  "analytics:read",
  "audit_log:read",
  "collection:manage",
];

function PolicyEditor({
  open, mode, policy, roles, token, submitting, onClose, onSaved, onError, t,
}: {
  open: boolean;
  mode: "create" | "edit";
  policy?: Policy;
  roles: Role[];
  token: string;
  submitting: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
  t: TFunc;
}) {
  const [name, setName] = useState(policy?.name ?? "");
  const [effect, setEffect] = useState<"allow" | "deny">(policy?.effect ?? "allow");
  const [permissions, setPermissions] = useState<string[]>(policy?.permissions ?? []);
  const [roleNames, setRoleNames] = useState<string[]>(policy?.role_names ?? []);
  const [customPerm, setCustomPerm] = useState("");

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }
  function addCustomPerm() {
    const p = customPerm.trim();
    if (p && !permissions.includes(p)) setPermissions([...permissions, p]);
    setCustomPerm("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { onError(t("policies.policyName")); return; }
    if (permissions.length === 0) { onError(t("policies.permissions")); return; }
    const payload = {
      name: name.trim(),
      effect,
      permissions,
      role_names: roleNames,
      resource_type: null,
      resource_visibility: null,
    };
    const res = mode === "create" || !policy
      ? await createPolicy(token, payload)
      : await updatePolicy(token, policy.id, payload);
    if (!res.ok) { onError((res as { message?: string }).message || t("users.fetchFailed")); return; }
    onSaved();
  }

  const inputCls = "w-full rounded-lg border border-border bg-input/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
  const chipCls = "inline-flex items-center rounded-md px-2 py-1 text-xs cursor-pointer transition-colors";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title={mode === "create" ? t("access.createPolicy") : t("access.editPolicy")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t("policies.policyName")}</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. editor-allow" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t("policies.effect")}</label>
          <select className={inputCls} value={effect} onChange={(e) => setEffect(e.target.value as "allow" | "deny")}>
            <option value="allow">allow</option>
            <option value="deny">deny</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t("policies.roleNames")}</label>
          <p className="mb-1.5 text-xs text-muted-foreground">{t("access.roleNamesHint")}</p>
          <div className="flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle(roleNames, setRoleNames, r.name)}
                className={cn(chipCls, roleNames.includes(r.name) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t("policies.permissions")}</label>
          <div className="flex flex-wrap gap-1.5">
            {PERMISSION_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => toggle(permissions, setPermissions, p)}
                className={cn(chipCls, permissions.includes(p) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
              >
                {p}
              </button>
            ))}
            {permissions.filter((p) => !PERMISSION_OPTIONS.includes(p)).map((p) => (
              <span key={p} className={cn(chipCls, "bg-primary text-primary-foreground")}>{p}</span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input className={inputCls} value={customPerm} onChange={(e) => setCustomPerm(e.target.value)} placeholder="custom:permission" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomPerm(); } }} />
            <button type="button" onClick={addCustomPerm} className="rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-muted">{t("access.add")}</button>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">{t("userFormModal.cancel")}</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("userFormModal.save")}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// shared presentational helpers
// ---------------------------------------------------------------------------

function CountHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
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
  return <div className="rounded-xl border border-border/70 bg-card/90 px-6 py-10 text-center text-sm text-muted-foreground">{label}</div>;
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
