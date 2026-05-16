from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import get_user_by_email, create_user
from app.schemas.user import UserCreate, UserLogin
from app.core.security import verify_password, create_access_token
from app.models.user import User

# Service katmanı iş mantığını içerir
# Repository'yi çağırır, sonucu işler, endpoint'e hazır hale getirir

def register_user(db: Session, user_data: UserCreate) -> User:
    """Yeni kullanıcı kaydı işlemi"""

    # Aynı email ile kayıt var mı kontrol et
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu email adresi zaten kayıtlı"
        )

    return create_user(db, user_data)

def login_user(db: Session, login_data: UserLogin) -> dict:
    """Kullanıcı girişi ve token üretimi"""

    # Kullanıcıyı email ile bul
    user = get_user_by_email(db, login_data.email)

    # Kullanıcı yoksa veya şifre yanlışsa aynı hatayı döndür
    # (Güvenlik: hangisinin yanlış olduğunu söyleme)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email veya şifre hatalı"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hesap aktif değil"
        )

    # JWT token üret, içine kullanıcı email'ini göm
    access_token = create_access_token(data={"sub": user.email})

    return {"access_token": access_token, "user": user}
