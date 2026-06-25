"use client";

import type { MatrixPolicy, MatrixRole } from "./admin-permission-matrix";
import type { BlockFieldError } from "./content-block-errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const ADMIN_TOKEN_STORAGE_KEY = "hsah_token";
export const ADMIN_AUTH_CHANGED_EVENT = "hsah-admin-auth-changed";

export type AdminRecord = Record<string, unknown>;

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; status: number; data: unknown; message: string };

export function getStoredAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
}

export function clearStoredAdminToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGED_EVENT));
}

export async function adminRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<ApiSuccess<T> | ApiFailure> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      clearStoredAdminToken();
    }
    return {
      ok: false,
      status: res.status,
      data,
      message: getErrorMessage(data, res.status),
    };
  }

  return { ok: true, data: data as T };
}

export function extractArrayPayload(data: unknown, preferredKeys: string[] = []) {
  if (Array.isArray(data)) return data.filter(isAdminRecord);
  if (!isAdminRecord(data)) return [];

  const keys = [...preferredKeys, "items", "results", "data"];
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) return value.filter(isAdminRecord);
  }

  return [];
}

export function isAdminRecord(value: unknown): value is AdminRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseContentBlockValidationErrors(data: unknown): BlockFieldError[] {
  if (!isAdminRecord(data) || !isAdminRecord(data.detail) || !Array.isArray(data.detail.errors)) {
    return [];
  }

  return data.detail.errors
    .map((item) => {
      if (!isAdminRecord(item)) return null;
      if (
        typeof item.block_id !== "string" ||
        typeof item.field !== "string" ||
        typeof item.message !== "string"
      ) {
        return null;
      }

      return {
        blockId: item.block_id,
        blockType: typeof item.block_type === "string" ? item.block_type : "unknown",
        field: item.field,
        message: item.message,
      };
    })
    .filter((item): item is BlockFieldError => item !== null);
}

export function pickString(record: AdminRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function pickNumber(record: AdminRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

export function pickBoolean(record: AdminRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return null;
}

export function pickStringArray(record: AdminRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function parseAdminRole(record: AdminRecord): MatrixRole {
  const name =
    pickString(record, ["name", "role_name", "slug", "id"]) ?? "unknown-role";

  return {
    id: pickString(record, ["id", "slug", "name", "role_name"]) ?? name,
    name,
  };
}

export function parseAdminPolicy(record: AdminRecord): MatrixPolicy {
  const name =
    pickString(record, ["name", "policy_name", "slug", "id"]) ?? "unknown-policy";
  const effect = pickString(record, ["effect", "decision", "result"]) === "deny" ? "deny" : "allow";

  return {
    id: pickString(record, ["id", "slug", "name", "policy_name"]) ?? name,
    name,
    effect,
    permissions: pickStringArray(record, ["permissions", "actions", "operations"]),
    role_names: pickStringArray(record, ["role_names", "roles", "subjects", "principals"]),
    resource_type: pickString(record, ["resource_type"]),
    resource_visibility: pickString(record, ["resource_visibility"]),
  };
}

export function formatDateLabel(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2) ?? "";
}

export async function updatePolicy(
  token: string,
  policyId: string,
  data: {
    name: string;
    effect: "allow" | "deny";
    permissions: string[];
    role_names?: string[];
    resource_type?: string | null;
    resource_visibility?: string | null;
  },
) {
  return adminRequest(`/api/v1/admin/policies/${policyId}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePolicy(token: string, policyId: string) {
  return adminRequest(`/api/v1/admin/policies/${policyId}`, token, { method: "DELETE" });
}

export async function updateRole(token: string, roleId: string, data: { name: string; description?: string; user_ids?: string[] }) {
  return adminRequest(`/api/v1/admin/roles/${roleId}`, token, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteRole(token: string, roleId: string) {
  return adminRequest(`/api/v1/admin/roles/${roleId}`, token, { method: "DELETE" });
}

export async function createUser(
  token: string,
  data: { email: string; password: string; is_active?: boolean; is_2fa_enabled?: boolean },
) {
  return adminRequest("/api/v1/admin/users", token, { method: "POST", body: JSON.stringify(data) });
}

export async function updateUser(
  token: string,
  userId: string,
  data: { email?: string; is_active?: boolean; is_2fa_enabled?: boolean },
) {
  return adminRequest(`/api/v1/admin/users/${userId}`, token, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteUser(token: string, userId: string) {
  return adminRequest(`/api/v1/admin/users/${userId}`, token, { method: "DELETE" });
}

export function getErrorMessage(data: unknown, status?: number) {
  if (isAdminRecord(data)) {
    const direct = pickString(data, ["message", "detail", "error"]);
    if (direct) return direct;
    if (isAdminRecord(data.detail)) {
      const nested = pickString(data.detail, ["message", "error", "code"]);
      if (nested) return nested;
    }
  }

  if (typeof data === "string" && data.trim()) return data;
  if (status === 401) return "登录已失效，请重新登录后重试。";
  if (status === 403) return "当前账号没有访问该管理能力的权限。";
  if (status) return `请求失败（HTTP ${status}）。`;
  return "请求失败，请稍后重试。";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export async function adminPaginatedRequest<T>(
  path: string,
  token: string,
  params: { limit?: number; offset?: number } = {},
  init: RequestInit = {},
): Promise<{ ok: true; data: PaginatedResponse<T> } | ApiFailure> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  const queryString = query.toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;
  return adminRequest<PaginatedResponse<T>>(fullPath, token, init);
}

export function extractPaginatedPayload<T>(data: unknown): { items: T[]; total: number } | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const items = d.items;
  const total = d.total;
  if (Array.isArray(items) && typeof total === "number") {
    return { items: items as T[], total };
  }
  return null;
}

export async function batchDeleteAssets(token: string, ids: string[]) {
  return adminRequest<{ deleted: number; failed: Array<{ id: string; reason: string }> }>(
    "/api/v1/admin/assets/batch-delete",
    token,
    {
      method: "POST",
      body: JSON.stringify({ ids }),
    },
  );
}

export async function publishAsset(token: string, assetId: string) {
  return adminRequest<AdminRecord>(`/api/v1/admin/assets/${assetId}/publish`, token, {
    method: "POST",
  });
}

export async function archiveAsset(token: string, assetId: string) {
  return adminRequest<AdminRecord>(`/api/v1/admin/assets/${assetId}/archive`, token, {
    method: "POST",
  });
}

export async function unpublishAsset(token: string, assetId: string) {
  return adminRequest<AdminRecord>(`/api/v1/admin/assets/${assetId}/unpublish`, token, {
    method: "POST",
  });
}

export async function restoreAsset(token: string, assetId: string) {
  return adminRequest<AdminRecord>(`/api/v1/admin/assets/${assetId}/restore`, token, {
    method: "POST",
  });
}
