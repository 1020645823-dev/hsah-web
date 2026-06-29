from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from app.models.asset import Asset
from app.models.asset_review import AssetReviewRecord

client = TestClient(app)


def _auth_headers(db_session) -> dict:
    """Register/login a user and return auth headers."""
    email = f"reviewer-{datetime.now().timestamp()}@hsah.test"
    client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!"})
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _seed_publishable_asset(db_session, slug: str = "reviewable-asset") -> Asset:
    asset = Asset(
        slug=slug,
        title="Reviewable Asset",
        subtitle="subtitle",
        short_description="A complete asset ready for review.",
        cloud_providers=["aws"],
        industries=["finance"],
        technologies=["python"],
        asset_type="solution",
        status="draft",
        content_schema_version=1,
        content_blocks=[{"type": "text", "config": {"markdown": "Body"}, "visible": True}],
        shared_fields={},
        sales_fields={},
        delivery_fields={},
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)
    return asset


def test_submit_review_creates_record_and_sets_reviewing(db_session):
    headers = _auth_headers(db_session)
    asset = _seed_publishable_asset(db_session)

    response = client.post(f"/api/v1/admin/assets/{asset.id}/submit-review", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "reviewing"

    records = db_session.query(AssetReviewRecord).filter_by(asset_id=asset.id).all()
    assert len(records) == 1
    assert records[0].action == "submit_review"
    assert records[0].from_status == "draft"
    assert records[0].to_status == "reviewing"


def test_approve_publishes_reviewing_asset(db_session):
    headers = _auth_headers(db_session)
    asset = _seed_publishable_asset(db_session)
    client.post(f"/api/v1/admin/assets/{asset.id}/submit-review", headers=headers)

    response = client.post(f"/api/v1/admin/assets/{asset.id}/approve", headers=headers, json={"reason": "Looks good"})

    assert response.status_code == 200
    assert response.json()["status"] == "published"


def test_reject_requires_reason(db_session):
    headers = _auth_headers(db_session)
    asset = _seed_publishable_asset(db_session)
    client.post(f"/api/v1/admin/assets/{asset.id}/submit-review", headers=headers)

    response = client.post(f"/api/v1/admin/assets/{asset.id}/reject", headers=headers, json={"reason": ""})

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "reason_required"


def test_reject_with_reason_sets_rejected(db_session):
    headers = _auth_headers(db_session)
    asset = _seed_publishable_asset(db_session)
    client.post(f"/api/v1/admin/assets/{asset.id}/submit-review", headers=headers)

    response = client.post(
        f"/api/v1/admin/assets/{asset.id}/reject", headers=headers, json={"reason": "Missing prerequisites"}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "rejected"


def test_invalid_transition_returns_422(db_session):
    headers = _auth_headers(db_session)
    asset = _seed_publishable_asset(db_session, slug="draft-only")
    # Cannot approve a draft directly (must go through reviewing).
    response = client.post(f"/api/v1/admin/assets/{asset.id}/approve", headers=headers, json={"reason": ""})

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "invalid_transition"


def test_publish_blocked_asset_returns_missing_fields(db_session):
    headers = _auth_headers(db_session)
    asset = Asset(
        slug="incomplete-asset",
        title="Incomplete",
        subtitle=None,
        short_description="",
        cloud_providers=[],
        industries=[],
        technologies=[],
        asset_type="solution",
        status="draft",
        content_schema_version=1,
        content_blocks=[],
        shared_fields={},
        sales_fields={},
        delivery_fields={},
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)

    response = client.post(f"/api/v1/admin/assets/{asset.id}/publish", headers=headers)

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["code"] == "publish_validation_failed"
    assert "short_description" in detail["fields"]
    assert "cloud_providers" in detail["fields"]


def test_review_history_returns_records(db_session):
    headers = _auth_headers(db_session)
    asset = _seed_publishable_asset(db_session, slug="history-asset")
    client.post(f"/api/v1/admin/assets/{asset.id}/submit-review", headers=headers)
    client.post(f"/api/v1/admin/assets/{asset.id}/approve", headers=headers, json={"reason": "ok"})

    response = client.get(f"/api/v1/admin/assets/{asset.id}/review-history", headers=headers)

    assert response.status_code == 200
    body = response.json()
    actions = [record["action"] for record in body]
    assert actions.count("approve") == 1
    assert actions.count("submit_review") == 1


def test_public_listing_only_returns_published(db_session):
    asset = _seed_publishable_asset(db_session, slug="still-draft")
    response = client.get("/api/v1/assets")
    slugs = [item["slug"] for item in response.json()["items"]]
    assert "still-draft" not in slugs
