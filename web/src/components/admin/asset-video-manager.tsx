"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, Star, Upload, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AssetVideoDraft } from "@/lib/admin-asset-editor";

type AssetVideoManagerProps = {
  videos: AssetVideoDraft[];
  onChange: (videos: AssetVideoDraft[]) => void;
  token?: string;
};

const inputClass =
  "w-full rounded-lg border border-border bg-input/40 px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const VIDEO_MAX_SIZE = 500 * 1024 * 1024;

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function createEmptyVideo(): AssetVideoDraft {
  return {
    id: randomId(),
    title: "",
    videoUrl: "",
    posterUrl: "",
    description: "",
    isPrimary: false,
  };
}

export function AssetVideoManager({ videos, onChange, token }: AssetVideoManagerProps) {
  const t = useTranslations("Admin");
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function addVideo() {
    const newVideo = createEmptyVideo();
    if (videos.length === 0) {
      newVideo.isPrimary = true;
    }
    onChange([...videos, newVideo]);
  }

  function updateVideo(index: number, patch: Partial<AssetVideoDraft>) {
    const updated = videos.map((v, i) => (i === index ? { ...v, ...patch } : v));
    onChange(updated);
  }

  function removeVideo(index: number) {
    const removed = videos[index];
    const remaining = videos.filter((_, i) => i !== index);
    if (removed.isPrimary && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isPrimary: true };
    }
    onChange(remaining);
  }

  function setPrimary(index: number) {
    onChange(
      videos.map((v, i) => ({
        ...v,
        isPrimary: i === index,
      })),
    );
  }

  async function handleUpload(index: number, video: AssetVideoDraft, file: File) {
    if (!token) return;
    setUploadError(null);

    if (!VIDEO_TYPES.includes(file.type)) {
      setUploadError(t("assetVideoManager.invalidType"));
      return;
    }
    if (file.size > VIDEO_MAX_SIZE) {
      setUploadError(t("assetVideoManager.tooLarge"));
      return;
    }

    setUploadingId(video.id);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/assets/videos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setUploadError(data?.message ?? t("assetVideoManager.uploadFailed"));
        return;
      }
      updateVideo(index, {
        videoUrl: data.url,
        title: video.title || file.name.replace(/\.[^.]+$/, ""),
      });
    } catch {
      setUploadError(t("assetVideoManager.uploadFailed"));
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {uploadError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {uploadError}
        </div>
      )}

      {videos.map((video, index) => {
        const isUploaded = video.videoUrl.startsWith("http") && !video.videoUrl.includes("example.com");
        return (
          <div
            key={video.id}
            className="space-y-3 rounded-xl border border-border bg-muted/70 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {video.isPrimary ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-electric-purple)]/20 px-2 py-0.5 text-xs font-medium text-[var(--color-electric-purple)]">
                    <Star className="size-3 fill-current" />
                    {t("assetVideoManager.primary")}
                  </span>
                ) : (
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {t("assetVideoManager.videoNumber", { number: index + 1 })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!video.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(index)}
                    className="rounded-md border border-border px-2.5 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-white/5"
                  >
                    {t("assetVideoManager.setPrimary")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeVideo(index)}
                  className="rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="mr-1 inline size-3" />
                  {t("assetVideoManager.delete")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">
                  {t("assetVideoManager.title")}
                </label>
                <input
                  className={inputClass}
                  value={video.title}
                  onChange={(e) => updateVideo(index, { title: e.target.value })}
                  placeholder={t("assetVideoManager.titlePlaceholder")}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">
                  {t("assetVideoManager.posterUrl")}
                </label>
                <input
                  className={inputClass}
                  value={video.posterUrl}
                  onChange={(e) => updateVideo(index, { posterUrl: e.target.value })}
                  placeholder={t("assetVideoManager.posterUrlPlaceholder")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">
                  {t("assetVideoManager.description")}
                </label>
                <input
                  className={inputClass}
                  value={video.description}
                  onChange={(e) => updateVideo(index, { description: e.target.value })}
                  placeholder={t("assetVideoManager.descriptionPlaceholder")}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">
                {t("assetVideoManager.videoUrl")}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className={inputClass}
                  value={video.videoUrl}
                  onChange={(e) => updateVideo(index, { videoUrl: e.target.value })}
                  placeholder="https://example.com/video.mp4"
                />
                <span className="flex items-center text-xs text-[var(--color-text-tertiary)]">
                  {t("assetVideoManager.or")}
                </span>
                <input
                  ref={(el) => {
                    fileInputs.current[video.id] = el;
                  }}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(index, video, file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  disabled={!token || uploadingId === video.id}
                  onClick={() => fileInputs.current[video.id]?.click()}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {uploadingId === video.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {t("assetVideoManager.upload")}
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                {t("assetVideoManager.uploadHint")}
              </p>
              {isUploaded ? (
                <p className="mt-1 truncate text-xs text-emerald-600">
                  {t("assetVideoManager.uploadedFrom")}: {video.videoUrl}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addVideo}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-electric-purple)] hover:text-[var(--color-text-primary)]"
      >
        <Plus className="size-4" />
        {t("assetVideoManager.addVideo")}
      </button>
    </div>
  );
}
