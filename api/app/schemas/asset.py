from typing import Literal

from pydantic import BaseModel, Field


class AssetVideoItem(BaseModel):
    id: str
    title: str = Field(..., min_length=1, max_length=160)
    video_url: str = Field(..., min_length=1, max_length=1000)
    poster_url: str | None = Field(None, max_length=1000)
    description: str = Field(default="", max_length=500)
    is_primary: bool = False


class SharedAssetFields(BaseModel):
    introduction: str = ""
    use_cases: list[str] = Field(default_factory=list)
    demo_video_url: str | None = None
    live_demo_url: str | None = None
    videos: list[AssetVideoItem] = Field(default_factory=list)


class SalesAssetFields(BaseModel):
    value_summary: str = ""
    differentiators: list[str] = Field(default_factory=list)
    outcomes: list[str] = Field(default_factory=list)


class DeliveryAssetFields(BaseModel):
    implementation_summary: str = ""
    prerequisites: list[str] = Field(default_factory=list)
    rollout_steps: list[str] = Field(default_factory=list)


class AssetSummary(BaseModel):
    id: str
    slug: str
    title: str
    subtitle: str | None
    short_description: str
    cloud_providers: list[str]
    industries: list[str]
    technologies: list[str]
    asset_type: str
    status: str


class AssetCreateRequest(BaseModel):
    slug: str = Field(..., min_length=1, max_length=200, pattern=r"^[a-z0-9-]+$")
    title: str = Field(..., min_length=1, max_length=240)
    subtitle: str | None = Field(None, max_length=300)
    short_description: str = Field(..., min_length=1, max_length=500)
    cloud_providers: list[str] = []
    industries: list[str] = []
    technologies: list[str] = []
    asset_type: str = Field(..., pattern=r"^(solution|whitepaper|demo|reference-architecture)$")
    status: str = Field(..., pattern=r"^(draft|published|archived)$")
    visibility: str = Field(..., pattern=r"^(public|restricted|internal)$")
    allowed_roles: list[str] = []
    allowed_users: list[str] = []
    content_schema_version: int = 1
    content_blocks: list[dict] = []
    shared_fields: SharedAssetFields = Field(default_factory=SharedAssetFields)
    sales_fields: SalesAssetFields = Field(default_factory=SalesAssetFields)
    delivery_fields: DeliveryAssetFields = Field(default_factory=DeliveryAssetFields)
    delivery_allowed_roles: list[str] = Field(default_factory=list)
    delivery_allowed_users: list[str] = Field(default_factory=list)


class AssetDetail(AssetSummary):
    content_schema_version: int
    content_blocks: list[dict]
    visibility: str
    shared_fields: dict
    sales_fields: dict
    delivery_fields: dict | None = None
    delivery_access: Literal["granted", "signin_required", "request_access"] | None = None


class BlockSearchResult(BaseModel):
    asset_id: str
    asset_name: str
    asset_slug: str
    block: dict
    matched_field: str


class BlockSearchResponse(BaseModel):
    query: str | None
    type_filter: str | None
    limit: int
    offset: int
    total: int
    results: list[BlockSearchResult]
