from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.api.v1.auth import get_current_user
from app.services import storage

router = APIRouter(prefix="/admin/assets", tags=["admin", "upload"])


@router.post("/images")
async def upload_image(file: UploadFile, _user=Depends(get_current_user)):
    """Upload an image to MinIO and return its presigned URL.

    Kept for backwards compatibility with the image-block editor. The endpoint
    path and response shape (``{"url": ...}``) are unchanged; only the storage
    backend moved from the local filesystem to MinIO.
    """
    kind = storage.kind_for_content_type(file.content_type)
    if kind != "image":
        raise HTTPException(
            status_code=400, detail={"code": "invalid_file_type", "message": "仅支持 jpg/png/gif/webp 格式"}
        )
    content = await file.read()
    try:
        storage.validate_file("image", file.content_type, len(content))
    except ValueError as exc:
        raise HTTPException(status_code=413, detail={"code": "file_too_large", "message": str(exc)}) from exc

    storage_key = storage.upload_file("image", file.content_type, content)
    url = storage.get_presigned_url(storage_key)
    return {"url": url, "storage_key": storage_key}


@router.post("/videos")
async def upload_video(file: UploadFile, _user=Depends(get_current_user)):
    """Upload a video file to MinIO and return a presigned playback URL.

    Used by the asset editor's local-video-upload mode. The returned URL is
    stored on the asset's shared_fields.videos[].video_url so the public detail
    page can play it back. Files live in the default bucket under videos/.
    """
    kind = storage.kind_for_content_type(file.content_type)
    if kind != "video":
        raise HTTPException(
            status_code=400,
            detail={"code": "invalid_file_type", "message": "仅支持 mp4/webm/mov 视频格式"},
        )
    content = await file.read()
    try:
        storage.validate_file("video", file.content_type, len(content))
    except ValueError as exc:
        raise HTTPException(status_code=413, detail={"code": "file_too_large", "message": str(exc)}) from exc

    storage_key = storage.upload_file("video", file.content_type, content)
    url = storage.get_presigned_url(storage_key)
    return {"url": url, "storage_key": storage_key}
