import React from 'react';
import { Volume2, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';
import { SpeechService } from '../../services/speech';

interface Step2Props {
  language: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onNext: () => void;
  onBack: () => void;
  voiceGuidance: boolean;
}

export const Step2Language: React.FC<Step2Props> = ({
  language,
  onSelectLanguage,
  onNext,
  onBack,
  voiceGuidance
}) => {
  const t = translations[language];

  const handlePreviewAudio = (lang: LanguageCode, text: string) => {
    SpeechService.speak(text, lang);
  };

  const languages = [
    {
      code: 'mr' as LanguageCode,
      name: 'मराठी',
      subname: 'Marathi',
      greeting: 'नमस्कार, मेडीकिओस्क मध्ये आपले स्वागत आहे.',
      desc: 'मराठी भाषेमध्ये आवाज व टच द्वारे केस नोंदणी करा.'
    },
    {
      code: 'hi' as LanguageCode,
      name: 'हिंदी',
      subname: 'Hindi',
      greeting: 'नमस्ते, मेडीकियोस्क में आपका स्वागत है।',
      desc: 'हिंदी भाषा में आवाज़ और टच द्वारा केस दर्ज करें।'
    },
    {
      code: 'en' as LanguageCode,
      name: 'English',
      subname: 'English',
      greeting: 'Hello, welcome to MediKiosk outpatient intake.',
      desc: 'Complete case intake in English via voice or touch.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t.languageSelectTitle}
        </h2>
        <p className="text-slate-600 text-base max-w-xl mx-auto">
          {t.languageSelectSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        {languages.map((l) => {
          const isSelected = language === l.code;
          return (
            <div
              key={l.code}
              onClick={() => {
                onSelectLanguage(l.code);
                if (voiceGuidance) handlePreviewAudio(l.code, l.greeting);
              }}
                className={`p-4 sm:p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? 'border-teal-600 bg-teal-50/80 shadow-md ring-2 ring-teal-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {l.name.substring(0, 2)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{l.name}</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-500">({l.subname})</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{l.desc}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewAudio(l.code, l.greeting);
                  }}
                  title="Listen to audio greeting"
                  className="p-3 rounded-xl bg-white border border-slate-200 text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  <Volume2 className="w-5 h-5" />
                </button>

                <div className="w-6 h-6 flex items-center justify-center">
                  {isSelected ? (
                    <CheckCircle2 className="w-6 h-6 text-teal-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={onBack}
          className="kiosk-btn flex items-center space-x-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </button>

        <button
          onClick={onNext}
          className="kiosk-btn flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-teal-600 text-white font-bold text-base hover:bg-teal-700 shadow-md shadow-teal-600/20"
        >
          <span>{t.next}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
