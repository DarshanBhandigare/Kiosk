import datetime
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Role, User, Symptom, RedFlagRule, Patient, PatientConsent,
    Case, CaseSymptom, MedicalHistory, Medication, Allergy,
    FamilyHistory, LifestyleInformation, AyurvedaProfile,
    Document, DocumentExtraction, MedicalTimelineEvent,
    RedFlagAlert, DoctorNote, InterviewQuestion
)
from backend.app.security.auth import get_password_hash
from backend.app.services.red_flag_engine import DEFAULT_RULES

def seed_database(db: Session):
    # 1. Seed Roles
    roles = {
        "admin": "System Administrator with full configuration permissions",
        "doctor": "Attending Physician with clinical case review and approval permissions",
        "staff": "OPD Triage Nurse / Reception Desk Staff",
        "patient": "Kiosk Patient Role"
    }
    role_map = {}
    for r_name, r_desc in roles.items():
        role = db.query(Role).filter(Role.name == r_name).first()
        if not role:
            role = Role(name=r_name, description=r_desc)
            db.add(role)
            db.flush()
        role_map[r_name] = role

    # 2. Seed Users
    default_users = [
        {
            "username": "dr.sharma",
            "email": "dr.sharma@medikiosk.in",
            "password": "Doctor@123",
            "full_name": "Dr. Anjali Sharma, MD",
            "department": "Internal Medicine / OPD",
            "role": "doctor"
        },
        {
            "username": "dr.kulkarni",
            "email": "dr.kulkarni@medikiosk.in",
            "password": "Doctor@123",
            "full_name": "Dr. Arvind Kulkarni, DM",
            "department": "Cardiology",
            "role": "doctor"
        },
        {
            "username": "dr.vaidya",
            "email": "dr.vaidya@medikiosk.in",
            "password": "Doctor@123",
            "full_name": "Dr. Rajesh Vaidya, BAMS",
            "department": "Ayurveda Consultation",
            "role": "doctor"
        },
        {
            "username": "dr.mehta",
            "email": "dr.mehta@medikiosk.in",
            "password": "Doctor@123",
            "full_name": "Dr. Neha Mehta, DM",
            "department": "Neurology",
            "role": "doctor"
        },
        {
            "username": "dr.khan",
            "email": "dr.khan@medikiosk.in",
            "password": "Doctor@123",
            "full_name": "Dr. Farah Khan, MD",
            "department": "Pulmonology",
            "role": "doctor"
        },
        {
            "username": "dr.iyer",
            "email": "dr.iyer@medikiosk.in",
            "password": "Doctor@123",
            "full_name": "Dr. Vikram Iyer, MS",
            "department": "Orthopaedics",
            "role": "doctor"
        },
        {
            "username": "staff.priya",
            "email": "staff.priya@medikiosk.in",
            "password": "Staff@123",
            "full_name": "Priya Deshpande, RN",
            "department": "OPD Triage & Reception",
            "role": "staff"
        },
        {
            "username": "admin",
            "email": "admin@medikiosk.in",
            "password": "Admin@123",
            "full_name": "MediKiosk Administrator",
            "department": "Hospital IT & Systems",
            "role": "admin"
        }
    ]

    for u_info in default_users:
        user = db.query(User).filter(User.username == u_info["username"]).first()
        if not user:
            user = User(
                username=u_info["username"],
                email=u_info["email"],
                hashed_password=get_password_hash(u_info["password"]),
                full_name=u_info["full_name"],
                department=u_info["department"],
                role_id=role_map[u_info["role"]].id,
                is_active=True
            )
            db.add(user)

    # 3. Seed Red Flag Rules
    for r_data in DEFAULT_RULES:
        rule = db.query(RedFlagRule).filter(RedFlagRule.rule_code == r_data["rule_code"]).first()
        if not rule:
            rule = RedFlagRule(**r_data)
            db.add(rule)

    # 4. Seed Standard Symptoms
    standard_symptoms = [
        {"name": "Chest Pain", "category": "Cardiovascular", "translations": {"hi": "छाती में दर्द", "mr": "छातीत दुखणे"}, "is_red_flag_candidate": True},
        {"name": "Shortness of Breath", "category": "Respiratory", "translations": {"hi": "सांस लेने में तकलीफ", "mr": "श्वास घेण्यास त्रास"}, "is_red_flag_candidate": True},
        {"name": "Chronic Cough", "category": "Respiratory", "translations": {"hi": "लगातार खांसी", "mr": "दीर्घकालीन खोकला"}, "is_red_flag_candidate": False},
        {"name": "High Fever", "category": "General", "translations": {"hi": "तेज बुखार", "mr": "तीव्र ताप"}, "is_red_flag_candidate": True},
        {"name": "Severe Headache", "category": "Neurological", "translations": {"hi": "गंभीर सिरदर्द", "mr": "तीव्र डोकेदुखी"}, "is_red_flag_candidate": True},
        {"name": "Abdominal Pain", "category": "Gastrointestinal", "translations": {"hi": "पेट में दर्द", "mr": "पोटात दुखणे"}, "is_red_flag_candidate": True},
        {"name": "Knee Joint Pain", "category": "Musculoskeletal", "translations": {"hi": "घुटनों में दर्द", "mr": "गुडघेदुखी"}, "is_red_flag_candidate": False},
        {"name": "Acid Reflux / Burning", "category": "Gastrointestinal", "translations": {"hi": "सीने में जलन / एसिडिटी", "mr": "छातीत जळजळ / आम्लपित्त"}, "is_red_flag_candidate": False},
        {"name": "Dizziness / Vertigo", "category": "Neurological", "translations": {"hi": "चक्कर आना", "mr": "चक्कर येणे"}, "is_red_flag_candidate": False}
    ]

    for sym in standard_symptoms:
        s = db.query(Symptom).filter(Symptom.name == sym["name"]).first()
        if not s:
            s = Symptom(**sym)
            db.add(s)

    # 5. Seed Demo Clinical Patients & Cases
    existing_patient = db.query(Patient).filter(Patient.patient_id_number == "PAT-2026-001").first()
    if not existing_patient:
        # Patient 1: Ramesh Patil (Cardiology Case with Red Flag)
        p1 = Patient(
            patient_id_number="PAT-2026-001",
            abha_id="91-8842-1920-5412",
            full_name="Ramesh Patil",
            age=54,
            sex="Male",
            contact_number="+91 98220 11223",
            emergency_contact="Sunita Patil (+91 98220 11224)",
            preferred_language="mr",
            address="Shivaji Nagar, Pune, Maharashtra"
        )
        db.add(p1)
        db.flush()

        c1_consent = PatientConsent(
            patient_id=p1.id,
            consent_given=True,
            consent_version="v1.0",
            ip_or_kiosk_id="KIOSK-01"
        )
        db.add(c1_consent)

        case1 = Case(
            patient_id=p1.id,
            token_number="T-101",
            chief_complaint="Chest tightness and heaviness spreading to left arm with mild breathlessness",
            hpi_summary="Patient reports gradual onset retrosternal chest tightness for 3 days, increasing on walking. Severity 7/10.",
            department="Cardiology",
            status="WAITING_REVIEW",
            has_red_flag=True,
            red_flag_severity="CRITICAL",
            ai_summary={
                "ai_disclaimer": "AI-Assisted Intake Summary. Prepared solely for attending physician review. Does NOT constitute a clinical diagnosis or treatment prescription.",
                "patient_overview": "Ramesh Patil, 54 y/o Male, Preferred Language: MARATHI (MR).",
                "chief_complaint": "Chest tightness and heaviness spreading to left arm with mild breathlessness",
                "patient_reported_symptoms": ["Chest Pain / Tightness (Duration: 3 days, Severity: 7/10)", "Shortness of Breath on Exertion"],
                "past_medical_history": ["Essential Hypertension (Diagnosed 5 years ago)", "Borderline Type 2 Diabetes Mellitus (Diagnosed 2 years ago)"],
                "current_medications": ["Telmisartan 40mg Once Daily (OD)", "Metformin 500mg Twice Daily (BD)", "Atorvastatin 20mg Bedtime (HS)"],
                "reported_allergies": ["No known drug allergies reported"],
                "document_extracted_findings": ["Prescription by Dr. Arvind Kulkarni (Telmisartan, Metformin, Atorvastatin)", "Pathology Lipid Profile: HbA1c 7.8% (HIGH), Total Cholesterol 228 mg/dL (HIGH)"],
                "red_flag_concerns": ["[CRITICAL] RF001: Potential Acute Coronary Syndrome. Chest tightness with left arm radiation."],
                "lifestyle_context": "Diet: Vegetarian, Smoking: FORMER, Alcohol: NEVER, Sleep: 6 hours",
                "suggested_doctor_clarifications": ["Urgent ECG triage", "Verify timing of last anti-hypertensive dose"]
            }
        )
        db.add(case1)
        db.flush()

        cs1 = CaseSymptom(case_id=case1.id, custom_name="Chest Pain & Tightness", duration="3 days", severity=7, body_location="Retrosternal / Left chest", is_primary=True)
        cs2 = CaseSymptom(case_id=case1.id, custom_name="Shortness of Breath", duration="2 days", severity=6, body_location="Chest", is_primary=False)
        db.add_all([cs1, cs2])

        mh1 = MedicalHistory(case_id=case1.id, condition_name="Hypertension", diagnosed_year_or_duration="5 years", status="ACTIVE")
        mh2 = MedicalHistory(case_id=case1.id, condition_name="Type 2 Diabetes Mellitus", diagnosed_year_or_duration="2 years", status="ACTIVE")
        db.add_all([mh1, mh2])

        m1 = Medication(case_id=case1.id, drug_name="Telmisartan", dosage="40mg", frequency="OD morning", prescribed_by="Dr. Arvind Kulkarni")
        m2 = Medication(case_id=case1.id, drug_name="Metformin", dosage="500mg", frequency="BD with meals", prescribed_by="Dr. Arvind Kulkarni")
        m3 = Medication(case_id=case1.id, drug_name="Atorvastatin", dosage="20mg", frequency="HS night", prescribed_by="Dr. Arvind Kulkarni")
        db.add_all([m1, m2, m3])

        life1 = LifestyleInformation(case_id=case1.id, diet_type="Vegetarian", smoking_status="FORMER", alcohol_status="NEVER", physical_activity="SEDENTARY", sleep_hours="6 hours")
        db.add(life1)

        alert1 = RedFlagAlert(
            case_id=case1.id,
            severity="CRITICAL",
            trigger_reason="Triggered by symptom match [chest, pain, radiat] with severity level 7/10",
            alert_message="CRITICAL: Patient reports severe chest discomfort with potential ischemic features. Immediate OPD triage nurse & duty physician evaluation required."
        )
        db.add(alert1)

        # Timeline events for Patient 1
        t1 = MedicalTimelineEvent(patient_id=p1.id, case_id=case1.id, event_date="2026-09-17", event_type="CONSULTATION", title="OPD Case Intake (Current Visit)", description="Chest tightness spreading to left arm", source="PATIENT_REPORTED", confidence="HIGH", verified=False)
        t2 = MedicalTimelineEvent(patient_id=p1.id, case_id=case1.id, event_date="2026-01-12", event_type="PRESCRIPTION", title="Prescription - Dr. Arvind Kulkarni", description="Telmisartan 40mg, Metformin 500mg, Atorvastatin 20mg", source="DOCUMENT_EXTRACTED", confidence="HIGH", verified=True)
        t3 = MedicalTimelineEvent(patient_id=p1.id, case_id=case1.id, event_date="2026-01-10", event_type="LAB_TEST", title="Lipid & Glycemic Profile - Metropolis Lab", description="HbA1c 7.8% (HIGH), Fasting Sugar 142 mg/dL (HIGH), Cholesterol 228 mg/dL", source="DOCUMENT_EXTRACTED", confidence="HIGH", verified=True)
        t4 = MedicalTimelineEvent(patient_id=p1.id, case_id=case1.id, event_date="2021-04-10", event_type="REPORTED_ILLNESS", title="Hypertension Diagnosis", description="Diagnosed approx. 5 years ago. On regular medications.", source="PATIENT_REPORTED", confidence="HIGH", verified=True)
        db.add_all([t1, t2, t3, t4])

        # Patient 2: Sunita Deshmukh (Ayurveda OPD Consultation)
        p2 = Patient(
            patient_id_number="PAT-2026-002",
            abha_id="91-9921-4412-8801",
            full_name="Sunita Deshmukh",
            age=42,
            sex="Female",
            contact_number="+91 97654 33211",
            preferred_language="hi",
            address="Kothrud, Pune, Maharashtra"
        )
        db.add(p2)
        db.flush()

        case2 = Case(
            patient_id=p2.id,
            token_number="T-102",
            chief_complaint="Severe acidity, retrosternal burning after meals and disturbed sleep",
            hpi_summary="Chronic acid reflux and burning sensation in upper abdomen and chest for 4 weeks. Worse with spicy food.",
            department="Ayurveda Consultation",
            status="WAITING_REVIEW",
            has_red_flag=False,
            ai_summary={
                "ai_disclaimer": "AI-Assisted Intake Summary. Prepared solely for attending physician review.",
                "patient_overview": "Sunita Deshmukh, 42 y/o Female, Language: HINDI (HI).",
                "chief_complaint": "Severe acidity, retrosternal burning after meals and disturbed sleep",
                "patient_reported_symptoms": ["Retrosternal Burning / Acidity (Duration: 4 weeks, Severity: 5/10)", "Nausea early morning"],
                "past_medical_history": ["Mild Gastritis (Diagnosed 1 year ago)"],
                "current_medications": ["Pantoprazole 40mg SOS"],
                "reported_allergies": ["No allergies"],
                "ayurveda_parameters": {"prakriti": "Pitta-Vata", "agni": "Tikshna / Vishama Agni", "sleep": "Disturbed", "appetite": "Irregular"},
                "lifestyle_context": "Diet: Vegetarian with occasional spicy food, Sleep: 5-6 hours irregular",
                "suggested_doctor_clarifications": ["Evaluate dietary triggers (Ahara / Vihara)", "Assess Agni & Pitta vitiation"]
            }
        )
        db.add(case2)
        db.flush()

        ayur2 = AyurvedaProfile(
            case_id=case2.id,
            prakriti="Pitta-Vata",
            vikriti="Pitta Pradhana Amlapitta",
            agni="Tikshna Agni",
            koshta="Madhyama",
            sleep_pattern="Disturbed (awakes around 2 AM)",
            appetite="Irregular with burning",
            bowel_habits="Constipation tendency",
            notes="Patient reports high stress and late dinners."
        )
        db.add(ayur2)

        t2_1 = MedicalTimelineEvent(patient_id=p2.id, case_id=case2.id, event_date="2026-09-17", event_type="CONSULTATION", title="Ayurveda OPD Case Intake", description="Amlapitta and acid reflux symptoms", source="PATIENT_REPORTED", confidence="HIGH", verified=False)
        db.add(t2_1)

    db.commit()
