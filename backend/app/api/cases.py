import datetime
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import (
    Case, Patient, CaseSymptom, MedicalHistory, Medication, Allergy,
    FamilyHistory, LifestyleInformation, AyurvedaProfile, Document,
    MedicalTimelineEvent, RedFlagAlert, DoctorNote, DoctorReview, CaseAssignment, Role, User,
    InterviewResponse
)
from backend.app.schemas.schemas import CaseCreate, CaseResponse, DoctorAssignmentRequest
from backend.app.security.auth import require_staff_or_doctor
from backend.app.services.red_flag_engine import RedFlagEngine
from backend.app.services.timeline_service import TimelineService
from backend.app.services.summary_service import SummaryService
from backend.app.services.audit_service import AuditService
from backend.app.services.specialty_routing import route_case_to_specialist

router = APIRouter(prefix="/cases", tags=["Cases & Queue"])

def generate_token(db: Session) -> str:
    token_numbers = db.query(Case.token_number).all()
    numeric_tokens = [
        int(match.group(1))
        for (token_number,) in token_numbers
        if (match := re.fullmatch(r"T-(\d+)", token_number))
    ]
    return f"T-{max(numeric_tokens, default=100) + 1}"

@router.get("")
def list_cases(
    status: Optional[str] = Query(None),
    has_red_flag: Optional[bool] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Case)
    if status:
        query = query.filter(Case.status == status)
    if has_red_flag is not None:
        query = query.filter(Case.has_red_flag == has_red_flag)
    if department:
        query = query.filter(Case.department == department)

    cases = query.order_by(
        Case.has_red_flag.desc(),
        Case.created_at.desc()
    ).all()

    result = []
    for c in cases:
        result.append({
            "id": c.id,
            "token_number": c.token_number,
            "patient_id": c.patient_id,
            "patient_name": c.patient.full_name if c.patient else "Patient",
            "patient_age": c.patient.age if c.patient else None,
            "patient_sex": c.patient.sex if c.patient else None,
            "patient_id_number": c.patient.patient_id_number if c.patient else None,
            "chief_complaint": c.chief_complaint,
            "department": c.department,
            "assigned_doctor_name": c.assignment.doctor.full_name if c.assignment else None,
            "assigned_specialty": c.assignment.specialty if c.assignment else None,
            "routing_reason": c.assignment.routing_reason if c.assignment else None,
            "status": c.status,
            "has_red_flag": c.has_red_flag,
            "red_flag_severity": c.red_flag_severity,
            "created_at": c.created_at,
            "submitted_at": c.submitted_at
        })
    return result

@router.get("/doctors")
def list_assignable_doctors(
    current_user: User = Depends(require_staff_or_doctor),
    db: Session = Depends(get_db),
):
    doctors = db.query(User).join(Role).filter(Role.name == "doctor", User.is_active.is_(True)).order_by(User.department, User.full_name).all()
    return [{"id": doctor.id, "full_name": doctor.full_name, "department": doctor.department} for doctor in doctors]

