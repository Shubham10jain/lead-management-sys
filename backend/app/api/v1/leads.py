import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, Form, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_attorney, require_lead
from app.core.exceptions import InvalidVisaStatusError, LeadNotFoundError
from app.models.lead import VisaStatus
from app.models.user import User
from app.schemas.lead import (
    LeadDetailResponse,
    LeadListResponse,
    LeadProfileUpdate,
    LeadResponse,
    LeadStatsResponse,
    LeadStatusUpdate,
)
from app.services import lead_service
from app.services.storage_service import storage_service

router = APIRouter(prefix="/leads", tags=["leads"])

VALID_VISA_STATUSES = {
    VisaStatus.CITIZEN,
    VisaStatus.PERMANENT_RESIDENT,
    VisaStatus.H1B,
    VisaStatus.F1,
    VisaStatus.OTHER,
}


@router.post("/me/profile", response_model=LeadResponse, status_code=201)
async def create_my_profile(
    background_tasks: BackgroundTasks,
    first_name: str = Form(..., max_length=100),
    last_name: str = Form(..., max_length=100),
    phone: str = Form(..., max_length=30),
    location: str = Form(..., max_length=200),
    visa_status: str = Form(...),
    interest_note: str | None = Form(None, max_length=2000),
    resume: UploadFile | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
) -> LeadResponse:
    if visa_status not in VALID_VISA_STATUSES:
        raise InvalidVisaStatusError()

    lead = await lead_service.create_profile(
        db=db,
        background_tasks=background_tasks,
        user=current_user,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        location=location,
        visa_status=visa_status,
        interest_note=interest_note,
        resume=resume,
    )
    return LeadResponse.model_validate(lead)


@router.get("/me", response_model=LeadResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
) -> LeadResponse:
    lead = lead_service.get_lead_by_user(db, current_user.id)
    if lead is None:
        raise LeadNotFoundError()
    return LeadResponse.model_validate(lead)


@router.patch("/me", response_model=LeadResponse)
def update_my_profile(
    payload: LeadProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
) -> LeadResponse:
    if payload.visa_status is not None and payload.visa_status not in VALID_VISA_STATUSES:
        raise InvalidVisaStatusError()

    lead = lead_service.update_profile(db, current_user, payload.model_dump())
    return LeadResponse.model_validate(lead)


@router.get("/stats", response_model=LeadStatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_attorney),
) -> LeadStatsResponse:
    return LeadStatsResponse(**lead_service.get_stats(db))


@router.get("", response_model=LeadListResponse)
def list_leads(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_attorney),
) -> LeadListResponse:
    items, total = lead_service.list_leads(db, page=page, limit=limit, search=search)
    return LeadListResponse(
        items=[LeadResponse.model_validate(lead) for lead in items],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{lead_id}", response_model=LeadDetailResponse)
def get_lead(
    lead_id: uuid.UUID,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_attorney),
) -> LeadDetailResponse:
    lead = lead_service.get_lead(db, lead_id)
    history = lead_service.get_lead_history(db, lead_id)
    return LeadDetailResponse(**LeadResponse.model_validate(lead).model_dump(), history=history)


@router.patch("/{lead_id}/status", response_model=LeadResponse)
def update_lead_status(
    lead_id: uuid.UUID,
    payload: LeadStatusUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_attorney),
) -> LeadResponse:
    lead = lead_service.update_lead_status(db, lead_id, payload.status)
    return LeadResponse.model_validate(lead)


@router.get("/{lead_id}/resume")
def download_resume(
    lead_id: uuid.UUID,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_attorney),
) -> Response:
    lead = lead_service.get_lead(db, lead_id)
    content = storage_service.read(lead.resume_path)
    return Response(
        content=content,
        media_type=lead.resume_mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{lead.resume_filename}"'
        },
    )
