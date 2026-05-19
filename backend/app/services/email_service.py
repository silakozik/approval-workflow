import logging
from sqlalchemy.orm import Session
from app.models.request import Request
from app.repositories import user_repository

# Logger ayarları
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
# Konsola basmak için handler ekle
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

def send_email_simulation(to_email: str, subject: str, body: str):
    """E-posta gönderimini loglama üzerinden simüle eder."""
    divider = "-" * 50
    email_content = f"\n{divider}\n📧 [EMAIL SIMULATION]\nTo: {to_email}\nSubject: {subject}\nBody: \n{body}\n{divider}\n"
    logger.info(email_content)

def notify_request_creator(db: Session, request: Request, subject: str, body: str):
    """Talebi oluşturan kişiye bildirim e-postası gönderir."""
    creator = user_repository.get_user_by_id(db, request.created_by)
    if creator and creator.email:
        send_email_simulation(creator.email, subject, body)

def notify_current_approvers(db: Session, request: Request, subject: str, body: str):
    """Talebin mevcut adımındaki tüm onaycılara bildirim e-postası gönderir."""
    from app.services import approval_engine
    
    step = approval_engine.get_current_step(db, request)
    if not step:
        return
        
    approvers = approval_engine.get_step_approvers(db, step.id)
    for approver in approvers:
        user = user_repository.get_user_by_id(db, approver.user_id)
        if user and user.email:
            # Kişiselleştirilmiş mesaj
            personalized_body = f"Sayın {user.full_name},\n\n{body}"
            send_email_simulation(user.email, subject, personalized_body)
