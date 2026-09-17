import os
import json
from typing import Dict, Any, List
from backend.app.ai.base import BaseAIProvider
from backend.app.ai.mock_provider import MockAIProvider

class GeminiAIProvider(BaseAIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.mock_fallback = MockAIProvider()
        self.client = None
        try:
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
        except Exception as e:
            print(f"Notice: Google GenAI client initialization note: {e}")

    async def generate_adaptive_followup(
        self,
        chief_complaint: str,
        answered_questions: List[Dict[str, Any]],
        language: str = "en"
    ) -> Dict[str, Any]:
        if not self.client:
            return await self.mock_fallback.generate_adaptive_followup(chief_complaint, answered_questions, language)
        
        prompt = f"""
You are MediKiosk AI, an accessible hospital OPD case-taking assistant.
Language: {language} (use simple, empathetic, patient-friendly phrasing in English, Hindi, or Marathi).
Chief Complaint: {chief_complaint}
Answered Questions So Far: {json.dumps(answered_questions, ensure_ascii=False)}

CRITICAL SAFETY RULES:
1. NEVER provide medical advice, diagnosis, or medication recommendations.
2. Formulate 1 single helpful clinical follow-up question regarding symptom onset, duration, severity, location, or associated symptoms.
3. If at least 3-4 key questions are answered or enough information is gathered, set "has_next": false.
4. Output MUST be strictly valid JSON matching this schema:
{{
  "has_next": true/false,
  "question_key": "unique_short_string",
  "question_text": "Translated question for patient",
  "category": "DURATION|SEVERITY|ASSOCIATED_SYMPTOMS|COMPLETE",
  "input_type": "CHOICE|SLIDER|VOICE_OR_TOUCH",
  "options": ["Option 1", "Option 2", "Option 3"] or null
}}
"""
        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            return data
        except Exception as err:
            print(f"Gemini API fallback invoked: {err}")
            return await self.mock_fallback.generate_adaptive_followup(chief_complaint, answered_questions, language)

    async def extract_entities_from_text(
        self,
        raw_text: str,
        document_type: str = "PRESCRIPTION"
    ) -> List[Dict[str, Any]]:
        if not self.client:
            return await self.mock_fallback.extract_entities_from_text(raw_text, document_type)
        
        prompt = f"""
Extract medical entities from the following OCR text of a {document_type}.
Extract ONLY facts explicitly mentioned in the text. Do NOT fabricate or assume missing values.

Raw Text:
{raw_text}

Output MUST be strictly valid JSON list of entities matching this schema:
[
  {{
    "entity_type": "MEDICINE|DOSAGE|LAB_TEST|TEST_RESULT|DOCTOR|DATE|DIAGNOSIS",
    "extracted_key": "Entity name e.g. Metformin or HbA1c",
    "extracted_value": "Entity value e.g. 500mg BD or 7.2%",
    "reference_range": "Normal range if lab test, otherwise null",
    "is_abnormal": true/false,
    "confidence_score": 0.95,
    "verified_by_doctor": false
  }}
]
"""
        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            if isinstance(data, list):
                return data
            elif isinstance(data, dict) and "entities" in data:
                return data["entities"]
            return await self.mock_fallback.extract_entities_from_text(raw_text, document_type)
        except Exception as err:
            print(f"Gemini entity extraction fallback: {err}")
            return await self.mock_fallback.extract_entities_from_text(raw_text, document_type)

    async def generate_doctor_summary(
        self,
        case_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        if not self.client:
            return await self.mock_fallback.generate_doctor_summary(case_data)
        
        prompt = f"""
Synthesize a structured clinical pre-consultation case summary for the attending doctor from this collected patient information:
{json.dumps(case_data, ensure_ascii=False)}

CRITICAL RULES:
1. Clearly distinguish Patient-Reported facts from Document-Extracted findings.
2. NEVER formulate a diagnosis or prescribe medication.
3. Highlight potential red flags and missing information that the doctor should verify.
4. Output MUST be valid JSON with keys:
"ai_disclaimer", "patient_overview", "chief_complaint", "patient_reported_symptoms", "past_medical_history", "current_medications", "reported_allergies", "document_extracted_findings", "red_flag_concerns", "ayurveda_parameters", "lifestyle_context", "suggested_doctor_clarifications".
"""
        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as err:
            print(f"Gemini doctor summary fallback: {err}")
            return await self.mock_fallback.generate_doctor_summary(case_data)
