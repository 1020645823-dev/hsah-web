"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register } from "@/lib/api";
import { ADMIN_TOKEN_STORAGE_KEY } from "@/lib/admin";

type Step = "password" | "totp";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextHref = getSafeNextHref(searchParams.get("next"));
  const cameFromAdmin = nextHref.startsWith("/admin");

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password) return false;
    if (step === "totp" && totp.trim().length < 6) return false;
    return true;
  }, [email, password, step, totp]);

  async function handleLogin() {
    setSubmitting(true);
    setError(null);
    const res = await login(email.trim(), password, step === "totp" ? totp.trim() : undefined);
    setSubmitting(false);

    if (!res.ok) {
      if (res.status === 428) {
        setStep("totp");
        return;
      }
      setError(typeof res.data === "string" ? res.data : "登录失败");
      return;
    }

    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, res.data.access_token);
    router.replace(nextHref);
  }

  async function handleCreateAccount() {
    setSubmitting(true);
    setError(null);
    const res = await register(email.trim(), password);
    if (!res.ok && res.status !== 409) {
      setSubmitting(false);
      setError("创建账号失败");
      return;
    }
    setSubmitting(false);
    await handleLogin();
  }

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-[rgb(9_11_20)] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-[0.18em] text-white/80">
              HYPERSCALER ASSET HUB
            </p>
            <h2 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight">
              Explore the public content platform, then move into operational workspaces.
            </h2>
            <p className="max-w-xl text-base leading-7 text-white/85">
              Access saved assets, profiles, and admin operations from one identity entry point.
            </p>
          </div>
          <div className="grid gap-4">
            <FeatureBullet
              icon={Sparkles}
              title="Public discovery"
              description="Browse reusable demos, architectures, and scenario-led content before you sign in."
            />
            <FeatureBullet
              icon={Workflow}
              title="Operational continuity"
              description="Move from discovery into admin workflows without losing route context."
            />
            <FeatureBullet
              icon={ShieldCheck}
              title="Protected access"
              description="Keep sensitive governance actions behind authenticated workspaces and 2FA when required."
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-white/12 bg-white/6 px-5 py-4 text-sm text-white/85">
          <span>Need a quick look first?</span>
          <Link
            href="/assets"
            className="inline-flex items-center gap-2 font-medium text-white transition-colors hover:text-white/80"
          >
            Explore the public content platform
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 lg:px-10">
        <Card className="w-full max-w-md border-border bg-card shadow-[var(--shadow-card)]">
          <CardHeader className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.18em] text-primary">
                IDENTITY GATEWAY
              </p>
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
                Sign in
              </h1>
              <p className="text-sm leading-6 text-foreground/80">
                {step === "password"
                  ? "Access saved assets, profiles, and admin operations."
                  : "Enter the 6-digit code from your authenticator to continue."}
              </p>
            </div>

            {cameFromAdmin ? (
              <div className="rounded-xl border border-border bg-muted/70 px-4 py-3 text-sm text-foreground/80">
                Sign in to continue to the admin workspace you requested.
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">
                Email
              </Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            {step === "totp" ? (
              <div className="space-y-2">
                <Label htmlFor="totp" className="text-foreground/80">
                  2FA Code
                </Label>
                <Input
                  id="totp"
                  inputMode="numeric"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                  placeholder="123456"
                />
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={!canSubmit || submitting}
            >
              {step === "totp" ? "Verify & Sign in" : "Sign in"}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleCreateAccount}
              disabled={!email.trim() || !password || submitting}
            >
              Create account (dev)
            </Button>
            <div className="w-full text-center text-sm text-foreground/70">
              <Link href="/assets" className="font-medium text-foreground transition-colors hover:text-primary">
                Return to public library
              </Link>
            </div>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-[var(--shadow-card)]">
        <p className="text-xs font-medium tracking-[0.18em] text-primary">
          IDENTITY GATEWAY
        </p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground">
          Loading sign-in workspace...
        </h1>
      </div>
    </div>
  );
}

function FeatureBullet({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
        <Icon className="size-5 text-white" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-sm leading-6 text-white/80">{description}</p>
      </div>
    </div>
  );
}

function getSafeNextHref(next: string | null) {
  if (!next) return "/profile";
  if (!next.startsWith("/") || next.startsWith("//")) return "/profile";
  return next;
}
