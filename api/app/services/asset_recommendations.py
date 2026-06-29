"""Simple deterministic related/recommended asset matching using shared metadata."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.asset import Asset


def _score_pair(asset: Asset, other: Asset) -> int:
    score = 0
    asset_providers = set(asset.cloud_providers or [])
    score += len(asset_providers & set(other.cloud_providers or [])) * 3
    score += len(set(asset.industries or []) & set(other.industries or [])) * 2
    score += len(set(asset.technologies or []) & set(other.technologies or [])) * 2
    if asset.asset_type and asset.asset_type == other.asset_type:
        score += 1
    return score


def related_assets(db: Session, asset: Asset, *, limit: int = 4) -> list[tuple[Asset, int]]:
    rows = db.scalars(
        select(Asset).where(
            Asset.id != asset.id,
            Asset.visibility == "public",
            Asset.status == "published",
        )
    ).all()

    scored = [(other, _score_pair(asset, other)) for other in rows]
    scored = [pair for pair in scored if pair[1] > 0]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:limit]


def recommended_assets(db: Session, *, limit: int = 6) -> list[Asset]:
    """Return published public assets, most recently updated first."""
    return list(
        db.scalars(
            select(Asset)
            .where(Asset.visibility == "public", Asset.status == "published")
            .order_by(Asset.updated_at.desc())
            .limit(limit)
        ).all()
    )
