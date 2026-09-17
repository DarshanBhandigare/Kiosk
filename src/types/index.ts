export type RoleType = 'doctor' | 'staff' | 'admin' | 'patient';

export interface User {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  role_name: RoleType;
  department?: string;
  is_active: boolean;
}

export interface Patient {
  id: string;
  patient_id_number: string;
  abha_id?: string;
  full_name: string;
  age?: number;
  sex: string;
  contact_number?: string;
  emergency_contact?: string;
  preferred_language: 'en' | 'hi' | 'mr';
  address?: string;
}

export interface SymptomItem {
  id?: string;
  name: string;
  custom_name?: string;
  duration?: string;
  severity?: number;
  body_location?: string;
  notes?: string;
  is_primary?: boolean;
}

export interface MedicalHistoryItem {
  id?: string;
  condition_name: string;
  diagnosed_year_or_duration?: string;
  status?: string;
  is_surgery?: boolean;
  is_hospitalization?: boolean;
  source?: string;
  notes?: string;
}

export interface MedicationItem {
  id?: string;
  drug_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  prescribed_by?: string;
  is_current?: boolean;
  source?: string;
  verified?: boolean;
  notes?: string;
}

export interface AllergyItem {
  id?: string;
  allergen_name: string;
  reaction_type?: string;
  severity?: string;
  source?: string;
}

export interface FamilyHistoryItem {
  id?: string;
  relation: string;
  condition_name: string;
  notes?: string;
}

export interface LifestyleInfo {
  diet_type?: string;
  smoking_status?: string;
  alcohol_status?: string;
  physical_activity?: string;
  sleep_hours?: string;
  occupation?: string;
}

export interface AyurvedaProfile {
  id?: string;
  prakriti?: string;
  vikriti?: string;
  agni?: string;
  koshta?: string;
  sleep_pattern?: string;
  appetite?: string;
  bowel_habits?: string;
  notes?: string;
}

export interface DocumentExtraction {
  id: string;
  entity_type: 'MEDICINE' | 'DOSAGE' | 'LAB_TEST' | 'TEST_RESULT' | 'DOCTOR' | 'DATE' | 'DIAGNOSIS' | 'PROCEDURE';
  extracted_key: string;
  extracted_value: string;
  reference_range?: string;
  is_abnormal?: boolean;
  confidence_score?: number;
  verified_by_doctor?: boolean;
}

export interface MedicalDocument {
  id: string;
  document_type: 'PRESCRIPTION' | 'LAB_REPORT' | 'DISCHARGE_SUMMARY' | 'OTHER';
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  ocr_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  ocr_raw_text?: string;
  uploaded_at: string;
  extractions: DocumentExtraction[];
}

export interface TimelineEvent {
  id: string;
  event_date: string;
  event_type: 'CONSULTATION' | 'HOSPITALIZATION' | 'MEDICATION' | 'LAB_TEST' | 'PROCEDURE' | 'PRESCRIPTION' | 'REPORTED_ILLNESS';
  title: string;
  description?: string;
  source: 'PATIENT_REPORTED' | 'DOCUMENT_EXTRACTED' | 'HMIS_SYNC';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCERTAIN_DATE';
  verified: boolean;
  created_at: string;
}

export interface RedFlagAlert {
  id: string;
  case_id: string;
  rule_id?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  trigger_reason: string;
  alert_message: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  created_at: string;
}

export interface DoctorNote {
  id: string;
  doctor_name: string;
  note_type: string;
  content: string;
  created_at: string;
}

export interface DoctorReview {
  id: string;
  doctor_name: string;
  status: string;
  verification_notes?: string;
  reviewed_at: string;
}

export interface AISummary {
  ai_disclaimer: string;
  patient_overview: string;
  chief_complaint: string;
  patient_reported_symptoms: string[];
  past_medical_history: string[];
  current_medications: string[];
  reported_allergies: string[];
  document_extracted_findings: string[];
  red_flag_concerns: string[];
  ayurveda_parameters?: Record<string, any>;
  lifestyle_context?: string;
  suggested_doctor_clarifications: string[];
}

export interface CaseDetails {
  id: string;
  token_number: string;
  patient: Patient;
  chief_complaint: string;
  hpi_summary?: string;
  department: string;
  assignment?: {
    doctor_id: string;
    doctor_name: string;
    specialty: string;
    routing_reason: string;
  } | null;
  assigned_doctor_name?: string;
  assigned_specialty?: string;
  routing_reason?: string;
  status: 'WAITING_REVIEW' | 'TRIAGED' | 'UNDER_REVIEW' | 'APPROVED' | 'COMPLETED';
  has_red_flag: boolean;
  red_flag_severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  ai_summary?: AISummary;
  symptoms: SymptomItem[];
  medical_histories: MedicalHistoryItem[];
  medications: MedicationItem[];
  allergies: AllergyItem[];
  family_histories: FamilyHistoryItem[];
  lifestyle?: LifestyleInfo;
  ayurveda?: AyurvedaProfile;
  documents: MedicalDocument[];
  timeline: TimelineEvent[];
  alerts: RedFlagAlert[];
  doctor_notes: DoctorNote[];
  doctor_reviews: DoctorReview[];
  created_at: string;
  submitted_at?: string;
  reviewed_at?: string;
}

export interface QueueItem {
  id: string;
  token_number: string;
  patient_id: string;
  patient_name: string;
  patient_age?: number;
  patient_sex?: string;
  patient_id_number?: string;
  chief_complaint: string;
  department: string;
  assigned_doctor_name?: string;
  assigned_specialty?: string;
  routing_reason?: string;
  status: string;
  has_red_flag: boolean;
  red_flag_severity?: string;
  created_at: string;
  submitted_at?: string;
}
