import uuid

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.asset import Asset


def test_list_assets_returns_only_public_published(db_session: Session) -> None:
    client = TestClient(app)
    suffix = "phase8-public-filter"
    visible_asset = Asset(
        slug=f"published-{suffix}",
        title="Published Asset",
        subtitle=None,
        short_description=f"Visible asset {suffix}",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="published",
        visibility="public",
        content_blocks=[{"type": "text", "text": "visible"}],
        allowed_roles=[],
        allowed_users=[],
    )
    draft_asset = Asset(
        slug=f"draft-{suffix}",
        title="Draft Asset",
        subtitle=None,
        short_description=f"Hidden draft {suffix}",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="draft",
        visibility="public",
        content_blocks=[{"type": "text", "text": "draft"}],
        allowed_roles=[],
        allowed_users=[],
    )
    archived_asset = Asset(
        slug=f"archived-{suffix}",
        title="Archived Asset",
        subtitle=None,
        short_description=f"Hidden archived {suffix}",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="archived",
        visibility="public",
        content_blocks=[{"type": "text", "text": "archived"}],
        allowed_roles=[],
        allowed_users=[],
    )
    restricted_asset = Asset(
        slug=f"restricted-{suffix}",
        title="Restricted Asset",
        subtitle=None,
        short_description=f"Restricted asset {suffix}",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="published",
        visibility="restricted",
        content_blocks=[{"type": "text", "text": "restricted"}],
        allowed_roles=[],
        allowed_users=[],
    )
    db_session.add_all([visible_asset, draft_asset, archived_asset, restricted_asset])
    db_session.commit()

    res = client.get("/api/v1/assets", params={"q": suffix, "limit": 10, "offset": 0})

    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["limit"] == 10
    assert body["offset"] == 0
    assert [item["slug"] for item in body["items"]] == [visible_asset.slug]


def test_get_asset_returns_404_for_non_published_asset(db_session: Session) -> None:
    client = TestClient(app)
    asset = Asset(
        slug="draft-detail-phase8",
        title="Draft Detail",
        subtitle=None,
        short_description="Should stay hidden from public detail",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="draft",
        visibility="public",
        content_blocks=[{"type": "text", "text": "hidden"}],
        allowed_roles=[],
        allowed_users=[],
    )
    db_session.add(asset)
    db_session.commit()

    res = client.get(f"/api/v1/assets/{asset.slug}")

    assert res.status_code == 404


def test_get_asset_returns_normalized_blocks_and_content_schema_version(db_session: Session) -> None:
    client = TestClient(app)
    asset = Asset(
        slug="phase9-public-detail",
        title="Phase 9 Public Detail",
        subtitle=None,
        short_description="Public asset with legacy blocks",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="published",
        visibility="public",
        content_blocks=[
            {
                "block_id": "legacy-stat-1",
                "block_type": "stat_card",
                "label": "ROI",
                "value": "42%",
                "description": "Migration test",
            }
        ],
        allowed_roles=[],
        allowed_users=[],
    )
    db_session.add(asset)
    db_session.commit()

    res = client.get(f"/api/v1/assets/{asset.slug}")

    assert res.status_code == 200
    body = res.json()
    assert body["content_schema_version"] == 2
    assert body["content_blocks"] == [
        {
            "id": "legacy-stat-1",
            "type": "stat_card",
            "version": 2,
            "order": 0,
            "visible": True,
            "config": {
                "title": "",
                "stats": [
                    {
                        "label": "ROI",
                        "value": "42%",
                        "description": "Migration test",
                    }
                ],
            },
        }
    ]


def _register_and_login(client: TestClient, email: str | None = None) -> tuple[str, str]:
    user_email = email or f"asset-viewer-{uuid.uuid4().hex}@example.com"
    password = "P@ssw0rd-123"

    register_res = client.post("/api/v1/auth/register", json={"email": user_email, "password": password})
    assert register_res.status_code == 201
    user_id = register_res.json()["id"]

    login_res = client.post("/api/v1/auth/login", json={"email": user_email, "password": password})
    assert login_res.status_code == 200
    return user_id, login_res.json()["access_token"]


def test_get_asset_hides_delivery_fields_and_blocks_for_anonymous_user(db_session: Session) -> None:
    client = TestClient(app)
    asset = Asset(
        slug="detail-audience-anon",
        title="Audience Controlled Asset",
        subtitle=None,
        short_description="Public summary",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["nextjs"],
        asset_type="solution",
        status="published",
        visibility="public",
        shared_fields={
            "introduction": "Shared overview",
            "use_cases": ["banking onboarding"],
        },
        sales_fields={"value_summary": "Sales framing"},
        delivery_fields={"implementation_summary": "Delivery checklist"},
        delivery_allowed_roles=["delivery-engineer"],
        delivery_allowed_users=[],
        content_blocks=[
            {
                "id": "shared-1",
                "type": "text",
                "version": 2,
                "order": 0,
                "visible": True,
                "audience": "shared",
                "config": {"markdown": "Shared narrative", "html": ""},
            },
            {
                "id": "delivery-1",
                "type": "text",
                "version": 2,
                "order": 1,
                "visible": True,
                "audience": "delivery",
                "config": {"markdown": "Delivery runbook", "html": ""},
            },
        ],
        allowed_roles=[],
        allowed_users=[],
    )
    db_session.add(asset)
    db_session.commit()

    res = client.get(f"/api/v1/assets/{asset.slug}")

    assert res.status_code == 200
    body = res.json()
    assert body["delivery_access"] == "signin_required"
    assert body["shared_fields"]["introduction"] == "Shared overview"
    assert body["shared_fields"]["use_cases"] == ["banking onboarding"]
    assert body["shared_fields"]["videos"] == []
    assert body["sales_fields"] == {"value_summary": "Sales framing"}
    assert body["delivery_fields"] is None
    assert [block["id"] for block in body["content_blocks"]] == ["shared-1"]


