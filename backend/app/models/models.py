import datetime
import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Enum
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False, index=True) # doctor, staff, admin, patient
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    role_id = Column(String(36), ForeignKey("roles.id"), nullable=False)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True) # OPD General, Cardiology, Ayurveda, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    role = relationship("Role", back_populates="users")
    doctor_reviews = relationship("DoctorReview", back_populates="doctor")
    doctor_notes = relationship("DoctorNote", back_populates="doctor")
    audit_logs = relationship("AuditLog", back_populates="user")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id_number = Column(String(50), unique=True, nullable=False, index=True) # e.g. PAT-2026-001
    abha_id = Column(String(50), nullable=True, index=True) # ABHA ID e.g. 14-digit or username@abdm
    full_name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=True)
    date_of_birth = Column(String(20), nullable=True)
    sex = Column(String(20), nullable=False) # Male, Female, Other
    contact_number = Column(String(30), nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    preferred_language = Column(String(10), default="en") # en, hi, mr
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    consents = relationship("PatientConsent", back_populates="patient", cascade="all, delete-orphan")
    kiosk_sessions = relationship("KioskSession", back_populates="patient")
    cases = relationship("Case", back_populates="patient")
    timeline_events = relationship("MedicalTimelineEvent", back_populates="patient")
    documents = relationship("Document", back_populates="patient")

class PatientConsent(Base):
    __tablename__ = "patient_consents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    consent_given = Column(Boolean, default=True, nullable=False)
    consent_version = Column(String(20), default="v1.0")
    consent_scope = Column(String(255), default="AI-assisted case intake, OCR document processing, Doctor review")
    consented_at = Column(DateTime, default=datetime.datetime.utcnow)
    ip_or_kiosk_id = Column(String(50), default="KIOSK-01")

    patient = relationship("Patient", back_populates="consents")

class KioskSession(Base):
    __tablename__ = "kiosk_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    kiosk_device_id = Column(String(50), default="KIOSK-01")
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=True)
    language = Column(String(10), default="en") # en, hi, mr
    status = Column(String(30), default="ACTIVE") # ACTIVE, COMPLETED, ABANDONED, TIMED_OUT
    current_step = Column(Integer, default=1) # 1 to 13
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    last_activity_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="kiosk_sessions")
    case = relationship("Case", back_populates="session", uselist=False)
    interview_responses = relationship("InterviewResponse", back_populates="session")

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    session_id = Column(String(36), ForeignKey("kiosk_sessions.id"), nullable=True)
    token_number = Column(String(20), unique=True, nullable=False, index=True) # e.g. T-101
    chief_complaint = Column(Text, nullable=False)
    hpi_summary = Column(Text, nullable=True) # History of present illness
    status = Column(String(30), default="WAITING_REVIEW") # WAITING_REVIEW, TRIAGED, UNDER_REVIEW, APPROVED, COMPLETED
    department = Column(String(100), default="OPD General")
    has_red_flag = Column(Boolean, default=False)
    red_flag_severity = Column(String(20), nullable=True) # CRITICAL, HIGH, MEDIUM, LOW
    ai_summary = Column(JSON, nullable=True) # structured JSON summary
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="cases")
    session = relationship("KioskSession", back_populates="case")
    case_symptoms = relationship("CaseSymptom", back_populates="case", cascade="all, delete-orphan")
    medical_histories = relationship("MedicalHistory", back_populates="case", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="case", cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="case", cascade="all, delete-orphan")
    family_histories = relationship("FamilyHistory", back_populates="case", cascade="all, delete-orphan")
    lifestyle_info = relationship("LifestyleInformation", back_populates="case", uselist=False, cascade="all, delete-orphan")
    ayurveda_profile = relationship("AyurvedaProfile", back_populates="case", uselist=False, cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="case")
    timeline_events = relationship("MedicalTimelineEvent", back_populates="case")
    red_flag_alerts = relationship("RedFlagAlert", back_populates="case")
    doctor_reviews = relationship("DoctorReview", back_populates="case")
    doctor_notes = relationship("DoctorNote", back_populates="case")

class Symptom(Base):
    __tablename__ = "symptoms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=True) # Respiratory, Cardiovascular, Gastrointestinal, General, etc.
    translations = Column(JSON, nullable=True) # {"hi": "छाती में दर्द", "mr": "छातीत दुखणे"}
    is_red_flag_candidate = Column(Boolean, default=False)

    case_symptoms = relationship("CaseSymptom", back_populates="symptom")

