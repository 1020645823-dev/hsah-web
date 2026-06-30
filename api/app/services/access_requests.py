"""Access request duplicate detection and approval/rejection logic."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.access_request import AccessRequest

OPEN_STATUSES = {"pending", "approved"}


def find_open_request(
    db: Session, *, user_id: uuid.UUID, asset_id: uuid.UUID
) -> AccessRequest | None:
    return db.scalar(
        select(AccessRequest).where(
            AccessRequest.user_id == user_id,
            AccessRequest.asset_id == asset_id,
            AccessRequest.status.in_(OPEN_STATUSES),
        )
    )


def create_request(
    db: Session,
    *,
    user_id: uuid.UUID,
    asset_id: uuid.UUID,
    purpose: str,
    role: str | None = None,
) -> AccessRequest:
    request = AccessRequest(
        user_id=user_id,
        asset_id=asset_id,
        purpose=purpose.strip(),
        role=role,
        status="pending",
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


def decide_request(
    db: Session,
    request: AccessRequest,
    *,
    decision: str,
    reviewer_id: uuid.UUID,
    reason: str = "",
) -> AccessRequest:
    if decision not in {"approved", "rejected"}:
        raise ValueError("invalid_decision")
    if decision == "rejected" and not reason.strip():
        raise ValueError("reason_required")

    request.status = decision
    request.reviewer_id = reviewer_id
    request.decision_reason = reason.strip()
    request.decided_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(request)
    return request