@router.post("/{case_id}/assign-doctor")
def assign_case_doctor(
    case_id: str,
    assignment_in: DoctorAssignmentRequest,
    current_user: User = Depends(require_staff_or_doctor),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    doctor = db.query(User).join(Role).filter(Role.name == "doctor", User.id == assignment_in.doctor_id, User.is_active.is_(True)).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Active doctor not found")

    routing_reason = f"Manually assigned by {current_user.full_name}."
    if case.assignment:
        case.assignment.doctor_id = doctor.id
        case.assignment.specialty = doctor.department or "General Medicine"
        case.assignment.routing_reason = routing_reason
    else:
        db.add(CaseAssignment(
            case_id=case.id,
            doctor_id=doctor.id,
            specialty=doctor.department or "General Medicine",
            routing_reason=routing_reason,
        ))
    case.department = doctor.department or case.department
    db.commit()
    db.refresh(case)

    AuditService.log(
        db=db,
        action="CASE_DOCTOR_ASSIGNED",
        resource_type="CASE",
        resource_id=case.id,
        user_id=current_user.id,
        details={"assigned_doctor": doctor.full_name, "assigned_by": current_user.full_name},
    )
    return {
        "status": "SUCCESS",
        "case_id": case.id,
        "doctor_id": doctor.id,
        "doctor_name": doctor.full_name,
        "department": case.department,
        "routing_reason": routing_reason,
    }

@router.delete("/{case_id}")
def delete_case(
    case_id: str,
    current_user: User = Depends(require_staff_or_doctor),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    token_number = case.token_number
    db.query(Document).filter(Document.case_id == case.id).delete(synchronize_session=False)
    db.query(MedicalTimelineEvent).filter(MedicalTimelineEvent.case_id == case.id).delete(synchronize_session=False)
    db.query(RedFlagAlert).filter(RedFlagAlert.case_id == case.id).delete(synchronize_session=False)
    db.query(DoctorNote).filter(DoctorNote.case_id == case.id).delete(synchronize_session=False)
    db.query(DoctorReview).filter(DoctorReview.case_id == case.id).delete(synchronize_session=False)
    db.query(CaseAssignment).filter(CaseAssignment.case_id == case.id).delete(synchronize_session=False)
    if case.session_id:
        db.query(InterviewResponse).filter(InterviewResponse.session_id == case.session_id).delete(synchronize_session=False)
    db.delete(case)
    db.commit()

    AuditService.log(
        db=db,
        action="CASE_DELETED",
        resource_type="CASE",
        resource_id=case_id,
        user_id=current_user.id,
        details={"token_number": token_number, "deleted_by": current_user.full_name},
    )
    return {"status": "SUCCESS", "case_id": case_id, "token_number": token_number}

@router.post("")
async def create_case(case_in: CaseCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == case_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    token = generate_token(db)
    new_case = Case(
        patient_id=patient.id,
        session_id=case_in.session_id,
        token_number=token,
        chief_complaint=case_in.chief_complaint,
        department=case_in.department or "OPD General",
        status="WAITING_REVIEW",
        submitted_at=datetime.datetime.utcnow()
    )
    db.add(new_case)
    db.flush()

    # Add symptoms
    for sym in case_in.symptoms:
        cs = CaseSymptom(
            case_id=new_case.id,
            custom_name=sym.custom_name or sym.name,
            duration=sym.duration,
            severity=sym.severity,
            body_location=sym.body_location,
            notes=sym.notes,
            is_primary=sym.is_primary
        )
        db.add(cs)

    # Add medical histories
    for mh in case_in.medical_histories:
        m = MedicalHistory(
            case_id=new_case.id,
            condition_name=mh.condition_name,
            diagnosed_year_or_duration=mh.diagnosed_year_or_duration,
            status=mh.status,
            is_surgery=mh.is_surgery,
            is_hospitalization=mh.is_hospitalization,
            notes=mh.notes
        )
        db.add(m)

    # Add medications
    for med in case_in.medications:
        md = Medication(
            case_id=new_case.id,
            drug_name=med.drug_name,
            dosage=med.dosage,
            frequency=med.frequency,
            duration=med.duration,
            prescribed_by=med.prescribed_by,
            source=med.source
        )
        db.add(md)

    # Add allergies
    for alg in case_in.allergies:
        al = Allergy(
            case_id=new_case.id,
            allergen_name=alg.allergen_name,
            reaction_type=alg.reaction_type,
            severity=alg.severity
        )
        db.add(al)

    # Add family history
    for fam in case_in.family_histories:
        fh = FamilyHistory(
            case_id=new_case.id,
            relation=fam.relation,
            condition_name=fam.condition_name,
            notes=fam.notes
        )
        db.add(fh)

    # Add lifestyle
    if case_in.lifestyle:
        ls = LifestyleInformation(
            case_id=new_case.id,
            diet_type=case_in.lifestyle.diet_type,
            smoking_status=case_in.lifestyle.smoking_status,
            alcohol_status=case_in.lifestyle.alcohol_status,
            physical_activity=case_in.lifestyle.physical_activity,
            sleep_hours=case_in.lifestyle.sleep_hours,
            occupation=case_in.lifestyle.occupation
        )
        db.add(ls)

    # Add ayurveda
    if case_in.ayurveda:
        ay = AyurvedaProfile(
            case_id=new_case.id,
            prakriti=case_in.ayurveda.prakriti,
            vikriti=case_in.ayurveda.vikriti,
            agni=case_in.ayurveda.agni,
            koshta=case_in.ayurveda.koshta,
            sleep_pattern=case_in.ayurveda.sleep_pattern,
            appetite=case_in.ayurveda.appetite,
            bowel_habits=case_in.ayurveda.bowel_habits,
            notes=case_in.ayurveda.notes
        )
        db.add(ay)

    db.commit()

    # 1. Run Red Flag Safety Engine
    RedFlagEngine.evaluate_case(db, new_case.id)

    # 2. Build Chronological Medical Timeline
    TimelineService.build_case_timeline(db, new_case.id)

    # 3. Route to a configured specialty based on reported symptoms.
    assignment = route_case_to_specialist(db, new_case)

    # 4. Generate AI Doctor Summary
    await SummaryService.generate_and_save_summary(db, new_case.id)

    AuditService.log(
        db=db,
        action="CASE_CREATED_AND_SUBMITTED",
        resource_type="CASE",
        resource_id=new_case.id,
        details={"token_number": new_case.token_number, "has_red_flag": new_case.has_red_flag, "assigned_doctor": assignment.doctor.full_name if assignment else None}
    )

    return {
        "id": new_case.id,
        "token_number": new_case.token_number,
        "status": new_case.status,
        "has_red_flag": new_case.has_red_flag,
        "red_flag_severity": new_case.red_flag_severity,
        "assigned_doctor_name": assignment.doctor.full_name if assignment else None,
        "submitted_at": new_case.submitted_at
    }

@router.get("/{id}")
def get_case_details(id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter((Case.id == id) | (Case.token_number == id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    patient = case.patient
    symptoms = [
        {
            "id": s.id,
            "name": s.custom_name or (s.symptom.name if s.symptom else "Symptom"),
            "duration": s.duration,
            "severity": s.severity,
            "body_location": s.body_location,
            "notes": s.notes,
            "is_primary": s.is_primary
        }
        for s in case.case_symptoms
    ]

    medical_histories = [
        {
            "id": m.id,
            "condition_name": m.condition_name,
            "diagnosed_year_or_duration": m.diagnosed_year_or_duration,
            "status": m.status,
            "is_surgery": m.is_surgery,
            "is_hospitalization": m.is_hospitalization,
            "source": m.source,
            "notes": m.notes
        }
        for m in case.medical_histories
    ]

    medications = [
        {
            "id": m.id,
            "drug_name": m.drug_name,
            "dosage": m.dosage,
            "frequency": m.frequency,
            "duration": m.duration,
            "prescribed_by": m.prescribed_by,
            "is_current": m.is_current,
            "source": m.source,
            "verified": m.verified
        }
        for m in case.medications
    ]

    allergies = [
        {
            "id": a.id,
            "allergen_name": a.allergen_name,
            "reaction_type": a.reaction_type,
            "severity": a.severity,
            "source": a.source
        }
        for a in case.allergies
    ]

    family_histories = [
        {
            "id": f.id,
            "relation": f.relation,
            "condition_name": f.condition_name,
            "notes": f.notes
        }
        for f in case.family_histories
    ]

    documents = []
    # Include case docs and patient docs
    doc_query = db.query(Document).filter((Document.case_id == case.id) | (Document.patient_id == case.patient_id)).all()
    for d in doc_query:
        documents.append({
            "id": d.id,
            "document_type": d.document_type,
            "file_name": d.file_name,
            "file_size_bytes": d.file_size_bytes,
            "mime_type": d.mime_type,
            "ocr_status": d.ocr_status,
            "ocr_raw_text": d.ocr_raw_text,
            "uploaded_at": d.uploaded_at,
            "extractions": [
                {
                    "id": e.id,
                    "entity_type": e.entity_type,
                    "extracted_key": e.extracted_key,
                    "extracted_value": e.extracted_value,
                    "reference_range": e.reference_range,
                    "is_abnormal": e.is_abnormal,
                    "confidence_score": e.confidence_score,
                    "verified_by_doctor": e.verified_by_doctor
                }
                for e in d.extractions
            ]
        })

    timeline = [
        {
            "id": t.id,
            "event_date": t.event_date,
            "event_type": t.event_type,
            "title": t.title,
            "description": t.description,
            "source": t.source,
            "confidence": t.confidence,
            "verified": t.verified,
            "created_at": t.created_at
        }
        for t in db.query(MedicalTimelineEvent).filter(MedicalTimelineEvent.patient_id == case.patient_id).order_by(MedicalTimelineEvent.created_at.desc()).all()
    ]

    alerts = [
        {
            "id": a.id,
            "severity": a.severity,
            "trigger_reason": a.trigger_reason,
            "alert_message": a.alert_message,
            "is_acknowledged": a.is_acknowledged,
            "acknowledged_by": a.acknowledged_by,
            "created_at": a.created_at
        }
        for a in case.red_flag_alerts
    ]

    doctor_notes = [
        {
            "id": n.id,
            "doctor_name": n.doctor.full_name if n.doctor else "Attending Physician",
            "note_type": n.note_type,
            "content": n.content,
            "created_at": n.created_at
        }
        for n in case.doctor_notes
    ]

    doctor_reviews = [
        {
            "id": r.id,
            "doctor_name": r.doctor.full_name if r.doctor else "Attending Physician",
            "status": r.status,
            "verification_notes": r.verification_notes,
            "reviewed_at": r.reviewed_at
        }
        for r in case.doctor_reviews
    ]

    return {
        "id": case.id,
        "token_number": case.token_number,
        "patient": {
            "id": patient.id,
            "patient_id_number": patient.patient_id_number,
            "abha_id": patient.abha_id,
            "full_name": patient.full_name,
            "age": patient.age,
            "sex": patient.sex,
            "contact_number": patient.contact_number,
            "emergency_contact": patient.emergency_contact,
            "preferred_language": patient.preferred_language,
            "address": patient.address
        } if patient else None,
        "chief_complaint": case.chief_complaint,
        "hpi_summary": case.hpi_summary,
        "department": case.department,
        "assignment": {
            "doctor_id": case.assignment.doctor_id,
            "doctor_name": case.assignment.doctor.full_name,
            "specialty": case.assignment.specialty,
            "routing_reason": case.assignment.routing_reason
        } if case.assignment else None,
        "status": case.status,
        "has_red_flag": case.has_red_flag,
        "red_flag_severity": case.red_flag_severity,
        "ai_summary": case.ai_summary,
        "symptoms": symptoms,
        "medical_histories": medical_histories,
        "medications": medications,
        "allergies": allergies,
        "family_histories": family_histories,
        "lifestyle": {
            "diet_type": case.lifestyle_info.diet_type,
            "smoking_status": case.lifestyle_info.smoking_status,
            "alcohol_status": case.lifestyle_info.alcohol_status,
            "physical_activity": case.lifestyle_info.physical_activity,
            "sleep_hours": case.lifestyle_info.sleep_hours,
            "occupation": case.lifestyle_info.occupation
        } if case.lifestyle_info else None,
        "ayurveda": {
            "prakriti": case.ayurveda_profile.prakriti,
            "vikriti": case.ayurveda_profile.vikriti,
            "agni": case.ayurveda_profile.agni,
            "koshta": case.ayurveda_profile.koshta,
            "sleep_pattern": case.ayurveda_profile.sleep_pattern,
            "appetite": case.ayurveda_profile.appetite,
            "bowel_habits": case.ayurveda_profile.bowel_habits,
            "notes": case.ayurveda_profile.notes
        } if case.ayurveda_profile else None,
        "documents": documents,
        "timeline": timeline,
        "alerts": alerts,
        "doctor_notes": doctor_notes,
        "doctor_reviews": doctor_reviews,
        "created_at": case.created_at,
        "submitted_at": case.submitted_at,
        "reviewed_at": case.reviewed_at
    }

@router.put("/{id}")
def update_case(id: str, case_update: dict, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if "chief_complaint" in case_update:
        case.chief_complaint = case_update["chief_complaint"]
    if "department" in case_update:
        case.department = case_update["department"]
    if "status" in case_update:
        case.status = case_update["status"]

    db.commit()
    db.refresh(case)

    AuditService.log(
        db=db,
        action="CASE_UPDATED",
        resource_type="CASE",
        resource_id=case.id,
        details=case_update
    )
    return {"status": "SUCCESS", "case_id": case.id}
