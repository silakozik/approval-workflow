from sqlalchemy.orm import Session
from app.models.workflow import Workflow, WorkflowStep, StepApprover
from app.schemas.workflow import WorkflowCreate
from app.repositories import workflow_repository
from app.repositories import user_repository

def get_all_workflows(db: Session):
    """Tüm aktif workflow'ları listeler"""
    return workflow_repository.get_all_workflows(db)

def get_workflow_by_id(db: Session, workflow_id: int):
    """ID'ye göre workflow getirir, bulunamazsa None döner"""
    return workflow_repository.get_workflow_by_id(db, workflow_id)

def create_workflow(db: Session, workflow_data: WorkflowCreate) -> Workflow:
    # 1. Ana workflow kaydını oluştur
    workflow = Workflow(
        name=data.name,
        description=data.description,
        process_type=data.process_type,
    )
    created_workflow = workflow_repository.create_workflow(db, workflow)

    # 2. Her adımı sırayla kaydet
    for step_data in data.steps:
        step = WorkflowStep(
            workflow_id=created_workflow.id,
            step_order=step_data.step_order,
            step_type=step_data.step_type,
            parallel_rule=step_data.parallel_rule,
        )
        created_step = workflow_repository.create_step(db, step)

        # 3. Adımdaki her onaycıyı kaydet
        for approver_data in step_data.approvers:
            approver = StepApprover(
                step_id=created_step.id,
                user_id=approver_data.user_id,
                approval_limit=approver_data.approval_limit,
            )
            workflow_repository.create_step_approver(db, approver)

    # 4. İlişkilerle birlikte güncel workflow'u döndür
    return workflow_repository.get_workflow_by_id(db, created_workflow.id)

def delete_workflow(db: Session, workflow_id: int):
    """Workflow'u pasife çeker (soft delete)"""
    workflow = workflow_repository.get_workflow_by_id(db, workflow_id)
    if not workflow:
        return None
    return workflow_repository.delete_workflow(db, workflow)

def get_all_users(db: Session):
    """Onaycı seçimi için tüm aktif kullanıcıları listeler"""
    return user_repository.get_all_users(db)
