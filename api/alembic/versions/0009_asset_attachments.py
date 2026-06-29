"""asset attachments

Revision ID: 0009_asset_attachments
Revises: 0008_info_polish
Create Date: 2026-06-29

"""

from alembic import op
import sqlalchemy as sa


revision: str = "0009_asset_attachments"
down_revision: str | None = "0008_info_polish"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "asset_attachments",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("asset_id", sa.Uuid(as_uuid=True), sa.ForeignKey("assets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_name", sa.String(300), nullable=False),
        sa.Column("storage_key", sa.String(500), nullable=False),
        sa.Column("content_type", sa.String(100), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("uploaded_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_asset_attachments_asset_id", "asset_attachments", ["asset_id"])
    op.create_index("ix_asset_attachments_uploaded_by", "asset_attachments", ["uploaded_by"])


def downgrade() -> None:
    op.drop_table("asset_attachments")
