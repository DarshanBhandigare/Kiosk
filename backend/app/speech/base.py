from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseSpeechProvider(ABC):
    @abstractmethod
    async def transcribe_audio(self, audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        """Convert recorded audio bytes to text transcription."""
        pass

    @abstractmethod
    async def synthesize_speech(self, text: str, language: str = "en") -> Dict[str, Any]:
        """Convert text prompt to speech audio or synthesis parameters."""
        pass
