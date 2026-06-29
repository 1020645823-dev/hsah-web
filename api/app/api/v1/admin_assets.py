import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.db import get_db
from app.core.permissions import require_permission
from app.models.asset import Asset
from app.models.asset_review import AssetReviewRecord
from app.models.user import User
from app.schemas.asset import AssetCreateRequest, SalesAssetFields, SharedAssetFields
from app.schemas.asset_quality import QualityCheckResponse
from app.schemas.asset_review import AssetReviewRecordResponse, ReviewActionRequest
from app.services.asset_quality import evaluate_quality, missing_requirements
from app.services.asset_review import (
    InvalidTransitionError,
    MissingRequirementsError,
    record_transition,
)
from app.services.audit_log import write as write_audit_log

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
# Response helpers
# ---------------------------------------------------------------------------


def _to_detail(asset: Asset) -> dict:
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
        "visibility": asset.visibility,
        "shared_fields": SharedAssetFields.model_validate(asset.shared_fields or {}).model_dump(
            exclude_defaults=True,
            exclude_none=True,
        ),
        "sales_fields": SalesAssetFields.model_validate(asset.sales_fields or {}).model_dump(
            exclude_defaults=True,
            exclude_none=True,
        ),
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


def _normalize_shared_fields(payload: AssetCreateRequest) -> None:
    """Validate video primary selection and write the normalized shared_fields back."""
    normalized_shared = _validate_and_normalize_videos(payload.shared_fields.model_dump())
    payload.shared_fields = SharedAssetFields(**normalized_shared)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


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

    _normalize_shared_fields(payload)
    asset = Asset(**payload.model_dump())
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
    user: User = Depends(require_permission("asset:submit_review")),
) -> dict:
    return _perform_transition("submit_review", asset_id, db, user)


@router.post("/{asset_id}/approve")
def approve_asset(
    asset_id: str,
    payload: ReviewActionRequest | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("asset:approve")),
) -> dict:
    return _perform_transition(
        "approve", asset_id, db, user, require_publishable=True, reason=(payload.reason if payload else "")
    )


@router.post("/{asset_id}/reject")
def reject_asset(
    asset_id: str,
    payload: ReviewActionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("asset:reject")),
) -> dict:
    return _perform_transition("reject", asset_id, db, user, reason=payload.reason)


@router.post("/{asset_id}/publish")
def publish_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("asset:publish")),
) -> dict:
    return _perform_transition("publish", asset_id, db, user, require_publishable=True)


@router.post("/{asset_id}/unpublish")
def unpublish_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("asset:archive")),
) -> dict:
    return _perform_transition("unpublish", asset_id, db, user)


@router.post("/{asset_id}/archive")
def archive_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("asset:archive")),
) -> dict:
    return _perform_transition("archive", asset_id, db, user)


@router.post("/{asset_id}/restore")
def restore_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("asset:archive")),
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

    _normalize_shared_fields(payload)

    for key, value in payload.model_dump().items():
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
