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
    live_demo_url: str | None = None
    videos: list[AssetVideoItem] = Field(default_factory=list)


class SalesAssetFields(BaseModel):
    value_summary: str = ""
    differentiators: list[str] = Field(default_factory=list)
    outcomes: list[str] = Field(default_factory=list)


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
    shared_fields: SharedAssetFields = Field(default_factory=SharedAssetFields)
    sales_fields: SalesAssetFields = Field(default_factory=SalesAssetFields)


class AssetDetail(AssetSummary):
    visibility: str
    shared_fields: dict
    sales_fields: dict
