from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_adaptive_followup(
        self,
        chief_complaint: str,
        answered_questions: List[Dict[str, Any]],
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Generate the next relevant clinical follow-up question or signal interview completion.
        Must NEVER diagnose or prescribe.
        """
        pass

    @abstractmethod
    async def extract_entities_from_text(
        self,
        raw_text: str,
        document_type: str = "PRESCRIPTION"
    ) -> List[Dict[str, Any]]:
        """
        Extract structured medical entities (Medicines, Dosages, Lab Tests, Values) from raw OCR text.
        Must only extract facts explicitly present in the text.
        """
        pass

    @abstractmethod
    async def generate_doctor_summary(
        self,
        case_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Synthesize a structured clinical pre-consultation summary for the attending doctor.
        Distinguishes patient-reported from document-extracted information.
        """
        pass
