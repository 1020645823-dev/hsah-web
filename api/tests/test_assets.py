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
