import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/admin/assets", tags=["admin", "upload"])

UPLOAD_DIR = Path("uploads/images")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024


@router.post("/images")
async def upload_image(file: UploadFile, _user=Depends(get_current_user)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400, detail={"code": "invalid_file_type", "message": "仅支持 jpg/png/gif/webp 格式"}
        )
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail={"code": "file_too_large", "message": "文件大小不能超过 5MB"})
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "png"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    filepath.write_bytes(content)
    return {"url": f"/uploads/images/{filename}"}
