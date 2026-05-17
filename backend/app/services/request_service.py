from sqlalchemy.orm import Session
from app.models.request import Request, RequestStatus
from app.models.workflow import Workflow
from app.schemas.request import RequestCreate
from app.repositories import request_repository, workflow_repository

def get_all_requests(db: Session):
    return request_repository.get_all_requests(db)

def get_request_by_id(db: Session, request_id: int):
    return request_repository.get_request_by_id(db, request_id)

def get_my_requests(db: Session, user_id: int):
    """Kullanıcının kendi taleplerini listeler"""
    return request_repository.get_requests_by_user(db, user_id)

def create_request(db: Session, data: RequestCreate, current_user_id: int) -> Request:
    """
    Yeni talep oluşturur ve onay akışını başlatır.
    1. Talebi kaydet
    2. Workflow'un ilk adımını bul
    3. current_step_order'ı 1 olarak ayarla
    """
    # Workflow var mı kontrol et
    workflow = workflow_repository.get_workflow_by_id(db, data.workflow_id)
    if not workflow:
        raise ValueError("Workflow bulunamadı")
    
    # talebi oluştur
    request = Request(
        title=data.title,
        description=data.description,
        amount=data.amount,
        workflow_id=data.workflow_id,
        created_by=current_user_id,
        current_step_order=1,  # İlk adımda başlar
        status=RequestStatus.PENDING
    )

    return request_repository.create_request(db, request)