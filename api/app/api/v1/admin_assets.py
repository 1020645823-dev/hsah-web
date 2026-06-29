import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.db import get_db
from app.models.asset import Asset
from app.models.asset_review import AssetReviewRecord
from app.models.user import User
from app.schemas.asset import (
    AssetCreateRequest,
    BlockSearchResponse,
    DeliveryAssetFields,
    SalesAssetFields,
    SharedAssetFields,
)
from app.schemas.asset_quality import QualityCheckResponse
from app.schemas.asset_review import AssetReviewRecordResponse, ReviewActionRequest
from app.services.asset_quality import evaluate_quality, missing_requirements
from app.services.asset_review import (
    InvalidTransitionError,
    MissingRequirementsError,
    record_transition,
)
from app.services.audit_log import write as write_audit_log
from app.services.content_blocks import ContentBlockValidationError, normalize_blocks

router = APIRouter(prefix="/admin/assets", tags=["admin-assets"])


def _validate_and_normalize_videos(shared_fields: dict) -> dict:
    videos = shared_fields.get("videos") or []
    if not videos:
        return shared_fields
    primaries = [v for v in videos if v.get("is_primary")]
    if len(primaries) > 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "multiple_primary_videos", "message": "Only one video can be marked as primary"},
        )
    if len(primaries) == 0:
        videos[0]["is_primary"] = True
    return shared_fields


# ---------------------------------------------------------------------------
# Search helpers
# ---------------------------------------------------------------------------


def _block_matches_keyword(block: dict, keyword: str) -> bool:
    """Return True if any searchable field in the block contains the keyword (case-insensitive)."""
    kw = keyword.lower()
    block_type = block.get("type", "").lower()
    config = block.get("config", {}) if isinstance(block.get("config"), dict) else {}

    if block_type == "text":
        content = config.get("markdown", "") or config.get("html", "") or block.get("content", "") or block.get("text", "")
        return kw in content.lower()

    if block_type == "stat_card":
        stats = config.get("stats", [])
        if stats:
            for stat in stats:
                if isinstance(stat, dict) and (
                    kw in stat.get("label", "").lower()
                    or kw in stat.get("value", "").lower()
                    or kw in stat.get("description", "").lower()
                ):
                    return True
            return False
        # Fallback: flat stat_card fields
        return (
            kw in block.get("label", "").lower()
            or kw in block.get("value", "").lower()
            or kw in block.get("description", "").lower()
        )

    if block_type == "image":
        return kw in str(config.get("alt", "") or block.get("alt", "")).lower() or kw in str(
            config.get("caption", "") or block.get("caption", "")
        ).lower()

    if block_type == "code_snippet":
        return kw in str(config.get("code", "") or block.get("code", "")).lower() or kw in str(
            config.get("language", "") or block.get("language", "")
        ).lower()

    if block_type == "callout":
        return kw in str(config.get("content", "") or block.get("content", "")).lower() or kw in str(
            config.get("title", "") or block.get("title", "")
        ).lower()

    # Fallback: search all string values in the block dict
    for value in block.values():
        if isinstance(value, str) and kw in value.lower():
            return True
        if isinstance(value, list):
            for item in value:
                if isinstance(item, str) and kw in item.lower():
                    return True
                if isinstance(item, dict):
                    for v in item.values():
                        if isinstance(v, str) and kw in v.lower():
                            return True
    return False


