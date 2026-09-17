import React from 'react';
import { Activity, ArrowRight, Volume2, ShieldCheck, HeartPulse, Languages, Sparkles } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';

interface Step1Props {
  language: LanguageCode;
  onNext: () => void;
  onSelectLanguage: (lang: LanguageCode) => void;
  voiceGuidance: boolean;
  onToggleVoice: () => void;
  onQuickDemo: () => void;
}

export const Step1Welcome: React.FC<Step1Props> = ({
  language,
  onNext,
  onSelectLanguage,
  voiceGuidance,
  onToggleVoice,
  onQuickDemo
}) => {
  const t = translations[language];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Hospital Banner */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Activity className="w-7 h-7 text-teal-300" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-teal-200">District General Hospital OPD</span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{t.welcomeTitle}</h1>
          </div>
        </div>

        <p className="text-base sm:text-xl text-teal-100/90 font-normal max-w-2xl leading-relaxed mb-8">
          {t.welcomeSubtitle}
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 pt-4 border-t border-teal-600/50">
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl p-3 border border-white/10">
            <Languages className="w-5 h-5 text-teal-300 shrink-0" />
            <span className="text-xs font-medium text-teal-100">English, हिंदी, मराठी Voice & Touch</span>
          </div>
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl p-3 border border-white/10">
            <HeartPulse className="w-5 h-5 text-teal-300 shrink-0" />
            <span className="text-xs font-medium text-teal-100">AI Adaptive History & Prescription OCR</span>
          </div>
          <div className="flex items-center space-x-3 bg-white/5 rounded-xl p-3 border border-white/10">
            <ShieldCheck className="w-5 h-5 text-teal-300 shrink-0" />
            <span className="text-xs font-medium text-teal-100">Doctor-Verified & ABDM/ABHA Ready</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button
            onClick={onNext}
            className="kiosk-btn flex items-center justify-center space-x-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold px-8 py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            <span>{t.startKiosk}</span>
            <ArrowRight className="w-6 h-6" />
          </button>

          <button
            onClick={onToggleVoice}
            className={`kiosk-btn flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl text-sm font-semibold border transition-all cursor-pointer ${
              voiceGuidance
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
            }`}
          >
            <Volume2 className="w-5 h-5" />
            <span>{voiceGuidance ? t.voiceGuidanceOn : t.voiceGuidanceOff}</span>
          </button>

          <button
            onClick={onQuickDemo}
            className="kiosk-btn flex items-center justify-center space-x-2 px-4 py-4 rounded-2xl text-xs font-semibold bg-white/10 border border-white/20 text-teal-200 hover:bg-white/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Quick Demo Prefill</span>
          </button>
        </div>
      </div>

      {/* Language Quick Selector Chips */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">{t.languageSelectTitle}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onSelectLanguage('en')}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              language === 'en'
                ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="text-base font-bold text-slate-900">English</div>
            <div className="text-xs text-slate-500">Default clinical language</div>
          </button>

          <button
            onClick={() => onSelectLanguage('hi')}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              language === 'hi'
                ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="text-base font-bold text-slate-900">हिंदी (Hindi)</div>
            <div className="text-xs text-slate-500">आवाज़ और टच सहायता उपलब्ध</div>
          </button>

          <button
            onClick={() => onSelectLanguage('mr')}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              language === 'mr'
                ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="text-base font-bold text-slate-900">मराठी (Marathi)</div>
            <div className="text-xs text-slate-500">आवाज व टच मार्गदर्शन उपलब्ध</div>
          </button>
        </div>
      </div>
    </div>
  );
};
