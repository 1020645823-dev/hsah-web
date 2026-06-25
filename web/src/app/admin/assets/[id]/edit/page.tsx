"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getStoredAdminToken } from "@/lib/admin";
import { AssetEditorForm } from "@/components/admin/asset-editor-form";

export default function EditAssetPage() {
  const params = useParams();
  const assetId = params.id as string;
  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return getStoredAdminToken();
  });

  if (!token) return null;

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              ADMIN / ASSETS / EDIT
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Edit Asset
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              编辑资产条目
            </div>
          </div>
          <Link
            href="/admin/assets"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            ← Back to Assets
          </Link>
        </div>

        <AssetEditorForm mode="edit" assetId={assetId} token={token} />
      </div>
    </div>
  );
}