def _get_matched_field(block: dict, keyword: str) -> str:
    """Return the first field name inside the block whose value contains the keyword."""
    kw = keyword.lower()
    block_type = block.get("type", "").lower()
    config = block.get("config", {}) if isinstance(block.get("config"), dict) else {}

    if block_type == "text":
        if kw in str(config.get("markdown", "")).lower():
            return "config.markdown"
        if kw in str(config.get("html", "")).lower():
            return "config.html"
        if kw in block.get("content", "").lower():
            return "content"
        if kw in block.get("text", "").lower():
            return "text"

    elif block_type == "stat_card":
        stats = config.get("stats", [])
        if stats:
            for stat in stats:
                if isinstance(stat, dict):
                    if kw in stat.get("label", "").lower():
                        return "config.stats.label"
                    if kw in stat.get("value", "").lower():
                        return "config.stats.value"
                    if kw in stat.get("description", "").lower():
                        return "config.stats.description"
        # Fallback: flat stat_card fields
        if kw in block.get("label", "").lower():
            return "label"
        if kw in block.get("value", "").lower():
            return "value"
        if kw in block.get("description", "").lower():
            return "description"

    elif block_type == "image":
        if kw in str(config.get("alt", "")).lower():
            return "config.alt"
        if kw in str(config.get("caption", "")).lower():
            return "config.caption"
        if kw in block.get("alt", "").lower():
            return "alt"
        if kw in block.get("caption", "").lower():
            return "caption"

    elif block_type == "code_snippet":
        if kw in str(config.get("code", "")).lower():
            return "config.code"
        if kw in str(config.get("language", "")).lower():
            return "config.language"
        if kw in block.get("code", "").lower():
            return "code"
        if kw in block.get("language", "").lower():
            return "language"

    elif block_type == "callout":
        if kw in str(config.get("content", "")).lower():
            return "config.content"
        if kw in str(config.get("title", "")).lower():
            return "config.title"
        if kw in block.get("content", "").lower():
            return "content"
        if kw in block.get("title", "").lower():
            return "title"

    # Fallback: scan all string values
    for key, value in block.items():
        if isinstance(value, str) and kw in value.lower():
            return key
        if isinstance(value, list):
            for item in value:
                if isinstance(item, str) and kw in item.lower():
                    return key
                if isinstance(item, dict):
                    for v in item.values():
                        if isinstance(v, str) and kw in v.lower():
                            return key
    return "unknown"


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------


def _to_detail(asset: Asset) -> dict:
    normalized = normalize_blocks(asset.content_blocks or [], asset.content_schema_version)
    return {
        "id": str(asset.id),
        "slug": asset.slug,
        "title": asset.title,
        "subtitle": asset.subtitle,
        "short_description": asset.short_description,
        "cloud_providers": asset.cloud_providers,
        "industries": asset.industries,
        "technologies": asset.technologies,
        "asset_type": asset.asset_type,
        "status": asset.status,
        "content_schema_version": normalized.asset_schema_version,
        "content_blocks": normalized.blocks,
        "visibility": asset.visibility,
        "shared_fields": SharedAssetFields.model_validate(asset.shared_fields or {}).model_dump(
            exclude_defaults=True,
            exclude_none=True,
        ),
        "sales_fields": SalesAssetFields.model_validate(asset.sales_fields or {}).model_dump(
            exclude_defaults=True,
            exclude_none=True,
        ),
        "delivery_fields": DeliveryAssetFields.model_validate(asset.delivery_fields or {}).model_dump(
            exclude_defaults=True,
            exclude_none=True,
        ),
        "delivery_allowed_roles": asset.delivery_allowed_roles,
        "delivery_allowed_users": asset.delivery_allowed_users,
        "allowed_roles": asset.allowed_roles,
        "allowed_users": asset.allowed_users,
    }


def _asset_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "asset_not_found", "message": "Asset not found"},
    )


