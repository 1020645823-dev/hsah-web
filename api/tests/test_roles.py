import uuid

from fastapi.testclient import TestClient

from app.main import app


def _register_and_login(client: TestClient) -> tuple[str, str]:
    email = f"role-test-{uuid.uuid4().hex}@example.com"
    password = "P@ssw0rd-123"

    res = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert res.status_code == 201
    user_id = res.json()["id"]

    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return user_id, token


def test_update_role_success() -> None:
    client = TestClient(app)
    user_id, token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/admin/roles",
        json={"name": f"role-{uuid.uuid4().hex[:8]}", "description": "original", "user_ids": [user_id]},
        headers=headers,
    )
    assert create_res.status_code == 201
    role_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/v1/admin/roles/{role_id}",
        json={"name": f"updated-{uuid.uuid4().hex[:8]}", "description": "updated desc", "user_ids": []},
        headers=headers,
    )
    assert update_res.status_code == 200
    body = update_res.json()
    assert body["id"] == role_id
    assert body["description"] == "updated desc"
    assert body["user_ids"] == []


def test_delete_role_success() -> None:
    client = TestClient(app)
    user_id, token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/admin/roles",
        json={"name": f"role-del-{uuid.uuid4().hex[:8]}", "description": "to delete", "user_ids": [user_id]},
        headers=headers,
    )
    assert create_res.status_code == 201
    role_id = create_res.json()["id"]

    delete_res = client.delete(f"/api/v1/admin/roles/{role_id}", headers=headers)
    assert delete_res.status_code == 204

    get_res = client.get(f"/api/v1/admin/roles", headers=headers)
    assert get_res.status_code == 200
    data = get_res.json()
    roles = data["items"]
    assert not any(r["id"] == role_id for r in roles)
