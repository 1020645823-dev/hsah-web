import uuid

import pyotp
from fastapi.testclient import TestClient

from app.main import app


def test_register_login_2fa_flow() -> None:
    client = TestClient(app)

    email = f"u-{uuid.uuid4().hex}@example.com"
    password = "P@ssw0rd-123"

    res = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert res.status_code == 201

    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    token = res.json()["access_token"]

    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == email
    assert res.json()["two_factor_enabled"] is False

    res = client.post("/api/v1/auth/2fa/setup", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    secret = res.json()["secret"]

    code = pyotp.TOTP(secret).now()
    res = client.post(
        "/api/v1/auth/2fa/verify",
        json={"totp_code": code},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["two_factor_enabled"] is True

    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 428

    code = pyotp.TOTP(secret).now()
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "totp_code": code},
    )
    assert res.status_code == 200