def test_get_asset_returns_delivery_fields_for_authorized_user(db_session: Session) -> None:
    client = TestClient(app)
    user_id, token = _register_and_login(client)

    role_res = client.post(
        "/api/v1/admin/roles",
        json={
            "name": f"delivery-engineer-{uuid.uuid4().hex[:8]}",
            "description": "Can review delivery content",
            "user_ids": [user_id],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert role_res.status_code == 201
    role_name = role_res.json()["name"]

    asset = Asset(
        slug="detail-audience-granted",
        title="Granted Delivery Asset",
        subtitle=None,
        short_description="Public summary",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["nextjs"],
        asset_type="solution",
        status="published",
        visibility="public",
        shared_fields={"introduction": "Shared overview"},
        sales_fields={"value_summary": "Sales framing"},
        delivery_fields={"implementation_summary": "Delivery checklist"},
        delivery_allowed_roles=[role_name],
        delivery_allowed_users=[],
        content_blocks=[
            {
                "id": "shared-2",
                "type": "text",
                "version": 2,
                "order": 0,
                "visible": True,
                "audience": "shared",
                "config": {"markdown": "Shared narrative", "html": ""},
            },
            {
                "id": "delivery-2",
                "type": "text",
                "version": 2,
                "order": 1,
                "visible": True,
                "audience": "delivery",
                "config": {"markdown": "Delivery runbook", "html": ""},
            },
        ],
        allowed_roles=[],
        allowed_users=[],
    )
    db_session.add(asset)
    db_session.commit()

    res = client.get(
        f"/api/v1/assets/{asset.slug}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["delivery_access"] == "granted"
    assert body["delivery_fields"] == {"implementation_summary": "Delivery checklist"}
    assert [block["id"] for block in body["content_blocks"]] == ["shared-2", "delivery-2"]


def test_get_asset_requests_access_when_signed_in_without_delivery_role(db_session: Session) -> None:
    client = TestClient(app)
    _, token = _register_and_login(client)

    asset = Asset(
        slug="detail-audience-request-access",
        title="Request Access Asset",
        subtitle=None,
        short_description="Public summary",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["nextjs"],
        asset_type="solution",
        status="published",
        visibility="public",
        shared_fields={"introduction": "Shared overview"},
        sales_fields={"value_summary": "Sales framing"},
        delivery_fields={"implementation_summary": "Delivery checklist"},
        delivery_allowed_roles=["delivery-engineer"],
        delivery_allowed_users=[],
        content_blocks=[],
        allowed_roles=[],
        allowed_users=[],
    )
    db_session.add(asset)
    db_session.commit()

    res = client.get(
        f"/api/v1/assets/{asset.slug}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["delivery_access"] == "request_access"
    assert body["delivery_fields"] is None


def test_get_asset_returns_videos_in_shared_fields(db_session: Session) -> None:
    """公开详情接口在 shared_fields 中返回 videos 数组。"""
    client = TestClient(app)
    asset = Asset(
        slug="videos-in-shared-fields",
        title="Videos Asset",
        subtitle=None,
        short_description="Asset with videos",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="published",
        visibility="public",
        shared_fields={
            "videos": [
                {"id": "v1", "title": "Video 1", "video_url": "https://example.com/v1.mp4", "is_primary": True}
            ]
        },
        allowed_roles=[],
        allowed_users=[],
    )
    db_session.add(asset)
    db_session.commit()

    resp = client.get(f"/api/v1/assets/{asset.slug}")
    assert resp.status_code == 200
    body = resp.json()
    assert "videos" in body["shared_fields"]
    assert isinstance(body["shared_fields"]["videos"], list)


def test_get_asset_legacy_demo_video_becomes_videos(db_session: Session) -> None:
    """当 assets 只有 demo_video_url 且无 videos 时，接口自动构造兼容视频对象。"""
    client = TestClient(app)
    asset = Asset(
        slug="legacy-demo-video-asset",
        title="Legacy Video Asset",
        subtitle=None,
        short_description="Asset with legacy demo_video_url",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="published",
        visibility="public",
        shared_fields={"demo_video_url": "https://example.com/legacy.mp4"},
        allowed_roles=[],
        allowed_users=[],
    )
    db_session.add(asset)
    db_session.commit()

    resp = client.get(f"/api/v1/assets/{asset.slug}")
    assert resp.status_code == 200
    videos = resp.json()["shared_fields"]["videos"]
    assert len(videos) == 1
    assert videos[0]["video_url"] == "https://example.com/legacy.mp4"
    assert videos[0]["is_primary"] is True
    assert videos[0]["id"] == "legacy-demo-video"
