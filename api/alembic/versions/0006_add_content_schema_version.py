"""add content_schema_version to assets

Revision ID: 0006_add_content_schema_version
Revises: 0005_templates
Create Date: 2026-06-25

"""

from alembic import op
import sqlalchemy as sa

revision: str = "0006_add_content_schema_version"
down_revision: str | None = "0005_templates"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column(
        "assets",
        sa.Column("content_schema_version", sa.Integer(), nullable=False, server_default=sa.text("1")),
    )


def downgrade() -> None:
    op.drop_column("assets", "content_schema_version")
