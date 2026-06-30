"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register } from "@/lib/api";
import { ADMIN_TOKEN_STORAGE_KEY } from "@/lib/admin";

type Step = "password" | "totp";

type LoginContext = {
  isAdminWorkspace: boolean;
  targetPath: string | null;
};

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
  const t = useTranslations("Login");
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextHref = getSafeNextHref(searchParams.get("next"));
  const loginContext = useMemo(() => buildLoginContext(nextHref), [nextHref]);

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password) return false;
    if (step === "totp" && totp.trim().length < 6) return false;
    return true;
  }, [email, password, step, totp]);

  async function handleLogin() {
    setSubmitting(true);
    setError(null);
    const res = await login(
      email.trim(),
      password,
      step === "totp" ? totp.trim() : undefined,
    );
    setSubmitting(false);

    if (!res.ok) {
      if (res.status === 428) {
        setStep("totp");
        return;
      }
      setError(typeof res.data === "string" ? res.data : t("loginFailed"));
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
      setError(t("createAccountFailed"));
      return;
    }
    setSubmitting(false);
    await handleLogin();
  }

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.15fr_0.85fr]">
      <section
        className="hero-gradient relative hidden overflow-hidden px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/[0.06] blur-3xl"
        />
        <div className="relative space-y-10">
          <div className="space-y-5">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase">
              {t("productName")}
            </p>
            <h2 className="max-w-2xl font-heading text-[2.75rem] font-semibold leading-[1.15] tracking-tight">
              {t("heroTitle")}
            </h2>
            <p className="max-w-lg text-[15px] leading-[1.7] text-white/70">
              {t("heroSummary")}
            </p>
          </div>

          <div className="grid gap-4">
            <FeatureBullet
              icon={Sparkles}
              title={t("publicDiscoveryTitle")}
              description={t("publicDiscoveryDescription")}
            />
            <FeatureBullet
              icon={Workflow}
              title={t("operationalContinuityTitle")}
              description={t("operationalContinuityDescription")}
            />
            <FeatureBullet
              icon={ShieldCheck}
              title={t("protectedAccessTitle")}
              description={t("protectedAccessDescription")}
            />
          </div>
        </div>

        <div className="relative mt-10 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 text-sm text-white/80 backdrop-blur-sm">
          <span className="text-white/60">{t("quickLook")}</span>
          <Link
            href="/assets"
            className="inline-flex items-center gap-2 font-medium text-white transition-colors hover:text-white/80"
          >
            {t("explorePublicPlatform")}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 lg:px-12">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
              {t("identityGateway")}
            </p>
            <h1 className="font-heading text-[2rem] font-semibold leading-tight tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="text-[15px] leading-[1.6] text-foreground/70">
              {step === "password"
                ? t("passwordStepSummary")
                : t("totpStepSummary")}
            </p>
          </div>

          {loginContext.isAdminWorkspace ? (
            <div className="rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4 text-sm text-foreground/80 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{t("adminWorkspaceSignIn")}</p>
                  <p className="leading-6 text-foreground/70">
                    {t("adminReturnSummary")}
                  </p>
                  <dl className="grid gap-2 text-[13px] text-foreground/70 sm:grid-cols-2">
                    <div className="rounded-xl bg-muted/60 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold tracking-[0.16em] text-foreground/55 uppercase">
                        {t("workspace")}
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {t("adminWorkspace")}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-muted/60 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold tracking-[0.16em] text-foreground/55 uppercase">
                        {t("targetPath")}
                      </dt>
                      <dd className="mt-1 font-mono text-[12px] text-foreground">
                        {loginContext.targetPath ?? "/admin"}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-[13px] leading-6 text-foreground/60">
                    {t("returnRoute")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-[13px] font-medium text-foreground/80">
                {t("email")}
              </Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="name@company.com"
                className="h-11 rounded-xl border-border/80 bg-background px-4 text-[15px] shadow-sm transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/8%)]"
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-foreground/80">
                {t("password")}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 rounded-xl border-border/80 bg-background px-4 text-[15px] shadow-sm transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/8%)]"
              />
            </div>
            {step === "totp" ? (
              <div className="space-y-2.5">
                <Label htmlFor="totp" className="text-[13px] font-medium text-foreground/80">
                  {t("totpCode")}
                </Label>
                <Input
                  id="totp"
                  inputMode="numeric"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                  placeholder="123456"
                  className="h-11 rounded-xl border-border/80 bg-background px-4 text-[15px] shadow-sm transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/8%)]"
                />
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-destructive/15 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="h-11 w-full rounded-xl text-[15px] font-semibold shadow-sm transition-all duration-200 hover:shadow-md active:translate-y-px"
              onClick={handleLogin}
              disabled={!canSubmit || submitting}
            >
              {step === "totp" ? t("verifyAndSignIn") : t("title")}
            </Button>
            <Button
              className="h-11 w-full rounded-xl text-[15px] font-medium transition-all duration-200"
              variant="outline"
              onClick={handleCreateAccount}
              disabled={!email.trim() || !password || submitting}
            >
              {t("createAccountDev")}
            </Button>
            <div className="w-full pt-1 text-center text-sm text-foreground/60">
              <Link
                href="/assets"
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                {t("returnToLibrary")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LoginPageFallback() {
  const t = useTranslations("Login");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-[var(--shadow-card)]">
        <p className="text-xs font-medium tracking-[0.18em] text-primary">
          {t("identityGateway")}
        </p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground">
          {t("loadingTitle")}
        </h1>
      </div>
    </div>
  );
}

function buildLoginContext(nextHref: string): LoginContext {
  const isAdminWorkspace = nextHref.startsWith("/admin");
  if (!isAdminWorkspace) {
    return {
      isAdminWorkspace: false,
      targetPath: null,
    };
  }

  return {
    isAdminWorkspace: true,
    targetPath: nextHref,
  };
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
    <div className="flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm transition-colors duration-200 hover:bg-white/[0.06]">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.08]">
        <Icon className="size-5 text-white/90" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-sm leading-[1.6] text-white/65">{description}</p>
      </div>
    </div>
  );
}

function getSafeNextHref(next: string | null) {
  if (!next) return "/admin";
  if (!next.startsWith("/") || next.startsWith("//")) return "/admin";
  return next;
}
