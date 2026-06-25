from pydantic import BaseModel


class AdminOverview(BaseModel):
    users: int
    assets: int


class UserSummary(BaseModel):
    id: str
    email: str
    is_active: bool
    two_factor_enabled: bool