class CaseSymptom(Base):
    __tablename__ = "case_symptoms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    symptom_id = Column(String(36), ForeignKey("symptoms.id"), nullable=True)
    custom_name = Column(String(255), nullable=True)
    duration = Column(String(100), nullable=True) # e.g. "3 days", "2 weeks"
    severity = Column(Integer, nullable=True) # 1 to 10
    body_location = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    is_primary = Column(Boolean, default=False)

    case = relationship("Case", back_populates="case_symptoms")
    symptom = relationship("Symptom", back_populates="case_symptoms")

class MedicalHistory(Base):
    __tablename__ = "medical_histories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    condition_name = Column(String(255), nullable=False) # Hypertension, Type 2 Diabetes, Asthma, etc.
    diagnosed_year_or_duration = Column(String(100), nullable=True)
    status = Column(String(50), default="ACTIVE") # ACTIVE, RESOLVED, CHRONIC
    is_surgery = Column(Boolean, default=False)
    is_hospitalization = Column(Boolean, default=False)
    source = Column(String(50), default="PATIENT_REPORTED") # PATIENT_REPORTED, DOCUMENT_EXTRACTED
    notes = Column(Text, nullable=True)

    case = relationship("Case", back_populates="medical_histories")

class Medication(Base):
    __tablename__ = "medications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    drug_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=True) # e.g. "500mg"
    frequency = Column(String(100), nullable=True) # e.g. "Twice daily after food (BD)"
    duration = Column(String(100), nullable=True)
    prescribed_by = Column(String(255), nullable=True)
    is_current = Column(Boolean, default=True)
    source = Column(String(50), default="PATIENT_REPORTED") # PATIENT_REPORTED, DOCUMENT_EXTRACTED
    confidence_score = Column(Float, default=1.0)
    verified = Column(Boolean, default=False)

    case = relationship("Case", back_populates="medications")

class Allergy(Base):
    __tablename__ = "allergies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    allergen_name = Column(String(255), nullable=False) # e.g. "Penicillin", "Sulfa drugs", "Peanuts"
    reaction_type = Column(String(255), nullable=True) # e.g. "Skin rash", "Anaphylaxis", "Breathlessness"
    severity = Column(String(50), default="MODERATE") # MILD, MODERATE, SEVERE
    source = Column(String(50), default="PATIENT_REPORTED")

    case = relationship("Case", back_populates="allergies")

class FamilyHistory(Base):
    __tablename__ = "family_histories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    relation = Column(String(100), nullable=False) # Father, Mother, Sibling, Maternal Grandparent
    condition_name = Column(String(255), nullable=False) # Diabetes, Heart Disease, Cancer, etc.
    notes = Column(String(255), nullable=True)

    case = relationship("Case", back_populates="family_histories")

class LifestyleInformation(Base):
    __tablename__ = "lifestyle_information"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    diet_type = Column(String(50), nullable=True) # Vegetarian, Non-Vegetarian, Vegan
    smoking_status = Column(String(50), default="NEVER") # NEVER, FORMER, OCCASIONAL, REGULAR
    alcohol_status = Column(String(50), default="NEVER") # NEVER, OCCASIONAL, REGULAR
    physical_activity = Column(String(50), default="MODERATE") # SEDENTARY, MODERATE, ACTIVE
    sleep_hours = Column(String(50), nullable=True) # e.g. "6-7 hours"
    occupation = Column(String(100), nullable=True)

    case = relationship("Case", back_populates="lifestyle_info")

class AyurvedaProfile(Base):
    __tablename__ = "ayurveda_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    prakriti = Column(String(100), nullable=True) # Vata, Pitta, Kapha, Vata-Pitta, etc.
    vikriti = Column(String(100), nullable=True) # Current dosha imbalance
    agni = Column(String(50), nullable=True) # Sama Agni, Vishama Agni, Tikshna Agni, Manda Agni
    koshta = Column(String(50), nullable=True) # Krura, Mridu, Madhyama
    sleep_pattern = Column(String(100), nullable=True)
    appetite = Column(String(100), nullable=True)
    bowel_habits = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="ayurveda_profile")

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_key = Column(String(100), unique=True, nullable=False)
    category = Column(String(100), nullable=False) # CHIEF_COMPLAINT, SEVERITY, DURATION, ASSOCIATED, HISTORY, AYURVEDA
    translations = Column(JSON, nullable=False) # {"en": "...", "hi": "...", "mr": "..."}
    input_type = Column(String(50), default="VOICE_OR_TOUCH") # CHOICE, SLIDER, TEXT, VOICE_OR_TOUCH
    options = Column(JSON, nullable=True) # list of choice options per language
    is_active = Column(Boolean, default=True)

