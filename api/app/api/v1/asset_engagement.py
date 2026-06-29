import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, get_optional_user
from app.core.db import get_db
from app.models.asset import Asset
from app.models.asset_engagement import AssetFavorite, AssetFeedback
from app.models.user import User
from app.schemas.asset_engagement import (
    FavoriteResponse,
    FeedbackCreateRequest,
    FeedbackResponse,
    RelatedAssetSummary,
)
from app.services.asset_recommendations import related_assets
from app.services.analytics import record_event

router = APIRouter(prefix="/assets", tags=["asset-engagement"])


def _get_published_asset_or_404(asset_id: str, db: Session) -> Asset:
    try:
        uid = uuid.UUID(asset_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="asset_not_found") from exc
    asset = db.scalar(
        select(Asset).where(Asset.id == uid, Asset.visibility == "public", Asset.status == "published")
    )
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="asset_not_found")
    return asset


@router.get("/{asset_id}/related", response_model=list[RelatedAssetSummary])
def get_related(
    asset_id: str,
    limit: int = 4,
    db: Session = Depends(get_db),
) -> list[RelatedAssetSummary]:
    asset = _get_published_asset_or_404(asset_id, db)
    pairs = related_assets(db, asset, limit=limit)
    return [
        RelatedAssetSummary(
            id=str(other.id),
            slug=other.slug,
            title=other.title,
            subtitle=other.subtitle,
            short_description=other.short_description,
            cloud_providers=other.cloud_providers,
            asset_type=other.asset_type,
            match_score=score,
        )
        for other, score in pairs
    ]


@router.post("/{asset_id}/favorite", response_model=FavoriteResponse)
def add_favorite(
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> FavoriteResponse:
    asset = _get_published_asset_or_404(asset_id, db)
    existing = db.scalar(
        select(AssetFavorite).where(
            AssetFavorite.user_id == user.id, AssetFavorite.asset_id == asset.id
        )
    )
    if existing is None:
        favorite = AssetFavorite(user_id=user.id, asset_id=asset.id)
        db.add(favorite)
        db.commit()
        record_event(
            db,
            event_type="asset_favorite_added",
            user_id=user.id,
            asset_id=asset.id,
        )
    return FavoriteResponse(id=str(asset.id), asset_id=str(asset.id), is_favorite=True)


@router.delete("/{asset_id}/favorite", response_model=FavoriteResponse)
def remove_favorite(
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> FavoriteResponse:
    asset = _get_published_asset_or_404(asset_id, db)
    existing = db.scalar(
        select(AssetFavorite).where(
            AssetFavorite.user_id == user.id, AssetFavorite.asset_id == asset.id
        )
    )
    if existing is not None:
        db.delete(existing)
        db.commit()
        record_event(
            db,
            event_type="asset_favorite_removed",
            user_id=user.id,
            asset_id=asset.id,
        )
    return FavoriteResponse(id=str(asset.id), asset_id=str(asset.id), is_favorite=False)


@router.post("/{asset_id}/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    asset_id: str,
    payload: FeedbackCreateRequest,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> FeedbackResponse:
    asset = _get_published_asset_or_404(asset_id, db)
    feedback = AssetFeedback(
        user_id=user.id if user else None,
        asset_id=asset.id,
        feedback_type=payload.feedback_type,
        message=payload.message.strip(),
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    record_event(
        db,
        event_type="asset_feedback_submitted",
        user_id=user.id if user else None,
        asset_id=asset.id,
        payload=payload.feedback_type,
    )
    return FeedbackResponse(
        id=str(feedback.id),
        asset_id=str(feedback.asset_id),
        feedback_type=feedback.feedback_type,
        message=feedback.message,
        created_at=feedback.created_at,
    )
