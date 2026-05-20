from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"        # Workflow oluşturabilir, silebilir
    MANAGER = "MANAGER"  # Onay verebilir
    EMPLOYEE = "EMPLOYEE"          # Sadece talep oluşturabilir

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    approval_limit = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())