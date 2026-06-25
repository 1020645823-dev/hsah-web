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


def _template_payload() -> dict:
    unique = uuid.uuid4().hex[:8]
    return {
        "name": f"Test Template {unique}",
        "description": "A test template",
        "blocks": [
            {
                "id": "blk-test",
                "type": "text",
                "order": 1,
                "visible": True,
                "config": {"variant": "h1", "markdown": "# Test"},
            }
        ],
    }


def test_list_templates() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/admin/templates", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert isinstance(body, list)


def test_create_template_authenticated() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _template_payload()
    res = client.post("/api/v1/admin/templates", json=payload, headers=headers)
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == payload["name"]
    assert body["description"] == payload["description"]
    assert body["blocks"] == payload["blocks"]
    assert "id" in body
    assert body["is_builtin"] is False
    assert body["created_by"] is not None


def test_create_template_unauthenticated() -> None:
    client = TestClient(app)
    payload = _template_payload()
    res = client.post("/api/v1/admin/templates", json=payload)
    assert res.status_code == 401


def test_update_own_template() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _template_payload()
    res = client.post("/api/v1/admin/templates", json=payload, headers=headers)
    assert res.status_code == 201
    template_id = res.json()["id"]

    update_payload = {"name": "Updated Name"}
    res = client.put(f"/api/v1/admin/templates/{template_id}", json=update_payload, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "Updated Name"


def test_update_builtin_template() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/admin/templates", headers=headers)
    assert res.status_code == 200
    templates = res.json()
    builtin = next((t for t in templates if t["is_builtin"]), None)
    assert builtin is not None, "No built-in template found"

    update_payload = {"name": "Hacked Name"}
    res = client.put(f"/api/v1/admin/templates/{builtin['id']}", json=update_payload, headers=headers)
    assert res.status_code == 403


def test_delete_own_template() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = _template_payload()
    res = client.post("/api/v1/admin/templates", json=payload, headers=headers)
    assert res.status_code == 201
    template_id = res.json()["id"]

    res = client.delete(f"/api/v1/admin/templates/{template_id}", headers=headers)
    assert res.status_code == 204

    res = client.get(f"/api/v1/admin/templates/{template_id}", headers=headers)
    assert res.status_code == 404


def test_delete_builtin_template() -> None:
    client = TestClient(app)
    token = _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/admin/templates", headers=headers)
    assert res.status_code == 200
    templates = res.json()
    builtin = next((t for t in templates if t["is_builtin"]), None)
    assert builtin is not None, "No built-in template found"

    res = client.delete(f"/api/v1/admin/templates/{builtin['id']}", headers=headers)
    assert res.status_code == 403
