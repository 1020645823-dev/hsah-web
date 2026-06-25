"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50";

type UserFormData = {
  email: string;
  password: string;
  is_active: boolean;
  is_2fa_enabled: boolean;
};

type UserFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  submitError?: string;
};

export function UserFormModal({ isOpen, mode, initialData, onSubmit, onCancel, submitError }: UserFormModalProps) {
  const [form, setForm] = useState<UserFormData>({
    email: initialData?.email ?? "",
    password: "",
    is_active: initialData?.is_active ?? true,
    is_2fa_enabled: initialData?.is_2fa_enabled ?? false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof UserFormData>(key: K, value: UserFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof UserFormData, string>> = {};
    if (!form.email.trim()) {
      nextErrors.email = "邮箱不能为空";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "邮箱格式不正确";
    }
    if (mode === "create" && !form.password) {
      nextErrors.password = "密码不能为空";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    onSubmit(form);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-full rounded-2xl border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/95%)] p-6 shadow-2xl md:max-w-md">
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">
          {mode === "create" ? "创建用户" : "编辑用户"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              邮箱 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="user@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {mode === "create" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className={inputClass}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="输入密码"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] text-[var(--color-electric-purple)] focus:ring-[var(--color-electric-purple)]"
            />
            <label htmlFor="is_active" className="text-sm text-[var(--color-text-primary)]">
              启用账号
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="is_2fa_enabled"
              type="checkbox"
              checked={form.is_2fa_enabled}
              onChange={(e) => updateField("is_2fa_enabled", e.target.checked)}
              className="h-4 w-4 rounded border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] text-[var(--color-electric-purple)] focus:ring-[var(--color-electric-purple)]"
            />
            <label htmlFor="is_2fa_enabled" className="text-sm text-[var(--color-text-primary)]">
              启用 2FA
            </label>
          </div>

          {submitError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-[rgb(212_218_245_/12%)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--color-electric-purple)] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)]/50"
            >
              {submitting ? "保存中…" : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
