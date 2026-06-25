import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.auth import get_current_user
from app.core.db import get_db
from app.core.security import hash_password
from app.models.access_policy import AccessPolicy
from app.models.asset import Asset
from app.models.role import Role
from app.models.user import User
from app.schemas.admin import AdminOverview, UserSummary
from app.schemas.asset import AssetSummary
from app.schemas.common import PaginatedResponse
from app.schemas.rbac import (
    MatchedPolicyResponse,
    PermissionSimulationRequest,
    PermissionSimulationResponse,
    PolicyCreateRequest,
    PolicyResponse,
    RoleCreateRequest,
    RoleResponse,
    UserCreateRequest,
    UserUpdateRequest,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _serialize_role(role: Role) -> RoleResponse:
    return RoleResponse(
        id=str(role.id),
        name=role.name,
        description=role.description,
        user_ids=[str(user.id) for user in role.users],
    )


def _serialize_policy(policy: AccessPolicy) -> PolicyResponse:
    return PolicyResponse(
        id=str(policy.id),
        name=policy.name,
        effect=policy.effect,
        permissions=policy.permissions,
        role_names=policy.role_names,
        resource_type=policy.resource_type,
        resource_visibility=policy.resource_visibility,
    )


def _get_target_user(db: Session, request_user: User, requested_user_id: uuid.UUID | None) -> User:
    if requested_user_id is None:
        return request_user

    target_user = db.scalar(select(User).where(User.id == requested_user_id))
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user_not_found")
    return target_user


def paginate_query(db: Session, stmt, limit: int, offset: int):
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0
    items = db.scalars(stmt.offset(offset).limit(limit)).all()
    return items, total


@router.get("/overview", response_model=AdminOverview)
def overview(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> AdminOverview:
    users = db.scalar(select(func.count()).select_from(User)) or 0
    assets = db.scalar(select(func.count()).select_from(Asset)) or 0
    return AdminOverview(users=users, assets=assets)


@router.get("/dashboard", response_model=AdminOverview)
def dashboard(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> AdminOverview:
    users = db.scalar(select(func.count()).select_from(User)) or 0
    assets = db.scalar(select(func.count()).select_from(Asset)) or 0
    return AdminOverview(users=users, assets=assets)


@router.get("/users", response_model=PaginatedResponse[UserSummary])
def list_users(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[UserSummary]:
    stmt = select(User).order_by(User.created_at.desc())
    items, total = paginate_query(db, stmt, limit, offset)
    return PaginatedResponse(
        items=[
            UserSummary(
                id=str(u.id),
                email=u.email,
                is_active=u.is_active,
                two_factor_enabled=u.two_factor_enabled,
            )
            for u in items
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/assets", response_model=PaginatedResponse[AssetSummary])
def list_assets_admin(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[AssetSummary]:
    stmt = select(Asset).order_by(Asset.created_at.desc())
    items, total = paginate_query(db, stmt, limit, offset)
    return PaginatedResponse(
        items=[
            AssetSummary(
                id=str(a.id),
                slug=a.slug,
                title=a.title,
                subtitle=a.subtitle,
                short_description=a.short_description,
                cloud_providers=a.cloud_providers,
                industries=a.industries,
                technologies=a.technologies,
                asset_type=a.asset_type,
                status=a.status,
            )
            for a in items
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/users", response_model=UserSummary, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> UserSummary:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email_already_exists")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        is_active=payload.is_active,
        two_factor_enabled=payload.is_2fa_enabled,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserSummary(
        id=str(user.id),
        email=user.email,
        is_active=user.is_active,
        two_factor_enabled=user.two_factor_enabled,
    )


@router.put("/users/{user_id}", response_model=UserSummary)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> UserSummary:
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user_not_found")

    if payload.email is not None:
        existing = db.scalar(select(User).where(User.email == payload.email, User.id != user_id))
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email_already_exists")
        user.email = payload.email
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.is_2fa_enabled is not None:
        user.two_factor_enabled = payload.is_2fa_enabled

    db.commit()
    db.refresh(user)
    return UserSummary(
        id=str(user.id),
        email=user.email,
        is_active=user.is_active,
        two_factor_enabled=user.two_factor_enabled,
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user_not_found")
    db.delete(user)
    db.commit()


@router.get("/roles", response_model=PaginatedResponse[RoleResponse])
def list_roles(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[RoleResponse]:
    stmt = select(Role).order_by(Role.created_at.desc())
    items, total = paginate_query(db, stmt, limit, offset)
    # Eager load users for each role in the paginated result
    role_ids = [role.id for role in items]
    if role_ids:
        db.scalars(select(Role).options(selectinload(Role.users)).where(Role.id.in_(role_ids))).all()
    return PaginatedResponse(
        items=[_serialize_role(role) for role in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreateRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> RoleResponse:
    existing = db.scalar(select(Role).where(Role.name == payload.name))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="role_already_exists")

    assigned_users: list[User] = []
    if payload.user_ids:
        rows = db.scalars(select(User).where(User.id.in_(payload.user_ids))).all()
        assigned_users = list(rows)
        found_ids = {user.id for user in assigned_users}
        missing_ids = [str(user_id) for user_id in payload.user_ids if user_id not in found_ids]
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "invalid_user_ids", "user_ids": missing_ids},
            )

    role = Role(name=payload.name, description=payload.description, users=assigned_users)
    db.add(role)
    db.commit()
    db.refresh(role)
    role = db.scalar(select(Role).options(selectinload(Role.users)).where(Role.id == role.id))
    assert role is not None
    return _serialize_role(role)


@router.put("/roles/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: uuid.UUID,
    payload: RoleCreateRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> RoleResponse:
    role = db.scalar(select(Role).options(selectinload(Role.users)).where(Role.id == role_id))
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="role_not_found")

    existing = db.scalar(select(Role).where(Role.name == payload.name, Role.id != role_id))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="role_name_already_exists")

    assigned_users: list[User] = []
    if payload.user_ids:
        rows = db.scalars(select(User).where(User.id.in_(payload.user_ids))).all()
        assigned_users = list(rows)
        found_ids = {user.id for user in assigned_users}
        missing_ids = [str(user_id) for user_id in payload.user_ids if user_id not in found_ids]
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "invalid_user_ids", "user_ids": missing_ids},
            )

    role.name = payload.name
    role.description = payload.description
    role.users = assigned_users
    db.commit()
    db.refresh(role)
    role = db.scalar(select(Role).options(selectinload(Role.users)).where(Role.id == role_id))
    assert role is not None
    return _serialize_role(role)


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    role = db.scalar(select(Role).where(Role.id == role_id))
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="role_not_found")
    db.delete(role)
    db.commit()
    return None


@router.get("/policies", response_model=PaginatedResponse[PolicyResponse])
def list_policies(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[PolicyResponse]:
    stmt = select(AccessPolicy).order_by(AccessPolicy.created_at.desc())
    items, total = paginate_query(db, stmt, limit, offset)
    return PaginatedResponse(
        items=[_serialize_policy(policy) for policy in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/policies", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(
    payload: PolicyCreateRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PolicyResponse:
    existing = db.scalar(select(AccessPolicy).where(AccessPolicy.name == payload.name))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="policy_already_exists")

    if payload.role_names:
        existing_roles = db.scalars(select(Role.name).where(Role.name.in_(payload.role_names))).all()
        missing_roles = sorted(set(payload.role_names) - set(existing_roles))
        if missing_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "invalid_role_names", "role_names": missing_roles},
            )

    policy = AccessPolicy(
        name=payload.name,
        effect=payload.effect,
        permissions=payload.permissions,
        role_names=payload.role_names,
        resource_type=payload.resource_type,
        resource_visibility=payload.resource_visibility,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return _serialize_policy(policy)


@router.put("/policies/{policy_id}", response_model=PolicyResponse)
def update_policy(
    policy_id: uuid.UUID,
    payload: PolicyCreateRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PolicyResponse:
    policy = db.scalar(select(AccessPolicy).where(AccessPolicy.id == policy_id))
    if policy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="policy_not_found")

    existing = db.scalar(select(AccessPolicy).where(AccessPolicy.name == payload.name, AccessPolicy.id != policy_id))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="policy_name_already_exists")

    if payload.role_names:
        existing_roles = db.scalars(select(Role.name).where(Role.name.in_(payload.role_names))).all()
        missing_roles = sorted(set(payload.role_names) - set(existing_roles))
        if missing_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "invalid_role_names", "role_names": missing_roles},
            )

    policy.name = payload.name
    policy.effect = payload.effect
    policy.permissions = payload.permissions
    policy.role_names = payload.role_names
    policy.resource_type = payload.resource_type
    policy.resource_visibility = payload.resource_visibility
    db.commit()
    db.refresh(policy)
    return _serialize_policy(policy)


@router.delete("/policies/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(
    policy_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    policy = db.scalar(select(AccessPolicy).where(AccessPolicy.id == policy_id))
    if policy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="policy_not_found")
    db.delete(policy)
    db.commit()
    return None


@router.post("/permissions/simulate", response_model=PermissionSimulationResponse)
def simulate_permission(
    payload: PermissionSimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PermissionSimulationResponse:
    target_user = _get_target_user(db, current_user, payload.user_id)
    target_user = db.scalar(select(User).options(selectinload(User.roles)).where(User.id == target_user.id))
    assert target_user is not None

    matched_roles = sorted(role.name for role in target_user.roles)
    policies = db.scalars(select(AccessPolicy).order_by(AccessPolicy.created_at.asc())).all()

    matched_policies: list[MatchedPolicyResponse] = []
    for policy in policies:
        role_match = not policy.role_names or bool(set(policy.role_names) & set(matched_roles))
        if not role_match:
            continue
        if payload.permission not in policy.permissions:
            continue
        if policy.resource_type and policy.resource_type != payload.resource_type:
            continue
        if policy.resource_visibility and policy.resource_visibility != payload.resource_visibility:
            continue

        matched_policies.append(MatchedPolicyResponse(id=str(policy.id), name=policy.name, effect=policy.effect))

    if any(policy.effect == "deny" for policy in matched_policies):
        return PermissionSimulationResponse(
            decision="deny",
            matched_roles=matched_roles,
            matched_policies=matched_policies,
            missing_permissions=[payload.permission],
            reason="matched_deny_policy",
        )

    if any(policy.effect == "allow" for policy in matched_policies):
        return PermissionSimulationResponse(
            decision="allow",
            matched_roles=matched_roles,
            matched_policies=matched_policies,
            missing_permissions=[],
            reason="matched_allow_policy",
        )

    return PermissionSimulationResponse(
        decision="implicit_deny",
        matched_roles=matched_roles,
        matched_policies=[],
        missing_permissions=[payload.permission],
        reason="no_matching_policy",
    )
