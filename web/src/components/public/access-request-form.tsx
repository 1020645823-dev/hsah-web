"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAccessRequest } from "@/lib/access-requests";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";

export function AccessRequestForm({
  assetId,
  token,
}: {
  assetId: string;
  token?: string | null;
}) {
  const t = useTranslations("AssetDetail");
  const [purpose, setPurpose] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [submitted, setSubmitted] = useState<null | "pending" | "approved">(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!purpose.trim()) return;
    setBusy(true);
    setError(null);
    setRequiresAuth(false);
    const res = await createAccessRequest(assetId, { purpose: purpose.trim(), role: role.trim() || null }, token);
    setBusy(false);
    if (!res.ok) {
      if (res.requiresAuth) {
        setRequiresAuth(true);
        return;
      }
      setError(parseApiError(res.error));
      return;
    }
    setSubmitted(res.data.status === "approved" ? "approved" : "pending");
  }

  if (submitted) {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
        <p>
          {submitted === "approved"
            ? t("accessRequestApproved")
            : t("accessRequestSubmitted")}
        </p>
        <Link href="/me/access-requests" className="font-medium underline underline-offset-4">
          {t("myRequestsLink")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/70 bg-card/90 p-5">
      <p className="text-sm font-semibold text-foreground">{t("accessRequestTitle")}</p>
      {requiresAuth && (
        <p className="text-sm text-muted-foreground">
          {t("accessRequestSignIn")}{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            {t("accessRequestSignInLink")}
          </Link>
        </p>
      )}
      <div className="space-y-2">
        <label htmlFor={`access-purpose-${assetId}`} className="text-sm font-medium text-foreground">
          {t("accessRequestPurpose")}
        </label>
        <Textarea
          id={`access-purpose-${assetId}`}
          className="min-h-[88px]"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`access-role-${assetId}`} className="text-sm font-medium text-foreground">
          {t("accessRequestRole")}
        </label>
        <Input
          id={`access-role-${assetId}`}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      <Button type="submit" disabled={!purpose.trim() || busy} className="w-full sm:w-auto">
        {t("accessRequestSubmit")}
      </Button>
    </form>
  );
}
