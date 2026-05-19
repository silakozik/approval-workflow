from sqlalchemy.orm import Session
from app.models.request import Request, RequestStatus
from app.schemas.request import RequestCreate
from app.repositories import request_repository, workflow_repository
from app.services import approval_engine

def get_all_requests(db: Session):
    return request_repository.get_all_requests(db)

def get_request_by_id(db: Session, request_id: int):
    return request_repository.get_request_by_id(db, request_id)

def get_my_requests(db: Session, user_id: int):
    """Kullanıcının kendi taleplerini listeler"""
    return request_repository.get_requests_by_user(db, user_id)

def get_request_actions(db: Session, request_id: int):
    """Talebin onay hareketlerini getirir"""
    return request_repository.get_actions_by_request(db, request_id)

def get_pending_approvers_for_request(db: Session, request_id: int):
    """Talebin şu anki adımında onay beklediği kişileri getirir"""
    request = request_repository.get_request_by_id(db, request_id)
    if not request or request.status != RequestStatus.PENDING:
        return []
    
    step = approval_engine.get_current_step(db, request)
    if not step:
        return []
        
    approvers = approval_engine.get_step_approvers(db, step.id)
    
    # Adımdaki mevcut aksiyonları al (bu adımda onaylayanları bulmak için)
    from app.models.request import ApprovalAction, ActionType
    actions = db.query(ApprovalAction).filter(
        ApprovalAction.request_id == request_id,
        ApprovalAction.step_id == step.id
    ).all()
    
    acted_user_ids = {
        action.user_id for action in actions 
        if action.action in [ActionType.APPROVED, ActionType.AUTO_APPROVED, ActionType.REJECTED]
    }
    
    pending_approvers = []
    from app.repositories import user_repository
    for approver in approvers:
        if approver.user_id not in acted_user_ids:
            user = user_repository.get_user_by_id(db, approver.user_id)
            if user:
                pending_approvers.append({
                    "user_id": user.id,
                    "full_name": user.full_name,
                    "email": user.email
                })
                
    return pending_approvers

def create_request(db: Session, data: RequestCreate, current_user_id: int) -> Request:
    """
    Yeni talep oluşturur ve onay akışını başlatır.
    1. Talebi kaydet
    2. Workflow'un ilk adımını bul
    3. Auto-approve kontrolü yap
    """
    # Workflow var mı kontrol et
    workflow = workflow_repository.get_workflow_by_id(db, data.workflow_id)
    if not workflow:
        raise ValueError("Workflow bulunamadı")

    # Talebi oluştur
    request = Request(
        title=data.title,
        description=data.description,
        amount=data.amount,
        workflow_id=data.workflow_id,
        created_by=current_user_id,
        status=RequestStatus.PENDING,
        current_step_order=1,
    )
    created = request_repository.create_request(db, request)

    # İlk adımda auto-approve kontrolü yap
    approval_engine.process_auto_approvals(db, created)

    return request_repository.get_request_by_id(db, created.id)

def approve_request(db: Session, request_id: int, user_id: int, comment: str | None = None):
    """Talebi onaylar"""
    request = request_repository.get_request_by_id(db, request_id)
    if not request:
        raise ValueError("Talep bulunamadı")
    if request.status != RequestStatus.PENDING:
        raise ValueError("Sadece bekleyen talepler onaylanabilir")

    approval_engine.approve(db, request, user_id, comment)
    return request_repository.get_request_by_id(db, request_id)

def reject_request(db: Session, request_id: int, user_id: int, comment: str):
    """Talebi reddeder"""
    request = request_repository.get_request_by_id(db, request_id)
    if not request:
        raise ValueError("Talep bulunamadı")
    if request.status != RequestStatus.PENDING:
        raise ValueError("Sadece bekleyen talepler reddedilebilir")

    approval_engine.reject(db, request, user_id, comment)
    return request_repository.get_request_by_id(db, request_id)

def cancel_request(db: Session, request_id: int, user_id: int):
    """Talebi iptal eder"""
    request = request_repository.get_request_by_id(db, request_id)
    if not request:
        raise ValueError("Talep bulunamadı")
    if request.status == RequestStatus.CANCELLED:
        raise ValueError("Talep zaten iptal edilmiş")

    approval_engine.cancel(db, request, user_id)
    return request_repository.get_request_by_id(db, request_id)

def revise_request(db: Session, request_id: int, user_id: int, data: RequestCreate):
    """
    Reddedilen talebi düzenler ve tekrar onaya gönderir.
    Süreç geçmişi korunur, yeni bir onay süreci başlar.
    """
    request = request_repository.get_request_by_id(db, request_id)
    if not request:
        raise ValueError("Talep bulunamadı")
    if request.status != RequestStatus.REJECTED:
        raise ValueError("Sadece reddedilen talepler revize edilebilir")
    if request.created_by != user_id:
        raise ValueError("Sadece talebi oluşturan kişi revize edebilir")

    # Talebi güncelle ve tekrar onay sürecine sok
    request.title = data.title
    request.description = data.description
    request.amount = data.amount
    request.status = RequestStatus.PENDING
    request.current_step_order = 1  # Başa dön

    updated = request_repository.update_request(db, request)

    # Auto-approve kontrolü yap
    approval_engine.process_auto_approvals(db, updated)

    return request_repository.get_request_by_id(db, request_id)