from backend.app.speech.base import BaseSpeechProvider
from backend.app.speech.mock_provider import MockSpeechProvider

def get_speech_provider() -> BaseSpeechProvider:
    return MockSpeechProvider()
