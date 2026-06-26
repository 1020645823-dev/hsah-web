from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_optional_user
from app.core.db import get_db
from app.models.asset import Asset
from app.models.user import User
from app.schemas.asset import AssetDetail, AssetSummary, DeliveryAssetFields, SalesAssetFields, SharedAssetFields
from app.schemas.common import PaginatedResponse
from app.services.content_blocks import normalize_blocks

router = APIRouter(prefix="/assets", tags=["assets"])


def _normalize_shared_fields(asset: Asset) -> dict:
    validated = SharedAssetFields.model_validate(asset.shared_fields or {})
    data = validated.model_dump(exclude_defaults=True, exclude_none=True)
    videos = data.get("videos") or []
    if not videos and data.get("demo_video_url"):
        videos = [
            {
                "id": "legacy-demo-video",
                "title": "Demo video",
                "video_url": data["demo_video_url"],
                "poster_url": None,
                "description": "",
                "is_primary": True,
            }
        ]
    data["videos"] = videos
    return data


def _normalize_sales_fields(asset: Asset) -> dict:
    return SalesAssetFields.model_validate(asset.sales_fields or {}).model_dump(
        exclude_defaults=True,
        exclude_none=True,
    )


def _normalize_delivery_fields(asset: Asset) -> dict:
    return DeliveryAssetFields.model_validate(asset.delivery_fields or {}).model_dump(
        exclude_defaults=True,
        exclude_none=True,
    )


def _block_audience(block: dict) -> str:
    audience = block.get("audience")
    if audience == "shared" or audience == "delivery":
        return audience
    return "sales"


def _filter_public_blocks(blocks: list[dict], *, include_delivery: bool) -> list[dict]:
    filtered: list[dict] = []
    for block in blocks:
        audience = _block_audience(block)
        if audience == "delivery" and not include_delivery:
            continue
        filtered.append(block)
    return filtered


def _has_delivery_content(asset: Asset, normalized_blocks: list[dict]) -> bool:
    if any(_block_audience(block) == "delivery" for block in normalized_blocks):
        return True
    return bool(_normalize_delivery_fields(asset))


def _user_has_delivery_access(asset: Asset, user: User | None) -> bool:
    if user is None:
        return False
    if user.email in (asset.delivery_allowed_users or []):
        return True

    required_roles = set(asset.delivery_allowed_roles or [])
    if not required_roles:
        return True

    return any(role.name in required_roles for role in user.roles)


def _resolve_delivery_access(asset: Asset, normalized_blocks: list[dict], user: User | None) -> str | None:
    if not _has_delivery_content(asset, normalized_blocks):
        return None
    if user is None:
        return "signin_required"
    if _user_has_delivery_access(asset, user):
        return "granted"
    return "request_access"


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
def get_asset(
    slug: str,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> AssetDetail:
    asset = db.scalar(select(Asset).where(Asset.slug == slug))
    if asset is None or asset.visibility != "public" or asset.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    normalized = normalize_blocks(asset.content_blocks or [], asset.content_schema_version)
    delivery_access = _resolve_delivery_access(asset, normalized.blocks, user)
    include_delivery = delivery_access == "granted"

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
        content_blocks=_filter_public_blocks(normalized.blocks, include_delivery=include_delivery),
        visibility=asset.visibility,
        shared_fields=_normalize_shared_fields(asset),
        sales_fields=_normalize_sales_fields(asset),
        delivery_fields=_normalize_delivery_fields(asset) if include_delivery else None,
        delivery_access=delivery_access,
    )
