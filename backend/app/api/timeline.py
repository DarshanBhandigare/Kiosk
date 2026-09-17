from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import MedicalTimelineEvent, Patient
from backend.app.schemas.schemas import TimelineEventCreate, TimelineEventResponse
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/timeline", tags=["Medical Timeline"])

@router.get("/patient/{patient_id}", response_model=List[TimelineEventResponse])
def get_patient_timeline(patient_id: str, db: Session = Depends(get_db)):
    events = db.query(MedicalTimelineEvent).filter(
        MedicalTimelineEvent.patient_id == patient_id
    ).order_by(MedicalTimelineEvent.created_at.desc()).all()
    return events

@router.post("", response_model=TimelineEventResponse)
def add_timeline_event(event_in: TimelineEventCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == event_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    new_event = MedicalTimelineEvent(
        patient_id=patient.id,
        case_id=event_in.case_id,
        event_date=event_in.event_date,
        event_type=event_in.event_type,
        title=event_in.title,
        description=event_in.description,
        source=event_in.source,
        confidence=event_in.confidence,
        verified=True
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    AuditService.log(
        db=db,
        action="TIMELINE_EVENT_ADDED",
        resource_type="TIMELINE_EVENT",
        resource_id=new_event.id,
        details={"title": new_event.title, "event_date": new_event.event_date}
    )

    return new_event
