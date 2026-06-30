from app.models.asset import Asset
from app.services.asset_quality import (
    BLOCKED_BAND,
    NEEDS_WORK_BAND,
    READY_BAND,
    evaluate_quality,
    missing_requirements,
)


def _full_asset(**overrides) -> Asset:
    base = dict(
        slug="full-asset",
        title="Full Asset",
        subtitle="subtitle",
        short_description="A complete asset.",
        cloud_providers=["aws"],
        industries=["finance"],
        technologies=["python"],
        asset_type="solution",
        status="draft",
        shared_fields={"videos": [{"id": "v1", "title": "Demo", "video_url": "http://x/y"}]},
        sales_fields={"value_summary": "Value"},
    )
    base.update(overrides)
    return Asset(**base)


def test_ready_asset_scores_full():
    asset = _full_asset()
    result = evaluate_quality(asset)
    assert result.band == READY_BAND
    assert result.score == 100.0
    assert result.is_publishable is True
    assert result.missing == []
    assert result.warnings == []


def test_missing_short_description_blocks_publish():
    asset = _full_asset(short_description="")
    result = evaluate_quality(asset)
    assert result.band == BLOCKED_BAND
    assert "short_description" in result.missing
    assert result.is_publishable is False


def test_missing_cloud_providers_blocks_publish():
    asset = _full_asset(cloud_providers=[])
    assert "cloud_providers" in missing_requirements(asset)
    assert evaluate_quality(asset).is_publishable is False


def test_missing_title_blocks_publish():
    asset = _full_asset(title="   ")
    result = evaluate_quality(asset)
    assert result.band == BLOCKED_BAND
    assert "title" in result.missing
    assert result.is_publishable is False


def test_needs_work_when_warnings_present():
    asset = _full_asset(industries=[], technologies=[], shared_fields={}, sales_fields={})
    result = evaluate_quality(asset)
    assert result.band == NEEDS_WORK_BAND
    assert result.is_publishable is True  # publishable but with warnings
    assert "industries" in result.warnings
    assert "technologies" in result.warnings
    assert "videos" in result.warnings
    assert "sales_fields" in result.warnings
    assert "access_configuration" not in result.warnings
