import os

from dotenv import load_dotenv

from backend.app.ocr.base import BaseOCRProvider
from backend.app.ocr.gemini_provider import GeminiOCRProvider
from backend.app.ocr.mock_provider import MockOCRProvider

load_dotenv()


def get_ocr_provider() -> BaseOCRProvider:
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key:
        return GeminiOCRProvider(api_key=gemini_key)
    return MockOCRProvider()
