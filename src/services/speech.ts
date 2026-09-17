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
        return 'Microphone permission is blocked. Allow microphone access for this site, then try again.';
      case 'no-speech':
        return 'No speech was detected. Check that your microphone is connected and speak closer to it.';
      case 'audio-capture':
      case 'NotFoundError':
        return 'No microphone is available. Connect or enable a microphone, then try again.';
      case 'NotReadableError':
        return 'Your microphone is being used by another app. Close that app and try again.';
      case 'network':
        return 'Speech recognition needs an internet connection in this browser. Check your connection and try again.';
      case 'language-not-supported':
      case 'language-unavailable':
        return 'This browser does not support speech recognition for the selected language.';
      default:
        return 'Speech recognition is unavailable. Use the latest Chrome or Edge and allow microphone access.';
    }
  }

  static async requestMicrophoneAccess(): Promise<string | null> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return 'Microphone access is unavailable in this browser. Use the latest Chrome or Edge.';
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return null;
    } catch (error) {
      return this.getRecognitionErrorMessage(error);
    }
  }

  static startListening(
    language: 'en' | 'hi' | 'mr',
    onResult: (text: string) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ) {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Speech recognition is not supported in this browser.');
      return null;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;

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
        onResult(transcript);
      };

      rec.onerror = (event: any) => {
        onError(event.error);
      };

      rec.onend = () => {
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
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
  }

  static speak(text: string, language: 'en' | 'hi' | 'mr') {
    if (!this.isSpeechSynthesisSupported() || !text) return;

    try {
      window.speechSynthesis.cancel(); // Stop ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN'
      };
      utterance.lang = langMap[language] || 'en-IN';
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
