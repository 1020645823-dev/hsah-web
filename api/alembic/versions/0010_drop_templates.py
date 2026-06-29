"""drop templates

Revision ID: 0010_drop_templates
Revises: 0009_asset_attachments
Create Date: 2026-06-29

"""

from alembic import op


revision: str = "0010_drop_templates"
down_revision: str | None = "0009_asset_attachments"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.drop_table("templates")


def downgrade() -> None:
    # Recreating the templates table is intentionally omitted: the content-block
    # template feature has been removed from the application, so there is nothing
    # to restore. If a rollback is ever needed, restore revision 0005_templates.
    pass
