from sqlalchemy.orm import Session
from app.models.request import Request, RequestStatus

# ── Request ──

def get_all_requests(db: Session):
    return db.query(Request).all()

def get_request_by_id(db: Session, request_id: int):
    return db.query(Request).filter(Request.id == request_id).first()

def get_requests_by_user(db: Session, user_id: int):
    """Kullanıcının oluşturduğu talepleri getirir"""
    return db.query(Request).filter(Request.created_by == user_id).all()

def create_request(db: Session, request: Request) -> Request:
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

def update_request(db: Session, request: Request) -> Request:
    db.commit()
    db.refresh(request)
    return request

def get_actions_by_request(db: Session, request_id: int):
    """Bir talebin tüm onay hareketlerini zamana göre sıralı getirir"""
    from app.models.request import ApprovalAction
    return (
        db.query(ApprovalAction)
        .filter(ApprovalAction.request_id == request_id)
        .order_by(ApprovalAction.created_at)
        .all()
    )