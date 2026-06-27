"use client";

import { Plus, Trash2, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AssetVideoDraft } from "@/lib/admin-asset-editor";

type AssetVideoManagerProps = {
  videos: AssetVideoDraft[];
  onChange: (videos: AssetVideoDraft[]) => void;
};

const inputClass =
  "w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none";

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

export function AssetVideoManager({ videos, onChange }: AssetVideoManagerProps) {
  const t = useTranslations("Admin");

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

  return (
    <div className="space-y-4">
      {videos.map((video, index) => (
        <div
          key={video.id}
          className="rounded-xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/50%)] p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {video.isPrimary ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-electric-purple)]/20 px-2 py-0.5 text-xs font-medium text-[var(--color-electric-purple)]">
                  <Star className="size-3 fill-current" />
                  {t("assetVideoManager.primary")}
                </span>
              ) : (
                <span className="text-xs text-[var(--color-text-tertiary)]">{t("assetVideoManager.videoNumber", { number: index + 1 })}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!video.isPrimary && (
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  className="rounded-md border border-[rgb(212_218_245_/12%)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-white/5"
                >
                  {t("assetVideoManager.setPrimary")}
                </button>
              )}
              <button
                type="button"
                onClick={() => removeVideo(index)}
                className="rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="size-3 inline mr-1" />
                {t("assetVideoManager.delete")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">{t("assetVideoManager.title")}</label>
              <input
                className={inputClass}
                value={video.title}
                onChange={(e) => updateVideo(index, { title: e.target.value })}
                placeholder={t("assetVideoManager.titlePlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">{t("assetVideoManager.videoUrl")}</label>
              <input
                className={inputClass}
                value={video.videoUrl}
                onChange={(e) => updateVideo(index, { videoUrl: e.target.value })}
                placeholder="https://example.com/video.mp4"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">{t("assetVideoManager.posterUrl")}</label>
              <input
                className={inputClass}
                value={video.posterUrl}
                onChange={(e) => updateVideo(index, { posterUrl: e.target.value })}
                placeholder={t("assetVideoManager.posterUrlPlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">{t("assetVideoManager.description")}</label>
              <input
                className={inputClass}
                value={video.description}
                onChange={(e) => updateVideo(index, { description: e.target.value })}
                placeholder={t("assetVideoManager.descriptionPlaceholder")}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addVideo}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[rgb(212_218_245_/20%)] py-3 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-electric-purple)] hover:text-[var(--color-text-primary)]"
      >
        <Plus className="size-4" />
        {t("assetVideoManager.addVideo")}
      </button>
    </div>
  );
}
