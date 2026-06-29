"""MinIO object storage service.

Wraps the minio client to provide bucket management, uploads, presigned URLs,
and object deletion. Two endpoints are supported:
  * internal endpoint (settings.minio_endpoint) for put/remove operations.
  * external endpoint (settings.minio_external_endpoint) for presigned URLs so
    the browser can reach MinIO regardless of the docker network topology.
"""

from __future__ import annotations

import uuid
from datetime import timedelta

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

# Allowed MIME types and size limits per attachment kind.
ALLOWED_MIME_TYPES: dict[str, set[str]] = {
    "image": {"image/jpeg", "image/png", "image/gif", "image/webp"},
    "video": {"video/mp4", "video/webm", "video/quicktime"},
    "document": {
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
}

MAX_SIZE_BYTES: dict[str, int] = {
    "image": 5 * 1024 * 1024,  # 5MB
    "video": 500 * 1024 * 1024,  # 500MB
    "document": 100 * 1024 * 1024,  # 100MB
}

# Presigned URL lifetime.
PRESIGN_EXPIRES = timedelta(hours=1)


def _build_client(endpoint: str) -> Minio:
    return Minio(
        endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )


# Internal client for data-plane operations (put/remove).
_internal_client = _build_client(settings.minio_endpoint)
# External client for presigned URLs (browser-reachable host).
_external_client = _build_client(settings.minio_external_endpoint)


def ensure_bucket() -> None:
    """Create the bucket if it does not already exist."""
    try:
        if not _internal_client.bucket_exists(settings.minio_bucket):
            _internal_client.make_bucket(settings.minio_bucket)
    except S3Error:
        # MinIO may not be ready on the very first startup event; the upload
        # endpoints will surface connection errors per-request instead.
        pass


def kind_for_content_type(content_type: str | None) -> str | None:
    """Return the attachment kind (image/video/document) for a MIME type."""
    if not content_type:
        return None
    for kind, types in ALLOWED_MIME_TYPES.items():
        if content_type in types:
            return kind
    return None


def validate_file(kind: str, content_type: str | None, size: int) -> None:
    """Validate that the content type and size are allowed for the given kind."""
    allowed = ALLOWED_MIME_TYPES.get(kind, set())
    if content_type not in allowed:
        raise ValueError(f"unsupported content type for {kind}: {content_type}")
    if size > MAX_SIZE_BYTES[kind]:
        limit_mb = MAX_SIZE_BYTES[kind] // (1024 * 1024)
        raise ValueError(f"{kind} file exceeds the {limit_mb}MB limit")


def upload_file(kind: str, content_type: str, data: bytes) -> str:
    """Upload bytes to MinIO and return the storage key.

    The storage key is namespaced by kind (e.g. ``images/<uuid>.png``) to keep
    the object layout readable.
    """
    ext = _extension_for_content_type(content_type)
    directory = {"image": "images", "video": "videos", "document": "documents"}[kind]
    storage_key = f"{directory}/{uuid.uuid4()}.{ext}"

    from io import BytesIO

    _internal_client.put_object(
        bucket_name=settings.minio_bucket,
        object_name=storage_key,
        data=BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return storage_key


def get_presigned_url(storage_key: str, expires: timedelta = PRESIGN_EXPIRES) -> str:
    """Return a browser-reachable presigned GET URL for the object."""
    return _external_client.presigned_get_object(
        bucket_name=settings.minio_bucket,
        object_name=storage_key,
        expires=expires,
    )


def delete_object(storage_key: str) -> None:
    """Delete an object from MinIO, ignoring missing objects."""
    try:
        _internal_client.remove_object(settings.minio_bucket, storage_key)
    except S3Error:
        pass


def _extension_for_content_type(content_type: str) -> str:
    return {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "video/quicktime": "mov",
        "application/pdf": "pdf",
        "application/vnd.ms-powerpoint": "ppt",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
        "application/msword": "doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    }.get(content_type, "bin")
