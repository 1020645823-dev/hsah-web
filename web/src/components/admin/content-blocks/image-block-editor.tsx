"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, ImageIcon, LinkIcon } from "lucide-react";
import type { ImageBlockConfig } from "@/lib/admin-content-blocks";
import { getFieldError, type BlockFieldError } from "@/lib/content-block-errors";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

interface ImageBlockEditorProps {
  config: ImageBlockConfig;
  onChange: (config: ImageBlockConfig) => void;
  token: string;
  errors?: BlockFieldError[];
}

export function ImageBlockEditor({ config, onChange, token, errors }: ImageBlockEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const srcError = getFieldError(errors, "config.src");
  const altError = getFieldError(errors, "config.alt");
  const captionError = getFieldError(errors, "config.caption");

  const handleUrlChange = (url: string) => {
    onChange({ ...config, url });
  };

  const handleAltChange = (alt: string) => {
    onChange({ ...config, alt });
  };

  const handleCaptionChange = (caption: string) => {
    onChange({ ...config, caption });
  };

  const handleWidthChange = (width: number) => {
    onChange({ ...config, width });
  };

  const handleFileSelect = async (file: File) => {
    setUploadError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("只支持 JPG、PNG、GIF、WebP 格式");
      return;
    }

    if (file.size > MAX_SIZE) {
      setUploadError("文件大小不能超过 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/v1/admin/assets/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("上传失败");
      }

      const data = await response.json();
      onChange({ ...config, url: data.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="space-y-4" data-testid="image-block-editor">
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          图片链接
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <input
              type="url"
              className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] pl-9 pr-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
              value={config.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              data-testid="image-block-url-input"
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[rgb(255_255_255_/10%)] disabled:opacity-50 transition-colors"
            data-testid="image-block-upload-button"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "上传中..." : "上传图片"}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileInputChange}
          data-testid="image-block-file-input"
        />
        {uploadError && (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400"
            data-testid="image-block-upload-error"
          >
            {uploadError}
          </div>
        )}
        {srcError && <p className="text-xs text-red-400">{srcError}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          替代文本
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
          value={config.alt}
          onChange={(e) => handleAltChange(e.target.value)}
          placeholder="图片描述"
          data-testid="image-block-alt-input"
        />
        {altError && <p className="text-xs text-red-400">{altError}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          图片说明（可选）
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
          value={config.caption ?? ""}
          onChange={(e) => handleCaptionChange(e.target.value)}
          placeholder="图片说明"
          data-testid="image-block-caption-input"
        />
        {captionError && <p className="text-xs text-red-400">{captionError}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          宽度: {config.width ?? 100}%
        </label>
        <input
          type="range"
          min={10}
          max={100}
          value={config.width ?? 100}
          onChange={(e) => handleWidthChange(Number(e.target.value))}
          className="w-full accent-[var(--color-electric-purple)]"
          data-testid="image-block-width-slider"
        />
      </div>

      {config.url && (
        <div className="space-y-2" data-testid="image-block-preview">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            预览
          </label>
          <div className="rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] p-4">
            <div className="flex justify-center">
                <Image
                  src={config.url}
                  alt={config.alt || "图片预览"}
                  width={800}
                  height={300}
                  className="max-h-[300px] rounded-lg object-contain"
                  style={{ width: `${config.width ?? 100}%` }}
                  unoptimized
                />
              </div>
            {config.caption && (
              <p className="mt-2 text-center text-xs text-[var(--color-text-secondary)]">
                {config.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {!config.url && (
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[rgb(255_255_255_/10%)] py-8 text-[var(--color-text-secondary)]"
          data-testid="image-block-empty-state"
        >
          <ImageIcon className="mb-2 h-8 w-8" />
          <span className="text-sm">暂无图片</span>
        </div>
      )}
    </div>
  );
}
