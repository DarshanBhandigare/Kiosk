export class SpeechService {
  private static recognition: any = null;

  static isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  static getRecognitionErrorMessage(error: unknown): string {
    const errorCode = typeof error === 'string'
      ? error
      : (error as { error?: string; name?: string })?.error || (error as { name?: string })?.name;

    switch (errorCode) {
      case 'not-allowed':
      case 'service-not-allowed':
      case 'NotAllowedError':
      case 'SecurityError':
        return 'Microphone permission blocked. Click the lock 🔒 or microphone 🎙️ icon in your browser address bar to allow access.';
      case 'no-speech':
        return 'No speech was detected. Speak clearly into the microphone or use the quick buttons below.';
      case 'audio-capture':
      case 'NotFoundError':
        return 'No microphone found. Please plug in or enable a microphone in Windows Sound Settings.';
      case 'NotReadableError':
        return 'Microphone is currently in use by another program. Close other apps using your mic.';
      case 'network':
        return 'Browser speech recognition requires an internet connection. Check your network or use touch/keyboard options.';
      case 'language-not-supported':
      case 'language-unavailable':
        return 'Speech recognition is not available for this language in this browser. Try English or Hindi.';
      case 'aborted':
        return '';
      default:
        return 'Microphone listening stopped. You can click to retry or choose an option below.';
    }
  }

  static startListening(
    language: 'en' | 'hi' | 'mr',
    onResult: (text: string) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ) {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return null;
    }

    // Stop any previously running instance
    this.stopListening();

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      const langMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN'
      };
      rec.lang = langMap[language] || 'en-IN';

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          onResult(transcript);
        }
      };

      rec.onerror = (event: any) => {
        if (event.error !== 'aborted') {
          onError(event.error || event);
        }
      };

      rec.onend = () => {
        this.recognition = null;
        onEnd();
      };

      rec.start();
      this.recognition = rec;
      return rec;
    } catch (e) {
      onError(e);
      return null;
    }
  }

  static stopListening() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }
  }

  static speak(text: string, language: 'en' | 'hi' | 'mr') {
    if (!this.isSpeechSynthesisSupported() || !text) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN'
      };
      utterance.lang = langMap[language] || 'en-IN';
      // Attempt to select a native voice for the language
      const voices = window.speechSynthesis.getVoices() || [];
      if (voices.length) {
        const langCode = utterance.lang;
        // Find voice matching language code (exact or prefix)
        const voice = voices.find(v => v.lang.startsWith(langCode));
        if (voice) {
          utterance.voice = voice;
        }
      }
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  static cancelSpeech() {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}
