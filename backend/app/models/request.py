from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

# Talebin genel durumu
class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"     # Onay bekliyor
    APPROVED = "APPROVED"   # Tüm adımlar onaylandı
    REJECTED = "REJECTED"   # Bir adım reddetti
    CANCELLED = "CANCELLED" # Talep iptal edildi
    REVISED = "REVISED"     # Talep revize edilip tekrar gönderildi

class ActionType(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED" 
    AUTO_APPROVED = "AUTO_APPROVED"

class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)        # Örn: "Laptop Satın Alma"
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)         # Talep tutarı (TL)

    # Hangi workflow şablonu kullanılacak
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Talebin mevcut durumu
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING)

    current_step_order = Column(Integer, default=1)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # İlişkiler
    workflow = relationship("Workflow")
    creator = relationship("User", foreign_keys=[created_by])
    actions = relationship("ApprovalAction", back_populates="request", cascade="all, delete-orphan")

class ApprovalAction(Base):
    __tablename__ = "approval_actions"

    id = Column(Integer, primary_key=True, index=True)

    request_id = Column(Integer, ForeignKey("requests.id"), nullable=False)

    # Hangi adımda yapıldı
    step_id = Column(Integer, ForeignKey("workflow_steps.id"), nullable=True)

    # Kim yaptı
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # AUTO_APPROVED'da None olabilir

    # Ne yapıldı
    action = Column(Enum(ActionType), nullable=False)

    # Red veya iptal sırasında açıklama (red için zorunlu)
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # İlişkiler
    request = relationship("Request", back_populates="actions")
    step = relationship("WorkflowStep")
    user = relationship("User")
    