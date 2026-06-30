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
    }


def test_get_asset_not_found() -> None:
    client = TestClient(app)
    token = _get_token(client)

    fake_id = str(uuid.uuid4())
    res = client.get(f"/api/v1/admin/assets/{fake_id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 404
    assert res.json()["detail"]["code"] == "asset_not_found"


def test_get_asset_success() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _asset_payload()
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201
    asset_id = res.json()["id"]

    res = client.get(f"/api/v1/admin/assets/{asset_id}", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["id"] == asset_id
    assert body["slug"] == payload["slug"]
    assert body["title"] == payload["title"]
    assert "content_blocks" not in body
    assert "delivery_fields" not in body


def test_create_asset_success() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _asset_payload()
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201
    body = res.json()
    assert body["slug"] == payload["slug"]
    assert body["title"] == payload["title"]
    assert "id" in body
    assert "content_blocks" not in body


def test_create_asset_persists_detail_fields() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _asset_payload()
    payload["shared_fields"] = {
        "introduction": "Shared overview for both sales and delivery teams.",
        "use_cases": ["customer onboarding", "agent operations"],
        "live_demo_url": "https://example.com/live",
    }
    payload["sales_fields"] = {
        "value_summary": "Business-ready accelerators for hyperscaler deals.",
        "differentiators": ["reusable playbooks", "packaged architecture"],
        "outcomes": ["shorter presales cycle"],
    }

    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)

    assert res.status_code == 201
    body = res.json()
    assert body["shared_fields"]["introduction"] == "Shared overview for both sales and delivery teams."
    assert body["shared_fields"]["use_cases"] == ["customer onboarding", "agent operations"]
    assert body["shared_fields"]["live_demo_url"] == "https://example.com/live"
    assert body["sales_fields"]["value_summary"] == "Business-ready accelerators for hyperscaler deals."


def test_create_asset_slug_conflict() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    slug = f"conflict-slug-{uuid.uuid4().hex[:8]}"
    payload1 = _asset_payload(slug=slug)
    res = client.post("/api/v1/admin/assets", json=payload1, headers=headers)
    assert res.status_code == 201

    payload2 = _asset_payload(slug=slug)
    res = client.post("/api/v1/admin/assets", json=payload2, headers=headers)
    assert res.status_code == 409
    assert res.json()["detail"]["code"] == "slug_already_exists"


def test_update_asset_success() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _asset_payload()
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201
    asset_id = res.json()["id"]

    update_payload = _asset_payload()
    update_payload["title"] = "Updated Title"
    res = client.put(f"/api/v1/admin/assets/{asset_id}", json=update_payload, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["id"] == asset_id
    assert body["title"] == "Updated Title"
    assert "content_blocks" not in body


def test_update_asset_slug_conflict() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload1 = _asset_payload()
    res = client.post("/api/v1/admin/assets", json=payload1, headers=headers)
    assert res.status_code == 201
    asset1_id = res.json()["id"]

    payload2 = _asset_payload()
    res = client.post("/api/v1/admin/assets", json=payload2, headers=headers)
    assert res.status_code == 201

    update_payload = _asset_payload(slug=payload2["slug"])
    res = client.put(f"/api/v1/admin/assets/{asset1_id}", json=update_payload, headers=headers)
    assert res.status_code == 409
    assert res.json()["detail"]["code"] == "slug_already_exists"


def test_delete_asset_success() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _asset_payload()
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201
    asset_id = res.json()["id"]

    res = client.delete(f"/api/v1/admin/assets/{asset_id}", headers=headers)
    assert res.status_code == 204

    res = client.get(f"/api/v1/admin/assets/{asset_id}", headers=headers)
    assert res.status_code == 404


def test_asset_status_transitions() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/api/v1/admin/assets", json=_asset_payload(), headers=headers)
    assert create_res.status_code == 201
    asset_id = create_res.json()["id"]

    publish_res = client.post(f"/api/v1/admin/assets/{asset_id}/publish", headers=headers)
    assert publish_res.status_code == 200
    assert publish_res.json()["status"] == "published"

    unpublish_res = client.post(f"/api/v1/admin/assets/{asset_id}/unpublish", headers=headers)
    assert unpublish_res.status_code == 200
    assert unpublish_res.json()["status"] == "draft"

    archive_res = client.post(f"/api/v1/admin/assets/{asset_id}/archive", headers=headers)
    assert archive_res.status_code == 200
    assert archive_res.json()["status"] == "archived"

    restore_res = client.post(f"/api/v1/admin/assets/{asset_id}/restore", headers=headers)
    assert restore_res.status_code == 200
    assert restore_res.json()["status"] == "draft"


def test_publish_asset_requires_missing_fields() -> None:
    """An asset missing core fields (cloud_providers) cannot be published."""
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _asset_payload()
    payload["cloud_providers"] = []
    create_res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert create_res.status_code == 201
    asset_id = create_res.json()["id"]

    publish_res = client.post(f"/api/v1/admin/assets/{asset_id}/publish", headers=headers)

    assert publish_res.status_code == 422
    detail = publish_res.json()["detail"]
    assert detail["code"] == "publish_validation_failed"
    assert "cloud_providers" in detail["fields"]
    assert "content_blocks" not in detail["fields"]


# ---------------------------------------------------------------------------
# Video validation tests
# ---------------------------------------------------------------------------


def test_create_asset_with_multiple_primary_videos_returns_422():
    """同一 asset 不允许有多个主视频。"""
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/v1/admin/assets",
        json={
            "slug": "multi-primary-test",
            "title": "Multi Primary",
            "short_description": "desc",
            "asset_type": "solution",
            "status": "draft",
            "visibility": "public",
            "shared_fields": {
                "videos": [
                    {"id": "v1", "title": "A", "video_url": "https://example.com/a.mp4", "is_primary": True},
                    {"id": "v2", "title": "B", "video_url": "https://example.com/b.mp4", "is_primary": True},
                ],
            },
        },
        headers=headers,
    )
    assert resp.status_code == 422


def test_create_asset_with_videos_auto_sets_primary():
    """当提交的视频列表无主视频时，服务端自动将第一条设为主视频。"""
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/v1/admin/assets",
        json={
            "slug": "auto-primary-test",
            "title": "Auto Primary",
            "short_description": "desc",
            "asset_type": "solution",
            "status": "draft",
            "visibility": "public",
            "shared_fields": {
                "videos": [
                    {"id": "v1", "title": "A", "video_url": "https://example.com/a.mp4", "is_primary": False},
                    {"id": "v2", "title": "B", "video_url": "https://example.com/b.mp4", "is_primary": False},
                ],
            },
        },
        headers=headers,
    )
    assert resp.status_code in (200, 201)
    videos = resp.json()["shared_fields"]["videos"]
    primaries = [v for v in videos if v.get("is_primary", False)]
    assert len(primaries) == 1
    assert primaries[0]["id"] == "v1"
