"""add asset detail audience fields

Revision ID: 0007_asset_detail_audience
Revises: 0006_add_content_schema_version
Create Date: 2026-06-26

"""

from alembic import op
import sqlalchemy as sa

revision: str = "0007_asset_detail_audience"
down_revision: str | None = "0006_add_content_schema_version"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column(
        "assets",
        sa.Column("shared_fields", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )
    op.add_column(
        "assets",
        sa.Column("sales_fields", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )
    op.add_column(
        "assets",
        sa.Column("delivery_fields", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )
    op.add_column(
        "assets",
        sa.Column("delivery_allowed_roles", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
    )
    op.add_column(
        "assets",
        sa.Column("delivery_allowed_users", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
    )


def downgrade() -> None:
    op.drop_column("assets", "delivery_allowed_users")
    op.drop_column("assets", "delivery_allowed_roles")
    op.drop_column("assets", "delivery_fields")
    op.drop_column("assets", "sales_fields")
    op.drop_column("assets", "shared_fields")
