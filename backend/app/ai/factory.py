import os
from backend.app.ai.base import BaseAIProvider
from backend.app.ai.gemini_provider import GeminiAIProvider
from backend.app.ai.mock_provider import MockAIProvider

def get_ai_provider() -> BaseAIProvider:
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key:
        try:
            return GeminiAIProvider(api_key=gemini_key)
        except Exception as e:
            print(f"Warning: Could not initialize Gemini provider ({e}), using MockAIProvider")
    return MockAIProvider()
