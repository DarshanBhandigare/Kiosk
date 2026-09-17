import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Edit3, Volume2, ArrowRight, ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';
import { SpeechService } from '../../services/speech';

interface Step6Props {
  language: LanguageCode;
  onNext: () => void;
  onBack: () => void;
  chiefComplaint: string;
  setChiefComplaint: (text: string) => void;
  voiceGuidance: boolean;
}

export const Step6ChiefComplaint: React.FC<Step6Props> = ({
  language,
  onNext,
  onBack,
  chiefComplaint,
  setChiefComplaint,
  voiceGuidance
}) => {
  const t = translations[language];
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(chiefComplaint || '');
  const [errorMsg, setErrorMsg] = useState('');

  const quickSymptoms = [
    {
      en: "Chest tightness spreading to left arm with breathlessness",
      hi: "छाती में भारीपन और बाएं हाथ में दर्द के साथ सांस फूलना",
      mr: "छातीत जडपणा आणि डाव्या हातामध्ये वेदनांसह दम लागणे"
    },
    {
      en: "Severe acidity, burning sensation in upper abdomen and nausea",
      hi: "तेज एसिडिटी, पेट के ऊपरी हिस्से में जलन और जी मिचलाना",
      mr: "तीव्र आम्लपित्त, पोटाच्या वरच्या भागात जळजळ आणि मळमळणे"
    },
    {
      en: "High fever with chills and severe body ache for 3 days",
      hi: "तीन दिनों से कंपकंपी के साथ तेज बुखार और बदन दर्द",
      mr: "तीन दिवसांपासून थंडी वाजून येणारा तीव्र ताप आणि अंगदुखी"
    },
    {
      en: "Severe right knee joint pain and morning stiffness",
      hi: "दाहिने घुटने में तेज दर्द और सुबह जोड़ों में जकड़न",
      mr: "उजव्या गुडघ्यात तीव्र वेदना आणि सकाळी सांधे ताठरणे"
    },
    {
      en: "Chronic dry cough and throat irritation for 2 weeks",
      hi: "दो हफ्तों से लगातार सूखी खांसी और गले में खराश",
      mr: "दोन आठवड्यांपासून सतत कोरडा खोकला आणि घशात खवखव"
    }
  ];

  useEffect(() => {
    if (voiceGuidance) {
      SpeechService.speak(t.chiefComplaintTitle, language);
    }
  }, [language, voiceGuidance]);

  const handleToggleListening = async () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
    } else {
      setErrorMsg('');
      const microphoneError = await SpeechService.requestMicrophoneAccess();
      if (microphoneError) {
        setErrorMsg(microphoneError);
        return;
      }
      setIsListening(true);
      SpeechService.startListening(
        language,
        (text) => {
          setTranscript(text);
          setChiefComplaint(text);
        },
        (err) => {
          console.warn('Speech error:', err);
          setIsListening(false);
          setErrorMsg(SpeechService.getRecognitionErrorMessage(err));
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  const handleSelectQuickSymptom = (item: any) => {
    const text = item[language] || item.en;
    setTranscript(text);
    setChiefComplaint(text);
    if (voiceGuidance) {
      SpeechService.speak(text, language);
    }
  };

  const handleProceed = () => {
    if (!transcript.trim()) {
      setErrorMsg('Please describe your main complaint using voice or text.');
      return;
    }
    setChiefComplaint(transcript.trim());
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t.chiefComplaintTitle}
        </h2>
        <p className="text-slate-600 text-sm max-w-xl mx-auto">
          {t.chiefComplaintSubtitle}
        </p>
      </div>

      {/* Voice Interaction Mic Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-6 text-center">
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={handleToggleListening}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-200'
                : 'bg-teal-600 hover:bg-teal-700 text-white hover:scale-105 shadow-teal-600/30 ring-4 ring-teal-100'
            }`}
          >
            {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </button>
        </div>

        <p className="text-base font-bold text-slate-900 mb-1">
          {isListening ? t.listening : t.speakNow}
        </p>
        <p className="text-xs text-slate-500 mb-6">
          {isListening ? 'Speak naturally in Hindi, Marathi, or English' : 'Tap the microphone to speak your symptoms'}
        </p>

        {/* Real-time editable transcript box */}
        <div className="text-left">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            <span className="flex items-center space-x-1.5">
              <Edit3 className="w-3.5 h-3.5 text-teal-600" />
              <span>{t.editTranscript}</span>
            </span>
            {transcript && <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1"><Check className="w-3.5 h-3.5" /><span>Captured</span></span>}
          </label>
          <textarea
            rows={3}
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              setChiefComplaint(e.target.value);
            }}
            placeholder="e.g. Severe chest pain radiating to left arm for 3 days..."
            className="w-full p-4 rounded-xl border border-slate-300 text-slate-900 text-base focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 leading-relaxed font-medium bg-slate-50/50"
          />
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs font-semibold mt-3 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Common Symptom Quick Chips */}
      <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 mb-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          {t.commonSymptoms}
        </h4>
        <div className="flex flex-wrap gap-2.5">
          {quickSymptoms.map((qs, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectQuickSymptom(qs)}
              className="text-xs font-semibold text-slate-800 bg-white hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300 px-3.5 py-2.5 rounded-xl border border-slate-200 transition-all text-left shadow-2xs"
            >
              {qs[language] || qs.en}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={onBack}
          className="kiosk-btn flex items-center space-x-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </button>

        <button
          onClick={handleProceed}
          className="kiosk-btn flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-teal-600 text-white font-bold text-base hover:bg-teal-700 shadow-md shadow-teal-600/20"
        >
          <span>{t.confirmAnswer}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
