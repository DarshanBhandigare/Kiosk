import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import Case, User, DoctorNote, DoctorReview, Medication, CaseSymptom
from backend.app.schemas.schemas import DoctorNoteCreate, DoctorNoteResponse, DoctorApproveRequest
from backend.app.security.auth import require_doctor, require_staff_or_doctor
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/doctor", tags=["Doctor Workspace"])

@router.post("/cases/{id}/notes", response_model=DoctorNoteResponse)
def add_doctor_note(
    id: str,
    note_in: DoctorNoteCreate,
    current_user: User = Depends(require_staff_or_doctor),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    note = DoctorNote(
        case_id=case.id,
        doctor_id=current_user.id,
        note_type=note_in.note_type,
        content=note_in.content
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    AuditService.log(
        db=db,
        action="DOCTOR_NOTE_ADDED",
        resource_type="CASE",
        resource_id=case.id,
        user_id=current_user.id,
        details={"note_type": note.note_type, "doctor": current_user.full_name}
    )

    return {
        "id": note.id,
        "case_id": note.case_id,
        "doctor_id": note.doctor_id,
        "doctor_name": current_user.full_name,
        "note_type": note.note_type,
        "content": note.content,
        "created_at": note.created_at
    }

@router.post("/cases/{id}/approve")
def approve_case(
    id: str,
    approve_in: DoctorApproveRequest,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = "APPROVED"
    case.reviewed_at = datetime.datetime.utcnow()

    # Mark all medications as doctor verified
    for med in case.medications:
        med.verified = True

    # Mark timeline events as doctor verified
    for ev in case.timeline_events:
        ev.verified = True

    # Add Doctor Review entry
    review = DoctorReview(
        case_id=case.id,
        doctor_id=current_user.id,
        status=approve_in.status,
        verification_notes=approve_in.verification_notes
    )
    db.add(review)
    db.commit()
    db.refresh(case)

    AuditService.log(
        db=db,
        action="DOCTOR_CASE_APPROVED",
        resource_type="CASE",
        resource_id=case.id,
        user_id=current_user.id,
        details={"doctor": current_user.full_name, "status": approve_in.status, "notes": approve_in.verification_notes}
    )

    return {
        "status": "SUCCESS",
        "case_id": case.id,
        "case_status": case.status,
        "reviewed_at": case.reviewed_at,
        "doctor_name": current_user.full_name
    }

@router.post("/cases/{id}/complete")
def mark_case_completed(
    id: str,
    current_user: User = Depends(require_staff_or_doctor),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = "COMPLETED"
    db.commit()

    AuditService.log(
        db=db,
        action="CASE_MARKED_COMPLETED",
        resource_type="CASE",
        resource_id=case.id,
        user_id=current_user.id
    )

    return {"status": "SUCCESS", "case_id": case.id, "case_status": case.status}
