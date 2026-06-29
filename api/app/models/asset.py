import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(300), nullable=True)
    short_description: Mapped[str] = mapped_column(String(500), nullable=False)

    cloud_providers: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    industries: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    technologies: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    asset_type: Mapped[str] = mapped_column(String(40), nullable=False, default="solution")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="preview")

    shared_fields: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    sales_fields: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    visibility: Mapped[str] = mapped_column(String(20), nullable=False, default="public")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
