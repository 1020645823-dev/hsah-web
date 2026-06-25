from pydantic import BaseModel


class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str
    totp_code: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TwoFactorRequiredResponse(BaseModel):
    error: str = "2fa_required"


class MeResponse(BaseModel):
    id: str
    email: str
    is_active: bool
    two_factor_enabled: bool


class TwoFactorSetupResponse(BaseModel):
    secret: str
    otpauth_url: str


class TwoFactorVerifyRequest(BaseModel):
    totp_code: str
