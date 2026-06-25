import uuid

import pytest
import httpx
from httpx import ASGITransport

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


async def _get_auth_headers() -> dict[str, str]:
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        email = f"u-{uuid.uuid4().hex}@example.com"
        password = "P@ssw0rd-123"
        await client.post("/api/v1/auth/register", json={"email": email, "password": password})
        res = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
        token = res.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_create_user_success() -> None:
    headers = await _get_auth_headers()
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        email = f"new-{uuid.uuid4().hex}@example.com"
        res = await client.post(
            "/api/v1/admin/users",
            headers=headers,
            json={"email": email, "password": "SecurePass123!", "is_active": True, "is_2fa_enabled": False},
        )
        assert res.status_code == 201
        data = res.json()
        assert data["email"] == email
        assert data["is_active"] is True
        assert data["two_factor_enabled"] is False
        assert "id" in data


@pytest.mark.anyio
async def test_create_user_duplicate_email() -> None:
    headers = await _get_auth_headers()
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        email = f"dup-{uuid.uuid4().hex}@example.com"
        res1 = await client.post(
            "/api/v1/admin/users",
            headers=headers,
            json={"email": email, "password": "SecurePass123!", "is_active": True, "is_2fa_enabled": False},
        )
        assert res1.status_code == 201

        res2 = await client.post(
            "/api/v1/admin/users",
            headers=headers,
            json={"email": email, "password": "AnotherPass123!", "is_active": True, "is_2fa_enabled": False},
        )
        assert res2.status_code == 409
        assert res2.json()["detail"] == "email_already_exists"


@pytest.mark.anyio
async def test_update_user_success() -> None:
    headers = await _get_auth_headers()
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        email = f"update-{uuid.uuid4().hex}@example.com"
        create_res = await client.post(
            "/api/v1/admin/users",
            headers=headers,
            json={"email": email, "password": "SecurePass123!", "is_active": True, "is_2fa_enabled": False},
        )
        assert create_res.status_code == 201
        user_id = create_res.json()["id"]

        new_email = f"updated-{uuid.uuid4().hex}@example.com"
        update_res = await client.put(
            f"/api/v1/admin/users/{user_id}",
            headers=headers,
            json={"email": new_email, "is_active": False, "is_2fa_enabled": True},
        )
        assert update_res.status_code == 200
        data = update_res.json()
        assert data["email"] == new_email
        assert data["is_active"] is False
        assert data["two_factor_enabled"] is True


@pytest.mark.anyio
async def test_delete_user_success() -> None:
    headers = await _get_auth_headers()
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        email = f"delete-{uuid.uuid4().hex}@example.com"
        create_res = await client.post(
            "/api/v1/admin/users",
            headers=headers,
            json={"email": email, "password": "SecurePass123!", "is_active": True, "is_2fa_enabled": False},
        )
        assert create_res.status_code == 201
        user_id = create_res.json()["id"]

        delete_res = await client.delete(f"/api/v1/admin/users/{user_id}", headers=headers)
        assert delete_res.status_code == 204

        get_res = await client.get(f"/api/v1/admin/users", headers=headers)
        assert get_res.status_code == 200
        data = get_res.json()
        users = data["items"]
        assert not any(u["id"] == user_id for u in users)


@pytest.mark.anyio
async def test_user_crud_requires_auth() -> None:
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/admin/users",
            json={"email": "noauth@example.com", "password": "SecurePass123!"},
        )
        assert res.status_code == 401

        fake_uuid = str(uuid.uuid4())
        res = await client.put(f"/api/v1/admin/users/{fake_uuid}", json={"is_active": False})
        assert res.status_code == 401

        res = await client.delete(f"/api/v1/admin/users/{fake_uuid}")
        assert res.status_code == 401
