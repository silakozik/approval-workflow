from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ── Enum Tipleri ──

class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    REVISED = "REVISED"

class ActionType(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    AUTO_APPROVED = "AUTO_APPROVED"

# ── Request Şemaları ──

class RequestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float
    workflow_id: int

class RequestResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    amount: float
    workflow_id: int
    created_by: int
    status: RequestStatus
    current_step_order: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# ── ApprovalAction Şemaları ──

class ApprovalActionResponse(BaseModel):
    id: int
    request_id: int
    step_id: Optional[int]
    user_id: Optional[int]
    action: ActionType
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ── Approve / Reject İşlemleri ──

class ApproveRequest(BaseModel):
    comment: Optional[str] = None  # Onayda açıklama opsiyonel

class RejectRequest(BaseModel):
    comment: str  # Redde açıklama zorunlu