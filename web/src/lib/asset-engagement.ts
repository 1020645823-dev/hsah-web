import { parseApiError, type ApiErrorInfo } from "./api-errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type FavoriteResult = { ok: true; data: { is_favorite: boolean } } | { ok: false; error: ApiErrorInfo };

export type FeedbackPayload = {
  feedback_type: "question" | "problem" | "praise" | "other";
  message: string;
};

export type FeedbackResult = { ok: true; data: { id: string } } | { ok: false; error: ApiErrorInfo };

export type RelatedAsset = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  short_description: string;
  cloud_providers: string[];
  asset_type: string;
  match_score: number;
};

export type RelatedAssetsResult = { ok: true; data: RelatedAsset[] } | { ok: false; error: ApiErrorInfo };

function authHeaders(token?: string | null): HeadersInit | undefined {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function addFavorite(assetId: string, token: string): Promise<FavoriteResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/assets/${assetId}/favorite`, {
      method: "POST",
      headers: { ...authHeaders(token), "content-type": "application/json" },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: parseApiError(data, res.status) };
    }
    const data = (await res.json()) as { is_favorite: boolean };
    return { ok: true, data };
  } catch {
    return { ok: false, error: parseApiError(null, undefined) };
  }
}

export async function removeFavorite(assetId: string, token: string): Promise<FavoriteResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/assets/${assetId}/favorite`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: parseApiError(data, res.status) };
    }
    const data = (await res.json()) as { is_favorite: boolean };
    return { ok: true, data };
  } catch {
    return { ok: false, error: parseApiError(null, undefined) };
  }
}

export async function submitFeedback(
  assetId: string,
  payload: FeedbackPayload,
  token?: string | null,
): Promise<FeedbackResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/assets/${assetId}/feedback`, {
      method: "POST",
      headers: { ...authHeaders(token), "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: parseApiError(data, res.status) };
    }
    const data = (await res.json()) as { id: string };
    return { ok: true, data };
  } catch {
    return { ok: false, error: parseApiError(null, undefined) };
  }
}

export async function fetchRelatedAssets(assetId: string): Promise<RelatedAssetsResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/assets/${assetId}/related`, { cache: "no-store" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: parseApiError(data, res.status) };
    }
    const data = (await res.json()) as RelatedAsset[];
    return { ok: true, data };
  } catch {
    return { ok: false, error: parseApiError(null, undefined) };
  }
}
