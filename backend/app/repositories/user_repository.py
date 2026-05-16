from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

# Repository katmanı sadece veritabanı işlemlerini içerir
# İş mantığı buraya yazılmaz, sadece CRUD (Create, Read, Update, Delete)

def get_user_by_email(db: Session, email: str):
    """Email'e göre kullanıcıyı veritabanından getirir, yoksa None döner"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    """ID'ye göre kullanıcıyı veritabanından getirir, yoksa None döner"""
    return db.query(User).filter(User.id == user_id).first()

def get_all_users(db: Session):
    """Tüm aktif kullanıcıları getirir (onaycı seçimi için kullanılır)"""
    return db.query(User).filter(User.is_active == True).all()

def create_user(db: Session, user_data: UserCreate) -> User:
    """Yeni kullanıcı oluşturur"""
    # Şifreyi hash'leyerek kaydet, düz metin asla saklanmaz
    hashed_password = get_password_hash(user_data.password)

    db_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_password,
        approval_limit=user_data.approval_limit
    )

    db.add(db_user)
    db.commit()          # veritabanına yaz
    db.refresh(db_user)  # veritabanından güncel halini al (id gibi alanlar için)
    return db_user

