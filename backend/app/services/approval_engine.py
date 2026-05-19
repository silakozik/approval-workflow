from sqlalchemy.orm import Session
from app.models.request import Request, RequestStatus, ApprovalAction, ActionType
from app.models.workflow import WorkflowStep, StepApprover, StepType, ParallelRule
from app.repositories import request_repository, workflow_repository

def get_current_step(db: Session, request: Request) -> WorkflowStep | None:
    """Talebin şu an hangi adımda olduğunu getirir"""
    return (
        db.query(WorkflowStep)
        .filter(
            WorkflowStep.workflow_id == request.workflow_id,
            WorkflowStep.step_order == request.current_step_order
        )
        .first()
    )

def get_step_approvers(db: Session, step_id: int) -> list[StepApprover]:
    """Adımdaki tüm onaycıları getirir"""
    return db.query(StepApprover).filter(StepApprover.step_id == step_id).all()

def check_auto_approve(request: Request, approver: StepApprover) -> bool:
    """
    Limit kontrolü yapar.
    Onaycının limiti varsa ve talep tutarı limitin altındaysa True döner.
    """
    if approver.approval_limit is not None:
        return request.amount < approver.approval_limit
    return False

def log_action(
    db: Session,
    request_id: int,
    step_id: int | None,
    user_id: int | None,
    action: ActionType,
    comment: str | None = None
):
    """Onay hareketini veritabanına kaydeder"""
    approval_action = ApprovalAction(
        request_id=request_id,
        step_id=step_id,
        user_id=user_id,
        action=action,
        comment=comment
    )
    db.add(approval_action)
    db.commit()

def advance_to_next_step(db: Session, request: Request):
    """
    Bir sonraki adıma geçer.
    Sonraki adım yoksa talebi APPROVED olarak işaretler.
    """
    next_step = (
        db.query(WorkflowStep)
        .filter(
            WorkflowStep.workflow_id == request.workflow_id,
            WorkflowStep.step_order == request.current_step_order + 1
        )
        .first()
    )

    if next_step:
        # Sonraki adıma geç
        request.current_step_order += 1
        db.commit()
        # Yeni adımda auto-approve kontrolü yap
        process_auto_approvals(db, request)
        
        if request.status == RequestStatus.PENDING:
            from app.services import email_service
            email_service.notify_current_approvers(
                db, request, 
                subject="Yeni Onay Talebi", 
                body=f"'{request.title}' başlıklı talep onayınızı bekliyor.\nTutar: {request.amount} TL"
            )
    else:
        # Son adımdı, talep onaylandı
        request.status = RequestStatus.APPROVED
        db.commit()
        
        from app.services import email_service
        email_service.notify_request_creator(
            db, request,
            subject="Talebiniz Onaylandı",
            body=f"'{request.title}' başlıklı talebiniz tüm onay adımlarından geçerek tamamen onaylanmıştır."
        )

def process_auto_approvals(db: Session, request: Request):
    """
    Mevcut adımdaki tüm onaycılar için limit kontrolü yapar.
    Limit altındaysa otomatik onay verir ve sonraki adıma geçer.
    """
    step = get_current_step(db, request)
    if not step:
        return

    approvers = get_step_approvers(db, step.id)
    if not approvers:
        return

    # Tüm onaycılar için auto-approve kontrolü
    all_auto = all(check_auto_approve(request, approver) for approver in approvers)

    if all_auto:
        for approver in approvers:
            log_action(
                db=db,
                request_id=request.id,
                step_id=step.id,
                user_id=approver.user_id,
                action=ActionType.AUTO_APPROVED,
                comment=f"Tutar ({request.amount} TL) limit altında, otomatik onaylandı"
            )
        advance_to_next_step(db, request)

def approve(db: Session, request: Request, user_id: int, comment: str | None = None):
    """
    Onaycı onay verir.
    - Serial adımda: direkt sonraki adıma geç
    - Parallel ALL: tüm onaycılar onayladıysa geç
    - Parallel ANY: biri onayladıysa geç
    """
    step = get_current_step(db, request)
    if not step:
        raise ValueError("Aktif adım bulunamadı")

    approvers = get_step_approvers(db, step.id)
    approver_ids = [a.user_id for a in approvers]

    # Kullanıcı bu adımın onaycısı mı?
    if user_id not in approver_ids:
        raise ValueError("Bu adımı onaylama yetkiniz yok")

    # Onay hareketini kaydet
    log_action(db, request.id, step.id, user_id, ActionType.APPROVED, comment)

    if step.step_type == StepType.SERIAL:
        # Serial: direkt sonraki adıma geç
        advance_to_next_step(db, request)

    elif step.step_type == StepType.PARALLEL:
        # Şu ana kadar bu adımda kaç kişi onayladı?
        approved_actions = (
            db.query(ApprovalAction)
            .filter(
                ApprovalAction.request_id == request.id,
                ApprovalAction.step_id == step.id,
                ApprovalAction.action == ActionType.APPROVED
            )
            .all()
        )
        approved_user_ids = {a.user_id for a in approved_actions}

        if step.parallel_rule == ParallelRule.ANY:
            # Biri onayladı, geç
            advance_to_next_step(db, request)

        elif step.parallel_rule == ParallelRule.ALL:
            # Hepsi onayladı mı?
            if all(uid in approved_user_ids for uid in approver_ids):
                advance_to_next_step(db, request)

def reject(db: Session, request: Request, user_id: int, comment: str):
    """
    Onaycı reddeder.
    Red açıklaması zorunludur.
    Talep REJECTED durumuna geçer, revize edilip tekrar gönderilebilir.
    """
    step = get_current_step(db, request)
    if not step:
        raise ValueError("Aktif adım bulunamadı")

    approvers = get_step_approvers(db, step.id)
    approver_ids = [a.user_id for a in approvers]

    if user_id not in approver_ids:
        raise ValueError("Bu adımı reddetme yetkiniz yok")

    # Red hareketini kaydet
    log_action(db, request.id, step.id, user_id, ActionType.REJECTED, comment)

    # Talebi REJECTED yap
    request.status = RequestStatus.REJECTED
    db.commit()

    from app.services import email_service
    email_service.notify_request_creator(
        db, request,
        subject="Talebiniz Reddedildi",
        body=f"'{request.title}' başlıklı talebiniz reddedildi.\n\nRed Nedeni: {comment}"
    )

def cancel(db: Session, request: Request, user_id: int):
    """
    Süreci iptal eder.
    İptal edilen talep bir daha onaya gönderilemez.
    """
    step = get_current_step(db, request)

    log_action(
        db=db,
        request_id=request.id,
        step_id=step.id if step else None,
        user_id=user_id,
        action=ActionType.CANCELLED,
        comment="Süreç iptal edildi"
    )

    request.status = RequestStatus.CANCELLED
    db.commit()

    from app.services import email_service
    email_service.notify_request_creator(
        db, request,
        subject="Süreç İptal Edildi",
        body=f"'{request.title}' başlıklı onay süreci iptal edildi."
    )