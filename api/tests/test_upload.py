import uuid
from io import BytesIO

import pytest
import httpx
from httpx import ASGITransport

from app.main import app
from app.services import storage


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
async def test_upload_image_success() -> None:
    storage.ensure_bucket()
    headers = await _get_auth_headers()
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        image_data = b"fake image content"
        files = {"file": ("test.png", BytesIO(image_data), "image/png")}

        res = await client.post("/api/v1/admin/assets/images", headers=headers, files=files)
        assert res.status_code == 200
        assert "url" in res.json()
        # MinIO presigned URL is an absolute http(s) URL, not a local path.
        assert res.json()["url"].startswith("http")
        assert ".png" in res.json()["url"]


@pytest.mark.anyio
async def test_upload_image_invalid_type() -> None:
    headers = await _get_auth_headers()
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        file_data = b"fake file content"
        files = {"file": ("test.txt", BytesIO(file_data), "text/plain")}

        res = await client.post("/api/v1/admin/assets/images", headers=headers, files=files)
        assert res.status_code == 400
        assert res.json()["detail"]["code"] == "invalid_file_type"


@pytest.mark.anyio
async def test_upload_image_too_large() -> None:
    headers = await _get_auth_headers()
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        large_data = b"x" * (5 * 1024 * 1024 + 1)
        files = {"file": ("large.png", BytesIO(large_data), "image/png")}

        res = await client.post("/api/v1/admin/assets/images", headers=headers, files=files)
        assert res.status_code == 413
        assert res.json()["detail"]["code"] == "file_too_large"