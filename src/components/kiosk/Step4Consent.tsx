import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';

interface Step4Props {
  language: LanguageCode;
  onNext: () => void;
  onBack: () => void;
  consentGiven: boolean;
  setConsentGiven: (val: boolean) => void;
}

export const Step4Consent: React.FC<Step4Props> = ({
  language,
  onNext,
  onBack,
  consentGiven,
  setConsentGiven
}) => {
  const t = translations[language];

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3 border border-teal-200">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t.consentTitle}
        </h2>
        <p className="text-slate-600 text-sm">
          {t.consentSubtitle}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6 space-y-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-700 leading-relaxed">
          {t.consentBody}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="flex items-start space-x-2.5 text-xs text-slate-600 bg-teal-50/50 p-3 rounded-lg border border-teal-100">
            <Lock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>Encrypted local hospital storage with zero public disclosure.</span>
          </div>
          <div className="flex items-start space-x-2.5 text-xs text-slate-600 bg-teal-50/50 p-3 rounded-lg border border-teal-100">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>Doctor conducts full in-person clinical review before diagnosis.</span>
          </div>
        </div>

        <div
          onClick={() => setConsentGiven(!consentGiven)}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center space-x-3.5 ${
            consentGiven
              ? 'border-teal-600 bg-teal-50/70 shadow-xs'
              : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="w-5 h-5 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
          />
          <label className="text-xs sm:text-sm font-semibold text-slate-900 cursor-pointer">
            {t.consentCheckbox}
          </label>
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
          onClick={onNext}
          disabled={!consentGiven}
          className="kiosk-btn flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-teal-600 text-white font-bold text-base hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>{t.giveConsent}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
