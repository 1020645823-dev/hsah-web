from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from app.models.access_request import AccessRequest
from app.models.asset import Asset

client = TestClient(app)


def _auth_headers(tag: str) -> dict:
    email = f"{tag}-{datetime.now().timestamp()}@hsah.test"
    client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!"})
    token = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _restricted_asset(db_session, slug: str) -> Asset:
    asset = Asset(
        slug=slug,
        title=slug,
        subtitle=None,
        short_description="restricted",
        cloud_providers=["aws"],
        industries=[],
        technologies=[],
        asset_type="solution",
        status="published",
        visibility="restricted",
        shared_fields={},
        sales_fields={},
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)
    return asset


def test_create_access_request_unauthenticated(db_session):
    asset = _restricted_asset(db_session, "ar-noauth")
    response = client.post(f"/api/v1/access-requests?asset_id={asset.id}", json={"purpose": "need it"})
    assert response.status_code == 401


def test_create_access_request_authenticated(db_session):
    headers = _auth_headers("requester")
    asset = _restricted_asset(db_session, "ar-create")
    response = client.post(
        f"/api/v1/access-requests?asset_id={asset.id}",
        json={"purpose": "Client delivery", "role": "Consultant"},
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert body["purpose"] == "Client delivery"


def test_duplicate_open_request_returns_existing(db_session):
    headers = _auth_headers("dup-requester")
    asset = _restricted_asset(db_session, "ar-dup")
    first = client.post(
        f"/api/v1/access-requests?asset_id={asset.id}", json={"purpose": "first"}, headers=headers
    )
    second = client.post(
        f"/api/v1/access-requests?asset_id={asset.id}", json={"purpose": "second"}, headers=headers
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    rows = db_session.query(AccessRequest).filter_by(asset_id=asset.id).all()
    assert len(rows) == 1


def test_admin_lists_pending_requests(db_session):
    requester_headers = _auth_headers("listed-requester")
    admin_headers = _auth_headers("listed-admin")
    asset = _restricted_asset(db_session, "ar-list")
    client.post(
        f"/api/v1/access-requests?asset_id={asset.id}",
        json={"purpose": "please"},
        headers=requester_headers,
    )

    response = client.get("/api/v1/admin/access-requests?status=pending", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1


def test_approve_request_sets_approved(db_session):
    requester_headers = _auth_headers("approve-requester")
    admin_headers = _auth_headers("approve-admin")
    asset = _restricted_asset(db_session, "ar-approve")
    created = client.post(
        f"/api/v1/access-requests?asset_id={asset.id}",
        json={"purpose": "approve me"},
        headers=requester_headers,
    ).json()
    request_id = created["id"]

    response = client.post(
        f"/api/v1/admin/access-requests/{request_id}/approve",
        json={"reason": "granted"},
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_reject_request_requires_reason(db_session):
    requester_headers = _auth_headers("reject-requester")
    admin_headers = _auth_headers("reject-admin")
    asset = _restricted_asset(db_session, "ar-reject")
    created = client.post(
        f"/api/v1/access-requests?asset_id={asset.id}",
        json={"purpose": "reject me"},
        headers=requester_headers,
    ).json()
    request_id = created["id"]

    response = client.post(
        f"/api/v1/admin/access-requests/{request_id}/reject",
        json={"reason": ""},
        headers=admin_headers,
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "reason_required"
