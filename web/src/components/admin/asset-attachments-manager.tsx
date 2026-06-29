"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, FileText, Film, Image as ImageIcon, Trash2, Download, Loader2 } from "lucide-react";
import {
  type AssetAttachment,
  type AttachmentKind,
  classifyAttachment,
  deleteAttachment,
  listAttachments,
  maxForKind,
  uploadAttachment,
} from "@/lib/asset-attachments";

interface AssetAttachmentsManagerProps {
  assetId: string;
  token: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function KindIcon({ kind }: { kind: AttachmentKind }) {
  if (kind === "video") return <Film className="size-4 text-[var(--color-electric-purple)]" />;
  if (kind === "image") return <ImageIcon className="size-4 text-emerald-400" />;
  return <FileText className="size-4 text-sky-400" />;
}

export function AssetAttachmentsManager({ assetId, token }: AssetAttachmentsManagerProps) {
  const t = useTranslations("Admin");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<AssetAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const load = useCallback(async () => {
    const res = await listAttachments(token, assetId);
    if (res.ok) {
      setAttachments(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  }, [token, assetId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFiles(files: FileList) {
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const kind = classifyAttachment(file);
        if (!kind) {
          setError(t("assetAttachments.unsupportedType", { name: file.name }));
          continue;
        }
        if (file.size > maxForKind(kind)) {
          setError(t("assetAttachments.tooLarge", { name: file.name }));
          continue;
        }
        const res = await uploadAttachment(token, assetId, file);
        if (!res.ok) {
          setError(res.message);
        }
      }
      await load();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(attachment: AssetAttachment) {
    if (!confirm(t("assetAttachments.deleteConfirm", { name: attachment.file_name }))) return;
    const res = await deleteAttachment(token, assetId, attachment.id);
    if (res.ok) {
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    } else {
      setError(res.message);
    }
  }

  async function handleDownload(attachment: AssetAttachment) {
    window.open(attachment.download_url, "_blank");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,.pdf,.ppt,.pptx,.doc,.docx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition-colors ${
          dragging
            ? "border-[var(--color-electric-purple)] bg-[var(--color-electric-purple)]/5"
            : "border-[rgb(255_255_255_/10%)] hover:border-[var(--color-electric-purple)]/60"
        }`}
        data-testid="attachment-dropzone"
      >
        {uploading ? (
          <>
            <Loader2 className="mb-2 size-6 animate-spin text-[var(--color-electric-purple)]" />
            <span className="text-sm text-[var(--color-text-secondary)]">
              {t("assetAttachments.uploading")}
            </span>
          </>
        ) : (
          <>
            <Upload className="mb-2 size-6 text-[var(--color-text-secondary)]" />
            <span className="text-sm text-[var(--color-text-secondary)]">
              {t("assetAttachments.dropOrClick")}
            </span>
            <span className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              {t("assetAttachments.supportedHint")}
            </span>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-4 text-center text-sm text-[var(--color-text-secondary)]">
          {t("assetAttachments.loading")}
        </div>
      ) : attachments.length === 0 ? (
        <div className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">
          {t("assetAttachments.empty")}
        </div>
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-3 rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/50%)] px-4 py-3"
            >
              <KindIcon kind={attachment.kind} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--color-text-primary)]">
                  {attachment.file_name}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {formatSize(attachment.size_bytes)} · {formatDate(attachment.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(attachment)}
                className="rounded-md border border-[rgb(212_218_245_/12%)] p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-white/5"
                title={t("assetAttachments.download")}
              >
                <Download className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(attachment)}
                className="rounded-md border border-red-500/30 p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
                title={t("assetAttachments.delete")}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
