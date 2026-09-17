import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

# Auth & User
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str
    username: str
    full_name: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[str] = None
    role_name: str
    department: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    full_name: str
    email: Optional[str] = None
    role_name: str
    department: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime

# Patient & Consent
class PatientCreate(BaseModel):
    full_name: str
    age: Optional[int] = None
    date_of_birth: Optional[str] = None
    sex: str
    contact_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    preferred_language: str = "en"
    abha_id: Optional[str] = None
    address: Optional[str] = None

class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    patient_id_number: str
    abha_id: Optional[str] = None
    full_name: str
    age: Optional[int] = None
    sex: str
    contact_number: Optional[str] = None
    preferred_language: str
    created_at: datetime.datetime

class PatientConsentCreate(BaseModel):
    patient_id: str
    consent_given: bool = True
    consent_version: str = "v1.0"
    kiosk_id: Optional[str] = "KIOSK-01"

class PatientConsentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    patient_id: str
    consent_given: bool
    consent_version: str
    consented_at: datetime.datetime

# Kiosk Session
class KioskSessionCreate(BaseModel):
    language: str = "en"
    kiosk_device_id: Optional[str] = "KIOSK-01"
    patient_id: Optional[str] = None

class KioskSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    kiosk_device_id: str
    patient_id: Optional[str] = None
    language: str
    status: str
    current_step: int
    started_at: datetime.datetime

class KioskStepUpdate(BaseModel):
    current_step: int
    status: Optional[str] = None

# Interview & Adaptive Q&A
class InterviewQuestionResponse(BaseModel):
    id: str
    question_key: str
    category: str
    question_text: str
    input_type: str
    options: Optional[List[str]] = None

class InterviewAnswerRequest(BaseModel):
    session_id: str
    question_key: str
    question_text: str
    response_text: str
    input_mode: str = "TOUCH" # VOICE, TOUCH, STAFF_ASSISTED
    language: str = "en"
    is_correction: bool = False

class AdaptiveNextQuestion(BaseModel):
    has_next: bool
    question_key: Optional[str] = None
    question_text: Optional[str] = None
    category: Optional[str] = None
    input_type: Optional[str] = "VOICE_OR_TOUCH"
    options: Optional[List[str]] = None
    collected_summary: Optional[Dict[str, Any]] = None

# Symptoms & Clinical Data
class SymptomInput(BaseModel):
    name: str
    custom_name: Optional[str] = None
    duration: Optional[str] = None
    severity: Optional[int] = Field(None, ge=1, le=10)
    body_location: Optional[str] = None
    notes: Optional[str] = None
    is_primary: bool = False

class MedicalHistoryInput(BaseModel):
    condition_name: str
    diagnosed_year_or_duration: Optional[str] = None
    status: str = "ACTIVE"
    is_surgery: bool = False
    is_hospitalization: bool = False
    notes: Optional[str] = None

class MedicationInput(BaseModel):
    drug_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    prescribed_by: Optional[str] = None
    is_current: bool = True
    source: str = "PATIENT_REPORTED"

class AllergyInput(BaseModel):
    allergen_name: str
    reaction_type: Optional[str] = None
    severity: str = "MODERATE"

class FamilyHistoryInput(BaseModel):
    relation: str
    condition_name: str
    notes: Optional[str] = None

class LifestyleInfoInput(BaseModel):
    diet_type: Optional[str] = "Vegetarian"
    smoking_status: Optional[str] = "NEVER"
    alcohol_status: Optional[str] = "NEVER"
    physical_activity: Optional[str] = "MODERATE"
    sleep_hours: Optional[str] = "6-7 hours"
    occupation: Optional[str] = None

class AyurvedaProfileInput(BaseModel):
    prakriti: Optional[str] = None
    vikriti: Optional[str] = None
    agni: Optional[str] = None
    koshta: Optional[str] = None
    sleep_pattern: Optional[str] = None
    appetite: Optional[str] = None
    bowel_habits: Optional[str] = None
    notes: Optional[str] = None

# Case Submission & Schemas
class CaseCreate(BaseModel):
    patient_id: str
    session_id: Optional[str] = None
    chief_complaint: str
    department: Optional[str] = "OPD General"
    symptoms: List[SymptomInput] = []
    medical_histories: List[MedicalHistoryInput] = []
    medications: List[MedicationInput] = []
    allergies: List[AllergyInput] = []
    family_histories: List[FamilyHistoryInput] = []
    lifestyle: Optional[LifestyleInfoInput] = None
    ayurveda: Optional[AyurvedaProfileInput] = None

class DoctorAssignmentRequest(BaseModel):
    doctor_id: str

class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    token_number: str
    patient_id: str
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_sex: Optional[str] = None
    chief_complaint: str
    hpi_summary: Optional[str] = None
    department: str
    status: str
    has_red_flag: bool
    red_flag_severity: Optional[str] = None
    ai_summary: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime
    submitted_at: Optional[datetime.datetime] = None

# Documents & OCR
class DocumentExtractionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    entity_type: str
    extracted_key: str
    extracted_value: str
    reference_range: Optional[str] = None
    is_abnormal: bool = False
    confidence_score: float = 1.0
    verified_by_doctor: bool = False

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    patient_id: str
    case_id: Optional[str] = None
    document_type: str
    file_name: str
    file_size_bytes: int
    mime_type: str
    ocr_status: str
    ocr_raw_text: Optional[str] = None
    uploaded_at: datetime.datetime
    extractions: List[DocumentExtractionResponse] = []

# Timeline
class TimelineEventCreate(BaseModel):
    patient_id: str
    case_id: Optional[str] = None
    event_date: str
    event_type: str
    title: str
    description: Optional[str] = None
    source: str = "PATIENT_REPORTED"
    confidence: str = "HIGH"

class TimelineEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    patient_id: str
    case_id: Optional[str] = None
    event_date: str
    event_type: str
    title: str
    description: Optional[str] = None
    source: str
    confidence: str
    verified: bool
    created_at: datetime.datetime

# Red Flags & Alerts
class RedFlagRuleCreate(BaseModel):
    rule_code: str
    name: str
    description: str
    severity: str = "HIGH"
    required_symptom_keys: List[str]
    additional_conditions: Optional[Dict[str, Any]] = None
    alert_message: str
    action_required: str = "Notify OPD triage nurse and duty physician"

class RedFlagAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    rule_id: Optional[str] = None
    severity: str
    trigger_reason: str
    alert_message: str
    is_acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime

# Doctor Review & Notes
class DoctorNoteCreate(BaseModel):
    note_type: str = "CLINICAL_OBSERVATION"
    content: str

class DoctorNoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    doctor_id: str
    doctor_name: Optional[str] = None
    note_type: str
    content: str
    created_at: datetime.datetime

class DoctorApproveRequest(BaseModel):
    verification_notes: Optional[str] = "Clinical history reviewed and verified by attending physician."
    status: str = "APPROVED"
    edited_symptoms: Optional[List[Dict[str, Any]]] = None
    edited_medications: Optional[List[Dict[str, Any]]] = None

# Audit Log
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: Optional[str] = None
    username: Optional[str] = None
    action: str
    resource_type: str
    resource_id: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime.datetime
