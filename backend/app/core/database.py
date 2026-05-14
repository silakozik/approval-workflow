from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# engine: veritabanına bağlantıyı yöneten ana obje
engine = create_engine(settings.DATABASE_URL)

# SessionLocal: her istek için ayrı bir veritabanı oturumu oluşturur
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base: tüm modeller (User, Workflow, Request...) bu sınıftan türeyecek
Base = declarative_base() 

# get_db: FastAPI endpoint'lerinde dependency injection ile kullanılır
# Her API isteği geldiğinde yeni bir DB oturumu açar, istek bitince kapatır
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()    