"use client";

import { adminRequest, getErrorMessage } from "./admin";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type AttachmentKind = "image" | "video" | "document";

export interface AssetAttachment {
  id: string;
  asset_id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  kind: AttachmentKind;
  uploaded_by: string | null;
  created_at: string;
  download_url: string;
}

/**
 * Upload a file as an asset attachment.
 *
 * Uses a raw fetch (not adminRequest) so the multipart/form-data boundary is
 * preserved — adminRequest would overwrite the content type with application/json.
 */
export async function uploadAttachment(
  token: string,
  assetId: string,
  file: File,
): Promise<{ ok: true; data: AssetAttachment } | { ok: false; message: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `${API_BASE_URL}/api/v1/admin/assets/${assetId}/attachments`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  );
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return { ok: false, message: getErrorMessage(data, res.status) };
  }
  return { ok: true, data: data as AssetAttachment };
}

export async function listAttachments(
  token: string,
  assetId: string,
) {
  return adminRequest<AssetAttachment[]>(
    `/api/v1/admin/assets/${assetId}/attachments`,
    token,
  );
}

export async function getAttachmentDownloadUrl(
  token: string,
  assetId: string,
  attachmentId: string,
) {
  return adminRequest<{ url: string }>(
    `/api/v1/admin/assets/${assetId}/attachments/${attachmentId}/download`,
    token,
  );
}

export async function deleteAttachment(
  token: string,
  assetId: string,
  attachmentId: string,
) {
  return adminRequest<void>(
    `/api/v1/admin/assets/${assetId}/attachments/${attachmentId}`,
    token,
    { method: "DELETE" },
  );
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const VIDEO_MAX_SIZE = 500 * 1024 * 1024;
export const DOCUMENT_MAX_SIZE = 100 * 1024 * 1024;

export function classifyAttachment(file: File): AttachmentKind | null {
  if (IMAGE_TYPES.includes(file.type)) return "image";
  if (VIDEO_TYPES.includes(file.type)) return "video";
  if (DOCUMENT_TYPES.includes(file.type)) return "document";
  return null;
}

export function maxForKind(kind: AttachmentKind): number {
  if (kind === "image") return IMAGE_MAX_SIZE;
  if (kind === "video") return VIDEO_MAX_SIZE;
  return DOCUMENT_MAX_SIZE;
}
