from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class FavoriteResponse(BaseModel):
    id: str
    asset_id: str
    is_favorite: bool


class FeedbackCreateRequest(BaseModel):
    feedback_type: Literal["question", "problem", "praise", "other"]
    message: str = Field(..., min_length=1, max_length=2000)


class FeedbackResponse(BaseModel):
    id: str
    asset_id: str
    feedback_type: str
    message: str
    created_at: datetime


class RelatedAssetSummary(BaseModel):
    id: str
    slug: str
    title: str
    subtitle: str | None
    short_description: str
    cloud_providers: list[str]
    asset_type: str
    match_score: int
