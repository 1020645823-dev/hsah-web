import uuid
from typing import Literal

from pydantic import BaseModel, Field


class RoleCreateRequest(BaseModel):
    name: str
    description: str | None = None
    user_ids: list[uuid.UUID] = Field(default_factory=list)


class RoleResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    user_ids: list[str]


class PolicyCreateRequest(BaseModel):
    name: str
    effect: Literal["allow", "deny"]
    permissions: list[str] = Field(min_length=1)
    role_names: list[str] = Field(default_factory=list)
    resource_type: str | None = None
    resource_visibility: str | None = None


class PolicyResponse(BaseModel):
    id: str
    name: str
    effect: Literal["allow", "deny"]
    permissions: list[str]
    role_names: list[str]
    resource_type: str | None = None
    resource_visibility: str | None = None


class PermissionSimulationRequest(BaseModel):
    user_id: uuid.UUID | None = None
    permission: str
    resource_type: str
    resource_visibility: str | None = None


class MatchedPolicyResponse(BaseModel):
    id: str
    name: str
    effect: Literal["allow", "deny"]


class PermissionSimulationResponse(BaseModel):
    decision: Literal["allow", "deny", "implicit_deny"]
    matched_roles: list[str]
    matched_policies: list[MatchedPolicyResponse]
    missing_permissions: list[str]
    reason: str


class UserCreateRequest(BaseModel):
    email: str
    password: str
    is_active: bool = True
    is_2fa_enabled: bool = False


class UserUpdateRequest(BaseModel):
    email: str | None = None
    is_active: bool | None = None
    is_2fa_enabled: bool | None = None
