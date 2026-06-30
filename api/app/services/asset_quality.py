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
    return fields


def _quality_warnings(asset: Asset) -> list[str]:
    warnings: list[str] = []
    if not asset.industries:
        warnings.append("industries")
    if not asset.technologies:
        warnings.append("technologies")
    shared = asset.shared_fields or {}
    videos = shared.get("videos") if isinstance(shared, dict) else None
    if not videos:
        warnings.append("videos")
    sales = asset.sales_fields or {}
    if not (sales.get("value_summary") or sales.get("differentiators") or sales.get("outcomes")):
        warnings.append("sales_fields")
    return warnings


def evaluate_quality(asset: Asset) -> QualityResult:
    """Evaluate an asset's quality and return a score, band, missing, and warnings."""
    missing = missing_requirements(asset)
    warnings = _quality_warnings(asset)

    # Each of the 4 core checks contributes 25 points.
    core_checks = ["slug", "title", "short_description", "cloud_providers"]
    passed = sum(1 for key in core_checks if key not in missing)
    score = passed / len(core_checks) * 100.0

    if missing:
        band = BLOCKED_BAND
    elif warnings:
        band = NEEDS_WORK_BAND
    else:
        band = READY_BAND

    return QualityResult(score=round(score, 1), band=band, missing=missing, warnings=warnings)
