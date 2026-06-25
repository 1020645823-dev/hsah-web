import uuid

from fastapi.testclient import TestClient

from app.main import app


def _get_token(client: TestClient) -> str:
    email = f"admin-{uuid.uuid4().hex}@example.com"
    password = "P@ssw0rd-123"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert res.status_code in (201, 409)
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def _asset_payload(slug: str | None = None) -> dict:
    unique = uuid.uuid4().hex[:8]
    return {
        "slug": slug or f"test-asset-{unique}",
        "title": f"Test Asset {unique}",
        "subtitle": "Test Subtitle",
        "short_description": f"Short description {unique}",
        "cloud_providers": ["aws"],
        "industries": ["finance"],
        "technologies": ["kubernetes"],
        "asset_type": "solution",
        "status": "draft",
        "visibility": "public",
        "allowed_roles": [],
        "allowed_users": [],
        "content_blocks": [],
    }


def test_dashboard_requires_auth() -> None:
    client = TestClient(app)
    res = client.get("/api/v1/admin/dashboard")
    assert res.status_code == 401


def test_dashboard_returns_stats() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # Create an asset so dashboard has something to count
    payload = _asset_payload()
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201

    res = client.get("/api/v1/admin/dashboard", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert "users" in body
    assert "assets" in body
    assert body["assets"] >= 1
    assert body["users"] >= 1
