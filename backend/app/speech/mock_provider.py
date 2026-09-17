from typing import Dict, Any
from backend.app.speech.base import BaseSpeechProvider

class MockSpeechProvider(BaseSpeechProvider):
    """
    Multilingual speech provider supporting English, Hindi, and Marathi.
    Provides speech metadata and server-side speech synthesis configuration.
    """

    VOICE_CONFIG = {
        "en": {"voice_name": "Google English (India)", "lang_code": "en-IN", "rate": 0.95},
        "hi": {"voice_name": "Google हिन्दी", "lang_code": "hi-IN", "rate": 0.90},
        "mr": {"voice_name": "Google मराठी", "lang_code": "mr-IN", "rate": 0.90}
    }

    async def transcribe_audio(self, audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        # Default fallback transcript if client-side WebSpeech is bypassed
        defaults = {
            "en": "I have been experiencing chest discomfort and shortness of breath for the last three days.",
            "hi": "मुझे पिछले तीन दिनों से छाती में भारीपन और सांस लेने में तकलीफ हो रही है।",
            "mr": "मला गेल्या तीन दिवसांपासून छातीत जडपणा आणि श्वास घेण्यास त्रास होत आहे."
        }
        lang = language if language in defaults else "en"
        return {
            "status": "SUCCESS",
            "transcript": defaults[lang],
            "confidence": 0.95,
            "language": lang
        }

    async def synthesize_speech(self, text: str, language: str = "en") -> Dict[str, Any]:
        lang = language if language in self.VOICE_CONFIG else "en"
        config = self.VOICE_CONFIG[lang]
        return {
            "status": "SUCCESS",
            "text": text,
            "language": lang,
            "voice_config": config
        }

def get_speech_provider() -> BaseSpeechProvider:
    return MockSpeechProvider()
