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


def _asset_payload_with_blocks(slug: str | None = None, blocks: list | None = None) -> dict:
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
        "content_blocks": blocks or [],
    }


def test_blocks_search_requires_auth() -> None:
    client = TestClient(app)
    res = client.get("/api/v1/admin/assets/search-blocks?q=test")
    assert res.status_code == 401


def test_blocks_search_no_results() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/admin/assets/search-blocks?q=nonexistent_xyz_12345", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 0
    assert body["results"] == []


def test_blocks_search_with_text_block() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {"type": "text", "content": "This is a unique keyword phrase for testing search."},
    ]
    payload = _asset_payload_with_blocks(blocks=blocks)
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201

    res = client.get("/api/v1/admin/assets/search-blocks?q=unique+keyword+phrase", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    assert any(r["asset_name"] == payload["title"] for r in body["results"])
    matched = next(r for r in body["results"] if r["asset_name"] == payload["title"])
    assert matched["matched_field"] == "config.markdown"
    assert matched["block"]["type"] == "text"


def test_blocks_search_with_stat_card_block() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {"type": "stat_card", "stats": [{"label": "Users", "value": "1,000", "description": "Monthly active users"}]},
    ]
    payload = _asset_payload_with_blocks(blocks=blocks)
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201

    res = client.get("/api/v1/admin/assets/search-blocks?q=monthly+active", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    matched = next(r for r in body["results"] if r["asset_name"] == payload["title"])
    assert matched["block"]["type"] == "stat_card"


def test_blocks_search_with_type_filter() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {"type": "text", "content": "Alpha beta gamma delta."},
        {"type": "stat_card", "stats": [{"label": "Alpha metric", "value": "99", "description": "Alpha description"}]},
    ]
    payload = _asset_payload_with_blocks(blocks=blocks)
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201

    # Search without type filter should return both blocks
    res = client.get("/api/v1/admin/assets/search-blocks?q=Alpha", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 2

    # Search with type filter should return only stat_card blocks
    res = client.get("/api/v1/admin/assets/search-blocks?q=Alpha&type=stat_card", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    for r in body["results"]:
        assert r["block"]["type"] == "stat_card"


def test_blocks_search_pagination() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {"type": "text", "content": "Pagination test keyword one."},
        {"type": "text", "content": "Pagination test keyword two."},
        {"type": "text", "content": "Pagination test keyword three."},
    ]
    payload = _asset_payload_with_blocks(blocks=blocks)
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201

    res = client.get("/api/v1/admin/assets/search-blocks?q=Pagination+test+keyword&limit=1&offset=0", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 3
    assert len(body["results"]) == 1
    assert body["limit"] == 1
    assert body["offset"] == 0

    res = client.get("/api/v1/admin/assets/search-blocks?q=Pagination+test+keyword&limit=1&offset=1", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert len(body["results"]) == 1
    assert body["offset"] == 1
