import uuid

from fastapi.testclient import TestClient

from app.main import app


def _register_and_login(client: TestClient) -> tuple[str, str]:
    email = f"policy-test-{uuid.uuid4().hex}@example.com"
    password = "P@ssw0rd-123"

    res = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert res.status_code == 201
    user_id = res.json()["id"]

    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return user_id, token


def test_update_policy_success() -> None:
    client = TestClient(app)
    _, token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/admin/policies",
        json={
            "name": f"policy-{uuid.uuid4().hex[:8]}",
            "effect": "allow",
            "permissions": ["assets.read"],
            "role_names": [],
            "resource_type": "asset",
            "resource_visibility": "restricted",
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    policy_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/v1/admin/policies/{policy_id}",
        json={
            "name": f"updated-{uuid.uuid4().hex[:8]}",
            "effect": "deny",
            "permissions": ["assets.read", "assets.manage"],
            "role_names": [],
            "resource_type": "asset",
            "resource_visibility": "public",
        },
        headers=headers,
    )
    assert update_res.status_code == 200
    body = update_res.json()
    assert body["id"] == policy_id
    assert body["effect"] == "deny"
    assert body["permissions"] == ["assets.read", "assets.manage"]
    assert body["resource_visibility"] == "public"


def test_delete_policy_success() -> None:
    client = TestClient(app)
    _, token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/admin/policies",
        json={
            "name": f"policy-del-{uuid.uuid4().hex[:8]}",
            "effect": "allow",
            "permissions": ["assets.read"],
            "role_names": [],
            "resource_type": None,
            "resource_visibility": None,
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    policy_id = create_res.json()["id"]

    delete_res = client.delete(f"/api/v1/admin/policies/{policy_id}", headers=headers)
    assert delete_res.status_code == 204

    get_res = client.get("/api/v1/admin/policies", headers=headers)
    assert get_res.status_code == 200
    data = get_res.json()
    policies = data["items"]
    assert not any(p["id"] == policy_id for p in policies)
