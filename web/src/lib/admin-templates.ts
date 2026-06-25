import type { ContentBlock } from "./admin-content-blocks";

export type Template = {
  id: number;
  name: string;
  description: string | null;
  blocks: ContentBlock[];
  is_builtin: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
};

export type TemplateCreate = {
  name: string;
  description?: string;
  blocks: ContentBlock[];
};

export type TemplateUpdate = {
  name?: string;
  description?: string;
  blocks?: ContentBlock[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function apiRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String(data.detail)
        : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function listTemplates(token: string): Promise<Template[]> {
  return apiRequest<Template[]>("/api/v1/admin/templates", token, { method: "GET" });
}

export async function createTemplate(token: string, data: TemplateCreate): Promise<Template> {
  return apiRequest<Template>("/api/v1/admin/templates", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTemplate(token: string, id: number): Promise<Template> {
  return apiRequest<Template>(`/api/v1/admin/templates/${id}`, token, { method: "GET" });
}

export async function updateTemplate(token: string, id: number, data: TemplateUpdate): Promise<Template> {
  return apiRequest<Template>(`/api/v1/admin/templates/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(token: string, id: number): Promise<void> {
  await apiRequest<unknown>(`/api/v1/admin/templates/${id}`, token, { method: "DELETE" });
}
