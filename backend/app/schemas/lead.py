import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class LeadHistoryEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event: str
    description: str
    created_at: datetime


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    location: str
    visa_status: str
    source: str
    interest_note: str | None
    status: str
    resume_filename: str
    resume_mime_type: str | None
    resume_size_bytes: int | None
    created_at: datetime
    updated_at: datetime


class LeadDetailResponse(LeadResponse):
    history: list[LeadHistoryEntry]


class LeadListResponse(BaseModel):
    items: list[LeadResponse]
    total: int
    page: int
    limit: int


class LeadStatsResponse(BaseModel):
    total_leads: int
    pending: int
    conversion_rate: float


class LeadStatusUpdate(BaseModel):
    status: str


class LeadProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    location: str | None = None
    visa_status: str | None = None
