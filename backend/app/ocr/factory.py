import os
from pathlib import Path

from dotenv import load_dotenv

from backend.app.ocr.base import BaseOCRProvider
from backend.app.ocr.gemini_provider import GeminiOCRProvider
from backend.app.ocr.mock_provider import MockOCRProvider

load_dotenv(Path(__file__).resolve().parents[3] / ".env")


def get_ocr_provider() -> BaseOCRProvider:
    if os.getenv("OCR_PROVIDER", "gemini").strip().lower() == "mock":
        return MockOCRProvider()
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key and not gemini_key.startswith("REPLACE_WITH_"):
        return GeminiOCRProvider(api_key=gemini_key)
    return MockOCRProvider()
