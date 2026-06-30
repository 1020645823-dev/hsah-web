from datetime import datetime

from pydantic import BaseModel, Field


class CollectionItemSummary(BaseModel):
    id: str
    slug: str
    title: str
    subtitle: str | None
    short_description: str
    cloud_providers: list[str]
    asset_type: str
    position: int


class CollectionSummary(BaseModel):
    id: str
    slug: str
    title: str
    summary: str
    cover_url: str | None
    item_count: int


class CollectionDetail(BaseModel):
    id: str
    slug: str
    title: str
    summary: str
    cover_url: str | None
    items: list[CollectionItemSummary]


class CollectionCreateRequest(BaseModel):
    slug: str = Field(..., min_length=1, max_length=200, pattern=r"^[a-z0-9-]+$")
    title: str = Field(..., min_length=1, max_length=240)
    summary: str = Field(default="", max_length=500)
    cover_url: str | None = Field(None, max_length=1000)
    is_visible: bool = True
