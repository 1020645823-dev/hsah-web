"""Bootstrap a built-in super administrator on every startup.

Runs unconditionally on application startup so that a usable admin account is
always present — regardless of fresh deployments, volume wipes, or image
rebuilds. The whole routine is idempotent and safe to run repeatedly.

Steps:
1. Run `alembic upgrade head` so the schema is current (best-effort).
2. Ensure the `super_admin` role exists.
3. Ensure the admin user exists (reset its password to the configured value so
   env changes take effect) and activate it.
4. Bind the `super_admin` role to the admin user.
5. Ensure a single allow-all policy scoped to `super_admin` is present.

Only the super admin account holds administrative permissions; every other
registered user is implicitly denied (no matching policy).
"""

from __future__ import annotations

import os
import subprocess

from sqlalchemy import select

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.access_policy import AccessPolicy
from app.models.role import Role
from app.models.user import User

SUPER_ADMIN_ROLE = "super_admin"

# Permissions actually enforced via `require_permission(...)` across the API.
SUPER_ADMIN_PERMISSIONS = [
    "asset:submit_review",
    "asset:approve",
    "asset:reject",
    "asset:publish",
    "asset:archive",
    "access_request:review",
    "analytics:read",
    "audit_log:read",
    "collection:manage",
]

SUPER_ADMIN_POLICY_NAME = "super-admin-allow"


def _run_migrations() -> None:
    """Apply pending alembic migrations. Failure is logged, not fatal."""
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            check=False,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(
                "[seed_admin] alembic upgrade head failed (continuing):\n"
                f"{result.stdout}\n{result.stderr}",
                flush=True,
            )
    except FileNotFoundError:
        print("[seed_admin] alembic not found on PATH; skipping migrations", flush=True)
    except Exception as exc:  # pragma: no cover - defensive
        print(f"[seed_admin] migration step raised: {exc}", flush=True)


def seed() -> None:
    _run_migrations()

    admin_email = os.getenv("ADMIN_EMAIL", "admin@hsah.local")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@123")

    try:
        with SessionLocal() as db:
            # 1. Ensure role.
            role = db.scalar(select(Role).where(Role.name == SUPER_ADMIN_ROLE))
            if role is None:
                role = Role(
                    name=SUPER_ADMIN_ROLE,
                    description="Built-in super administrator with full permissions",
                )
                db.add(role)
                db.flush()

            # 2. Ensure user (create or reset password + activate).
            user = db.scalar(select(User).where(User.email == admin_email))
            if user is None:
                user = User(
                    email=admin_email,
                    password_hash=hash_password(admin_password),
                    is_active=True,
                )
                db.add(user)
                db.flush()
                print(f"[seed_admin] created super admin: {admin_email}", flush=True)
            else:
                user.password_hash = hash_password(admin_password)
                user.is_active = True
                db.flush()
                print(f"[seed_admin] super admin already exists, refreshed: {admin_email}", flush=True)

            # 3. Bind role (idempotent).
            if role not in user.roles:
                user.roles.append(role)
                db.flush()

            # 4. Ensure allow-all policy scoped to the super admin role.
            policy = db.scalar(
                select(AccessPolicy).where(AccessPolicy.name == SUPER_ADMIN_POLICY_NAME)
            )
            if policy is None:
                db.add(
                    AccessPolicy(
                        name=SUPER_ADMIN_POLICY_NAME,
                        effect="allow",
                        permissions=SUPER_ADMIN_PERMISSIONS,
                        role_names=[SUPER_ADMIN_ROLE],
                        resource_type=None,
                        resource_visibility=None,
                    )
                )
            else:
                policy.effect = "allow"
                policy.permissions = SUPER_ADMIN_PERMISSIONS
                policy.role_names = [SUPER_ADMIN_ROLE]

            db.commit()
    except Exception as exc:  # pragma: no cover - defensive
        print(f"[seed_admin] failed to seed super admin: {exc}", flush=True)


if __name__ == "__main__":
    seed()
