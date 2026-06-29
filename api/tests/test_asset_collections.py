import uuid

from fastapi.testclient import TestClient

from app.main import app
from app.models.asset import Asset
from app.models.asset_collection import AssetCollection, AssetCollectionItem

client = TestClient(app)


def _published_asset(db_session, slug: str) -> Asset:
    asset = Asset(
        slug=slug,
        title=f"Asset {slug}",
        subtitle=None,
        short_description="desc",
        cloud_providers=["aws"],
        industries=[],
        technologies=[],
        asset_type="solution",
        status="published",
        content_schema_version=1,
        content_blocks=[{"type": "text", "config": {"markdown": "x"}, "visible": True}],
        shared_fields={},
        sales_fields={},
        delivery_fields={},
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)
    return asset


def _collection(db_session, slug: str, *, visible: bool = True) -> AssetCollection:
    collection = AssetCollection(slug=slug, title=f"Collection {slug}", summary="", is_visible=visible)
    db_session.add(collection)
    db_session.commit()
    db_session.refresh(collection)
    return collection


def test_list_collections_only_visible(db_session):
    _collection(db_session, "visible-col", visible=True)
    _collection(db_session, "hidden-col", visible=False)

    response = client.get("/api/v1/assets/collections")

    slugs = [c["slug"] for c in response.json()]
    assert "visible-col" in slugs
    assert "hidden-col" not in slugs


def test_collection_detail_only_published_members(db_session):
    collection = _collection(db_session, "ai-transform")
    published = _published_asset(db_session, "pub-member")
    draft = Asset(
        slug="draft-member",
        title="Draft",
        subtitle=None,
        short_description="d",
        cloud_providers=["aws"],
        industries=[],
        technologies=[],
        asset_type="solution",
        status="draft",
        content_schema_version=1,
        content_blocks=[],
        shared_fields={},
        sales_fields={},
        delivery_fields={},
    )
    db_session.add(draft)
    db_session.commit()
    db_session.refresh(draft)

    db_session.add_all([
        AssetCollectionItem(collection_id=collection.id, asset_id=published.id, position=0),
        AssetCollectionItem(collection_id=collection.id, asset_id=draft.id, position=1),
    ])
    db_session.commit()

    response = client.get("/api/v1/assets/collections/ai-transform")
    assert response.status_code == 200
    body = response.json()
    slugs = [item["slug"] for item in body["items"]]
    assert "pub-member" in slugs
    assert "draft-member" not in slugs


def test_collection_detail_404_for_unknown_slug(db_session):
    response = client.get("/api/v1/assets/collections/does-not-exist")
    assert response.status_code == 404


def test_collection_summary_item_count_only_counts_published(db_session):
    collection = _collection(db_session, "counted-col")
    published = _published_asset(db_session, "counted-pub")
    db_session.add(AssetCollectionItem(collection_id=collection.id, asset_id=published.id, position=0))
    db_session.commit()

    response = client.get("/api/v1/assets/collections")
    summary = next(c for c in response.json() if c["slug"] == "counted-col")
    assert summary["item_count"] == 1
