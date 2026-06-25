import uuid

from fastapi.testclient import TestClient

from app.main import app


def _register_and_login(client: TestClient) -> tuple[str, str]:
    email = f"rbac-{uuid.uuid4().hex}@example.com"
    password = "P@ssw0rd-123"

    res = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert res.status_code == 201
    user_id = res.json()["id"]

    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return user_id, token


def test_rbac_admin_endpoints_require_auth() -> None:
    client = TestClient(app)

    assert client.get("/api/v1/admin/roles").status_code == 401
    assert client.get("/api/v1/admin/policies").status_code == 401
    assert client.post(
        "/api/v1/admin/permissions/simulate",
        json={"permission": "assets.read", "resource_type": "asset"},
    ).status_code == 401


def test_rbac_role_policy_and_simulation_flow() -> None:
    client = TestClient(app)
    user_id, token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    role_res = client.post(
        "/api/v1/admin/roles",
        json={
            "name": f"asset-reader-{uuid.uuid4().hex[:8]}",
            "description": "Can read restricted assets",
            "user_ids": [user_id],
        },
        headers=headers,
    )
    assert role_res.status_code == 201
    role_body = role_res.json()
    assert role_body["name"].startswith("asset-reader-")
    assert user_id in role_body["user_ids"]

    policy_res = client.post(
        "/api/v1/admin/policies",
        json={
            "name": f"allow-restricted-{uuid.uuid4().hex[:8]}",
            "effect": "allow",
            "permissions": ["assets.read"],
            "role_names": [role_body["name"]],
            "resource_type": "asset",
            "resource_visibility": "restricted",
        },
        headers=headers,
    )
    assert policy_res.status_code == 201
    assert policy_res.json()["effect"] == "allow"

    simulate_allow_res = client.post(
        "/api/v1/admin/permissions/simulate",
        json={
            "user_id": user_id,
            "permission": "assets.read",
            "resource_type": "asset",
            "resource_visibility": "restricted",
        },
        headers=headers,
    )
    assert simulate_allow_res.status_code == 200
    assert simulate_allow_res.json()["decision"] == "allow"

    simulate_implicit_deny_res = client.post(
        "/api/v1/admin/permissions/simulate",
        json={
            "user_id": user_id,
            "permission": "assets.manage",
            "resource_type": "asset",
            "resource_visibility": "restricted",
        },
        headers=headers,
    )
    assert simulate_implicit_deny_res.status_code == 200
    assert simulate_implicit_deny_res.json()["decision"] == "implicit_deny"
    assert simulate_implicit_deny_res.json()["missing_permissions"] == ["assets.manage"]

    deny_policy_res = client.post(
        "/api/v1/admin/policies",
        json={
            "name": f"deny-restricted-{uuid.uuid4().hex[:8]}",
            "effect": "deny",
            "permissions": ["assets.read"],
            "role_names": [role_body["name"]],
            "resource_type": "asset",
            "resource_visibility": "restricted",
        },
        headers=headers,
    )
    assert deny_policy_res.status_code == 201

    simulate_deny_res = client.post(
        "/api/v1/admin/permissions/simulate",
        json={
            "user_id": user_id,
            "permission": "assets.read",
            "resource_type": "asset",
            "resource_visibility": "restricted",
        },
        headers=headers,
    )
    assert simulate_deny_res.status_code == 200
    deny_body = simulate_deny_res.json()
    assert deny_body["decision"] == "deny"
    assert deny_body["matched_roles"] == [role_body["name"]]
    assert {policy["effect"] for policy in deny_body["matched_policies"]} == {"allow", "deny"}
