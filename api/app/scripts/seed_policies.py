from sqlalchemy import select

from app.core.db import SessionLocal
from app.models.access_policy import AccessPolicy

# Default allow policy that grants all administrative permissions to every
# authenticated user. This mirrors the prototype's current behaviour (any
# authenticated user is treated as an admin) while providing a real
# enforcement layer that role-scoped policies can override later.
# Empty role_names means "matches any role" in the policy resolver.
DEFAULT_ADMIN_POLICY_NAME = "default-admin-allow"

ADMIN_PERMISSIONS = [
    "asset:submit_review",
    "asset:approve",
    "asset:reject",
    "asset:publish",
    "asset:archive",
    "asset:manage",
    "access_request:review",
    "analytics:read",
    "audit_log:read",
    "collection:manage",
    "user:manage",
    "role:manage",
    "policy:manage",
]


def seed() -> None:
    with SessionLocal() as db:
        existing = db.scalar(
            select(AccessPolicy.id).where(AccessPolicy.name == DEFAULT_ADMIN_POLICY_NAME).limit(1)
        )
        if existing is not None:
            return

        db.add(
            AccessPolicy(
                name=DEFAULT_ADMIN_POLICY_NAME,
                effect="allow",
                permissions=ADMIN_PERMISSIONS,
                role_names=[],
                resource_type=None,
                resource_visibility=None,
            )
        )
        db.commit()


if __name__ == "__main__":
    seed()
