import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.db import get_db
from app.models.asset import Asset
from app.models.asset_attachment import AssetAttachment
from app.models.user import User
from app.schemas.asset_attachment import (
    AssetAttachmentResponse,
    AssetAttachmentWithUrl,
    AttachmentDownloadResponse,
)
from app.services import storage

router = APIRouter(prefix="/admin/assets/{asset_id}/attachments", tags=["admin-attachments"])


def _asset_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "asset_not_found", "message": "Asset not found"},
    )


def _get_asset_or_404(asset_id: str, db: Session) -> Asset:
    try:
        uid = uuid.UUID(asset_id)
    except ValueError as exc:
        raise _asset_not_found() from exc
    asset = db.scalar(select(Asset).where(Asset.id == uid))
    if asset is None:
        raise _asset_not_found()
    return asset


def _attachment_to_response(
    attachment: AssetAttachment, *, with_url: bool = False
) -> dict:
    payload: dict = {
        "id": str(attachment.id),
        "asset_id": str(attachment.asset_id),
        "file_name": attachment.file_name,
        "content_type": attachment.content_type,
        "size_bytes": attachment.size_bytes,
        "kind": attachment.kind,
        "uploaded_by": str(attachment.uploaded_by) if attachment.uploaded_by else None,
        "created_at": attachment.created_at,
    }
    if with_url:
        payload["download_url"] = storage.get_presigned_url(attachment.storage_key)
    return payload


@router.post("", status_code=status.HTTP_201_CREATED, response_model=AssetAttachmentResponse)
async def upload_attachment(
    asset_id: str,
    file: UploadFile,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    asset = _get_asset_or_404(asset_id, db)

    kind = storage.kind_for_content_type(file.content_type)
    if kind is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "invalid_file_type",
                "message": "不支持的文件类型，仅支持图片、视频及 PDF/PPT/Word 文档",
            },
        )

    content = await file.read()
    try:
        storage.validate_file(kind, file.content_type, len(content))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_file", "message": str(exc)},
        ) from exc

    storage_key = storage.upload_file(kind, file.content_type, content)
    attachment = AssetAttachment(
        asset_id=asset.id,
        file_name=file.filename or "unnamed",
        storage_key=storage_key,
        content_type=file.content_type,
        size_bytes=len(content),
        kind=kind,
        uploaded_by=user.id,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return _attachment_to_response(attachment)


@router.get("", response_model=list[AssetAttachmentWithUrl])
def list_attachments(
    asset_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> list[dict]:
    asset = _get_asset_or_404(asset_id, db)
    attachments = db.scalars(
        select(AssetAttachment)
        .where(AssetAttachment.asset_id == asset.id)
        .order_by(AssetAttachment.created_at.desc(), AssetAttachment.id.desc())
    ).all()
    return [_attachment_to_response(a, with_url=True) for a in attachments]


@router.get("/{attachment_id}/download", response_model=AttachmentDownloadResponse)
def get_download_url(
    asset_id: str,
    attachment_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    _get_asset_or_404(asset_id, db)
    try:
        uid = uuid.UUID(attachment_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="attachment not found") from exc
    attachment = db.scalar(
        select(AssetAttachment).where(
            AssetAttachment.id == uid,
            AssetAttachment.asset_id == uuid.UUID(asset_id),
        )
    )
    if attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="attachment not found")
    return {"url": storage.get_presigned_url(attachment.storage_key)}


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    asset_id: str,
    attachment_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    _get_asset_or_404(asset_id, db)
    try:
        uid = uuid.UUID(attachment_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="attachment not found") from exc
    attachment = db.scalar(
        select(AssetAttachment).where(
            AssetAttachment.id == uid,
            AssetAttachment.asset_id == uuid.UUID(asset_id),
        )
    )
    if attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="attachment not found")
    storage.delete_object(attachment.storage_key)
    db.delete(attachment)
    db.commit()
    return None
