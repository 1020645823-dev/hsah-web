from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.scripts.seed_assets import SAMPLE_ASSET_SLUG, seed


def test_seed_assets_upserts_complete_public_sample_asset(db_session: Session) -> None:
    seed()

    asset = db_session.scalar(select(Asset).where(Asset.slug == SAMPLE_ASSET_SLUG))

    assert asset is not None
    assert asset.title == "Agentic Service Mesh on Kubernetes"
    assert asset.status == "published"
    assert asset.visibility == "public"
    assert asset.asset_type == "reference-architecture"
    assert asset.cloud_providers == ["aws", "azure", "gcp"]
    assert asset.industries == ["financial-services", "healthcare", "manufacturing"]
    assert asset.technologies == ["genai", "kubernetes", "service-mesh", "observability"]
    assert len(asset.content_blocks) >= 5
    assert {block["type"] for block in asset.content_blocks} >= {"text", "stat_card", "callout", "code_snippet"}


def test_seed_assets_is_idempotent(db_session: Session) -> None:
    seed()
    seed()

    rows = db_session.scalars(select(Asset).where(Asset.slug == SAMPLE_ASSET_SLUG)).all()

    assert len(rows) == 1
