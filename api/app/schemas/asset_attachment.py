from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class AssetAttachmentResponse(BaseModel):
    id: str
    asset_id: str
    file_name: str
    content_type: str
    size_bytes: int
    kind: Literal["image", "video", "document"]
    uploaded_by: str | None
    created_at: datetime


class AssetAttachmentWithUrl(AssetAttachmentResponse):
    download_url: str


class AttachmentDownloadResponse(BaseModel):
    url: str
