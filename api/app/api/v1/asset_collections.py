from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.asset import Asset
from app.models.asset_collection import AssetCollection, AssetCollectionItem
from app.schemas.asset_collection import (
    CollectionDetail,
    CollectionItemSummary,
    CollectionSummary,
)
from app.services.asset_quality import evaluate_quality  # noqa: F401  (kept for parity)

router = APIRouter(prefix="/assets/collections", tags=["asset-collections"])


def _to_summary(collection: AssetCollection, item_count: int) -> CollectionSummary:
    return CollectionSummary(
        id=str(collection.id),
        slug=collection.slug,
        title=collection.title,
        summary=collection.summary,
        cover_url=collection.cover_url,
        item_count=item_count,
    )


@router.get("", response_model=list[CollectionSummary])
def list_collections(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[CollectionSummary]:
    collections = db.scalars(
        select(AssetCollection)
        .where(AssetCollection.is_visible.is_(True))
        .order_by(AssetCollection.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    result: list[CollectionSummary] = []
    for collection in collections:
        item_count = db.scalar(
            select(func.count())
            .select_from(AssetCollectionItem)
            .join(Asset, AssetCollectionItem.asset_id == Asset.id)
            .where(
                AssetCollectionItem.collection_id == collection.id,
                Asset.visibility == "public",
                Asset.status == "published",
            )
        ) or 0
        result.append(_to_summary(collection, item_count))
    return result


@router.get("/{slug}", response_model=CollectionDetail)
def get_collection(slug: str, db: Session = Depends(get_db)) -> CollectionDetail:
    collection = db.scalar(select(AssetCollection).where(AssetCollection.slug == slug))
    if collection is None or not collection.is_visible:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="collection_not_found")

    rows = db.execute(
        select(Asset, AssetCollectionItem.position)
        .join(AssetCollectionItem, AssetCollectionItem.asset_id == Asset.id)
        .where(
            AssetCollectionItem.collection_id == collection.id,
            Asset.visibility == "public",
            Asset.status == "published",
        )
        .order_by(AssetCollectionItem.position.asc(), Asset.title.asc())
    ).all()

    return CollectionDetail(
        id=str(collection.id),
        slug=collection.slug,
        title=collection.title,
        summary=collection.summary,
        cover_url=collection.cover_url,
        items=[
            CollectionItemSummary(
                id=str(asset.id),
                slug=asset.slug,
                title=asset.title,
                subtitle=asset.subtitle,
                short_description=asset.short_description,
                cloud_providers=asset.cloud_providers,
                asset_type=asset.asset_type,
                position=position,
            )
            for asset, position in rows
        ],
    )
