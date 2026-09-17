import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import KioskSession
from backend.app.schemas.schemas import KioskSessionCreate, KioskSessionResponse, KioskStepUpdate
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/sessions", tags=["Kiosk Sessions"])

@router.post("", response_model=KioskSessionResponse)
def create_session(session_in: KioskSessionCreate, db: Session = Depends(get_db)):
    session = KioskSession(
        kiosk_device_id=session_in.kiosk_device_id or "KIOSK-01",
        patient_id=session_in.patient_id,
        language=session_in.language,
        status="ACTIVE",
        current_step=1
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    AuditService.log(
        db=db,
        action="KIOSK_SESSION_STARTED",
        resource_type="SESSION",
        resource_id=session.id,
        details={"language": session.language, "device": session.kiosk_device_id}
    )

    return session

@router.get("/{id}", response_model=KioskSessionResponse)
def get_session(id: str, db: Session = Depends(get_db)):
    session = db.query(KioskSession).filter(KioskSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Kiosk session not found")
    return session

@router.put("/{id}", response_model=KioskSessionResponse)
def update_session_step(id: str, update_in: KioskStepUpdate, db: Session = Depends(get_db)):
    session = db.query(KioskSession).filter(KioskSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Kiosk session not found")

    session.current_step = update_in.current_step
    if update_in.status:
        session.status = update_in.status
    session.last_activity_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(session)
    return session

@router.post("/{id}/complete", response_model=KioskSessionResponse)
def complete_session(id: str, db: Session = Depends(get_db)):
    session = db.query(KioskSession).filter(KioskSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Kiosk session not found")

    session.status = "COMPLETED"
    session.completed_at = datetime.datetime.utcnow()
    session.last_activity_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(session)

    AuditService.log(
        db=db,
        action="KIOSK_SESSION_COMPLETED",
        resource_type="SESSION",
        resource_id=session.id
    )

    return session
