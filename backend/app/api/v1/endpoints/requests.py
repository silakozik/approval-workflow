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