def _parse_asset_id(asset_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(asset_id)
    except ValueError as exc:
        raise _asset_not_found() from exc


def _get_asset_or_404(asset_id: str, db: Session) -> Asset:
    asset = db.scalar(select(Asset).where(Asset.id == _parse_asset_id(asset_id)))
    if asset is None:
        raise _asset_not_found()
    return asset


def _commit_and_refresh_asset(asset: Asset, db: Session) -> dict:
    db.commit()
    db.refresh(asset)
    return _to_detail(asset)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/search-blocks", response_model=BlockSearchResponse)
async def search_blocks(
    q: str | None = None,
    type: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BlockSearchResponse:
    """Search across all assets' content_blocks for blocks matching the keyword."""
    assets = db.scalars(select(Asset)).all()
    results = []
    kw_lower = q.lower() if q else None

    for asset in assets:
        for block in asset.content_blocks or []:
            block_type = block.get("type")
            if type is not None and block_type != type:
                continue
            if kw_lower is None or _block_matches_keyword(block, kw_lower):
                results.append(
                    {
                        "asset_id": str(asset.id),
                        "asset_name": asset.title,
                        "asset_slug": asset.slug,
                        "block": block,
                        "matched_field": _get_matched_field(block, kw_lower) if kw_lower else "unknown",
                    }
                )

    total = len(results)
    paginated = results[offset : offset + limit]

    return BlockSearchResponse(
        query=q,
        type_filter=type,
        limit=limit,
        offset=offset,
        total=total,
        results=paginated,
    )


@router.get("/{asset_id}")
def get_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    return _to_detail(_get_asset_or_404(asset_id, db))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_asset(
    payload: AssetCreateRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    existing = db.scalar(select(Asset).where(Asset.slug == payload.slug))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "slug_already_exists", "message": "Slug already exists"},
        )

    try:
        normalized = normalize_blocks(payload.content_blocks, payload.content_schema_version)
    except ContentBlockValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "content_block_validation_failed",
                "message": "One or more content blocks are invalid",
                "errors": exc.errors,
            },
        ) from exc

    normalized_shared = _validate_and_normalize_videos(payload.shared_fields.model_dump())
    payload.shared_fields = SharedAssetFields(**normalized_shared)

    asset_data = payload.model_dump()
    asset_data["content_schema_version"] = normalized.asset_schema_version
    asset_data["content_blocks"] = normalized.blocks
    asset = Asset(**asset_data)
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return _to_detail(asset)


def _handle_transition_error(action: str, asset: Asset, exc: Exception) -> HTTPException:
    if isinstance(exc, InvalidTransitionError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "invalid_transition",
                "message": f"Action '{action}' not allowed from status '{asset.status}'",
            },
        )
    if isinstance(exc, MissingRequirementsError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "publish_validation_failed",
                "message": "Asset is not ready to publish",
                "fields": exc.fields,
            },
        )
    if isinstance(exc, ValueError) and str(exc) == "reason_required":
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "reason_required", "message": "A reason is required for this action"},
        )
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="transition_failed")


def _perform_transition(
    action: str,
    asset_id: str,
    db: Session,
    user: User,
    *,
    reason: str = "",
    require_publishable: bool = False,
) -> dict:
    asset = _get_asset_or_404(asset_id, db)
    if require_publishable:
        missing = missing_requirements(asset)
        if missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "code": "publish_validation_failed",
                    "message": "Asset is not ready to publish",
                    "fields": missing,
                },
            )
    try:
        record_transition(
            db, asset, action, actor_user_id=user.id, reason=reason
        )
    except (InvalidTransitionError, MissingRequirementsError, ValueError) as exc:
        raise _handle_transition_error(action, asset, exc) from exc

    write_audit_log(
        db,
        action=f"asset.{action}",
        resource_type="asset",
        actor_user_id=user.id,
        resource_id=str(asset.id),
        summary=f"{action}: {asset.title}",
        details={"from_status": asset.status, "reason": reason} if reason else {},
    )
    return _commit_and_refresh_asset(asset, db)


