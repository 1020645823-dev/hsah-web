import { adminRequest } from "@/lib/admin";
import type { AnalyticsOverview, AuditLog } from "@/types/analytics";

export function fetchAnalyticsOverview(token: string) {
  return adminRequest<AnalyticsOverview>("/api/v1/admin/analytics/overview", token, {
    method: "GET",
  });
}

export type AuditLogListResponse = {
  items: AuditLog[];
  total: number;
  limit: number;
  offset: number;
};

export function fetchAuditLogs(
  token: string,
  params: { action?: string; resourceType?: string; limit?: number; offset?: number } = {},
) {
  const search = new URLSearchParams();
  if (params.action) search.set("action", params.action);
  if (params.resourceType) search.set("resource_type", params.resourceType);
  search.set("limit", String(params.limit ?? 20));
  search.set("offset", String(params.offset ?? 0));
  const query = search.toString();
  return adminRequest<AuditLogListResponse>(
    `/api/v1/admin/audit-logs?${query}`,
    token,
    { method: "GET" },
  );
}
