from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from app.models.access_policy import AccessPolicy
from app.models.role import Role
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)


def _auth_user(db_session, email: str, roles: list[str] | None = None) -> tuple[User, str]:
    user = User(email=email, password_hash=hash_password("Password123!"))
    if roles:
        role_objs = []
        for name in roles:
            role = db_session.query(Role).filter_by(name=name).first()
            if role is None:
                role = Role(name=name)
                db_session.add(role)
                db_session.flush()
            role_objs.append(role)
        user.roles = role_objs
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    token = client.post(
        "/api/v1/auth/login", json={"email": email, "password": "Password123!"}
    ).json()["access_token"]
    return user, token


def test_admin_endpoints_allow_with_default_policy(db_session):
    """The seeded default-admin-allow policy grants analytics:read to any authed user."""
    email = f"auth-{datetime.now().timestamp()}@hsah.test"
    _, token = _auth_user(db_session, email)

    response = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_admin_endpoints_deny_unauthenticated(db_session):
    response = client.get("/api/v1/admin/analytics/overview")
    assert response.status_code == 401


def test_deny_policy_overrides_default_allow_for_scoped_role(db_session):
    """A deny policy scoped to a role blocks that role despite the default allow."""
    email = f"blocked-{datetime.now().timestamp()}@hsah.test"
    user, token = _auth_user(db_session, email, roles=["restricted"])

    # Deny analytics:read for the restricted role. This overrides the default allow.
    db_session.add(
        AccessPolicy(
            name=f"deny-analytics-{datetime.now().timestamp()}",
            effect="deny",
            permissions=["analytics:read"],
            role_names=["restricted"],
        )
    )
    db_session.commit()

    response = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "permission_denied"


def test_audit_log_endpoint_requires_audit_log_read(db_session):
    """The audit-logs endpoint enforces audit_log:read, not just authentication."""
    email = f"audit-{datetime.now().timestamp()}@hsah.test"
    user, token = _auth_user(db_session, email, roles=["auditor-blocked"])

    db_session.add(
        AccessPolicy(
            name=f"deny-audit-{datetime.now().timestamp()}",
            effect="deny",
            permissions=["audit_log:read"],
            role_names=["auditor-blocked"],
        )
    )
    db_session.commit()

    response = client.get(
        "/api/v1/admin/audit-logs",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_access_request_review_requires_permission(db_session):
    """A user without access_request:review cannot list admin access requests."""
    email = f"review-{datetime.now().timestamp()}@hsah.test"
    user, token = _auth_user(db_session, email, roles=["no-review"])

    db_session.add(
        AccessPolicy(
            name=f"deny-review-{datetime.now().timestamp()}",
            effect="deny",
            permissions=["access_request:review"],
            role_names=["no-review"],
        )
    )
    db_session.commit()

    response = client.get(
        "/api/v1/admin/access-requests",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_asset_publish_requires_permission(db_session):
    """Asset publish enforces asset:publish."""
    from app.models.asset import Asset

    email = f"publish-{datetime.now().timestamp()}@hsah.test"
    user, token = _auth_user(db_session, email, roles=["no-publish"])

    asset = Asset(
        slug=f"perm-asset-{datetime.now().timestamp()}",
        title="Perm Asset",
        subtitle=None,
        short_description="d",
        cloud_providers=["aws"],
        industries=[],
        technologies=[],
        asset_type="solution",
        status="draft",
        shared_fields={},
        sales_fields={},
    )
    db_session.add(asset)
    db_session.add(
        AccessPolicy(
            name=f"deny-publish-{datetime.now().timestamp()}",
            effect="deny",
            permissions=["asset:publish"],
            role_names=["no-publish"],
        )
    )
    db_session.commit()
    db_session.refresh(asset)

    response = client.post(
        f"/api/v1/admin/assets/{asset.id}/publish",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
