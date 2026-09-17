import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import Patient, PatientConsent
from backend.app.schemas.schemas import PatientCreate, PatientResponse, PatientConsentCreate, PatientConsentResponse
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/patients", tags=["Patients"])

def generate_patient_id(db: Session) -> str:
    count = db.query(Patient).count() + 1
    return f"PAT-2026-{count:03d}"

@router.post("", response_model=PatientResponse)
def create_or_get_patient(patient_in: PatientCreate, db: Session = Depends(get_db)):
    # Check if existing by ABHA ID or contact
    patient = None
    if patient_in.abha_id:
        patient = db.query(Patient).filter(Patient.abha_id == patient_in.abha_id).first()
    if not patient and patient_in.contact_number:
        patient = db.query(Patient).filter(
            Patient.contact_number == patient_in.contact_number,
            Patient.full_name.ilike(patient_in.full_name)
        ).first()

    if not patient:
        patient_id_number = generate_patient_id(db)
        patient = Patient(
            patient_id_number=patient_id_number,
            abha_id=patient_in.abha_id,
            full_name=patient_in.full_name,
            age=patient_in.age,
            date_of_birth=patient_in.date_of_birth,
            sex=patient_in.sex,
            contact_number=patient_in.contact_number,
            emergency_contact=patient_in.emergency_contact,
            preferred_language=patient_in.preferred_language,
            address=patient_in.address
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

        AuditService.log(
            db=db,
            action="PATIENT_REGISTERED",
            resource_type="PATIENT",
            resource_id=patient.id,
            details={"patient_id_number": patient.patient_id_number, "full_name": patient.full_name}
        )
    else:
        # Update details if provided
        patient.preferred_language = patient_in.preferred_language
        if patient_in.age:
            patient.age = patient_in.age
        if patient_in.contact_number:
            patient.contact_number = patient_in.contact_number
        db.commit()
        db.refresh(patient)

    return patient

@router.get("/{id}", response_model=PatientResponse)
def get_patient(id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter((Patient.id == id) | (Patient.patient_id_number == id) | (Patient.abha_id == id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{id}", response_model=PatientResponse)
def update_patient(id: str, patient_in: PatientCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient.full_name = patient_in.full_name
    patient.age = patient_in.age
    patient.sex = patient_in.sex
    patient.contact_number = patient_in.contact_number
    patient.emergency_contact = patient_in.emergency_contact
    patient.preferred_language = patient_in.preferred_language
    patient.address = patient_in.address
    db.commit()
    db.refresh(patient)

    AuditService.log(
        db=db,
        action="PATIENT_UPDATED",
        resource_type="PATIENT",
        resource_id=patient.id,
        details={"updated_fields": patient_in.dict(exclude_unset=True)}
    )
    return patient

@router.post("/{id}/consent", response_model=PatientConsentResponse)
def record_consent(id: str, consent_in: PatientConsentCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    consent = PatientConsent(
        patient_id=patient.id,
        consent_given=consent_in.consent_given,
        consent_version=consent_in.consent_version,
        ip_or_kiosk_id=consent_in.kiosk_id or "KIOSK-01"
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)

    AuditService.log(
        db=db,
        action="PATIENT_CONSENT_RECORDED",
        resource_type="PATIENT",
        resource_id=patient.id,
        details={"consent_version": consent.consent_version, "kiosk_id": consent.ip_or_kiosk_id}
    )

    return consent
