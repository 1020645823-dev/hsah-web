from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ReviewActionRequest(BaseModel):
    reason: str = Field(default="", max_length=2000)


class AssetReviewRecordResponse(BaseModel):
    id: str
    asset_id: str
    actor_user_id: str | None
    action: str
    from_status: str | None
    to_status: str
    reason: str
    created_at: datetime
