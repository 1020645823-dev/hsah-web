from pydantic import BaseModel


class OperationsOverview(BaseModel):
    total_assets: int
    published_assets: int
    reviewing_assets: int
    low_quality_assets: int
    pending_access_requests: int


class OperationsTask(BaseModel):
    asset_id: str
    slug: str
    title: str
    status: str
    reason: str
    priority: str
    target_url: str


class OperationsTasks(BaseModel):
    items: list[OperationsTask]
    total: int


class RecentActivity(BaseModel):
    id: str
    asset_id: str
    asset_title: str
    action: str
    from_status: str | None
    to_status: str
    reason: str
    created_at: str


class RecentActivities(BaseModel):
    items: list[RecentActivity]
    total: int
