from pydantic import BaseModel, Field


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


class AssetDetail(AssetSummary):
    content_schema_version: int
    content_blocks: list[dict]
    visibility: str


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
