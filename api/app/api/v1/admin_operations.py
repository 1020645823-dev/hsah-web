from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.db import get_db
from app.models.access_request import AccessRequest
from app.models.asset import Asset
from app.models.asset_review import AssetReviewRecord
from app.models.user import User
from app.schemas.operations import (
    OperationsOverview,
    OperationsTask,
    OperationsTasks,
    RecentActivities,
    RecentActivity,
)
from app.services.asset_quality import evaluate_quality

router = APIRouter(prefix="/admin/operations", tags=["admin-operations"])


@router.get("/overview", response_model=OperationsOverview)
def overview(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> OperationsOverview:
    total = db.scalar(select(func.count()).select_from(Asset)) or 0
    published = db.scalar(select(func.count()).select_from(Asset).where(Asset.status == "published")) or 0
    reviewing = db.scalar(select(func.count()).select_from(Asset).where(Asset.status == "reviewing")) or 0

    low_quality = sum(
        1 for a in db.scalars(select(Asset)).all() if evaluate_quality(a).band == "blocked"
    )
    pending_access = db.scalar(
        select(func.count()).select_from(AccessRequest).where(AccessRequest.status == "pending")
    ) or 0

    return OperationsOverview(
        total_assets=total,
        published_assets=published,
        reviewing_assets=reviewing,
        low_quality_assets=low_quality,
        pending_access_requests=pending_access,
    )


@router.get("/tasks", response_model=OperationsTasks)
def tasks(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> OperationsTasks:
    """Build a prioritized work queue from reviewing, rejected, blocked, and published assets."""
    priorities = {"reviewing": "high", "rejected": "high", "draft": "medium", "published": "low"}
    items: list[OperationsTask] = []

    for asset in db.scalars(select(Asset)).all():
        result = evaluate_quality(asset)
        if asset.status == "reviewing":
            reason = "Awaiting review"
        elif asset.status == "rejected":
            reason = "Rejected — needs revision"
        elif result.band == "blocked":
            reason = f"Blocked: {', '.join(result.missing)}"
        elif asset.status == "published":
            continue
        else:
            reason = f"Needs work: {', '.join(result.warnings)}" if result.warnings else "Incomplete"
        items.append(
            OperationsTask(
                asset_id=str(asset.id),
                slug=asset.slug,
                title=asset.title,
                status=asset.status,
                reason=reason,
                priority=priorities.get(asset.status, "medium"),
                target_url=f"/admin/assets/{asset.id}/edit",
            )
        )

    priority_order = {"high": 0, "medium": 1, "low": 2}
    items.sort(key=lambda t: (priority_order.get(t.priority, 9), t.title.lower()))
    total = len(items)
    return OperationsTasks(items=items[offset : offset + limit], total=total)


@router.get("/recent-activities", response_model=RecentActivities)
def recent_activities(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> RecentActivities:
    rows = db.execute(
        select(AssetReviewRecord, Asset)
        .join(Asset, AssetReviewRecord.asset_id == Asset.id)
        .order_by(AssetReviewRecord.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    items = [
        RecentActivity(
            id=str(record.id),
            asset_id=str(asset.id),
            asset_title=asset.title,
            action=record.action,
            from_status=record.from_status,
            to_status=record.to_status,
            reason=record.reason,
            created_at=record.created_at.isoformat(),
        )
        for record, asset in rows
    ]

    total = db.scalar(select(func.count()).select_from(AssetReviewRecord)) or 0
    return RecentActivities(items=items, total=total)
