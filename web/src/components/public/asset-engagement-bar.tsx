"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addFavorite, removeFavorite } from "@/lib/asset-engagement";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";

/**
 * Lightweight engagement bar with favorite (bookmark) and share actions.
 * Favorite requires auth; share uses the native Web Share API with a clipboard fallback.
 */
export function AssetEngagementBar({
  assetId,
  token,
}: {
  assetId: string;
  token?: string | null;
}) {
  const t = useTranslations("AssetDetail");
  const [isFavorite, setIsFavorite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [shared, setShared] = useState(false);

  async function toggleFavorite() {
    if (!token) {
      setError({
        message: t("favoriteSignIn"),
        category: "auth",
        userMessage: t("favoriteSignIn"),
        iconName: "lock",
        retryable: false,
      });
      return;
    }
    setBusy(true);
    setError(null);
    const res = isFavorite
      ? await removeFavorite(assetId, token)
      : await addFavorite(assetId, token);
    setBusy(false);
    if (!res.ok) {
      setError(parseApiError(res.error));
      return;
    }
    setIsFavorite(res.data.is_favorite);
  }

  async function share() {
    setError(null);
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: document.title, url });
        setShared(true);
        return;
      }
    } catch {
      // user cancelled or share failed; fall through to clipboard
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShared(true);
      }
    } catch {
      setError({
        message: t("shareFailed"),
        category: "client",
        userMessage: t("shareFailed"),
        iconName: "alert-triangle",
        retryable: false,
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant={isFavorite ? "secondary" : "outline"}
        onClick={toggleFavorite}
        disabled={busy}
        aria-pressed={isFavorite}
      >
        <Heart className={isFavorite ? "fill-current" : ""} />
        {isFavorite ? t("favorited") : t("favorite")}
      </Button>

      <Button type="button" variant="outline" onClick={share}>
        <Share2 />
        {shared ? t("shared") : t("share")}
      </Button>

      {error && <span className="text-sm text-destructive">{error.message}</span>}
    </div>
  );
}
