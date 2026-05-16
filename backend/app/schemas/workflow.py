from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

# ── Enum Tipleri ──

class StepType(str, Enum):
    SERIAL = "SERIAL"
    PARALLEL = "PARALLEL"

class ParallelRule(str, Enum):
    ALL = "ALL"
    ANY = "ANY"

class ProcessType(str, Enum):
    PURCHASE_REQUEST = "PURCHASE_REQUEST"
    SUPPLIER_APPROVAL = "SUPPLIER_APPROVAL"
    CONTRACT_APPROVAL = "CONTRACT_APPROVAL"
    ORDER_APPROVAL = "ORDER_APPROVAL"

# ── StepApprover Şemaları ──

class StepApproverCreate(BaseModel):
    user_id: int
    approval_limit: Optional[float] = None  # Limit yoksa None, otomatik geçiş olmaz

class StepApproverResponse(BaseModel):
    id: int
    user_id: int
    approval_limit: Optional[float]

    class Config:
        from_attributes = True

# ── WorkflowStep Şemaları ──

class WorkflowStepCreate(BaseModel):
    step_order: int
    step_type: StepType
    parallel_rule: Optional[ParallelRule] = None  # Sadece PARALLEL tipinde kullanılır
    approvers: List[StepApproverCreate]


class WorkflowStepResponse(BaseModel):
    id: int
    step_order: int
    step_type: StepType
    parallel_rule: Optional[ParallelRule]
    approvers: List[StepApproverResponse]

    class Config:
        from_attributes = True

# ── Workflow Şemaları ──

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    process_type: ProcessType
    steps: List[WorkflowStepCreate]

class WorkflowResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    process_type: ProcessType
    is_active: bool
    steps: List[WorkflowStepResponse]

    class Config:
        from_attributes = True