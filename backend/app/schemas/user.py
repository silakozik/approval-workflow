from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Pydantic schema'ları API'ye gelen ve giden verinin şeklini tanımlar

class UserBase(BaseModel):
    """Kayıt olurken gönderilecek veri"""
    full_name : str
    email : EmailStr
    password : str
    approval_limit : Optional[float] = None

class UserLogin(BaseModel):
    """Giriş yaparken gönderilecek veri"""
    email : EmailStr
    password : str

class UserResponse(BaseModel):
    """API'den kullanıcı bilgisi dönerken kullanılır"""
    id :int
    full_name : str
    email : EmailStr
    approval_limit : Optional[float] = None
    is_active : bool
    created_at : datetime

    class Config:
        from_attributes = True  # SQLAlchemy modelini direkt okuyabilmek için

class TokenResponse(BaseModel):
    """Login başarılı olduğunda dönen token verisi"""
    access_token : str
    token_type : str = "bearer"
    user: UserResponse 