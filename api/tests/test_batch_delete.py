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
    }


def test_batch_delete_requires_auth() -> None:
    client = TestClient(app)
    res = client.post("/api/v1/admin/assets/batch-delete", json={"ids": []})
    assert res.status_code == 401


def test_batch_delete_empty_ids() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/admin/assets/batch-delete", json={"ids": []}, headers=headers)
    assert res.status_code == 400
    body = res.json()
    assert body["detail"]["code"] == "empty_ids"


def test_batch_delete_single_asset() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _asset_payload()
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201
    asset_id = res.json()["id"]

    res = client.post("/api/v1/admin/assets/batch-delete", json={"ids": [asset_id]}, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["deleted"] == 1
    assert body["failed"] == []

    # Verify asset is gone
    res = client.get(f"/api/v1/admin/assets/{asset_id}", headers=headers)
    assert res.status_code == 404


def test_batch_delete_multiple_assets() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    ids = []
    for _ in range(3):
        payload = _asset_payload()
        res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
        assert res.status_code == 201
        ids.append(res.json()["id"])

    res = client.post("/api/v1/admin/assets/batch-delete", json={"ids": ids}, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["deleted"] == 3
    assert body["failed"] == []


def test_batch_delete_invalid_id() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        "/api/v1/admin/assets/batch-delete",
        json={"ids": ["not-a-valid-uuid"]},
        headers=headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert body["deleted"] == 0
    assert body["failed"] == [{"id": "not-a-valid-uuid", "reason": "invalid_id"}]


def test_batch_delete_not_found_id() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    fake_id = str(uuid.uuid4())
    res = client.post(
        "/api/v1/admin/assets/batch-delete",
        json={"ids": [fake_id]},
        headers=headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert body["deleted"] == 0
    assert body["failed"] == [{"id": fake_id, "reason": "not_found"}]


def test_batch_delete_mixed_results() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _asset_payload()
    res = client.post("/api/v1/admin/assets", json=payload, headers=headers)
    assert res.status_code == 201
    valid_id = res.json()["id"]
    fake_id = str(uuid.uuid4())

    res = client.post(
        "/api/v1/admin/assets/batch-delete",
        json={"ids": [valid_id, "bad-uuid", fake_id]},
        headers=headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert body["deleted"] == 1
    assert len(body["failed"]) == 2
    failed_ids = {f["id"] for f in body["failed"]}
    assert "bad-uuid" in failed_ids
    assert fake_id in failed_ids
