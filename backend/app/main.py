from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from app.api.v1.router import api_router

# venv\Scripts\activate
# uvicorn app.main:app --reload --port 8001 ile çalıştırılacak

# alembic revision --autogenerate -m "initial tables" -> migration dosyası oluşturur
# alembic upgrade head -> migration'ları veritabanına uygular

# FastAPI uygulama objesi — tüm endpointlerimiz buraya bağlanır
app = FastAPI(
    title = "Approval Workflow API",
    version = "1.0.0",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
    }
)

# CORS: farklı portlardan gelen isteklere izin vermek için gerekli
# Frontend localhost:3000'de, backend localhost:8000'de çalışacak
# Bu middleware olmasaydı tarayıcı frontend'in backend'e istek atmasını engellerdi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], #sadece frontend'e izin ver
    allow_credentials=True, # cookie ve auth header'larına izin ver
    allow_methods=["*"], # GET, POST, PUT, DELETE hepsine izin ver
    allow_headers=["*"], # tüm header'lara izin ver
)

# Tüm API route'larını uygulamaya bağla
app.include_router(api_router) 

# Bu endpoint ile backend'in çalışıp çalışmadığını kontrol edebiliriz.
@app.get("/health")
def health_check():
    return {"status": "ok"}