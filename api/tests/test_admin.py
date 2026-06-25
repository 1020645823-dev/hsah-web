import uuid

from fastapi.testclient import TestClient

from app.main import app


def test_admin_overview_requires_auth() -> None:
    client = TestClient(app)
    res = client.get("/api/v1/admin/overview")
    assert res.status_code == 401


def test_admin_overview_authed() -> None:
    client = TestClient(app)

    email = f"admin-{uuid.uuid4().hex}@example.com"
    password = "P@ssw0rd-123"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert res.status_code in (201, 409)

    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    token = res.json()["access_token"]

    res = client.get("/api/v1/admin/overview", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.json()
    assert "users" in body and "assets" in body
