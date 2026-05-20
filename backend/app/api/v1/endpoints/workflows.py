from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.user import User
from app.schemas.workflow import WorkflowCreate, WorkflowResponse
from app.schemas.user import UserResponse
from app.services import workflow_service

router = APIRouter()

@router.get("/", response_model=List[WorkflowResponse])
def list_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tüm aktif workflow'ları listeler"""
    return workflow_service.get_all_workflows(db)

@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ID'ye göre tek bir workflow getirir"""
    workflow = workflow_service.get_workflow_by_id(db, workflow_id)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow bulunamadı"
        )
    return workflow

@router.post("/", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(
    data: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Yeni workflow oluşturur"""
    require_admin(current_user)
    return workflow_service.create_workflow(db, data)

@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Workflow'u pasife çeker (soft delete)"""
    require_admin(current_user)
    result = workflow_service.delete_workflow(db, workflow_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow bulunamadı"
        )
    
@router.get("/users/approvers", response_model=List[UserResponse])
def list_approvers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Onaycı seçimi için tüm aktif kullanıcıları listeler"""
    return workflow_service.get_all_users(db)