@router.get("/{asset_id}/quality-check", response_model=QualityCheckResponse)
def quality_check(
    asset_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> QualityCheckResponse:
    asset = _get_asset_or_404(asset_id, db)
    result = evaluate_quality(asset)
    return QualityCheckResponse(
        asset_id=str(asset.id),
        score=result.score,
        band=result.band,
        missing=result.missing,
        warnings=result.warnings,
        is_publishable=result.is_publishable,
    )


@router.post("/{asset_id}/submit-review")
def submit_review(
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return _perform_transition("submit_review", asset_id, db, user)


@router.post("/{asset_id}/approve")
def approve_asset(
    asset_id: str,
    payload: ReviewActionRequest | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return _perform_transition(
        "approve", asset_id, db, user, require_publishable=True, reason=(payload.reason if payload else "")
    )


@router.post("/{asset_id}/reject")
def reject_asset(
    asset_id: str,
    payload: ReviewActionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return _perform_transition("reject", asset_id, db, user, reason=payload.reason)


@router.post("/{asset_id}/publish")
def publish_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return _perform_transition("publish", asset_id, db, user, require_publishable=True)


@router.post("/{asset_id}/unpublish")
def unpublish_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return _perform_transition("unpublish", asset_id, db, user)


@router.post("/{asset_id}/archive")
def archive_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return _perform_transition("archive", asset_id, db, user)


@router.post("/{asset_id}/restore")
def restore_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return _perform_transition("restore", asset_id, db, user)


@router.get("/{asset_id}/review-history", response_model=list[AssetReviewRecordResponse])
def review_history(
    asset_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> list[AssetReviewRecordResponse]:
    asset = _get_asset_or_404(asset_id, db)
    records = db.scalars(
        select(AssetReviewRecord)
        .where(AssetReviewRecord.asset_id == asset.id)
        .order_by(AssetReviewRecord.created_at.desc(), AssetReviewRecord.id.desc())
    ).all()
    return [
        AssetReviewRecordResponse(
            id=str(r.id),
            asset_id=str(r.asset_id),
            actor_user_id=str(r.actor_user_id) if r.actor_user_id else None,
            action=r.action,
            from_status=r.from_status,
            to_status=r.to_status,
            reason=r.reason,
            created_at=r.created_at,
        )
        for r in records
    ]


@router.put("/{asset_id}")
def update_asset(
    asset_id: str,
    payload: AssetCreateRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    uid = _parse_asset_id(asset_id)
    asset = _get_asset_or_404(asset_id, db)

    existing = db.scalar(select(Asset).where(Asset.slug == payload.slug, Asset.id != uid))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "slug_already_exists", "message": "Slug already exists"},
        )

    try:
        normalized = normalize_blocks(payload.content_blocks, payload.content_schema_version)
    except ContentBlockValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "content_block_validation_failed",
                "message": "One or more content blocks are invalid",
                "errors": exc.errors,
            },
        ) from exc

    normalized_shared = _validate_and_normalize_videos(payload.shared_fields.model_dump())
    payload.shared_fields = SharedAssetFields(**normalized_shared)

    payload_data = payload.model_dump()
    payload_data["content_schema_version"] = normalized.asset_schema_version
    payload_data["content_blocks"] = normalized.blocks

    for key, value in payload_data.items():
        setattr(asset, key, value)

    db.commit()
    db.refresh(asset)
    return _to_detail(asset)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> None:
    asset = _get_asset_or_404(asset_id, db)
    db.delete(asset)
    db.commit()
    return None


@router.post("/batch-delete", status_code=status.HTTP_200_OK)
def batch_delete_assets(
    payload: dict,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> dict:
    """Delete multiple assets by their IDs."""
    ids = payload.get("ids", [])
    if not ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "empty_ids", "message": "No asset IDs provided"},
        )

    deleted = 0
    failed = []
    for raw_id in ids:
        try:
            uid = uuid.UUID(raw_id)
        except ValueError:
            failed.append({"id": raw_id, "reason": "invalid_id"})
            continue

        asset = db.scalar(select(Asset).where(Asset.id == uid))
        if asset is None:
            failed.append({"id": raw_id, "reason": "not_found"})
            continue

        db.delete(asset)
        deleted += 1

    db.commit()
    return {"deleted": deleted, "failed": failed}
