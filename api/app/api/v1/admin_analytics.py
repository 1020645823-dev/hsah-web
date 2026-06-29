from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.permissions import require_permission
from app.models.asset import Asset
from app.models.asset_engagement import AssetFavorite, AssetFeedback
from app.models.access_request import AccessRequest
from app.models.analytics_event import AnalyticsEvent
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.analytics import AnalyticsOverview, AssetPerformance
from app.schemas.audit_log import AuditLogResponse
from app.schemas.common import PaginatedResponse
from app.services.analytics import build_overview

router = APIRouter(tags=["admin-analytics"])


@router.get("/admin/analytics/overview", response_model=AnalyticsOverview)
def analytics_overview(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("analytics:read")),
) -> AnalyticsOverview:
    return AnalyticsOverview(**build_overview(db))


@router.get("/admin/analytics/assets/{asset_id}", response_model=AssetPerformance)
def asset_performance(
    asset_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("analytics:read")),
) -> AssetPerformance:
    from app.api.v1.access_requests import _get_asset_or_404

    asset = _get_asset_or_404(asset_id, db)

    views = db.scalar(
        select(func.count())
        .select_from(AnalyticsEvent)
        .where(AnalyticsEvent.event_type == "asset_view", AnalyticsEvent.asset_id == asset.id)
    ) or 0
    favorites = db.scalar(
        select(func.count()).select_from(AssetFavorite).where(AssetFavorite.asset_id == asset.id)
    ) or 0
    feedback = db.scalar(
        select(func.count()).select_from(AssetFeedback).where(AssetFeedback.asset_id == asset.id)
    ) or 0
    access_requests = db.scalar(
        select(func.count()).select_from(AccessRequest).where(AccessRequest.asset_id == asset.id)
    ) or 0

    return AssetPerformance(
        asset_id=str(asset.id),
        slug=asset.slug,
        title=asset.title,
        views=views,
        favorites=favorites,
        feedback=feedback,
        access_requests=access_requests,
    )


@router.get("/admin/audit-logs", response_model=PaginatedResponse[AuditLogResponse])
def audit_logs(
    action: str | None = None,
    resource_type: str | None = None,
    actor_user_id: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("audit_log:read")),
) -> PaginatedResponse[AuditLogResponse]:
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if resource_type:
        stmt = stmt.where(AuditLog.resource_type == resource_type)
    if actor_user_id:
        try:
            from uuid import UUID

            stmt = stmt.where(AuditLog.actor_user_id == UUID(actor_user_id))
        except ValueError:
            return PaginatedResponse(items=[], total=0, limit=limit, offset=offset)

    rows = db.scalars(stmt.offset(offset).limit(limit)).all()
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    return PaginatedResponse(
        items=[
            AuditLogResponse(
                id=str(r.id),
                actor_user_id=str(r.actor_user_id) if r.actor_user_id else None,
                action=r.action,
                resource_type=r.resource_type,
                resource_id=r.resource_id,
                summary=r.summary,
                details=r.details,
                created_at=r.created_at,
            )
            for r in rows
        ],
        total=total,
        limit=limit,
        offset=offset,
    )
