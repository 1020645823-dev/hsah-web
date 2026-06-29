from app.schemas.asset import AssetVideoItem, SharedAssetFields, AssetCreateRequest


def test_asset_video_item_defaults():
    item = AssetVideoItem(id="v1", title="Demo", video_url="https://example.com/v.mp4")
    assert item.poster_url is None
    assert item.description == ""
    assert item.is_primary is False


def test_asset_video_item_with_all_fields():
    item = AssetVideoItem(
        id="v1",
        title="Architecture Walkthrough",
        video_url="https://example.com/v.mp4",
        poster_url="https://example.com/poster.jpg",
        description="High-level overview of the mesh architecture.",
        is_primary=True,
    )
    assert item.is_primary is True
    assert item.poster_url == "https://example.com/poster.jpg"


def test_shared_asset_fields_includes_videos():
    data = {
        "introduction": "Intro",
        "use_cases": ["uc1"],
        "live_demo_url": "https://example.com/live",
        "videos": [
            {"id": "v1", "title": "Main", "video_url": "https://example.com/v1.mp4", "is_primary": True},
            {"id": "v2", "title": "Alt", "video_url": "https://example.com/v2.mp4", "is_primary": False},
        ],
    }
    parsed = SharedAssetFields.model_validate(data)
    assert len(parsed.videos) == 2
    assert parsed.videos[0].is_primary is True
    assert parsed.videos[1].title == "Alt"


def test_shared_asset_fields_videos_default_empty():
    parsed = SharedAssetFields.model_validate({"introduction": "x"})
    assert parsed.videos == []


def test_asset_create_request_accepts_videos_in_shared_fields():
    payload = AssetCreateRequest(
        slug="test-slug",
        title="Test",
        short_description="desc",
        asset_type="solution",
        status="draft",
        visibility="public",
        shared_fields={
            "videos": [{"id": "v1", "title": "T", "video_url": "https://example.com/v.mp4"}],
        },
    )
    assert len(payload.shared_fields.videos) == 1
    assert payload.shared_fields.videos[0].id == "v1"
