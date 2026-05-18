from sqlalchemy.orm import Session
from app.models.workflow import Workflow, WorkflowStep, StepApprover

def get_all_workflows(db: Session):
    """Aktif tüm workflow'ları adımları ve onaycılarıyla birlikte getirir"""
    from sqlalchemy.orm import joinedload
    return (
        db.query(Workflow)
        .options(
            joinedload(Workflow.steps).joinedload(WorkflowStep.approvers)
        )
        .filter(Workflow.is_active == True)
        .all()
    )
def get_workflow_by_id(db: Session, workflow_id: int):
    """ID'ye göre workflow getirir, yoksa None döner"""
    return db.query(Workflow).filter(Workflow.id == workflow_id).first()

def create_workflow(db: Session, workflow: Workflow) -> Workflow:
    """Yeni workflow'u veritabanına kaydeder"""
    db.add(workflow)       
    db.commit()            # Kaydet
    db.refresh(workflow)   # DB'deki güncel halini geri al (id, created_at vs.)
    return workflow

def delete_workflow(db: Session, workflow: Workflow):
    """Workflow'u silmek yerine pasife çeker (soft delete)"""
    workflow.is_active = False
    db.commit()
    return workflow


def get_steps_by_workflow(db: Session, workflow_id: int):
    """Bir workflow'un adımlarını sıralı şekilde getirir"""
    return (
        db.query(WorkflowStep)
        .filter(WorkflowStep.workflow_id == workflow_id)
        .order_by(WorkflowStep.step_order)
        .all()
    )

def create_step(db: Session, step: WorkflowStep) -> WorkflowStep:
    """Yeni adımı veritabanına kaydeder"""
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


def create_step_approver(db: Session, approver: StepApprover) -> StepApprover:
    """Adıma onaycı ekler"""
    db.add(approver)
    db.commit()
    db.refresh(approver)
    return approver