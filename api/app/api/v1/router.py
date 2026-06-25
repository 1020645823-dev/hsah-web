from fastapi import APIRouter

from app.api.v1.admin import router as admin_router
from app.api.v1.admin_assets import router as admin_assets_router
from app.api.v1.assets import router as assets_router
from app.api.v1.auth import router as auth_router
from app.api.v1.templates import router as templates_router
from app.api.v1.upload import router as upload_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(assets_router)
router.include_router(admin_router)
router.include_router(admin_assets_router)
router.include_router(upload_router)
router.include_router(templates_router)


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/version")
def version() -> dict[str, str]:
    return {"version": "0.1.0"}
