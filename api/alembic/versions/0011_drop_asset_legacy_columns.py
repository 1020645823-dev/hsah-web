"""drop asset legacy columns (access lists, delivery, content blocks)

Revision ID: 0011_drop_asset_legacy_columns
Revises: 0010_drop_templates
Create Date: 2026-06-29

Removes the columns backing features that have been retired from the asset model:
- allowed_roles / allowed_users (never enforced on the public read path)
- delivery_fields / delivery_allowed_roles / delivery_allowed_users (delivery section removed)
- content_schema_version / content_blocks (content-block subsystem removed)

"""

from alembic import op


revision: str = "0011_drop_asset_legacy_columns"
down_revision: str | None = "0010_drop_templates"
branch_labels: str | None = None
depends_on: str | None = None


# Columns dropped from the assets table. Kept as a constant so the downgrade can
# be documented; recreating the exact original columns is out of scope because the
# application no longer reads or writes them.
DROPPED_COLUMNS = [
    "allowed_roles",
    "allowed_users",
    "delivery_fields",
    "delivery_allowed_roles",
    "delivery_allowed_users",
    "content_schema_version",
    "content_blocks",
]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa_inspect_columns(bind, "assets")
    existing = {col["name"] for col in inspector}
    for column in DROPPED_COLUMNS:
        if column in existing:
            op.drop_column("assets", column)


def downgrade() -> None:
    # The application no longer references these columns, so the downgrade is a
    # no-op rather than recreating now-unused schema. If a full restore is needed,
    # restore revision 0010 and earlier instead.
    pass


def sa_inspect_columns(bind, table_name: str):
    """Return alembic/SQLAlchemy column introspection for a table."""
    from sqlalchemy import inspect

    inspector = inspect(bind)
    return inspector.get_columns(table_name)
