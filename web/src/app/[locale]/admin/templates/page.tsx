"use client";

import { useState } from "react";
import Link from "next/link";

import { TemplateManager } from "@/components/admin/template-manager";
import { getStoredAdminToken } from "@/lib/admin";

export default function AdminTemplatesPage() {
  const [token] = useState<string | null>(() => getStoredAdminToken());

  if (!token) return null;

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              ADMIN / TEMPLATES
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Templates
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              管理内容模板，用于快速创建资产内容块。
            </div>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            ← Back
          </Link>
        </div>

        <TemplateManager token={token} />
      </div>
    </div>
  );
}
