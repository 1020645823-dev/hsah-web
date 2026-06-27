"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  BarChart3,
  Image as ImageIcon,
  Code,
  AlertCircle,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  LayoutTemplate,
  Shield,
} from "lucide-react";
import type { ContentBlock } from "@/lib/admin-content-blocks";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/admin-templates";
import type { Template } from "@/lib/admin-templates";

interface TemplateManagerProps {
  token: string;
  initialBlocks?: ContentBlock[];
}

const BLOCK_TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <FileText className="h-3 w-3" />,
  stat_card: <BarChart3 className="h-3 w-3" />,
  image: <ImageIcon className="h-3 w-3" />,
  code_snippet: <Code className="h-3 w-3" />,
  callout: <AlertCircle className="h-3 w-3" />,
};

export function TemplateManager({ token, initialBlocks }: TemplateManagerProps) {
  const t = useTranslations("Admin");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const canceledRef = useRef(false);
  const didInitRef = useRef(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTemplates(token);
      if (!canceledRef.current) setTemplates(data);
    } catch (err) {
      if (!canceledRef.current) setError(err instanceof Error ? err.message : t("templateManager.loadFailed"));
    } finally {
      if (!canceledRef.current) setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    canceledRef.current = false;
    loadTemplates();
    return () => {
      canceledRef.current = true;
    };
  }, [loadTemplates]);

  async function handleDelete(id: number) {
    try {
      await deleteTemplate(token, id);
      setDeleteConfirmId(null);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("templateManager.deleteFailed"));
    }
  }

  async function handleSaveEdit(id: number) {
    if (!editForm.name.trim()) return;
    setSubmitting(true);
    try {
      await updateTemplate(token, id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
      });
      setEditingId(null);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("templateManager.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateFromBlocks() {
    if (!createForm.name.trim() || !initialBlocks?.length) return;
    setSubmitting(true);
    try {
      await createTemplate(token, {
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        blocks: initialBlocks,
      });
      setShowCreateDialog(false);
      setCreateForm({ name: "", description: "" });
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("templateManager.createFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  const startEdit = (template: Template) => {
    setEditingId(template.id);
    setEditForm({
      name: template.name,
      description: template.description ?? "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="h-5 w-5 text-[var(--color-electric-purple)]" />
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {t("templateManager.title")}
          </h2>
        </div>
        {initialBlocks && initialBlocks.length > 0 && (
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 rounded-lg bg-[rgb(123_63_242_/25%)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[rgb(123_63_242_/35%)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("templateManager.createFromCurrent")}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
          {t("templateManager.loading")}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-[rgb(255_255_255_/10%)] bg-[rgb(255_255_255_/3%)] py-12 text-center text-sm text-[var(--color-text-secondary)]">
          {t("templateManager.empty")}
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-[rgb(255_255_255_/10%)] bg-[rgb(255_255_255_/3%)] p-4"
            >
              {editingId === template.id ? (
                <div className="space-y-3">
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/80%)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                    placeholder={t("templateManager.namePlaceholder")}
                  />
                  <input
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/80%)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                    placeholder={t("templateManager.descriptionPlaceholder")}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(template.id)}
                      disabled={submitting || !editForm.name.trim()}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t("templateManager.save")}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 rounded-lg bg-[rgb(255_255_255_/5%)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[rgb(255_255_255_/10%)] transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t("templateManager.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {template.name}
                      </span>
                      {template.is_builtin && (
                        <span className="flex items-center gap-1 rounded-full bg-[rgb(123_63_242_/18%)] px-2 py-0.5 text-xs text-[var(--color-electric-purple)]">
                          <Shield className="h-3 w-3" />
                          {t("templateManager.builtin")}
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {t("templateManager.blockCount", { count: template.blocks.length })}
                      </span>
                      <div className="flex gap-1">
                        {template.blocks.map((block, index) => (
                          <span key={index} className="text-[var(--color-text-tertiary)]" title={block.type}>
                            {BLOCK_TYPE_ICONS[block.type] ?? <FileText className="h-3 w-3" />}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {!template.is_builtin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(template)}
                        className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[rgb(255_255_255_/5%)] hover:text-[var(--color-text-primary)] transition-colors"
                        title={t("templateManager.edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {deleteConfirmId === template.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="rounded-lg bg-red-500/20 p-2 text-red-200 hover:bg-red-500/30 transition-colors"
                            title={t("templateManager.confirmDelete")}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[rgb(255_255_255_/5%)] transition-colors"
                            title={t("templateManager.cancelDelete")}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(template.id)}
                          className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-200 transition-colors"
                          title={t("templateManager.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateDialog(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/95%)] p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
              {t("templateManager.saveAsTemplate")}
            </h3>
            <div className="space-y-3">
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/80%)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                placeholder={t("templateManager.namePlaceholder")}
              />
              <input
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/80%)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                placeholder={t("templateManager.descriptionPlaceholder")}
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreateFromBlocks}
                  disabled={submitting || !createForm.name.trim()}
                  className="flex-1 rounded-lg bg-[rgb(123_63_242_/25%)] py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[rgb(123_63_242_/35%)] disabled:opacity-50 transition-colors"
                >
                  {submitting ? t("templateManager.saving") : t("templateManager.save")}
                </button>
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="rounded-lg bg-[rgb(255_255_255_/5%)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[rgb(255_255_255_/10%)] transition-colors"
                >
                  {t("templateManager.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
