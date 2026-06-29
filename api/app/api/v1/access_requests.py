import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.db import get_db
from app.models.access_request import AccessRequest
from app.models.asset import Asset
from app.models.user import User
from app.schemas.access_request import (
    AccessRequestCreate,
    AccessRequestDecision,
    AccessRequestResponse,
)
from app.schemas.common import PaginatedResponse
from app.services.access_requests import (
    create_request,
    decide_request,
    find_open_request,
)
from app.services.analytics import record_event
from app.services.audit_log import write as write_audit_log

router = APIRouter(tags=["access-requests"])


def _serialize(request: AccessRequest) -> AccessRequestResponse:
    return AccessRequestResponse(
        id=str(request.id),
        user_id=str(request.user_id),
        asset_id=str(request.asset_id),
        purpose=request.purpose,
        role=request.role,
        status=request.status,
        decision_reason=request.decision_reason,
        decided_at=request.decided_at,
        created_at=request.created_at,
    )


def _get_asset_or_404(asset_id: str, db: Session) -> Asset:
    try:
        uid = uuid.UUID(asset_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="asset_not_found") from exc
    asset = db.scalar(select(Asset).where(Asset.id == uid))
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="asset_not_found")
    return asset


@router.post("/access-requests", response_model=AccessRequestResponse, status_code=status.HTTP_201_CREATED)
def create_access_request(
    payload: AccessRequestCreate,
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AccessRequestResponse:
    asset = _get_asset_or_404(asset_id, db)
    existing = find_open_request(db, user_id=user.id, asset_id=asset.id)
    if existing is not None:
        return _serialize(existing)
    request = create_request(
        db, user_id=user.id, asset_id=asset.id, purpose=payload.purpose, role=payload.role
    )
    record_event(
        db,
        event_type="access_request_created",
        user_id=user.id,
        asset_id=asset.id,
    )
    return _serialize(request)


@router.get("/me/access-requests", response_model=PaginatedResponse[AccessRequestResponse])
def my_access_requests(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PaginatedResponse[AccessRequestResponse]:
    stmt = (
        select(AccessRequest)
        .where(AccessRequest.user_id == user.id)
        .order_by(AccessRequest.created_at.desc())
    )
    rows = db.scalars(stmt.offset(offset).limit(limit)).all()
    total = db.scalar(
        select(func.count()).select_from(AccessRequest).where(AccessRequest.user_id == user.id)
    ) or 0
    return PaginatedResponse(
        items=[_serialize(r) for r in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/admin/access-requests", response_model=PaginatedResponse[AccessRequestResponse])
def list_access_requests(
    status_: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[AccessRequestResponse]:
    stmt = select(AccessRequest).order_by(AccessRequest.created_at.desc())
    if status_ in {"pending", "approved", "rejected"}:
        stmt = stmt.where(AccessRequest.status == status_)
    rows = db.scalars(stmt.offset(offset).limit(limit)).all()
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0
    return PaginatedResponse(
        items=[_serialize(r) for r in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/admin/access-requests/{request_id}/approve", response_model=AccessRequestResponse)
def approve_access_request(
    request_id: str,
    payload: AccessRequestDecision | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AccessRequestResponse:
    request = _get_request_or_404(request_id, db)
    reason = (payload.reason if payload else "")
    try:
        decide_request(db, request, decision="approved", reviewer_id=user.id, reason=reason)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    record_event(
        db,
        event_type="access_request_approved",
        user_id=request.user_id,
        asset_id=request.asset_id,
    )
    write_audit_log(
        db,
        action="access_request.approve",
        resource_type="access_request",
        actor_user_id=user.id,
        resource_id=str(request.id),
        summary="Access request approved",
    )
    return _serialize(request)


@router.post("/admin/access-requests/{request_id}/reject", response_model=AccessRequestResponse)
def reject_access_request(
    request_id: str,
    payload: AccessRequestDecision,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AccessRequestResponse:
    request = _get_request_or_404(request_id, db)
    try:
        decide_request(db, request, decision="rejected", reviewer_id=user.id, reason=payload.reason)
    except ValueError as exc:
        detail = "reason_required" if str(exc) == "reason_required" else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail) from exc
    record_event(
        db,
        event_type="access_request_rejected",
        user_id=request.user_id,
        asset_id=request.asset_id,
    )
    write_audit_log(
        db,
        action="access_request.reject",
        resource_type="access_request",
        actor_user_id=user.id,
        resource_id=str(request.id),
        summary="Access request rejected",
    )
    return _serialize(request)


def _get_request_or_404(request_id: str, db: Session) -> AccessRequest:
    try:
        uid = uuid.UUID(request_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="access_request_not_found") from exc
    request = db.scalar(select(AccessRequest).where(AccessRequest.id == uid))
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="access_request_not_found")
    return request
