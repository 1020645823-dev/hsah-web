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


def test_create_asset_persists_detail_fields_and_delivery_audience() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _asset_payload()
    payload["shared_fields"] = {
        "introduction": "Shared overview for both sales and delivery teams.",
        "use_cases": ["customer onboarding", "agent operations"],
        "demo_video_url": "https://example.com/demo.mp4",
        "live_demo_url": "https://example.com/live",
    }
    payload["sales_fields"] = {
        "value_summary": "Business-ready accelerators for hyperscaler deals.",
        "differentiators": ["reusable playbooks", "packaged architecture"],
        "outcomes": ["shorter presales cycle"],
    }
    payload["delivery_fields"] = {
        "implementation_summary": "Deployment checklist for project teams.",
        "prerequisites": ["Kubernetes", "Secrets manager"],
        "rollout_steps": ["Provision cluster", "Connect LLM gateway"],
    }
    payload["delivery_allowed_roles"] = ["delivery-engineer"]
    payload["delivery_allowed_users"] = ["lead@example.com"]
    payload["content_blocks"] = [
        {
            "id": "delivery-text-1",
            "type": "text",
            "version": 2,
            "order": 0,
            "visible": True,
            "audience": "delivery",
            "config": {"markdown": "Delivery-only notes", "html": ""},
        }
    ]

    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)

    assert res.status_code == 201
    body = res.json()
    assert body["shared_fields"] == payload["shared_fields"]
    assert body["sales_fields"] == payload["sales_fields"]
    assert body["delivery_fields"] == payload["delivery_fields"]
    assert body["delivery_allowed_roles"] == ["delivery-engineer"]
    assert body["delivery_allowed_users"] == ["lead@example.com"]
    assert body["content_blocks"][0]["audience"] == "delivery"


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


def test_get_asset_normalizes_legacy_blocks_and_returns_content_schema_version() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _asset_payload()
    payload["content_blocks"] = [
        {
            "block_id": "legacy-text-1",
            "block_type": "text",
            "content": "Legacy content",
        }
    ]
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201
    asset_id = res.json()["id"]

    res = client.get(f"/api/v1/admin/assets/{asset_id}", headers=headers)

    assert res.status_code == 200
    body = res.json()
    assert body["content_schema_version"] == 2
    assert body["content_blocks"] == [
        {
            "id": "legacy-text-1",
            "type": "text",
            "version": 2,
            "order": 0,
            "visible": True,
            "config": {
                "markdown": "Legacy content",
                "html": "",
            },
        }
    ]


def test_update_asset_returns_structured_block_errors_for_invalid_image() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/api/v1/admin/assets", json=_asset_payload(), headers=headers)
    assert create_res.status_code == 201
    asset_id = create_res.json()["id"]

    payload = _asset_payload(slug=f"updated-{uuid.uuid4().hex[:8]}")
    payload["content_schema_version"] = 1
    payload["content_blocks"] = [
        {
            "id": "img-1",
            "type": "image",
            "version": 1,
            "order": 0,
            "visible": True,
            "config": {"src": "https://example.com/a.png", "alt": "", "caption": ""},
        }
    ]
    res = client.put(f"/api/v1/admin/assets/{asset_id}", json=payload, headers=headers)

    assert res.status_code == 422
    assert res.json()["detail"] == {
        "code": "content_block_validation_failed",
        "message": "One or more content blocks are invalid",
        "errors": [
            {
                "block_id": "img-1",
                "block_type": "image",
                "field": "config.alt",
                "message": "Alt text is required",
            }
        ],
    }


