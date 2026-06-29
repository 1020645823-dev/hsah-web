"""Audit log writer for critical administrative actions."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def write(
    db: Session,
    *,
    action: str,
    resource_type: str,
    actor_user_id: uuid.UUID | None,
    resource_id: str | None = None,
    summary: str = "",
    details: dict | None = None,
) -> AuditLog:
    entry = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        summary=summary,
        details=details or {},
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
