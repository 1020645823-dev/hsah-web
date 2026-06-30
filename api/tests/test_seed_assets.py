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
    assert asset.shared_fields["live_demo_url"] == "https://example.com/demos/agentic-service-mesh"
    assert asset.sales_fields["value_summary"].startswith("Position a reusable")
    assert "demo_video_url" not in asset.shared_fields

    assert "videos" in asset.shared_fields
    assert len(asset.shared_fields["videos"]) >= 2
    primaries = [v for v in asset.shared_fields["videos"] if v.get("is_primary")]
    assert len(primaries) == 1
    assert primaries[0]["title"] == "Agentic Service Mesh Overview"


def test_seed_assets_is_idempotent(db_session: Session) -> None:
    seed()
    seed()

    rows = db_session.scalars(select(Asset).where(Asset.slug == SAMPLE_ASSET_SLUG)).all()

    assert len(rows) == 1
