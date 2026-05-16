from fastapi import APIRouter
from app.api.v1.endpoints import auth

# Ana router: tüm endpoint gruplarını bir araya toplar
# Yeni endpoint ekledikçe buraya include edilecek

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)