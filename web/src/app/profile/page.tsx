"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { me, setup2fa, verify2fa, type MeResponse, type TwoFactorSetupResponse } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("hsah_token");
  });
  const [user, setUser] = useState<MeResponse | null>(null);
  const [setup, setSetup] = useState<TwoFactorSetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/auth/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    me(token).then((res) => {
      if (canceled) return;
      if (!res.ok) {
        localStorage.removeItem("hsah_token");
        router.replace("/auth/login");
        return;
      }
      setUser(res.data);
    });
    return () => {
      canceled = true;
    };
  }, [router, token]);

  const canVerify = useMemo(() => code.trim().length >= 6 && !!token, [code, token]);
  const loadingUser = !!token && !user;

  async function handleSetup2fa() {
    if (!token) return;
    setLoading(true);
    setError(null);
    const res = await setup2fa(token);
    setLoading(false);
    if (!res.ok) {
      setError("2FA 初始化失败");
      return;
    }
    setSetup(res.data);
  }

  async function handleVerify2fa() {
    if (!token) return;
    setLoading(true);
    setError(null);
    const res = await verify2fa(token, code.trim());
    setLoading(false);
    if (!res.ok) {
      setError("2FA 验证失败");
      return;
    }
    setUser(res.data);
    setSetup(null);
    setCode("");
  }

  function handleLogout() {
    localStorage.removeItem("hsah_token");
    router.replace("/auth/login");
  }

  return (
    <div className="flex flex-1 items-start justify-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              PROFILE
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Account Settings
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sign out
          </Button>
        </div>

        <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text-primary)]">User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="text-[var(--color-text-secondary)]">
              {loadingUser ? "Loading..." : null}
            </div>
            {user ? (
              <div className="space-y-1">
                <div className="text-[var(--color-text-secondary)]">Email</div>
                <div className="text-[var(--color-text-primary)]">{user.email}</div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="text-[var(--color-text-secondary)]">2FA</div>
                  <div className="text-[var(--color-text-primary)]">
                    {user.two_factor_enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text-primary)]">Two-Factor Auth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-[rgb(239_68_68_/35%)] bg-[rgb(239_68_68_/10%)] px-3 py-2 text-sm text-[rgb(252_165_165)]">
                {error}
              </div>
            ) : null}

            {user?.two_factor_enabled ? (
              <div className="text-sm text-[var(--color-text-secondary)]">
                2FA 已开启。
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-[var(--color-text-secondary)]">
                  点击初始化后，将 secret 添加到你的 Authenticator，然后输入验证码完成绑定。
                </div>
                <Button onClick={handleSetup2fa} disabled={loading || !token}>
                  Initialize 2FA
                </Button>

                {setup ? (
                  <div className="space-y-3 rounded-xl border border-[rgb(212_218_245_/12%)] bg-[rgb(10_10_15_/55%)] p-4">
                    <div className="space-y-1">
                      <div className="text-xs tracking-[0.16em] text-[var(--color-text-tertiary)]">
                        SECRET
                      </div>
                      <div className="font-mono text-sm text-[var(--color-text-primary)]">
                        {setup.secret}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code" className="text-[var(--color-text-secondary)]">
                        Verification Code
                      </Label>
                      <div className="flex gap-3">
                        <Input
                          id="code"
                          inputMode="numeric"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="123456"
                        />
                        <Button onClick={handleVerify2fa} disabled={!canVerify || loading}>
                          Verify
                        </Button>
                      </div>
                    </div>
                    <div className="break-all text-xs text-[var(--color-text-tertiary)]">
                      {setup.otpauth_url}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
