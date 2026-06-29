from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from app.models.audit_log import AuditLog

client = TestClient(app)


def _auth_headers(tag: str) -> dict:
    email = f"{tag}-{datetime.now().timestamp()}@hsah.test"
    client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!"})
    token = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_audit_log_written_on_asset_transition(db_session):
    from app.models.asset import Asset

    headers = _auth_headers("audit-admin")
    asset = Asset(
        slug="audit-asset",
        title="Audit Asset",
        subtitle=None,
        short_description="d",
        cloud_providers=["aws"],
        industries=[],
        technologies=[],
        asset_type="solution",
        status="draft",
        shared_fields={},
        sales_fields={},
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)

    client.post(f"/api/v1/admin/assets/{asset.id}/archive", headers=headers)

    logs = db_session.query(AuditLog).filter_by(resource_type="asset", resource_id=str(asset.id)).all()
    assert len(logs) >= 1
    assert any(log.action == "asset.archive" for log in logs)


def test_audit_logs_endpoint_supports_filters(db_session):
    from app.models.asset import Asset

    headers = _auth_headers("audit-list-admin")
    asset = Asset(
        slug="audit-list-asset",
        title="Audit List",
        subtitle=None,
        short_description="d",
        cloud_providers=["aws"],
        industries=[],
        technologies=[],
        asset_type="solution",
        status="draft",
        shared_fields={},
        sales_fields={},
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)
    client.post(f"/api/v1/admin/assets/{asset.id}/archive", headers=headers)

    response = client.get("/api/v1/admin/audit-logs?resource_type=asset", headers=headers)
    assert response.status_code == 200
    body = response.json()
    actions = [item["action"] for item in body["items"]]
    assert "asset.archive" in actions


def test_audit_logs_pagination_structure(db_session):
    headers = _auth_headers("audit-pagination")
    response = client.get("/api/v1/admin/audit-logs?limit=5&offset=0", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body
    assert body["limit"] == 5
    assert body["offset"] == 0
