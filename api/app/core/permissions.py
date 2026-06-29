"""Permission enforcement for administrative actions.

Reuses the same policy-matching algorithm as the permission simulator
(`app.api.v1.admin.simulate_permission`) so that simulation and live
enforcement agree on every decision.

Resolution rules (mirrors the simulator):
1. Collect the user's role names.
2. A policy matches when its role_names are empty OR intersect the user's roles,
   and the required permission is in policy.permissions.
3. If any matching policy has effect "deny", access is denied.
4. If any matching policy has effect "allow", access is granted.
5. Otherwise access is implicitly denied.
"""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.auth import get_current_user
from app.core.db import get_db
from app.models.access_policy import AccessPolicy
from app.models.user import User


def _resolve_decision(user: User, policies: list[AccessPolicy], permission: str) -> bool:
    user_roles = {role.name for role in user.roles}
    matched: list[AccessPolicy] = []
    for policy in policies:
        role_match = not policy.role_names or bool(set(policy.role_names) & user_roles)
        if not role_match:
            continue
        if permission not in (policy.permissions or []):
            continue
        matched.append(policy)

    if any(policy.effect == "deny" for policy in matched):
        return False
    return any(policy.effect == "allow" for policy in matched)


def user_has_permission(db: Session, user: User, permission: str) -> bool:
    """Check whether a user is allowed a permission given the current policies."""
    policies = list(db.scalars(select(AccessPolicy).order_by(AccessPolicy.created_at.asc())).all())
    # Ensure roles are loaded for the comparison.
    if not user.roles:
        fresh = db.scalar(
            select(User).options(selectinload(User.roles)).where(User.id == user.id)
        )
        if fresh is not None:
            user = fresh
    return _resolve_decision(user, policies, permission)


def require_permission(permission: str):
    """FastAPI dependency that denies access unless the user holds `permission`."""

    def _dependency(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if not user_has_permission(db, user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "permission_denied", "message": "Insufficient permissions"},
            )
        return user

    return _dependency
