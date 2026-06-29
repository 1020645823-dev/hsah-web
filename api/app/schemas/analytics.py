from pydantic import BaseModel


class AnalyticsOverview(BaseModel):
    content: dict
    experience: dict
    workflow: dict
    quality: dict
    governance: dict


class AssetPerformance(BaseModel):
    asset_id: str
    slug: str
    title: str
    views: int
    favorites: int
    feedback: int
    access_requests: int
