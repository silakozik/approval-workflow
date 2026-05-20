from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_admin, get_current_user
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import register_user, login_user
from app.repositories.user_repository import get_all_users, get_user_by_id

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
  
@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kullanıcı rolünü günceller — sadece ADMIN"""
    require_admin(current_user)

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )

    valid_roles = [r.value for r in UserRole]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Geçersiz rol. Geçerli roller: {valid_roles}"
        )

    user.role = role
    db.commit()
    db.refresh(user)
    return {"message": f"Kullanıcı rolü {role} olarak güncellendi", "user_id": user_id, "role": role}

@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kullanıcıyı aktif/pasif yapar — sadece ADMIN"""
    require_admin(current_user)

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    status_text = "aktif" if user.is_active else "pasif"
    return {"message": f"Kullanıcı {status_text} yapıldı", "user_id": user_id, "is_active": user.is_active}