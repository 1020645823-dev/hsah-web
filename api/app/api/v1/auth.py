import uuid

import pyotp
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.core.security import create_access_token, decode_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    MeResponse,
    RegisterRequest,
    TokenResponse,
    TwoFactorRequiredResponse,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])
http_bearer = HTTPBearer(auto_error=False)


def _resolve_user_from_credentials(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None

    try:
        payload = decode_token(credentials.credentials)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED) from e

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED) from e

    user = db.scalar(select(User).where(User.id == user_uuid))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    return user


def get_current_user(
    user: User | None = Depends(_resolve_user_from_credentials),
) -> User:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user


def get_optional_user(
    user: User | None = Depends(_resolve_user_from_credentials),
) -> User | None:
    return user


@router.post("/register", response_model=MeResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> MeResponse:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email_already_exists")

    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    return MeResponse(
        id=str(user.id),
        email=user.email,
        is_active=user.is_active,
        two_factor_enabled=user.two_factor_enabled,
    )


@router.post(
    "/login",
    responses={status.HTTP_428_PRECONDITION_REQUIRED: {"model": TwoFactorRequiredResponse}},
)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_credentials")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_credentials")

    if user.two_factor_enabled:
        if not payload.totp_code:
            raise HTTPException(status_code=status.HTTP_428_PRECONDITION_REQUIRED, detail="2fa_required")
        if not user.two_factor_secret:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(payload.totp_code, valid_window=1):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_totp")

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)


@router.get("/me", response_model=MeResponse)
def me(user: User = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        id=str(user.id),
        email=user.email,
        is_active=user.is_active,
        two_factor_enabled=user.two_factor_enabled,
    )


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_2fa(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> TwoFactorSetupResponse:
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(name=user.email, issuer_name=settings.jwt_issuer)

    user.two_factor_secret = secret
    user.two_factor_enabled = False
    db.add(user)
    db.commit()

    return TwoFactorSetupResponse(secret=secret, otpauth_url=otpauth_url)


@router.post("/2fa/verify", response_model=MeResponse)
def verify_2fa(
    payload: TwoFactorVerifyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeResponse:
    if not user.two_factor_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2fa_not_initialized")

    totp = pyotp.TOTP(user.two_factor_secret)
    if not totp.verify(payload.totp_code, valid_window=1):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_totp")

    user.two_factor_enabled = True
    db.add(user)
    db.commit()
    db.refresh(user)

    return MeResponse(
        id=str(user.id),
        email=user.email,
        is_active=user.is_active,
        two_factor_enabled=user.two_factor_enabled,
    )
