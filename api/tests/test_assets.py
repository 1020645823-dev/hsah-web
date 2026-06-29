import uuid

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.asset import Asset


def _make_asset(slug: str, *, status: str = "published", visibility: str = "public") -> Asset:
    return Asset(
        slug=slug,
        title=slug.replace("-", " ").title(),
        subtitle=None,
        short_description=f"Description for {slug}",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status=status,
        visibility=visibility,
    )


def test_list_assets_returns_only_public_published(db_session: Session) -> None:
    client = TestClient(app)
    suffix = "phase8-public-filter"
    visible_asset = _make_asset(f"published-{suffix}")
    draft_asset = _make_asset(f"draft-{suffix}", status="draft")
    archived_asset = _make_asset(f"archived-{suffix}", status="archived")
    restricted_asset = _make_asset(f"restricted-{suffix}", visibility="restricted")
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
    asset = _make_asset("draft-detail-phase8", status="draft")
    db_session.add(asset)
    db_session.commit()

    res = client.get(f"/api/v1/assets/{asset.slug}")

    assert res.status_code == 404


def test_list_assets_filters_by_cloud_provider(db_session: Session) -> None:
    client = TestClient(app)
    aws_asset = Asset(
        slug="cloud-aws",
        title="AWS Asset",
        subtitle=None,
        short_description="On AWS",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="published",
        visibility="public",
    )
    azure_asset = Asset(
        slug="cloud-azure",
        title="Azure Asset",
        subtitle=None,
        short_description="On Azure",
        cloud_providers=["azure"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="published",
        visibility="public",
    )
    db_session.add_all([aws_asset, azure_asset])
    db_session.commit()

    res = client.get("/api/v1/assets", params={"cloud": "aws", "limit": 10, "offset": 0})

    assert res.status_code == 200
    slugs = [item["slug"] for item in res.json()["items"]]
    assert "cloud-aws" in slugs
    assert "cloud-azure" not in slugs


def test_list_assets_filters_by_industry(db_session: Session) -> None:
    client = TestClient(app)
    banking_asset = _make_asset("industry-banking")
    banking_asset.industries = ["banking"]
    retail_asset = _make_asset("industry-retail")
    retail_asset.industries = ["retail"]
    db_session.add_all([banking_asset, retail_asset])
    db_session.commit()

    res = client.get("/api/v1/assets", params={"industry": "retail", "limit": 10, "offset": 0})

    assert res.status_code == 200
    slugs = [item["slug"] for item in res.json()["items"]]
    assert "industry-retail" in slugs
    assert "industry-banking" not in slugs


def test_list_assets_filters_by_technology(db_session: Session) -> None:
    client = TestClient(app)
    ai_asset = _make_asset("tech-ai")
    ai_asset.technologies = ["ai"]
    k8s_asset = _make_asset("tech-k8s")
    k8s_asset.technologies = ["kubernetes"]
    db_session.add_all([ai_asset, k8s_asset])
    db_session.commit()

    res = client.get("/api/v1/assets", params={"tech": "kubernetes", "limit": 10, "offset": 0})

    assert res.status_code == 200
    slugs = [item["slug"] for item in res.json()["items"]]
    assert "tech-k8s" in slugs
    assert "tech-ai" not in slugs


def _register_and_login(client: TestClient, email: str | None = None) -> tuple[str, str]:
    user_email = email or f"asset-viewer-{uuid.uuid4().hex}@example.com"
    password = "P@ssw0rd-123"

    register_res = client.post("/api/v1/auth/register", json={"email": user_email, "password": password})
    assert register_res.status_code == 201
    user_id = register_res.json()["id"]

    login_res = client.post("/api/v1/auth/login", json={"email": user_email, "password": password})
    assert login_res.status_code == 200
    return user_id, login_res.json()["access_token"]


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
    )
    db_session.add(asset)
    db_session.commit()

    resp = client.get(f"/api/v1/assets/{asset.slug}")
    assert resp.status_code == 200
    body = resp.json()
    assert "videos" in body["shared_fields"]
    assert isinstance(body["shared_fields"]["videos"], list)
