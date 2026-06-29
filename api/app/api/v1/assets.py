from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_optional_user
from app.core.db import get_db
from app.models.asset import Asset
from app.models.asset_attachment import AssetAttachment
from app.models.user import User
from app.schemas.asset import AssetDetail, AssetSummary, SalesAssetFields, SharedAssetFields
from app.schemas.asset_attachment import AssetAttachmentWithUrl
from app.schemas.common import PaginatedResponse
from app.services import storage

router = APIRouter(prefix="/assets", tags=["assets"])


def _normalize_shared_fields(asset: Asset) -> dict:
    validated = SharedAssetFields.model_validate(asset.shared_fields or {})
    return validated.model_dump(exclude_defaults=True, exclude_none=True)


def _normalize_sales_fields(asset: Asset) -> dict:
    return SalesAssetFields.model_validate(asset.sales_fields or {}).model_dump(
        exclude_defaults=True,
        exclude_none=True,
    )


def _asset_summary(a: Asset) -> AssetSummary:
    return AssetSummary(
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


def _get_public_asset_or_404(slug: str, db: Session) -> Asset:
    asset = db.scalar(select(Asset).where(Asset.slug == slug))
    if asset is None or asset.visibility != "public" or asset.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return asset


@router.get("", response_model=PaginatedResponse[AssetSummary])
def list_assets(
    q: str | None = None,
    cloud: str | None = None,
    industry: str | None = None,
    tech: str | None = None,
    status_: str | None = Query(default=None, alias="status"),
    sort: str | None = Query(default=None),
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

    stmt = stmt.order_by(Asset.updated_at.desc() if sort == "updated_at" else Asset.title.asc())

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(stmt.offset(offset).limit(limit)).all()
    return PaginatedResponse(
        items=[_asset_summary(a) for a in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/recommended", response_model=list[AssetSummary])
def recommended(
    limit: int = Query(default=6, ge=1, le=20),
    db: Session = Depends(get_db),
) -> list[AssetSummary]:
    rows = db.scalars(
        select(Asset)
        .where(Asset.visibility == "public", Asset.status == "published")
        .order_by(Asset.updated_at.desc())
        .limit(limit)
    ).all()
    return [_asset_summary(a) for a in rows]


@router.get("/{slug}", response_model=AssetDetail)
def get_asset(
    slug: str,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> AssetDetail:
    asset = _get_public_asset_or_404(slug, db)

    # Record an anonymous or authenticated view event for analytics.
    from app.models.analytics_event import AnalyticsEvent

    db.add(
        AnalyticsEvent(
            event_type="asset_view",
            user_id=user.id if user else None,
            asset_id=asset.id,
        )
    )
    db.commit()

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
        visibility=asset.visibility,
        shared_fields=_normalize_shared_fields(asset),
        sales_fields=_normalize_sales_fields(asset),
    )


@router.get("/{slug}/attachments", response_model=list[AssetAttachmentWithUrl])
def list_public_attachments(
    slug: str,
    db: Session = Depends(get_db),
) -> list[AssetAttachmentWithUrl]:
    """Public attachment listing for a published asset (document/video kinds).

    Used by the detail page to render the file-attachments tab. Files live in the
    default MinIO bucket; URLs are presigned on demand.
    """
    asset = _get_public_asset_or_404(slug, db)
    rows = db.scalars(
        select(AssetAttachment)
        .where(AssetAttachment.asset_id == asset.id)
        .order_by(AssetAttachment.created_at.desc(), AssetAttachment.id.desc())
    ).all()
    return [
        AssetAttachmentWithUrl(
            id=str(a.id),
            asset_id=str(a.asset_id),
            file_name=a.file_name,
            content_type=a.content_type,
            size_bytes=a.size_bytes,
            kind=a.kind,
            uploaded_by=str(a.uploaded_by) if a.uploaded_by else None,
            created_at=a.created_at,
            download_url=storage.get_presigned_url(a.storage_key),
        )
        for a in rows
    ]
