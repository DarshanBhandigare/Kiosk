from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import Case, Patient
from backend.app.ai.factory import get_ai_provider

class SummaryService:
    @staticmethod
    async def generate_and_save_summary(db: Session, case_id: str) -> Dict[str, Any]:
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            return {}

        patient = case.patient

        # Build payload for AI provider
        case_data = {
            "patient": {
                "full_name": patient.full_name if patient else "Unknown",
                "age": patient.age if patient else None,
                "sex": patient.sex if patient else "Unspecified",
                "preferred_language": patient.preferred_language if patient else "en"
            },
            "chief_complaint": case.chief_complaint,
            "symptoms": [
                {
                    "name": cs.custom_name or (cs.symptom.name if cs.symptom else "Symptom"),
                    "duration": cs.duration,
                    "severity": cs.severity,
                    "notes": cs.notes
                }
                for cs in case.case_symptoms
            ],
            "medical_histories": [
                {
                    "condition_name": mh.condition_name,
                    "diagnosed_year_or_duration": mh.diagnosed_year_or_duration,
                    "status": mh.status,
                    "is_surgery": mh.is_surgery,
                    "is_hospitalization": mh.is_hospitalization
                }
                for mh in case.medical_histories
            ],
            "medications": [
                {
                    "drug_name": m.drug_name,
                    "dosage": m.dosage,
                    "frequency": m.frequency,
                    "source": m.source
                }
                for m in case.medications
            ],
            "allergies": [
                {
                    "allergen_name": a.allergen_name,
                    "reaction_type": a.reaction_type,
                    "severity": a.severity
                }
                for a in case.allergies
            ],
            "lifestyle": {
                "diet_type": case.lifestyle_info.diet_type if case.lifestyle_info else "Standard",
                "smoking_status": case.lifestyle_info.smoking_status if case.lifestyle_info else "NEVER",
                "alcohol_status": case.lifestyle_info.alcohol_status if case.lifestyle_info else "NEVER",
                "sleep_hours": case.lifestyle_info.sleep_hours if case.lifestyle_info else "N/A"
            },
            "ayurveda": {
                "prakriti": case.ayurveda_profile.prakriti if case.ayurveda_profile else None,
                "vikriti": case.ayurveda_profile.vikriti if case.ayurveda_profile else None,
                "agni": case.ayurveda_profile.agni if case.ayurveda_profile else None,
                "koshta": case.ayurveda_profile.koshta if case.ayurveda_profile else None,
                "sleep_pattern": case.ayurveda_profile.sleep_pattern if case.ayurveda_profile else None,
                "bowel_habits": case.ayurveda_profile.bowel_habits if case.ayurveda_profile else None
            } if case.ayurveda_profile else None,
            "documents": [
                {
                    "document_type": d.document_type,
                    "file_name": d.file_name,
                    "extractions": [
                        {
                            "entity_type": e.entity_type,
                            "extracted_key": e.extracted_key,
                            "extracted_value": e.extracted_value,
                            "reference_range": e.reference_range,
                            "is_abnormal": e.is_abnormal
                        }
                        for e in d.extractions
                    ]
                }
                for d in case.documents
            ],
            "red_flags": [
                f"[{alert.severity}] {alert.alert_message}"
                for alert in case.red_flag_alerts
            ]
        }

        ai_provider = get_ai_provider()
        summary_dict = await ai_provider.generate_doctor_summary(case_data)

        case.ai_summary = summary_dict
        db.commit()

        return summary_dict
