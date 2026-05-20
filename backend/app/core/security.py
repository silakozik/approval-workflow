from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db

# Kullanıcı şifresi düz metin olarak veritabanına kaydedilmez
# Örnek: "12345" → "$2b$12$..." şeklinde hash'lenir
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kullanıcının girdiği şifreyi veritabanındaki hash ile karşılaştırır"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Düz metin şifreyi hash'e çevirir"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT token üretir"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    # Token'ı SECRET_KEY ile imzala
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    """Token'ı çözümler ve içindeki veriyi döner, geçersizse None döner"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Token'dan kullanıcıyı çözümler ve döner, geçersizse hata fırlatır"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz kimlik bilgisi",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    # Kullanıcıyı veritabanından getir
    from app.repositories.user_repository import get_user_by_email
    user = get_user_by_email(db, email)
    if user is None:
        raise credentials_exception

    return user

def require_admin(current_user):
    """Sadece ADMIN rolüne izin ver"""
    from app.models.user import UserRole
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için admin yetkisi gereklidir"
        )
    return current_user

def require_manager_or_admin(current_user):
    """ADMIN veya MANAGER rolüne izin ver"""
    from app.models.user import UserRole
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yönetici yetkisi gereklidir"
        )
    return current_user