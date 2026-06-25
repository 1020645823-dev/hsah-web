import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class TemplateBase(BaseModel):
    name: str
    description: str | None = None
    blocks: list[dict[str, Any]]


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    blocks: list[dict[str, Any]] | None = None


class TemplateResponse(TemplateBase):
    id: int
    is_builtin: bool
    created_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
