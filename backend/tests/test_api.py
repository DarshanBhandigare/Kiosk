import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.services.seed_data import seed_database

@pytest.fixture(autouse=True, scope="session")
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["diagnosis_disabled"] is True

def test_doctor_login():
    response = client.post("/api/auth/login", data={"username": "dr.sharma", "password": "Doctor@123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "doctor"

def test_patient_registration_and_kiosk_flow():
    # 1. Register Patient
    patient_res = client.post("/api/patients", json={
        "full_name": "Vijay Gaikwad",
        "age": 48,
        "sex": "Male",
        "contact_number": "+91 98223 99887",
        "preferred_language": "hi",
        "abha_id": "91-1122-3344-5566"
    })
    assert patient_res.status_code == 200
    p_data = patient_res.json()
    patient_id = p_data["id"]

    # 2. Record Consent
    consent_res = client.post(f"/api/patients/{patient_id}/consent", json={
        "patient_id": patient_id,
        "consent_given": True,
        "consent_version": "v1.0"
    })
    assert consent_res.status_code == 200

    # 3. Create Kiosk Session
    session_res = client.post("/api/sessions", json={
        "language": "hi",
        "patient_id": patient_id
    })
    assert session_res.status_code == 200
    session_id = session_res.json()["id"]

    # 4. Adaptive Interview
    start_q = client.post(f"/api/interview/start?session_id={session_id}&chief_complaint=Chest pain and breathlessness&language=hi")
    assert start_q.status_code == 200
    q_data = start_q.json()
    assert q_data["has_next"] is True

    ans_res = client.post("/api/interview/answer", json={
        "session_id": session_id,
        "question_key": q_data["question_key"] or "duration",
        "question_text": q_data["question_text"] or "Duration",
        "response_text": "3 days",
        "language": "hi",
        "input_mode": "VOICE"
    })
    assert ans_res.status_code == 200

    # 5. Create Case with Red Flag
    case_res = client.post("/api/cases", json={
        "patient_id": patient_id,
        "session_id": session_id,
        "chief_complaint": "Severe retrosternal chest pain with left arm radiation",
        "department": "Cardiology",
        "symptoms": [
            {"name": "Chest Pain", "duration": "3 days", "severity": 8, "is_primary": True}
        ],
        "medications": [
            {"drug_name": "Amlodipine", "dosage": "5mg", "frequency": "OD"}
        ]
    })
    assert case_res.status_code == 200
    c_data = case_res.json()
    assert "token_number" in c_data
    assert c_data["has_red_flag"] is True
    assert c_data["assigned_doctor_name"] == "Dr. Arvind Kulkarni, DM"

    # 6. Retrieve Case Details
    case_id = c_data["id"]
    detail_res = client.get(f"/api/cases/{case_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["chief_complaint"] == "Severe retrosternal chest pain with left arm radiation"
    assert len(detail_data["timeline"]) > 0
    assert detail_data["ai_summary"] is not None
    assert detail_data["assignment"]["specialty"] == "Cardiology"

def test_document_upload_and_ocr():
    # Fetch patient 1
    patients = client.get("/api/cases").json()
    patient_id = patients[0]["patient_id"]
    case_id = patients[0]["id"]

    # Mock file upload
    file_content = b"Tab Telmisartan 40mg OD\nTab Metformin 500mg BD\nDr. Arvind Kulkarni\nDate: 12/01/2026"
    files = {"file": ("prescription.txt", file_content, "text/plain")}
    data = {"patient_id": patient_id, "case_id": case_id, "document_type": "PRESCRIPTION"}
    
    upload_res = client.post("/api/documents/upload", data=data, files=files)
    assert upload_res.status_code == 200
    doc_data = upload_res.json()
    assert doc_data["ocr_status"] == "COMPLETED"
    assert len(doc_data["extractions"]) > 0

def test_doctor_review_and_approval():
    # Login as doctor
    login_res = client.post("/api/auth/login", data={"username": "dr.sharma", "password": "Doctor@123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get case
    cases = client.get("/api/cases").json()
    case_id = cases[0]["id"]

    # Add note
    note_res = client.post(
        f"/api/doctor/cases/{case_id}/notes",
        json={"note_type": "CLINICAL_OBSERVATION", "content": "Patient evaluated. ECG requested urgently."},
        headers=headers
    )
    assert note_res.status_code == 200

    # Approve case
    approve_res = client.post(
        f"/api/doctor/cases/{case_id}/approve",
        json={"verification_notes": "Clinical history verified and approved for OPD consultation.", "status": "APPROVED"},
        headers=headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["case_status"] == "APPROVED"

def test_ayurveda_endpoints():
    cases = client.get("/api/cases").json()
    case_id = cases[0]["id"]

    # Save Ayurveda Profile
    save_res = client.post(
        f"/api/ayurveda/case/{case_id}",
        json={
            "prakriti": "Vata-Pitta",
            "agni": "Vishama Agni",
            "sleep_pattern": "Interrupted",
            "notes": "Prone to dryness and hyperacidity."
        }
    )
    assert save_res.status_code == 200

    # Retrieve Ayurveda Profile
    get_res = client.get(f"/api/ayurveda/case/{case_id}")
    assert get_res.status_code == 200
    assert get_res.json()["prakriti"] == "Vata-Pitta"

def test_abdm_verify():
    response = client.post("/api/abdm/verify-abha", json={"abha_id": "91-8842-1920-5412"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VERIFIED"
    assert data["full_name"] == "Ramesh Patil"
    assert data["is_mock"] is True


def test_abdm_verify_rejects_unknown_demo_id():
    response = client.post("/api/abdm/verify-abha", json={"abha_id": "91-0000-0000-0000"})
    assert response.status_code == 404


def test_case_tokens_increment_from_highest_existing_token():
    existing_tokens = {case["token_number"] for case in client.get("/api/cases").json()}
    patient_id = client.get("/api/cases").json()[0]["patient_id"]
    payload = {
        "patient_id": patient_id,
        "chief_complaint": "Follow-up consultation",
        "symptoms": []
    }

    first_case = client.post("/api/cases", json=payload)
    second_case = client.post("/api/cases", json=payload)

    assert first_case.status_code == 200
    assert second_case.status_code == 200
    first_token = first_case.json()["token_number"]
    second_token = second_case.json()["token_number"]
    assert first_token not in existing_tokens
    assert second_token not in existing_tokens
    assert first_token != second_token


def test_staff_can_triage_and_escalate_live_cases():
    login_response = client.post("/api/auth/login", data={"username": "staff.priya", "password": "Staff@123"})
    assert login_response.status_code == 200
    headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}
    cases = client.get("/api/cases").json()
    normal_case = next(case for case in cases if not case["has_red_flag"])
    urgent_case = next(case for case in cases if case["has_red_flag"])

    triage_response = client.post(f"/api/triage/cases/{normal_case['id']}/mark-triaged", headers=headers)
    escalate_response = client.post(f"/api/triage/cases/{urgent_case['id']}/escalate", headers=headers)

    assert triage_response.status_code == 200
    assert triage_response.json()["case_status"] == "TRIAGED"
    assert escalate_response.status_code == 200
    assert escalate_response.json()["case_status"] == "UNDER_REVIEW"
