from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.db import get_db
from app.models.template import Template
from app.models.user import User
from app.schemas.template import TemplateCreate, TemplateResponse, TemplateUpdate

router = APIRouter(prefix="/admin/templates", tags=["admin-templates"])


@router.get("", response_model=list[TemplateResponse])
def list_templates(
    include_builtin: bool = Query(default=True),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Template]:
    stmt = select(Template)
    if not include_builtin:
        stmt = stmt.where(Template.is_builtin == False)
    rows = db.scalars(stmt).all()
    return rows


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Template:
    template = Template(
        name=payload.name,
        description=payload.description,
        blocks=payload.blocks,
        created_by=user.id,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Template:
    template = db.scalar(select(Template).where(Template.id == template_id))
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="template_not_found")
    return template


@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: int,
    payload: TemplateUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Template:
    template = db.scalar(select(Template).where(Template.id == template_id))
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="template_not_found")

    if template.is_builtin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="cannot_modify_builtin_template")

    if template.created_by != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_owner")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(template, key, value)

    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    template = db.scalar(select(Template).where(Template.id == template_id))
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="template_not_found")

    if template.is_builtin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="cannot_delete_builtin_template")

    if template.created_by != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_owner")

    db.delete(template)
    db.commit()
