from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseOCRProvider(ABC):
    @abstractmethod
    async def extract_text_and_entities(
        self,
        file_path: str,
        mime_type: str,
        document_type: str = "PRESCRIPTION"
    ) -> Dict[str, Any]:
        """
        Process medical document image/PDF, return raw text, OCR confidence, and extracted entities.
        """
        pass
