from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from app.models.asset import Asset

client = TestClient(app)


def _auth_headers() -> dict:
    email = f"ops-{datetime.now().timestamp()}@hsah.test"
    client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!"})
    token = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_operations_overview_returns_counts(db_session):
    headers = _auth_headers()
    response = client.get("/api/v1/admin/operations/overview", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert "total_assets" in body
    assert "published_assets" in body
    assert "reviewing_assets" in body
    assert "low_quality_assets" in body
    assert "pending_access_requests" in body


def test_operations_tasks_includes_blocked_asset(db_session):
    headers = _auth_headers()
    asset = Asset(
        slug="ops-incomplete",
        title="Incomplete Ops Asset",
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

    response = client.get("/api/v1/admin/operations/tasks", headers=headers)
    body = response.json()
    slugs = [item["slug"] for item in body["items"]]
    assert "ops-incomplete" in slugs
    task = next(item for item in body["items"] if item["slug"] == "ops-incomplete")
    assert task["reason"].startswith("Blocked")


def test_operations_tasks_excludes_published(db_session):
    headers = _auth_headers()
    asset = Asset(
        slug="ops-published",
        title="Published Ops Asset",
        subtitle=None,
        short_description="Complete",
        cloud_providers=["aws"],
        industries=["finance"],
        technologies=["python"],
        asset_type="solution",
        status="published",
        content_schema_version=1,
        content_blocks=[{"type": "text", "config": {"markdown": "x"}, "visible": True}],
        shared_fields={"videos": [{"id": "v", "title": "t", "video_url": "u"}]},
        sales_fields={"value_summary": "v"},
        delivery_fields={},
    )
    db_session.add(asset)
    db_session.commit()

    response = client.get("/api/v1/admin/operations/tasks", headers=headers)
    slugs = [item["slug"] for item in response.json()["items"]]
    assert "ops-published" not in slugs


def test_recent_activities_returns_review_records(db_session):
    headers = _auth_headers()
    asset = Asset(
        slug="ops-reviewable",
        title="Reviewable Ops Asset",
        subtitle=None,
        short_description="Complete asset",
        cloud_providers=["aws"],
        industries=["finance"],
        technologies=["python"],
        asset_type="solution",
        status="draft",
        content_schema_version=1,
        content_blocks=[{"type": "text", "config": {"markdown": "x"}, "visible": True}],
        shared_fields={"videos": [{"id": "v", "title": "t", "video_url": "u"}]},
        sales_fields={"value_summary": "v"},
        delivery_fields={},
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)

    client.post(f"/api/v1/admin/assets/{asset.id}/submit-review", headers=headers)

    response = client.get("/api/v1/admin/operations/recent-activities", headers=headers)
    body = response.json()
    assert body["total"] >= 1
    actions = [item["action"] for item in body["items"]]
    assert "submit_review" in actions
