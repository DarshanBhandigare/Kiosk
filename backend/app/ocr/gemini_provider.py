import asyncio
import json
from typing import Any, Dict
from backend.app.ocr.base import BaseOCRProvider

class GeminiOCRProvider(BaseOCRProvider):
    def __init__(self, api_key: str):
        from google import genai
        self.client = genai.Client(api_key=api_key)

    async def extract_text_and_entities(self, file_path: str, mime_type: str, document_type: str = "PRESCRIPTION") -> Dict[str, Any]:
        with open(file_path, "rb") as document_file:
            file_bytes = document_file.read()
        prompt = f'''Transcribe this {document_type} for hospital intake. Read tables and legible handwriting. Return only JSON: {{"raw_text":"faithful visible-text transcription", "entities":[{{"entity_type":"MEDICINE|DOSAGE|LAB_TEST|TEST_RESULT|DOCTOR|DATE|DIAGNOSIS|PROCEDURE", "extracted_key":"label", "extracted_value":"document-supported value", "reference_range":"printed range or null", "is_abnormal":true, "confidence_score":0.0}}]}}. Only extract facts visible in the document. Never infer missing text, diagnoses, medicines, or values. Mark a lab result abnormal only when explicitly flagged or outside the printed reference range. This is for clinician review, never medical advice.'''
        def generate() -> Any:
            from google.genai import types
            return self.client.models.generate_content(model="gemini-2.5-flash", contents=[prompt, types.Part.from_bytes(data=file_bytes, mime_type=mime_type)], config={"response_mime_type": "application/json"})
        response = await asyncio.to_thread(generate)
        try:
            result = json.loads(response.text)
        except (TypeError, json.JSONDecodeError) as error:
            raise RuntimeError("Gemini returned an invalid OCR response.") from error
        raw_text, entities = result.get("raw_text"), result.get("entities")
        if not isinstance(raw_text, str) or not isinstance(entities, list):
            raise RuntimeError("Gemini OCR response was missing text or entities.")
        return {"ocr_status": "COMPLETED", "raw_text": raw_text.strip(), "overall_confidence": 0.95, "entities": self._validate_entities(entities)}

    @staticmethod
    def _validate_entities(entities: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
        allowed = {"MEDICINE", "DOSAGE", "LAB_TEST", "TEST_RESULT", "DOCTOR", "DATE", "DIAGNOSIS", "PROCEDURE"}
        valid = []
        for entity in entities:
            if not isinstance(entity, dict):
                continue
            entity_type = str(entity.get("entity_type", "")).upper()
            key, value = str(entity.get("extracted_key", "")).strip(), str(entity.get("extracted_value", "")).strip()
            if entity_type not in allowed or not key or not value:
                continue
            try:
                confidence = max(0.0, min(1.0, float(entity.get("confidence_score", 0.85))))
            except (TypeError, ValueError):
                confidence = 0.85
            valid.append({"entity_type": entity_type, "extracted_key": key[:255], "extracted_value": value[:255], "reference_range": str(entity["reference_range"])[:100] if entity.get("reference_range") else None, "is_abnormal": bool(entity.get("is_abnormal", False)), "confidence_score": confidence})
        return valid
