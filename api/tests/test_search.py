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


def _asset_payload(slug: str | None = None, blocks: list | None = None) -> dict:
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


# ---------------------------------------------------------------------------
# Search by keyword
# ---------------------------------------------------------------------------

def test_search_by_keyword_text_block() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {"type": "text", "content": "This is a unique keyword phrase for testing search."},
    ]
    payload = _asset_payload(blocks=blocks)
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201

    res = client.get("/api/v1/admin/assets/search-blocks?q=unique+keyword+phrase", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["query"] == "unique keyword phrase"
    assert body["total"] >= 1
    matched = next(r for r in body["results"] if r["asset_name"] == payload["title"])
    assert matched["matched_field"] == "config.markdown"
    assert matched["block"]["type"] == "text"


def test_search_by_keyword_stat_card_block() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {"type": "stat_card", "stats": [{"label": "Monthly Users", "value": "1,000"}]},
    ]
    payload = _asset_payload(blocks=blocks)
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201

    res = client.get("/api/v1/admin/assets/search-blocks?q=monthly+users", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    matched = next(r for r in body["results"] if r["asset_name"] == payload["title"])
    assert matched["matched_field"] == "config.stats.label"

    res = client.get("/api/v1/admin/assets/search-blocks?q=1%2C000", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    matched = next(r for r in body["results"] if r["asset_name"] == payload["title"])
    assert matched["matched_field"] == "config.stats.value"


def test_search_by_keyword_image_block() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {
            "type": "image",
            "src": "https://example.com/architecture.png",
            "alt": "Architecture diagram",
            "caption": "System overview",
        },
    ]
    payload = _asset_payload(blocks=blocks)
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201

    res = client.get("/api/v1/admin/assets/search-blocks?q=architecture+diagram", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    matched = next(r for r in body["results"] if r["asset_name"] == payload["title"])
    assert matched["matched_field"] == "config.alt"

    res = client.get("/api/v1/admin/assets/search-blocks?q=system+overview", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    matched = next(r for r in body["results"] if r["asset_name"] == payload["title"])
    assert matched["matched_field"] == "config.caption"


def test_search_by_keyword_code_snippet_block() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {"type": "code_snippet", "code": "def hello_world(): pass", "language": "python"},
    ]
    payload = _asset_payload(blocks=blocks)
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201

    res = client.get("/api/v1/admin/assets/search-blocks?q=hello_world", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    matched = next(r for r in body["results"] if r["asset_name"] == payload["title"])
    assert matched["matched_field"] == "config.code"

    res = client.get("/api/v1/admin/assets/search-blocks?q=python", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    matched = next(r for r in body["results"] if r["asset_name"] == payload["title"])
    assert matched["matched_field"] == "config.language"


def test_search_by_keyword_callout_block() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {"type": "callout", "title": "Important Note", "content": "Please read carefully."},
    ]
    payload = _asset_payload(blocks=blocks)
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201

    res = client.get("/api/v1/admin/assets/search-blocks?q=important+note", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    matched = next(r for r in body["results"] if r["asset_name"] == payload["title"])
    assert matched["matched_field"] == "config.title"

    res = client.get("/api/v1/admin/assets/search-blocks?q=read+carefully", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    matched = next(r for r in body["results"] if r["asset_name"] == payload["title"])
    assert matched["matched_field"] == "config.content"


# ---------------------------------------------------------------------------
# Search with type filter
# ---------------------------------------------------------------------------

def test_search_with_type_filter() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {"type": "text", "content": "Alpha beta gamma delta."},
        {"type": "stat_card", "stats": [{"label": "Alpha metric", "value": "99"}]},
    ]
    payload = _asset_payload(blocks=blocks)
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
    assert body["type_filter"] == "stat_card"
    assert body["total"] >= 1
    for r in body["results"]:
        assert r["block"]["type"] == "stat_card"


# ---------------------------------------------------------------------------
# Empty results
# ---------------------------------------------------------------------------

def test_search_empty_results() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/admin/assets/search-blocks?q=nonexistent_xyz_12345", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 0
    assert body["results"] == []
    assert body["query"] == "nonexistent_xyz_12345"


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------

def test_search_pagination() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # Create an asset with multiple matching blocks
    blocks = [
        {"type": "text", "content": "Pagination test block one."},
        {"type": "text", "content": "Pagination test block two."},
        {"type": "text", "content": "Pagination test block three."},
    ]
    payload = _asset_payload(blocks=blocks)
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201

    # limit=1 should return only 1 result
    res = client.get("/api/v1/admin/assets/search-blocks?q=Pagination+test&limit=1", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["limit"] == 1
    assert body["total"] >= 3
    assert len(body["results"]) == 1

    # offset=1, limit=1 should return the second result
    res = client.get("/api/v1/admin/assets/search-blocks?q=Pagination+test&limit=1&offset=1", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["offset"] == 1
    assert body["limit"] == 1
    assert len(body["results"]) == 1
    # The second block should be different from the first
    first_res = client.get("/api/v1/admin/assets/search-blocks?q=Pagination+test&limit=1&offset=0", headers=headers)
    assert first_res.status_code == 200
    first_block = first_res.json()["results"][0]["block"]
    second_block = body["results"][0]["block"]
    assert first_block != second_block


# ---------------------------------------------------------------------------
# Optional q parameter (no keyword)
# ---------------------------------------------------------------------------

def test_search_without_keyword() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {"type": "text", "content": "No keyword filter test."},
    ]
    payload = _asset_payload(blocks=blocks)
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201

    # Without q, should return all blocks (optionally filtered by type)
    res = client.get("/api/v1/admin/assets/search-blocks?type=text", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["query"] is None
    assert body["type_filter"] == "text"
    assert body["total"] >= 1
    for r in body["results"]:
        assert r["block"]["type"] == "text"


# ---------------------------------------------------------------------------
# Auth required
# ---------------------------------------------------------------------------

def test_search_requires_auth() -> None:
    client = TestClient(app)
    res = client.get("/api/v1/admin/assets/search-blocks?q=test")
    assert res.status_code == 401
