from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.request import RequestCreate, RequestResponse, ApproveRequest, RejectRequest, ApprovalActionResponse
from app.services import request_service

router = APIRouter()

@router.get("/", response_model=List[RequestResponse])
def list_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tüm talepleri listeler"""
    return request_service.get_all_requests(db)

@router.get("/my", response_model=List[RequestResponse])
def my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Giriş yapan kullanıcının taleplerini listeler"""
    return request_service.get_my_requests(db, current_user.id)

@router.get("/{request_id}", response_model=RequestResponse)
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ID'ye göre talep getirir"""
    request = request_service.get_request_by_id(db, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Talep bulunamadı"
        )
    return request

@router.get("/{request_id}/actions", response_model=List[ApprovalActionResponse])
def get_request_actions(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Talebin onay geçmişini getirir"""
    return request_service.get_request_actions(db, request_id)

@router.get("/{request_id}/pending-approvers")
def get_pending_approvers(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Talebin şu anki adımında onay beklediği kişileri getirir"""
    return request_service.get_pending_approvers_for_request(db, request_id)

@router.post("/", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(
    data: RequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Yeni talep oluşturur ve onay akışını başlatır"""
    try:
        return request_service.create_request(db, data, current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
@router.post("/{request_id}/approve", response_model=RequestResponse)
def approve_request(
    request_id: int,
    data: ApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Talebi onaylar"""
    try:
        return request_service.approve_request(db, request_id, current_user.id, data.comment)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{request_id}/reject", response_model=RequestResponse)
def reject_request(
    request_id: int,
    data: RejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Talebi reddeder, açıklama zorunludur"""
    try:
        return request_service.reject_request(db, request_id, current_user.id, data.comment)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{request_id}/cancel", response_model=RequestResponse)
def cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Talebi iptal eder, bir daha onaya gönderilemez"""
    try:
        return request_service.cancel_request(db, request_id, current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{request_id}/revise", response_model=RequestResponse)
def revise_request(
    request_id: int,
    data: RequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reddedilen talebi düzenler ve tekrar onaya gönderir"""
    try:
        return request_service.revise_request(db, request_id, current_user.id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
@router.get("/{request_id}/actions", response_model=List[ApprovalActionResponse])
def get_request_actions(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Talebin onay hareketlerini getirir"""
    from app.repositories.request_repository import get_actions_by_request
    return get_actions_by_request(db, request_id)

@router.get("/{request_id}/pending-approvers")
def get_pending_approvers(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Talebin mevcut adımında onay bekleyen kullanıcıları getirir"""
    from app.models.request import Request, RequestStatus, ApprovalAction, ActionType
    from app.models.workflow import WorkflowStep, StepApprover
    from app.repositories.user_repository import get_user_by_id

    request = db.query(Request).filter(Request.id == request_id).first()
    if not request or request.status != RequestStatus.PENDING:
        return []

    # Mevcut adımı bul
    step = db.query(WorkflowStep).filter(
        WorkflowStep.workflow_id == request.workflow_id,
        WorkflowStep.step_order == request.current_step_order
    ).first()
    if not step:
        return []

    # Adımdaki onaycıları getir
    approvers = db.query(StepApprover).filter(StepApprover.step_id == step.id).all()

    # Zaten onaylayanları çıkar
    approved_user_ids = {
        a.user_id for a in db.query(ApprovalAction).filter(
            ApprovalAction.request_id == request_id,
            ApprovalAction.step_id == step.id,
            ApprovalAction.action.in_([ActionType.APPROVED, ActionType.AUTO_APPROVED])
        ).all()
    }

    # Bekleyen onaycıların bilgilerini döndür
    result = []
    for approver in approvers:
        if approver.user_id not in approved_user_ids:
            user = get_user_by_id(db, approver.user_id)
            if user:
                result.append({
                    "user_id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                })
    return result