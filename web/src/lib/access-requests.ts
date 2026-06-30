import { parseApiError, type ApiErrorInfo } from "./api-errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type AccessRequestState = {
  status: "pending" | "approved" | "rejected";
};

export type AccessRequestResult =
  | { ok: true; data: AccessRequestState }
  | { ok: false; error: ApiErrorInfo; requiresAuth?: boolean };

export async function createAccessRequest(
  assetId: string,
  payload: { purpose: string; role?: string | null },
  token?: string | null,
): Promise<AccessRequestResult> {
  if (!token) {
    return { ok: false, error: parseApiError(null, 401), requiresAuth: true };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/access-requests?asset_id=${assetId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: parseApiError(data, res.status) };
    }
    const data = (await res.json()) as AccessRequestState;
    return { ok: true, data };
  } catch {
    return { ok: false, error: parseApiError(null, undefined) };
  }
}
