from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
import enum
from app.core.database import Base

class StepType(str, enum.Enum):
    SERIAL = "SERIAL"       # Sırayla: biri bitince diğeri başlar
    PARALLEL = "PARALLEL"   # Aynı anda: hepsi veya biri onaylamalı


class ParallelRule(str, enum.Enum):
    ALL = "ALL"  # Tüm onaycılar onaylamalı
    ANY = "ANY"  # Herhangi biri onaylarsa yeter


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Workflow'a ait adımlar (one-to-many ilişki)
    steps = relationship("WorkflowStep", back_populates="workflow", order_by="WorkflowStep.step_order")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id  = Column(Integer, primary_key=True, index=True)

    # Hangi workflow'e ait 
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)

    step_order = Column(Integer, nullable=False)
    step_name = Column(String, nullable=False)

    # SERRIAL veya PARALLEL
    step_type = Column(Enum(StepType), nullable=False, default=StepType.SERIAL)

    # Sadece PARALLEL adımlarda geçerli: ALL mı ANY mi
    parallel_rule = Column(Enum(ParallelRule), nullable=True)

    workflow = relationship("Workflow", back_populates="steps")
    approvers = relationship("StepApprover", back_populates="step", cascade="all, delete-orphan")


class StepApprover(Base):
    __tablename__ = "step_approvers"

    id = Column(Integer, primary_key=True, index=True)

    step_id = Column(Integer, ForeignKey("workflow_steps.id"), nullable=False)

    # Bu adımı onaylayacak kullanıcı
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Bu onaycı için özel limit (opsiyonel)
    # Talep tutarı bu limitin altındaysa adım otomatik geçilir
    approval_limit = Column(Float, nullable=True)

    step = relationship("WorkflowStep", back_populates="approvers")
    user = relationship("User")