def test_update_asset_writes_latest_content_schema_and_block_versions() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/api/v1/admin/assets", json=_asset_payload(), headers=headers)
    assert create_res.status_code == 201
    asset_id = create_res.json()["id"]

    payload = _asset_payload(slug=f"updated-{uuid.uuid4().hex[:8]}")
    payload["content_schema_version"] = 1
    payload["content_blocks"] = [
        {
            "block_id": "legacy-callout-1",
            "block_type": "callout",
            "title": "Heads up",
            "content": "Upgrade complete",
        }
    ]
    res = client.put(f"/api/v1/admin/assets/{asset_id}", json=payload, headers=headers)

    assert res.status_code == 200
    body = res.json()
    assert body["content_schema_version"] == 2
    assert body["content_blocks"] == [
        {
            "id": "legacy-callout-1",
            "type": "callout",
            "version": 2,
            "order": 0,
            "visible": True,
            "config": {
                "title": "Heads up",
                "content": "Upgrade complete",
                "tone": "info",
            },
        }
    ]


def test_update_asset_persists_delivery_access_lists() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/api/v1/admin/assets", json=_asset_payload(), headers=headers)
    assert create_res.status_code == 201
    asset_id = create_res.json()["id"]

    payload = _asset_payload(slug=f"delivery-access-{uuid.uuid4().hex[:8]}")
    payload["shared_fields"] = {"introduction": "Updated intro"}
    payload["sales_fields"] = {"value_summary": "Updated sales narrative"}
    payload["delivery_fields"] = {"implementation_summary": "Updated delivery narrative"}
    payload["delivery_allowed_roles"] = ["delivery-engineer", "platform-lead"]
    payload["delivery_allowed_users"] = ["owner@example.com"]
    payload["content_blocks"] = [
        {
            "id": "shared-text-1",
            "type": "text",
            "version": 2,
            "order": 0,
            "visible": True,
            "audience": "shared",
            "config": {"markdown": "Shared notes", "html": ""},
        }
    ]

    res = client.put(f"/api/v1/admin/assets/{asset_id}", json=payload, headers=headers)

    assert res.status_code == 200
    body = res.json()
    assert body["delivery_allowed_roles"] == ["delivery-engineer", "platform-lead"]
    assert body["delivery_allowed_users"] == ["owner@example.com"]
    assert body["shared_fields"] == {"introduction": "Updated intro"}
    assert body["sales_fields"] == {"value_summary": "Updated sales narrative"}
    assert body["delivery_fields"] == {"implementation_summary": "Updated delivery narrative"}
    assert body["content_blocks"][0]["audience"] == "shared"


# ---------------------------------------------------------------------------
# Search blocks tests
# ---------------------------------------------------------------------------


def _asset_payload_with_blocks(slug: str | None = None, blocks: list | None = None) -> dict:
    payload = _asset_payload(slug=slug)
    payload["content_blocks"] = blocks or []
    return payload


def _publishable_asset_payload(slug: str | None = None) -> dict:
    return _asset_payload_with_blocks(
        slug=slug,
        blocks=[
            {
                "type": "text",
                "text": "Visible content for publishing",
                "visible": True,
            }
        ],
    )


def test_publish_asset_requires_visible_content_block() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/api/v1/admin/assets", json=_asset_payload(), headers=headers)
    assert create_res.status_code == 201
    asset_id = create_res.json()["id"]

    publish_res = client.post(f"/api/v1/admin/assets/{asset_id}/publish", headers=headers)

    assert publish_res.status_code == 422
    detail = publish_res.json()["detail"]
    assert detail["code"] == "publish_validation_failed"
    assert "content_blocks" in detail["fields"]


def test_asset_status_transitions() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/api/v1/admin/assets", json=_publishable_asset_payload(), headers=headers)
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


def test_search_blocks_success() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {"type": "text", "text": "This is a unique keyword phrase for testing search."},
        {"type": "stat_card", "label": "Users", "value": "1,000", "description": "Monthly active users"},
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


def test_search_blocks_no_results() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/admin/assets/search-blocks?q=nonexistent_xyz_12345", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 0
    assert body["results"] == []


def test_search_blocks_requires_auth() -> None:
    client = TestClient(app)
    res = client.get("/api/v1/admin/assets/search-blocks?q=test")
    assert res.status_code == 401


def test_search_blocks_with_type_filter() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    blocks = [
        {"type": "text", "text": "Alpha beta gamma delta."},
        {"type": "stat_card", "label": "Alpha metric", "value": "99", "description": "Alpha description"},
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
