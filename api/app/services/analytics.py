"""Analytics event recording and aggregation."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.access_request import AccessRequest
from app.models.analytics_event import AnalyticsEvent
from app.models.asset import Asset
from app.models.asset_engagement import AssetFavorite, AssetFeedback
from app.models.asset_review import AssetReviewRecord
from app.services.asset_quality import evaluate_quality

ALLOWED_EVENT_TYPES = {
    "asset_view",
    "asset_favorite_added",
    "asset_favorite_removed",
    "asset_feedback_submitted",
    "access_request_created",
    "access_request_approved",
    "access_request_rejected",
}


def record_event(
    db: Session,
    *,
    event_type: str,
    user_id: uuid.UUID | None = None,
    asset_id: uuid.UUID | None = None,
    payload: str | None = None,
) -> AnalyticsEvent | None:
    if event_type not in ALLOWED_EVENT_TYPES:
        return None
    event = AnalyticsEvent(
        event_type=event_type,
        user_id=user_id,
        asset_id=asset_id,
        payload=payload,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def build_overview(db: Session) -> dict:
    total_assets = db.scalar(select(func.count()).select_from(Asset)) or 0
    published = db.scalar(select(func.count()).select_from(Asset).where(Asset.status == "published")) or 0
    reviewing = db.scalar(select(func.count()).select_from(Asset).where(Asset.status == "reviewing")) or 0

    # Low quality: any published-eligible asset currently blocked by missing requirements.
    low_quality = 0
    for asset in db.scalars(select(Asset)).all():
        if evaluate_quality(asset).band == "blocked":
            low_quality += 1

    views = db.scalar(select(func.count()).select_from(AnalyticsEvent).where(AnalyticsEvent.event_type == "asset_view")) or 0
    favorites = db.scalar(select(func.count()).select_from(AssetFavorite)) or 0
    feedback = db.scalar(select(func.count()).select_from(AssetFeedback)) or 0
    access_requests = db.scalar(select(func.count()).select_from(AccessRequest)) or 0
    pending_access = db.scalar(select(func.count()).select_from(AccessRequest).where(AccessRequest.status == "pending")) or 0

    approved_requests = db.scalar(select(func.count()).select_from(AccessRequest).where(AccessRequest.status == "approved")) or 0
    rejected_requests = db.scalar(select(func.count()).select_from(AccessRequest).where(AccessRequest.status == "rejected")) or 0
    review_records = db.scalar(select(func.count()).select_from(AssetReviewRecord)) or 0
    rejects = db.scalar(select(func.count()).select_from(AssetReviewRecord).where(AssetReviewRecord.action == "reject")) or 0

    avg_score = 0.0
    assets = db.scalars(select(Asset)).all()
    if assets:
        avg_score = round(sum(evaluate_quality(a).score for a in assets) / len(assets), 1)

    return {
        "content": {
            "total_assets": total_assets,
            "published_assets": published,
            "reviewing_assets": reviewing,
            "low_quality_assets": low_quality,
        },
        "experience": {
            "views": views,
            "favorites": favorites,
            "feedback": feedback,
            "access_requests": access_requests,
        },
        "workflow": {
            "review_records": review_records,
            "rejects": rejects,
            "approved_requests": approved_requests,
            "rejected_requests": rejected_requests,
        },
        "quality": {
            "average_score": avg_score,
            "low_quality_assets": low_quality,
        },
        "governance": {
            "pending_access_requests": pending_access,
            "total_access_requests": access_requests,
        },
    }
