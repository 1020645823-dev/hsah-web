from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from app.models.asset import Asset
from app.models.analytics_event import AnalyticsEvent

client = TestClient(app)


def _auth_headers(tag: str) -> dict:
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
        industries=[],
        technologies=[],
        asset_type="solution",
        status="published",
        shared_fields={},
        sales_fields={},
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)
    return asset


def test_viewing_asset_detail_records_asset_view_event(db_session):
    asset = _published_asset(db_session, "analytics-viewed")
    client.get(f"/api/v1/assets/{asset.slug}")

    events = db_session.query(AnalyticsEvent).filter_by(asset_id=asset.id, event_type="asset_view").all()
    assert len(events) == 1


def test_analytics_overview_returns_metric_groups(db_session):
    headers = _auth_headers("analytics-admin")
    response = client.get("/api/v1/admin/analytics/overview", headers=headers)
    assert response.status_code == 200
    body = response.json()
    for group in ("content", "experience", "workflow", "quality", "governance"):
        assert group in body
    assert "total_assets" in body["content"]
    assert "views" in body["experience"]


def test_asset_performance_returns_counts(db_session):
    headers = _auth_headers("perf-admin")
    asset = _published_asset(db_session, "analytics-perf")
    client.get(f"/api/v1/assets/{asset.slug}")  # generate a view

    response = client.get(f"/api/v1/admin/analytics/assets/{asset.id}", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["views"] == 1
    assert body["favorites"] == 0
