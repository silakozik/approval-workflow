from app.core.database import SessionLocal
from app.models.workflow import WorkflowStep
from app.models.request import Request

db = SessionLocal()
request = db.query(Request).filter_by(id=2).first()
print(f"Request workflow_id: {request.workflow_id}, current_step_order: {request.current_step_order}")
steps = db.query(WorkflowStep).filter_by(workflow_id=request.workflow_id).all()
for step in steps:
    print(f"Step ID: {step.id}, Order: {step.step_order}")
