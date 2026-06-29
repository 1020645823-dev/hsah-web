"""Asset lifecycle transitions and review-record persistence.

Lifecycle vocabulary: draft, reviewing, rejected, published, archived.
Transitions are validated through an explicit matrix so every action is auditable.
"""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.asset_review import AssetReviewRecord
from app.services.asset_quality import missing_requirements

# Explicit transition matrix: action -> { from_status: to_status }
TRANSITIONS: dict[str, dict[str, str]] = {
    "submit_review": {"draft": "reviewing", "rejected": "reviewing"},
    "approve": {"reviewing": "published"},
    "reject": {"reviewing": "rejected"},
    "publish": {"draft": "published", "reviewing": "published", "rejected": "published"},
    "unpublish": {"published": "draft"},
    "archive": {"draft": "archived", "published": "archived", "rejected": "archived", "reviewing": "archived"},
    "restore": {"archived": "draft", "rejected": "draft"},
}

# Actions that require a non-empty reason.
REASON_REQUIRED_ACTIONS = {"reject"}


class InvalidTransitionError(Exception):
    def __init__(self, action: str, current_status: str) -> None:
        self.action = action
        self.current_status = current_status
        super().__init__(f"Action '{action}' not allowed from status '{current_status}'")


class MissingRequirementsError(Exception):
    def __init__(self, fields: list[str]) -> None:
        self.fields = fields
        super().__init__("Asset has missing publish requirements")


def allowed_target_status(action: str, current_status: str) -> str | None:
    return TRANSITIONS.get(action, {}).get(current_status)


def record_transition(
    db: Session,
    asset: Asset,
    action: str,
    *,
    actor_user_id: uuid.UUID | None,
    reason: str = "",
    from_status: str | None = None,
) -> AssetReviewRecord:
    source = from_status or asset.status
    target = allowed_target_status(action, source)
    if target is None:
        raise InvalidTransitionError(action, source)

    if action in REASON_REQUIRED_ACTIONS and not (reason or "").strip():
        raise ValueError("reason_required")

    record = AssetReviewRecord(
        asset_id=asset.id,
        actor_user_id=actor_user_id,
        action=action,
        from_status=source,
        to_status=target,
        reason=(reason or "").strip(),
    )
    db.add(record)
    asset.status = target
    return record


def assert_publishable(asset: Asset) -> None:
    """Raise MissingRequirementsError if the asset cannot be published."""
    fields = missing_requirements(asset)
    if fields:
        raise MissingRequirementsError(fields)
