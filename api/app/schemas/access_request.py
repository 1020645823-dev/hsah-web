from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AccessRequestCreate(BaseModel):
    purpose: str = Field(..., min_length=1, max_length=1000)
    role: str | None = Field(default=None, max_length=120)


class AccessRequestResponse(BaseModel):
    id: str
    user_id: str
    asset_id: str
    purpose: str
    role: str | None
    status: Literal["pending", "approved", "rejected"]
    decision_reason: str
    decided_at: datetime | None
    created_at: datetime


class AccessRequestDecision(BaseModel):
    reason: str = Field(default="", max_length=1000)
