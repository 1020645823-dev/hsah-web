from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from app.models.asset import Asset
from app.models.asset_engagement import AssetFavorite

client = TestClient(app)


def _auth_headers(tag: str = "user") -> dict:
    email = f"{tag}-{datetime.now().timestamp()}@hsah.test"
    client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!"})
    token = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _published_asset(db_session, slug: str) -> Asset:
    asset = Asset(
        slug=slug,
        title=slug,
        subtitle=None,
        short_description="desc",
        cloud_providers=["aws"],
        industries=["finance"],
        technologies=["python"],
        asset_type="solution",
        status="published",
        shared_fields={},
        sales_fields={},
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)
    return asset


def test_favorite_requires_auth(db_session):
    asset = _published_asset(db_session, "fav-noauth")
    response = client.post(f"/api/v1/assets/{asset.id}/favorite")
    assert response.status_code == 401


def test_create_and_remove_favorite(db_session):
    headers = _auth_headers("favoriter")
    asset = _published_asset(db_session, "fav-asset")

    create = client.post(f"/api/v1/assets/{asset.id}/favorite", headers=headers)
    assert create.status_code == 200
    assert create.json()["is_favorite"] is True

    rows = db_session.query(AssetFavorite).filter_by(asset_id=asset.id).all()
    assert len(rows) == 1

    remove = client.delete(f"/api/v1/assets/{asset.id}/favorite", headers=headers)
    assert remove.status_code == 200
    assert remove.json()["is_favorite"] is False

    rows = db_session.query(AssetFavorite).filter_by(asset_id=asset.id).all()
    assert len(rows) == 0


def test_duplicate_favorite_is_idempotent(db_session):
    headers = _auth_headers("dup-fav")
    asset = _published_asset(db_session, "dup-fav-asset")

    client.post(f"/api/v1/assets/{asset.id}/favorite", headers=headers)
    second = client.post(f"/api/v1/assets/{asset.id}/favorite", headers=headers)

    assert second.status_code == 200
    assert second.json()["is_favorite"] is True
    rows = db_session.query(AssetFavorite).filter_by(asset_id=asset.id).all()
    assert len(rows) == 1


def test_feedback_anonymous_allowed(db_session):
    asset = _published_asset(db_session, "feedback-anon")
    response = client.post(
        f"/api/v1/assets/{asset.id}/feedback",
        json={"feedback_type": "question", "message": "How do I use this?"},
    )
    assert response.status_code == 201
    assert response.json()["message"] == "How do I use this?"


def test_feedback_requires_message(db_session):
    asset = _published_asset(db_session, "feedback-empty")
    response = client.post(
        f"/api/v1/assets/{asset.id}/feedback",
        json={"feedback_type": "problem", "message": ""},
    )
    assert response.status_code == 422


def test_related_assets_match_by_provider(db_session):
    target = _published_asset(db_session, "related-target")
    similar = Asset(
        slug="related-similar",
        title="Similar",
        subtitle=None,
        short_description="d",
        cloud_providers=["aws"],
        industries=["finance"],
        technologies=["python"],
        asset_type="solution",
        status="published",
        shared_fields={},
        sales_fields={},
    )
    db_session.add(similar)
    db_session.commit()

    response = client.get(f"/api/v1/assets/{target.id}/related")
    assert response.status_code == 200
    slugs = [item["slug"] for item in response.json()]
    assert "related-similar" in slugs


def test_recommended_returns_published(db_session):
    _published_asset(db_session, "rec-pub")
    response = client.get("/api/v1/assets/recommended")
    slugs = [item["slug"] for item in response.json()]
    assert "rec-pub" in slugs
