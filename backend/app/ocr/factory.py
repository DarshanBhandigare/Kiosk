from backend.app.ocr.base import BaseOCRProvider
from backend.app.ocr.mock_provider import MockOCRProvider

def get_ocr_provider() -> BaseOCRProvider:
    return MockOCRProvider()
