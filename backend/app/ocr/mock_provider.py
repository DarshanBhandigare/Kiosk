import os
import re
from typing import Dict, Any, List
from backend.app.ocr.base import BaseOCRProvider
from backend.app.ai.mock_provider import MockAIProvider

class MockOCRProvider(BaseOCRProvider):
    """
    Mock & Offline OCR Provider for MediKiosk.
    Parses real plain text files if uploaded or simulates high accuracy OCR extraction
    for realistic Indian OPD medical documents.
    """

    SAMPLE_DOCUMENTS = {
        "PRESCRIPTION": {
            "raw_text": """
CITY MULTISPECIALITY HOSPITAL & RESEARCH CENTRE
OPD CONSULTATION RECORD
Date: 12/01/2026
Doctor: Dr. Arvind Kulkarni, MD, DM (Cardiology)
Reg No: MH-2012-8942
Patient: Ramesh Patil (Male / 54 Years)

Clinical Impression: Essential Hypertension with Borderline Type 2 Diabetes Mellitus

Rx:
1. Tab. Telmisartan 40 mg - 1 tab Once Daily morning (OD) after breakfast
2. Tab. Metformin 500 mg - 1 tab Twice Daily (BD) with meals
3. Tab. Atorvastatin 20 mg - 1 tab At Bedtime (HS)
4. Tab. Pantoprazole 40 mg - 1 tab Early morning empty stomach (OD) x 14 days

Advice: Low salt diet, 30 min daily brisk walk. Follow-up after 1 month with Lipid Profile & HbA1c.
            """,
            "entities": [
                {"entity_type": "DOCTOR", "extracted_key": "Prescribing Physician", "extracted_value": "Dr. Arvind Kulkarni, MD, DM", "reference_range": None, "is_abnormal": False, "confidence_score": 0.98, "verified_by_doctor": False},
                {"entity_type": "DATE", "extracted_key": "Consultation Date", "extracted_value": "12/01/2026", "reference_range": None, "is_abnormal": False, "confidence_score": 0.99, "verified_by_doctor": False},
                {"entity_type": "DIAGNOSIS", "extracted_key": "Documented Impression", "extracted_value": "Essential Hypertension with Borderline Type 2 DM", "reference_range": None, "is_abnormal": False, "confidence_score": 0.92, "verified_by_doctor": False},
                {"entity_type": "MEDICINE", "extracted_key": "Telmisartan", "extracted_value": "40 mg Once Daily (OD)", "reference_range": None, "is_abnormal": False, "confidence_score": 0.96, "verified_by_doctor": False},
                {"entity_type": "MEDICINE", "extracted_key": "Metformin", "extracted_value": "500 mg Twice Daily (BD)", "reference_range": None, "is_abnormal": False, "confidence_score": 0.95, "verified_by_doctor": False},
                {"entity_type": "MEDICINE", "extracted_key": "Atorvastatin", "extracted_value": "20 mg Bedtime (HS)", "reference_range": None, "is_abnormal": False, "confidence_score": 0.94, "verified_by_doctor": False},
                {"entity_type": "MEDICINE", "extracted_key": "Pantoprazole", "extracted_value": "40 mg Once Daily empty stomach", "reference_range": None, "is_abnormal": False, "confidence_score": 0.91, "verified_by_doctor": False}
            ]
        },
        "LAB_REPORT": {
            "raw_text": """
METROPOLIS DIAGNOSTIC PATHOLOGY LAB
COMPREHENSIVE METABOLIC & LIPID REPORT
Sample Collected: 10/01/2026 | Reported: 10/01/2026
Patient: Ramesh Patil (54 Y / M) | Ref By: Dr. Arvind Kulkarni

INVESTIGATION                     RESULT     UNIT       REFERENCE RANGE
Glycated Hemoglobin (HbA1c)       7.8        %          Normal: < 5.7 %, Diabetic: > 6.5 %
Estimated Avg Glucose (eAG)       177        mg/dL      Normal: 70 - 126
Fasting Blood Sugar (FBS)         142        mg/dL      Normal: 70 - 100 (HIGH)
Post Prandial Sugar (PPBS)        210        mg/dL      Normal: < 140 (HIGH)
Serum Creatinine                  1.05       mg/dL      Normal: 0.70 - 1.30
Serum Uric Acid                   5.4        mg/dL      Normal: 3.5 - 7.2
Total Cholesterol                 228        mg/dL      Desirable: < 200 (HIGH)
Serum Triglycerides               195        mg/dL      Normal: < 150 (HIGH)
HDL Cholesterol                   38         mg/dL      Normal: > 40 (LOW)
LDL Cholesterol                   151        mg/dL      Optimal: < 100 (HIGH)
            """,
            "entities": [
                {"entity_type": "LAB_TEST", "extracted_key": "HbA1c", "extracted_value": "7.8 %", "reference_range": "< 5.7 %", "is_abnormal": True, "confidence_score": 0.98, "verified_by_doctor": False},
                {"entity_type": "LAB_TEST", "extracted_key": "Fasting Blood Sugar (FBS)", "extracted_value": "142 mg/dL", "reference_range": "70 - 100 mg/dL", "is_abnormal": True, "confidence_score": 0.97, "verified_by_doctor": False},
                {"entity_type": "LAB_TEST", "extracted_key": "Post Prandial Sugar (PPBS)", "extracted_value": "210 mg/dL", "reference_range": "< 140 mg/dL", "is_abnormal": True, "confidence_score": 0.96, "verified_by_doctor": False},
                {"entity_type": "LAB_TEST", "extracted_key": "Total Cholesterol", "extracted_value": "228 mg/dL", "reference_range": "< 200 mg/dL", "is_abnormal": True, "confidence_score": 0.95, "verified_by_doctor": False},
                {"entity_type": "LAB_TEST", "extracted_key": "Serum Triglycerides", "extracted_value": "195 mg/dL", "reference_range": "< 150 mg/dL", "is_abnormal": True, "confidence_score": 0.94, "verified_by_doctor": False},
                {"entity_type": "LAB_TEST", "extracted_key": "Serum Creatinine", "extracted_value": "1.05 mg/dL", "reference_range": "0.70 - 1.30 mg/dL", "is_abnormal": False, "confidence_score": 0.99, "verified_by_doctor": False},
                {"entity_type": "DATE", "extracted_key": "Report Date", "extracted_value": "10/01/2026", "reference_range": None, "is_abnormal": False, "confidence_score": 0.99, "verified_by_doctor": False}
            ]
        },
        "DISCHARGE_SUMMARY": {
            "raw_text": """
SAHYADRI HOSPITAL - DISCHARGE SUMMARY
IP No: IPD-88219 | Admission: 04/11/2025 | Discharge: 06/11/2025
Patient Name: Ramesh Patil | Age/Sex: 54 / M
Consultant: Dr. Sunil Deshmukh, MS (Ortho)

Final Diagnosis: Right Knee Medial Meniscus Tear
Procedure Done: Right Knee Arthroscopic Debridement and Partial Meniscectomy on 04/11/2025
Course in Hospital: Uneventful post-operative recovery. Mobilized with walker on Day 1.

Discharge Medications:
1. Tab Paracetamol 650 mg - 1 tab TDS after food x 5 days
2. Tab Pantoprazole 40 mg - 1 tab OD empty stomach x 7 days
3. Cap Chymoral Forte - 1 cap TDS before food x 5 days

Advice on Discharge: Quadriceps strengthening exercises. Suture removal on 16/11/2025.
            """,
            "entities": [
                {"entity_type": "DIAGNOSIS", "extracted_key": "Discharge Diagnosis", "extracted_value": "Right Knee Medial Meniscus Tear", "reference_range": None, "is_abnormal": False, "confidence_score": 0.95, "verified_by_doctor": False},
                {"entity_type": "PROCEDURE", "extracted_key": "Surgical Procedure", "extracted_value": "Right Knee Arthroscopic Partial Meniscectomy", "reference_range": None, "is_abnormal": False, "confidence_score": 0.96, "verified_by_doctor": False},
                {"entity_type": "DATE", "extracted_key": "Discharge Date", "extracted_value": "06/11/2025", "reference_range": None, "is_abnormal": False, "confidence_score": 0.98, "verified_by_doctor": False},
                {"entity_type": "MEDICINE", "extracted_key": "Paracetamol", "extracted_value": "650 mg TDS x 5 days", "reference_range": None, "is_abnormal": False, "confidence_score": 0.94, "verified_by_doctor": False},
                {"entity_type": "DOCTOR", "extracted_key": "Treating Surgeon", "extracted_value": "Dr. Sunil Deshmukh, MS (Ortho)", "reference_range": None, "is_abnormal": False, "confidence_score": 0.97, "verified_by_doctor": False}
            ]
        }
    }

    async def extract_text_and_entities(
        self,
        file_path: str,
        mime_type: str,
        document_type: str = "PRESCRIPTION"
    ) -> Dict[str, Any]:
        if not mime_type.startswith("text/"):
            raise RuntimeError("Live OCR is not configured. Set GEMINI_API_KEY to scan PDF and image documents.")

        # If file is text file, read actual text
        real_text = ""
        if os.path.exists(file_path) and mime_type.startswith("text/"):
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    real_text = f.read().strip()
            except Exception:
                pass

        doc_key = document_type.upper() if document_type.upper() in self.SAMPLE_DOCUMENTS else "PRESCRIPTION"
        sample_data = self.SAMPLE_DOCUMENTS[doc_key]

        raw_text = real_text if real_text else sample_data["raw_text"].strip()
        
        # If real text was read, extract entities dynamically with entity heuristics
        if real_text:
            ai_helper = MockAIProvider()
            entities = await ai_helper.extract_entities_from_text(real_text, document_type)
        else:
            entities = sample_data["entities"]

        return {
            "ocr_status": "COMPLETED",
            "raw_text": raw_text,
            "overall_confidence": 0.95,
            "entities": entities
        }

def get_ocr_provider() -> BaseOCRProvider:
    return MockOCRProvider()

