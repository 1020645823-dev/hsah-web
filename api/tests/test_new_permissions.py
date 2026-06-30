from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from app.models.access_policy import AccessPolicy
from app.models.role import Role
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)


def _auth_user(db_session, email: str, roles: list[str] = []) -> tuple[User, str]:
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


def test_permission_simulator_handles_new_permission_names(db_session):
    """New permission points (asset:approve, access_request:review, etc.) flow through simulation."""
    email = f"perm-{datetime.now().timestamp()}@hsah.test"
    user, token = _auth_user(db_session, email, roles=["reviewer"])

    policy = AccessPolicy(
        name="reviewer-can-approve",
        effect="allow",
        permissions=["asset:submit_review", "asset:approve"],
        role_names=["reviewer"],
        resource_type=None,
        resource_visibility=None,
    )
    db_session.add(policy)
    db_session.commit()

    response = client.post(
        "/api/v1/admin/permissions/simulate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "permission": "asset:approve",
            "resource_type": "asset",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["decision"] == "allow"
    assert "reviewer" in body["matched_roles"]


def test_permission_simulator_implicit_deny_for_unmapped_permission(db_session):
    email = f"deny-{datetime.now().timestamp()}@hsah.test"
    user, token = _auth_user(db_session, email, roles=["viewer"])

    # Use a permission that no seeded policy grants.
    response = client.post(
        "/api/v1/admin/permissions/simulate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "permission": "nonexistent:capability",
            "resource_type": "unknown",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["decision"] == "implicit_deny"
    assert "nonexistent:capability" in body["missing_permissions"]
