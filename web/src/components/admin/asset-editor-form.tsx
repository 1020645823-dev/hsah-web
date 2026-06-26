"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TagInput } from "./tag-input";
import { ContentBlockEditor } from "./content-blocks/content-block-editor";
import { AssetVideoManager } from "./asset-video-manager";
import type { ContentBlock } from "@/lib/admin-content-blocks";
import type { AssetVideoDraft } from "@/lib/admin-asset-editor";
import {
  AssetEditorDraft,
  INITIAL_DRAFT,
  validateDraft,
  buildPayload,
  parseAssetToDraft,
  areDraftsEqual,
  ASSET_TYPE_OPTIONS,
  ASSET_STATUS_OPTIONS,
  ASSET_VISIBILITY_OPTIONS,
} from "@/lib/admin-asset-editor";
import { adminRequest, parseContentBlockValidationErrors } from "@/lib/admin";
import type { BlockFieldError } from "@/lib/content-block-errors";

type AssetEditorFormProps = {
  mode: "create" | "edit";
  assetId?: string;
  token: string;
};

const inputClass =
  "w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none";

const selectClass =
  "w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/90%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none";

const cardClass =
  "rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] p-6 backdrop-blur-[24px]";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
      {children}
      {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export function AssetEditorForm({ mode, assetId, token }: AssetEditorFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<AssetEditorDraft>(INITIAL_DRAFT);
  const [initialDraft, setInitialDraft] = useState<AssetEditorDraft>(INITIAL_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<keyof AssetEditorDraft, string>>>({});
  const [blockErrors, setBlockErrors] = useState<BlockFieldError[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState("");
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);

  const isDirty = !areDraftsEqual(draft, initialDraft);

  useEffect(() => {
    if (mode !== "edit" || !assetId) return;
    let canceled = false;
    async function loadAsset() {
      const res = await adminRequest<Record<string, unknown>>(
        `/api/v1/admin/assets/${assetId}`,
        token,
      );
      if (canceled) return;
      if (res.ok) {
        const parsed = parseAssetToDraft(res.data);
        setDraft(parsed);
        setInitialDraft(parsed);
        setBlockErrors([]);
      } else {
        setLoadError(res.message);
      }
      setLoading(false);
    }
    loadAsset();
    return () => {
      canceled = true;
    };
  }, [mode, assetId, token]);

  useEffect(() => {
    adminRequest<Record<string, unknown>[]>("/api/v1/admin/roles", token).then((res) => {
      if (res.ok && Array.isArray(res.data)) {
        const names = res.data
          .map((r) => (typeof r.name === "string" ? r.name : ""))
          .filter(Boolean);
        setRoleSuggestions(names);
      }
    });
  }, [token]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function updateField<K extends keyof AssetEditorDraft>(key: K, value: AssetEditorDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (key === "contentBlocks") {
      setBlockErrors([]);
    }
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setBlockErrors([]);
    const { valid, errors: validationErrors } = validateDraft(draft);
    setErrors(validationErrors);
    if (!valid) return;

    setSubmitting(true);
    const payload = buildPayload(draft);
    const isEdit = mode === "edit" && assetId;
    const res = isEdit
      ? await adminRequest(`/api/v1/admin/assets/${assetId}`, token, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : await adminRequest("/api/v1/admin/assets", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });

    setSubmitting(false);
    if (!res.ok) {
      setBlockErrors(parseContentBlockValidationErrors(res.data));
      setSubmitError((res as { message: string }).message);
      return;
    }
    router.push("/admin/assets");
  }

  function handleCancel() {
    if (isDirty && !confirm("有未保存的变更，确定要离开吗？")) return;
    router.push("/admin/assets");
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">加载中…</div>;
  }

  if (loadError) {
    return <div className="p-8 text-center text-sm text-red-500">{loadError}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={cardClass}>
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">基本信息</h3>
        <div className="space-y-4">
          <div>
            <Label required>Slug</Label>
            <input
              className={inputClass}
              value={draft.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              placeholder="asset-slug"
            />
            <FieldError message={errors.slug} />
          </div>
          <div>
            <Label required>标题</Label>
            <input
              className={inputClass}
              value={draft.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="资产标题"
            />
            <FieldError message={errors.title} />
          </div>
          <div>
            <Label>副标题</Label>
            <input
              className={inputClass}
              value={draft.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              placeholder="可选副标题"
            />
            <FieldError message={errors.subtitle} />
          </div>
          <div>
            <Label required>简短描述</Label>
            <textarea
              className={inputClass}
              rows={3}
              value={draft.shortDescription}
              onChange={(e) => updateField("shortDescription", e.target.value)}
              placeholder="资产的简短描述"
            />
            <FieldError message={errors.shortDescription} />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">分类标签</h3>
        <div className="space-y-4">
          <div>
            <Label required>云厂商</Label>
            <TagInput
              value={draft.cloudProviders}
              onChange={(v) => updateField("cloudProviders", v as AssetEditorDraft["cloudProviders"])}
              placeholder="输入云厂商，回车添加"
            />
            <FieldError message={errors.cloudProviders} />
          </div>
          <div>
            <Label>行业</Label>
            <TagInput
              value={draft.industries}
              onChange={(v) => updateField("industries", v as AssetEditorDraft["industries"])}
              placeholder="输入行业，回车添加"
            />
            <FieldError message={errors.industries} />
          </div>
          <div>
            <Label>技术</Label>
            <TagInput
              value={draft.technologies}
              onChange={(v) => updateField("technologies", v as AssetEditorDraft["technologies"])}
              placeholder="输入技术，回车添加"
            />
            <FieldError message={errors.technologies} />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">类型与状态</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label required>资产类型</Label>
            <select
              className={selectClass}
              value={draft.assetType}
              onChange={(e) => updateField("assetType", e.target.value)}
            >
              {ASSET_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <FieldError message={errors.assetType} />
          </div>
          <div>
            <Label required>状态</Label>
            <select
              className={selectClass}
              value={draft.status}
              onChange={(e) => updateField("status", e.target.value)}
            >
              {ASSET_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <FieldError message={errors.status} />
          </div>
          <div>
            <Label required>可见性</Label>
            <select
              className={selectClass}
              value={draft.visibility}
              onChange={(e) => updateField("visibility", e.target.value)}
            >
              {ASSET_VISIBILITY_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <FieldError message={errors.visibility} />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">访问控制</h3>
        <div className="space-y-4">
          <div>
            <Label required>允许角色</Label>
            <TagInput
              value={draft.allowedRoles}
              onChange={(v) => updateField("allowedRoles", v as AssetEditorDraft["allowedRoles"])}
              suggestions={roleSuggestions}
              placeholder="输入角色，回车添加"
            />
            <FieldError message={errors.allowedRoles} />
          </div>
          <div>
            <Label required>允许用户</Label>
            <TagInput
              value={draft.allowedUsers}
              onChange={(v) => updateField("allowedUsers", v as AssetEditorDraft["allowedUsers"])}
              placeholder="输入用户，回车添加"
            />
            <FieldError message={errors.allowedUsers} />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">Shared Detail</h3>
        <div className="space-y-4">
          <div>
            <Label>介绍文字</Label>
            <textarea
              className={inputClass}
              rows={4}
              value={draft.sharedFields.introduction}
              onChange={(e) =>
                updateField("sharedFields", {
                  ...draft.sharedFields,
                  introduction: e.target.value,
                })}
              placeholder="面向客户和交付团队共享的资产介绍"
            />
          </div>
          <div>
            <Label>适用业务</Label>
            <TagInput
              value={draft.sharedFields.useCases}
              onChange={(v) =>
                updateField("sharedFields", {
                  ...draft.sharedFields,
                  useCases: v as string[],
                })}
              placeholder="输入适用业务，回车添加"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Live Demo 链接</Label>
              <input
                className={inputClass}
                value={draft.sharedFields.liveDemoUrl}
                onChange={(e) =>
                  updateField("sharedFields", {
                    ...draft.sharedFields,
                    liveDemoUrl: e.target.value,
                  })}
                placeholder="https://example.com/live"
              />
            </div>
          </div>
          <div>
            <Label>视频内容管理</Label>
            <div className="mt-2">
              <AssetVideoManager
                videos={draft.sharedFields.videos}
                onChange={(videos: AssetVideoDraft[]) =>
                  updateField("sharedFields", {
                    ...draft.sharedFields,
                    videos,
                  })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">Sales Detail</h3>
        <div className="space-y-4">
          <div>
            <Label>价值概述</Label>
            <textarea
              className={inputClass}
              rows={4}
              value={draft.salesFields.valueSummary}
              onChange={(e) =>
                updateField("salesFields", {
                  ...draft.salesFields,
                  valueSummary: e.target.value,
                })}
              placeholder="面向售前展示的价值概述"
            />
          </div>
          <div>
            <Label>差异化亮点</Label>
            <TagInput
              value={draft.salesFields.differentiators}
              onChange={(v) =>
                updateField("salesFields", {
                  ...draft.salesFields,
                  differentiators: v as string[],
                })}
              placeholder="输入亮点，回车添加"
            />
          </div>
          <div>
            <Label>业务结果</Label>
            <TagInput
              value={draft.salesFields.outcomes}
              onChange={(v) =>
                updateField("salesFields", {
                  ...draft.salesFields,
                  outcomes: v as string[],
                })}
              placeholder="输入结果，回车添加"
            />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">Delivery Detail</h3>
        <div className="space-y-4">
          <div>
            <Label>实施说明</Label>
            <textarea
              className={inputClass}
              rows={4}
              value={draft.deliveryFields.implementationSummary}
              onChange={(e) =>
                updateField("deliveryFields", {
                  ...draft.deliveryFields,
                  implementationSummary: e.target.value,
                })}
              placeholder="面向交付团队的实施说明"
            />
          </div>
          <div>
            <Label>前置条件</Label>
            <TagInput
              value={draft.deliveryFields.prerequisites}
              onChange={(v) =>
                updateField("deliveryFields", {
                  ...draft.deliveryFields,
                  prerequisites: v as string[],
                })}
              placeholder="输入前置条件，回车添加"
            />
          </div>
          <div>
            <Label>落地步骤</Label>
            <TagInput
              value={draft.deliveryFields.rolloutSteps}
              onChange={(v) =>
                updateField("deliveryFields", {
                  ...draft.deliveryFields,
                  rolloutSteps: v as string[],
                })}
              placeholder="输入落地步骤，回车添加"
            />
          </div>
          <div>
            <Label>Delivery 允许角色</Label>
            <TagInput
              value={draft.deliveryAllowedRoles}
              onChange={(v) => updateField("deliveryAllowedRoles", v as string[])}
              suggestions={roleSuggestions}
              placeholder="输入 Delivery 角色，回车添加"
            />
          </div>
          <div>
            <Label>Delivery 允许用户</Label>
            <TagInput
              value={draft.deliveryAllowedUsers}
              onChange={(v) => updateField("deliveryAllowedUsers", v as string[])}
              placeholder="输入 Delivery 用户邮箱，回车添加"
            />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">内容块</h3>
        <ContentBlockEditor
          blocks={draft.contentBlocks}
          onChange={(blocks: ContentBlock[]) => updateField("contentBlocks", blocks)}
          errors={blockErrors}
        />
      </div>

      {submitError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {submitError}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-[rgb(212_218_245_/12%)] px-6 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-white/5"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!isDirty || submitting}
          className="rounded-lg bg-[var(--color-electric-purple)] px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "保存中…" : "保存"}
        </button>
      </div>
    </form>
  );
}
