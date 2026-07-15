import uuid

from fastapi import BackgroundTasks, UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import (
    InvalidStateTransitionError,
    LeadNotFoundError,
    ProfileAlreadyExistsError,
    ResumeRequiredError,
    ResumeTooLargeError,
    UnsupportedFileTypeError,
    UnsupportedTargetStateError,
)
from app.database import SessionLocal
from app.models.lead import Lead, LeadStatus
from app.models.lead_history import LeadHistory
from app.models.user import User, UserRole
from app.services.email_service import email_service
from app.services.storage_service import ALLOWED_CONTENT_TYPES, storage_service

MAX_UPLOAD_BYTES = settings.max_upload_mb * 1024 * 1024

# Only these forward transitions are allowed; anything else (including no-ops and
# going backwards) is rejected so status changes stay auditable and monotonic.
ALLOWED_TRANSITIONS = {
    LeadStatus.PENDING: {LeadStatus.IN_PROGRESS, LeadStatus.COMPLETED},
    LeadStatus.IN_PROGRESS: {LeadStatus.COMPLETED},
    LeadStatus.COMPLETED: set(),
}


def _log(db: Session, lead_id: uuid.UUID, event: str, description: str) -> None:
    db.add(LeadHistory(lead_id=lead_id, event=event, description=description))


def _notify_new_application(
    prospect_email: str, first_name: str, last_name: str, lead_id: str
) -> None:
    email_service.send_prospect_confirmation(to=prospect_email, first_name=first_name)

    db = SessionLocal()
    try:
        attorney_emails = [
            row.email for row in db.query(User).filter(User.role == UserRole.ATTORNEY).all()
        ]
    finally:
        db.close()

    for attorney_email in attorney_emails:
        email_service.send_attorney_notification(
            to=attorney_email,
            first_name=first_name,
            last_name=last_name,
            email=prospect_email,
            lead_id=lead_id,
        )


async def create_profile(
    db: Session,
    background_tasks: BackgroundTasks,
    user: User,
    first_name: str,
    last_name: str,
    phone: str,
    location: str,
    visa_status: str,
    interest_note: str | None,
    resume: UploadFile | None,
) -> Lead:
    if db.query(Lead).filter(Lead.user_id == user.id).first() is not None:
        raise ProfileAlreadyExistsError()

    if resume is None or not resume.filename:
        raise ResumeRequiredError()

    content_type = resume.content_type
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise UnsupportedFileTypeError()

    content = await resume.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise ResumeTooLargeError()

    resume_path = storage_service.save(content, content_type)

    lead = Lead(
        user_id=user.id,
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        email=user.email,
        phone=phone.strip(),
        location=location.strip(),
        visa_status=visa_status,
        interest_note=interest_note.strip() if interest_note else None,
        resume_path=resume_path,
        resume_filename=resume.filename,
        resume_mime_type=content_type,
        resume_size_bytes=len(content),
        status=LeadStatus.PENDING,
    )
    db.add(lead)
    db.flush()
    _log(db, lead.id, "ACCOUNT_CREATED", f"Account created for {user.email}")
    _log(db, lead.id, "PROFILE_SUBMITTED", "Application profile submitted")
    db.commit()
    db.refresh(lead)

    background_tasks.add_task(
        _notify_new_application, lead.email, lead.first_name, lead.last_name, str(lead.id)
    )

    return lead


def update_profile(db: Session, user: User, updates: dict) -> Lead:
    lead = get_lead_by_user(db, user.id)
    if lead is None:
        raise LeadNotFoundError()

    for field, value in updates.items():
        if value is not None:
            setattr(lead, field, value.strip() if isinstance(value, str) else value)

    db.commit()
    db.refresh(lead)
    return lead


def get_lead_by_user(db: Session, user_id: uuid.UUID) -> Lead | None:
    return db.query(Lead).filter(Lead.user_id == user_id).first()


def list_leads(
    db: Session, page: int, limit: int, search: str | None = None
) -> tuple[list[Lead], int]:
    query = select(Lead)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Lead.first_name.ilike(pattern),
                Lead.last_name.ilike(pattern),
                Lead.email.ilike(pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(
        query.order_by(Lead.created_at.desc()).offset((page - 1) * limit).limit(limit)
    ).all()
    return list(items), total


def get_stats(db: Session) -> dict:
    total = db.scalar(select(func.count()).select_from(Lead)) or 0
    pending = db.scalar(select(func.count()).where(Lead.status == LeadStatus.PENDING)) or 0
    completed = db.scalar(select(func.count()).where(Lead.status == LeadStatus.COMPLETED)) or 0
    conversion_rate = round((completed / total) * 100, 1) if total else 0.0
    return {"total_leads": total, "pending": pending, "conversion_rate": conversion_rate}


def get_lead(db: Session, lead_id: uuid.UUID) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise LeadNotFoundError()
    return lead


def get_lead_history(db: Session, lead_id: uuid.UUID) -> list[LeadHistory]:
    return (
        db.query(LeadHistory)
        .filter(LeadHistory.lead_id == lead_id)
        .order_by(LeadHistory.created_at.asc())
        .all()
    )


def update_lead_status(db: Session, lead_id: uuid.UUID, target_status: str) -> Lead:
    if target_status not in (LeadStatus.PENDING, LeadStatus.IN_PROGRESS, LeadStatus.COMPLETED):
        raise UnsupportedTargetStateError()

    lead = get_lead(db, lead_id)
    if target_status not in ALLOWED_TRANSITIONS[lead.status]:
        raise InvalidStateTransitionError()

    lead.status = target_status
    _log(db, lead.id, "STATUS_CHANGED", f"Status changed to {target_status}")
    db.commit()
    db.refresh(lead)
    return lead
