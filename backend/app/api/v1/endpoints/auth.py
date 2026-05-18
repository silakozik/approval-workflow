from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import register_user, login_user
from app.repositories.user_repository import get_all_users

# APIRouter: endpoint'leri gruplar
router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Yeni kullanıcı kaydı endpoint'i"""
    return register_user(db, user_data)

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Kullanıcı girişi
    - Başarılı girişte JWT token döner
    - Token'ı sonraki isteklerde Authorization header'ına ekle
    """
    result = login_user(db, login_data)
    return{
        "access_token": result["access_token"],
        "token_type": "bearer",
        "user": result["user"]
    }

@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """Tüm aktif kullanıcıları listeleyen endpoint (onaycı seçimi için)"""

    return get_all_users(db)
  