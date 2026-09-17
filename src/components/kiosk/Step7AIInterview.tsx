import React, { useState, useEffect } from 'react';
import { Volume2, Mic, MicOff, ArrowRight, ArrowLeft, SkipForward, RefreshCcw, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';
import { SpeechService } from '../../services/speech';
import { api } from '../../services/api';

interface Step7Props {
  language: LanguageCode;
  onNext: () => void;
  onBack: () => void;
  sessionId: string;
  chiefComplaint: string;
  interviewAnswers: any[];
  setInterviewAnswers: (answers: any[]) => void;
  voiceGuidance: boolean;
}

export const Step7AIInterview: React.FC<Step7Props> = ({
  language,
  onNext,
  onBack,
  sessionId,
  chiefComplaint,
  interviewAnswers,
  setInterviewAnswers,
  voiceGuidance
}) => {
  const t = translations[language];
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [severityVal, setSeverityVal] = useState(5);
  const [customText, setCustomText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');

  useEffect(() => {
    loadFirstQuestion();
  }, [sessionId, chiefComplaint, language]);

  const loadFirstQuestion = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const q = await api.startInterview(sessionId, chiefComplaint, language);
      setCurrentQuestion(q);
      if (voiceGuidance && q?.question_text) {
        SpeechService.speak(q.question_text, language);
      }
    } catch (e) {
      console.warn('AI interview start error:', e);
      // Fallback
      setCurrentQuestion({
        has_next: true,
        question_key: 'duration',
        question_text: language === 'hi' ? 'आपको यह समस्या कितने समय से है?' : language === 'mr' ? 'हा त्रास किती दिवसांपासून होत आहे?' : 'How long have you had this issue?',
        category: 'DURATION',
        input_type: 'VOICE_OR_TOUCH',
        options: ['Less than 24 hours', '2 to 7 days', '1 to 4 weeks', 'More than 1 month']
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakQuestion = () => {
    if (currentQuestion?.question_text) {
      SpeechService.speak(currentQuestion.question_text, language);
    }
  };

  const handleToggleVoice = async () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
    } else {
      setSpeechError('');
      const microphoneError = await SpeechService.requestMicrophoneAccess();
      if (microphoneError) {
        setSpeechError(microphoneError);
        return;
      }
      setIsListening(true);
      SpeechService.startListening(
        language,
        (text) => {
          setCustomText(text);
          setSelectedChoice(text);
        },
        (err) => {
          setIsListening(false);
          setSpeechError(SpeechService.getRecognitionErrorMessage(err));
        },
        () => setIsListening(false)
      );
    }
  };

  const handleAnswer = async (responseVal?: string) => {
    const val = responseVal || selectedChoice || (currentQuestion?.input_type === 'SLIDER' ? `${severityVal} / 10` : customText);
    if (!val) return;

    const answerRecord = {
      question_key: currentQuestion.question_key || 'q_key',
      question_text: currentQuestion.question_text || 'Question',
      response_text: val,
      category: currentQuestion.category
    };

    const updated = [...interviewAnswers, answerRecord];
    setInterviewAnswers(updated);
    setSelectedChoice('');
    setCustomText('');

    setLoading(true);
    try {
      const nextQ = await api.submitAnswer({
        session_id: sessionId,
        question_key: answerRecord.question_key,
        question_text: answerRecord.question_text,
        response_text: val,
        input_mode: isListening ? 'VOICE' : 'TOUCH',
        language: language
      });

      if (!nextQ.has_next) {
        onNext();
      } else {
        setCurrentQuestion(nextQ);
        if (voiceGuidance && nextQ.question_text) {
          SpeechService.speak(nextQ.question_text, language);
        }
      }
    } catch (e) {
      console.warn('Answer submit error:', e);
      if (interviewAnswers.length >= 2) {
        onNext();
      } else {
        setCurrentQuestion({
          has_next: true,
          question_key: 'severity',
          question_text: language === 'hi' ? '1 से 10 के पैमाने पर तकलीफ कितनी तीव्र है?' : language === 'mr' ? 'त्रास किती तीव्र आहे? (१ ते १०)' : 'How severe is the pain on a scale of 1 to 10?',
          category: 'SEVERITY',
          input_type: 'SLIDER',
          options: null
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-teal-50 text-teal-800 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-teal-200/60">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Adaptive Clinical Questioning Engine</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
          {t.adaptiveInterviewTitle}
        </h2>
        <p className="text-slate-500 text-xs">
          Questions adapt in real-time based on your specific symptoms.
        </p>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        {[1, 2, 3, 4].map((step, idx) => (
          <div
            key={step}
            className={`h-2 rounded-full transition-all ${
              idx < interviewAnswers.length
                ? 'w-8 bg-teal-600'
                : idx === interviewAnswers.length
                ? 'w-8 bg-teal-400'
                : 'w-2 bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Main Question Card */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-sm mb-6">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-700">Analyzing responses & preparing next question...</p>
        </div>
      ) : currentQuestion ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
          {/* Question Text & Audio Button */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/60">
                {currentQuestion.category || 'Clinical Follow-Up'}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-3 leading-snug">
                {currentQuestion.question_text}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleSpeakQuestion}
              title="Repeat question audio"
              className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 transition-colors shrink-0 cursor-pointer"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>

          {/* Options / Slider / Voice Input */}
          {currentQuestion.input_type === 'SLIDER' || currentQuestion.category === 'SEVERITY' ? (
            <div className="py-6 px-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-600 uppercase">1 (Mild Discomfort)</span>
                <span className="text-2xl font-black text-teal-700 px-4 py-1 bg-white rounded-xl border border-teal-200 shadow-xs">
                  {severityVal} / 10
                </span>
                <span className="text-xs font-bold text-rose-600 uppercase">10 (Unbearable)</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={severityVal}
                onChange={(e) => setSeverityVal(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>
          ) : currentQuestion.options && currentQuestion.options.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {currentQuestion.options.map((opt: string, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAnswer(opt)}
                  className={`p-4 rounded-xl border-2 text-left font-semibold text-sm transition-all cursor-pointer ${
                    selectedChoice === opt
                      ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-xs'
                      : 'border-slate-200 bg-slate-50/70 hover:border-teal-300 hover:bg-teal-50/40 text-slate-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-6 space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Type or speak your answer..."
                  className="flex-1 p-3.5 rounded-xl border border-slate-300 text-slate-900 text-base focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse border-rose-600'
                      : 'bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
              {speechError && (
                <p className="text-xs font-medium text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {speechError}
                </p>
              )}
            </div>
          )}

          {/* Skip & Change Previous buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => {
                if (interviewAnswers.length > 0) {
                  const popped = [...interviewAnswers];
                  popped.pop();
                  setInterviewAnswers(popped);
                  loadFirstQuestion();
                }
              }}
              disabled={interviewAnswers.length === 0}
              className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-900 font-medium disabled:opacity-30 cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>{t.changeAnswer}</span>
            </button>

            <button
              type="button"
              onClick={() => handleAnswer('Not specified / Skipped')}
              className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>{t.skipQuestion}</span>
            </button>
          </div>
        </div>
      ) : null}

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
          onClick={() => handleAnswer()}
          className="kiosk-btn flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-teal-600 text-white font-bold text-base hover:bg-teal-700 shadow-md shadow-teal-600/20"
        >
          <span>{t.next}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
