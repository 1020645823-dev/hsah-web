from pydantic import BaseModel


class QualityCheckResponse(BaseModel):
    asset_id: str
    score: float
    band: str
    missing: list[str]
    warnings: list[str]
    is_publishable: bool
