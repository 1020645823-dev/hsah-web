"""assets

Revision ID: 0003_assets
Revises: 0002_users
Create Date: 2026-06-24

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0003_assets"
down_revision: str | None = "0002_users"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "assets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("subtitle", sa.String(length=300), nullable=True),
        sa.Column("short_description", sa.String(length=500), nullable=False),
        sa.Column(
            "cloud_providers",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "industries",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "technologies",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("asset_type", sa.String(length=40), nullable=False, server_default=sa.text("'solution'")),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'preview'")),
        sa.Column(
            "content_blocks",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("visibility", sa.String(length=20), nullable=False, server_default=sa.text("'public'")),
        sa.Column(
            "allowed_roles",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "allowed_users",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_assets_slug", "assets", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_assets_slug", table_name="assets")
    op.drop_table("assets")