class InterviewResponse(Base):
    __tablename__ = "interview_responses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("kiosk_sessions.id"), nullable=False)
    question_key = Column(String(100), nullable=False)
    question_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=False)
    input_mode = Column(String(30), default="TOUCH") # VOICE, TOUCH, STAFF_ASSISTED
    language = Column(String(10), default="en")
    is_corrected = Column(Boolean, default=False)
    previous_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("KioskSession", back_populates="interview_responses")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=True)
    document_type = Column(String(50), nullable=False) # PRESCRIPTION, LAB_REPORT, DISCHARGE_SUMMARY, OTHER
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    ocr_status = Column(String(50), default="PENDING") # PENDING, PROCESSING, COMPLETED, FAILED
    ocr_raw_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="documents")
    case = relationship("Case", back_populates="documents")
    extractions = relationship("DocumentExtraction", back_populates="document", cascade="all, delete-orphan")

class DocumentExtraction(Base):
    __tablename__ = "document_extractions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    entity_type = Column(String(50), nullable=False) # MEDICINE, DOSAGE, LAB_TEST, TEST_RESULT, DOCTOR, DATE, DIAGNOSIS
    extracted_key = Column(String(255), nullable=False) # e.g. "HbA1c", "Atorvastatin"
    extracted_value = Column(String(255), nullable=False) # e.g. "7.8%", "20mg daily"
    reference_range = Column(String(100), nullable=True) # e.g. "< 5.7%"
    is_abnormal = Column(Boolean, default=False)
    confidence_score = Column(Float, default=0.95)
    verified_by_doctor = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="extractions")

class MedicalTimelineEvent(Base):
    __tablename__ = "medical_timeline_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=True)
    event_date = Column(String(50), nullable=False) # e.g. "2026-02-15" or "Approx. 2 years ago"
    event_type = Column(String(50), nullable=False) # CONSULTATION, HOSPITALIZATION, MEDICATION, LAB_TEST, PROCEDURE, PRESCRIPTION, REPORTED_ILLNESS
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source = Column(String(50), default="PATIENT_REPORTED") # PATIENT_REPORTED, DOCUMENT_EXTRACTED, HMIS_SYNC
    confidence = Column(String(30), default="HIGH") # HIGH, MEDIUM, LOW, UNCERTAIN_DATE
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="timeline_events")
    case = relationship("Case", back_populates="timeline_events")

class RedFlagRule(Base):
    __tablename__ = "red_flag_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    rule_code = Column(String(50), unique=True, nullable=False, index=True) # RF001, RF002, etc.
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="HIGH") # CRITICAL, HIGH, MEDIUM
    required_symptom_keys = Column(JSON, nullable=False) # list of keyword patterns
    additional_conditions = Column(JSON, nullable=True) # e.g. {"min_age": 45, "severity_gte": 8}
    alert_message = Column(String(500), nullable=False)
    action_required = Column(String(255), default="Notify OPD triage nurse and duty physician")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class RedFlagAlert(Base):
    __tablename__ = "red_flag_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    rule_id = Column(String(36), ForeignKey("red_flag_rules.id"), nullable=True)
    severity = Column(String(20), nullable=False) # CRITICAL, HIGH, MEDIUM
    trigger_reason = Column(Text, nullable=False)
    alert_message = Column(String(500), nullable=False)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="red_flag_alerts")

class DoctorReview(Base):
    __tablename__ = "doctor_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="APPROVED") # APPROVED, REVISED, REFERRED, REJECTED
    verification_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="doctor_reviews")
    doctor = relationship("User", back_populates="doctor_reviews")

class DoctorNote(Base):
    __tablename__ = "doctor_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    note_type = Column(String(50), default="CLINICAL_OBSERVATION") # CLINICAL_OBSERVATION, TRIAGE_NOTE, FOLLOW_UP
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="doctor_notes")
    doctor = relationship("User", back_populates="doctor_notes")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False) # PATIENT_CONSENT, CASE_CREATED, DOCUMENT_UPLOADED, OCR_PROCESSED, RED_FLAG_TRIGGERED, DOCTOR_APPROVED, DATA_EDITED
    resource_type = Column(String(50), nullable=False) # CASE, PATIENT, DOCUMENT, REVIEW
    resource_id = Column(String(100), nullable=False)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")
