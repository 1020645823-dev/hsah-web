from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.asset import Asset
from app.schemas.asset import AssetDetail, AssetSummary
from app.schemas.common import PaginatedResponse
from app.services.content_blocks import normalize_blocks

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=PaginatedResponse[AssetSummary])
def list_assets(
    q: str | None = None,
    cloud: str | None = None,
    industry: str | None = None,
    tech: str | None = None,
    status_: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> PaginatedResponse[AssetSummary]:
    stmt = select(Asset).where(
        Asset.visibility == "public",
        Asset.status == "published",
    )

    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Asset.title.ilike(like), Asset.short_description.ilike(like)))

    if cloud:
        stmt = stmt.where(Asset.cloud_providers.contains([cloud]))

    if industry:
        stmt = stmt.where(Asset.industries.contains([industry]))

    if tech:
        stmt = stmt.where(Asset.technologies.contains([tech]))

    if status_:
        stmt = stmt.where(Asset.status == status_)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(stmt.offset(offset).limit(limit)).all()
    return PaginatedResponse(
        items=[
            AssetSummary(
                id=str(a.id),
                slug=a.slug,
                title=a.title,
                subtitle=a.subtitle,
                short_description=a.short_description,
                cloud_providers=a.cloud_providers,
                industries=a.industries,
                technologies=a.technologies,
                asset_type=a.asset_type,
                status=a.status,
            )
            for a in rows
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{slug}", response_model=AssetDetail)
def get_asset(slug: str, db: Session = Depends(get_db)) -> AssetDetail:
    asset = db.scalar(select(Asset).where(Asset.slug == slug))
    if asset is None or asset.visibility != "public" or asset.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    normalized = normalize_blocks(asset.content_blocks or [], asset.content_schema_version)

    return AssetDetail(
        id=str(asset.id),
        slug=asset.slug,
        title=asset.title,
        subtitle=asset.subtitle,
        short_description=asset.short_description,
        cloud_providers=asset.cloud_providers,
        industries=asset.industries,
        technologies=asset.technologies,
        asset_type=asset.asset_type,
        status=asset.status,
        content_schema_version=normalized.asset_schema_version,
        content_blocks=normalized.blocks,
        visibility=asset.visibility,
    )
