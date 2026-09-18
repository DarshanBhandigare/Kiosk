import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import Case, User, DoctorNote, DoctorReview, Medication, CaseSymptom, CaseAssignment
from backend.app.schemas.schemas import DoctorNoteCreate, DoctorNoteResponse, DoctorApproveRequest
from backend.app.security.auth import require_doctor, require_staff_or_doctor
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/doctor", tags=["Doctor Workspace"])

@router.get("/my-cases")
def get_my_assigned_cases(
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    cases = db.query(Case).join(CaseAssignment).filter(CaseAssignment.doctor_id == current_user.id).order_by(Case.has_red_flag.desc(), Case.created_at.desc()).all()
    return [{
        "id": case.id,
        "token_number": case.token_number,
        "patient_id": case.patient_id,
        "patient_name": case.patient.full_name if case.patient else "Patient",
        "patient_age": case.patient.age if case.patient else None,
        "patient_sex": case.patient.sex if case.patient else None,
        "patient_id_number": case.patient.patient_id_number if case.patient else None,
        "chief_complaint": case.chief_complaint,
        "department": case.department,
        "assigned_doctor_name": current_user.full_name,
        "assigned_specialty": case.assignment.specialty if case.assignment else current_user.department,
        "routing_reason": case.assignment.routing_reason if case.assignment else None,
        "status": case.status,
        "has_red_flag": case.has_red_flag,
        "red_flag_severity": case.red_flag_severity,
        "created_at": case.created_at,
        "submitted_at": case.submitted_at,
    } for case in cases]
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

@router.post("/cases/{id}/diagnose")
def mark_case_diagnosed(
    id: str,
    diagnose_in: DoctorApproveRequest,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = "DIAGNOSED"
    case.reviewed_at = datetime.datetime.utcnow()
    for med in case.medications:
        med.verified = True

    review = DoctorReview(
        case_id=case.id,
        doctor_id=current_user.id,
        status="DIAGNOSED",
        verification_notes=diagnose_in.verification_notes
    )
    db.add(review)
    db.commit()
    db.refresh(case)

    AuditService.log(
        db=db,
        action="DOCTOR_CASE_DIAGNOSED",
        resource_type="CASE",
        resource_id=case.id,
        user_id=current_user.id,
        details={"doctor": current_user.full_name, "status": case.status, "notes": diagnose_in.verification_notes}
    )

    return {
        "status": "SUCCESS",
        "case_id": case.id,
        "case_status": case.status,
        "reviewed_at": case.reviewed_at,
        "doctor_name": current_user.full_name
    }

