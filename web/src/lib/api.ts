const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type JsonRecord = Record<string, unknown>;

async function requestJson<T>(
  path: string,
  init: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; data: unknown }> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, status: res.status, data };
  return { ok: true, data: data as T };
}

export type TokenResponse = { access_token: string; token_type: string };
export type MeResponse = {
  id: string;
  email: string;
  is_active: boolean;
  two_factor_enabled: boolean;
};
export type TwoFactorSetupResponse = { secret: string; otpauth_url: string };

export async function register(email: string, password: string) {
  return requestJson<MeResponse>("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password } satisfies JsonRecord),
  });
}

export async function login(email: string, password: string, totpCode?: string) {
  return requestJson<TokenResponse>("/api/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, totp_code: totpCode ?? null } satisfies JsonRecord),
  });
}

export async function me(token: string) {
  return requestJson<MeResponse>("/api/v1/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function setup2fa(token: string) {
  return requestJson<TwoFactorSetupResponse>("/api/v1/auth/2fa/setup", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function verify2fa(token: string, totpCode: string) {
  return requestJson<MeResponse>("/api/v1/auth/2fa/verify", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ totp_code: totpCode } satisfies JsonRecord),
  });
}
