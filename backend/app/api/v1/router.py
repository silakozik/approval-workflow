from app.api.v1.endpoints import requests
from fastapi import APIRouter
from app.api.v1.endpoints import auth, workflows

# Ana router: tüm endpoint gruplarını bir araya toplar
# Yeni endpoint ekledikçe buraya include edilecek

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["Workflows"])
api_router.include_router(requests.router, prefix="/requests", tags=["Requests"])