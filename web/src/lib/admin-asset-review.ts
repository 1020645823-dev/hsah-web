import { adminRequest } from "@/lib/admin";

export type QualityCheckResult = {
  asset_id: string;
  score: number;
  band: "ready" | "needs_work" | "blocked";
  missing: string[];
  warnings: string[];
  is_publishable: boolean;
};

export type ReviewRecord = {
  id: string;
  asset_id: string;
  actor_user_id: string | null;
  action: string;
  from_status: string | null;
  to_status: string;
  reason: string;
  created_at: string;
};

export function fetchQualityCheck(assetId: string, token: string) {
  return adminRequest<QualityCheckResult>(
    `/api/v1/admin/assets/${assetId}/quality-check`,
    token,
    { method: "GET" },
  );
}

export function submitReview(assetId: string, token: string) {
  return adminRequest<unknown>(`/api/v1/admin/assets/${assetId}/submit-review`, token, {
    method: "POST",
  });
}

export function approveAsset(assetId: string, token: string, reason = "") {
  return adminRequest<unknown>(`/api/v1/admin/assets/${assetId}/approve`, token, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function rejectAsset(assetId: string, token: string, reason: string) {
  return adminRequest<unknown>(`/api/v1/admin/assets/${assetId}/reject`, token, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function publishAsset(assetId: string, token: string) {
  return adminRequest<unknown>(`/api/v1/admin/assets/${assetId}/publish`, token, {
    method: "POST",
  });
}

export function unpublishAsset(assetId: string, token: string) {
  return adminRequest<unknown>(`/api/v1/admin/assets/${assetId}/unpublish`, token, {
    method: "POST",
  });
}

export function archiveAsset(assetId: string, token: string) {
  return adminRequest<unknown>(`/api/v1/admin/assets/${assetId}/archive`, token, {
    method: "POST",
  });
}
