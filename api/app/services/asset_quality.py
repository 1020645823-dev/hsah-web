"""Asset quality scoring and missing-requirement detection.

Quality is computed deterministically from existing asset fields so that
publish readiness is explainable instead of subjective.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.models.asset import Asset

# Score bands. `ready` means publishable; `needs_work` has warnings; `blocked` cannot publish.
READY_BAND = "ready"
NEEDS_WORK_BAND = "needs_work"
BLOCKED_BAND = "blocked"


@dataclass
class QualityResult:
    score: float
    band: str
    missing: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def is_publishable(self) -> bool:
        return self.band in (READY_BAND, NEEDS_WORK_BAND) and not self.missing


def _visible_blocks(asset: Asset) -> list[dict]:
    return [
        block
        for block in (asset.content_blocks or [])
        if isinstance(block, dict) and block.get("visible", True)
    ]


def missing_requirements(asset: Asset) -> list[str]:
    """Return the list of blocking missing requirements that prevent publishing."""
    fields: list[str] = []
    if not (asset.slug or "").strip():
        fields.append("slug")
    if not (asset.title or "").strip():
        fields.append("title")
    if not (asset.short_description or "").strip():
        fields.append("short_description")
    if not asset.cloud_providers:
        fields.append("cloud_providers")
    if not _visible_blocks(asset):
        fields.append("content_blocks")
    return fields


def _quality_warnings(asset: Asset) -> list[str]:
    warnings: list[str] = []
    if not asset.industries:
        warnings.append("industries")
    if not asset.technologies:
        warnings.append("technologies")
    videos = ((asset.shared_fields or {}).get("videos") if isinstance(asset.shared_fields, dict) else None) or []
    if not videos and not (asset.shared_fields or {}).get("demo_video_url"):
        warnings.append("videos")
    sales = asset.sales_fields or {}
    if not (sales.get("value_summary") or sales.get("differentiators") or sales.get("outcomes")):
        warnings.append("sales_fields")
    if asset.visibility == "restricted" and not (asset.allowed_roles or asset.allowed_users):
        warnings.append("access_configuration")
    return warnings


def evaluate_quality(asset: Asset) -> QualityResult:
    """Evaluate an asset's quality and return a score, band, missing, and warnings."""
    missing = missing_requirements(asset)
    warnings = _quality_warnings(asset)

    # Each of the 5 core checks contributes 20 points.
    core_checks = ["slug", "title", "short_description", "cloud_providers", "content_blocks"]
    passed = sum(1 for key in core_checks if key not in missing)
    score = passed / len(core_checks) * 100.0

    if missing:
        band = BLOCKED_BAND
    elif warnings:
        band = NEEDS_WORK_BAND
    else:
        band = READY_BAND

    return QualityResult(score=round(score, 1), band=band, missing=missing, warnings=warnings)
