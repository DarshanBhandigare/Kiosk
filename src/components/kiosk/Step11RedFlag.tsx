import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';

interface Step11Props {
  language: LanguageCode;
  onNext: () => void;
  onBack: () => void;
  chiefComplaint: string;
  interviewAnswers: any[];
}

export const Step11RedFlag: React.FC<Step11Props> = ({
  language,
  onNext,
  onBack,
  chiefComplaint,
  interviewAnswers
}) => {
  const t = translations[language];

  // Client-side quick check heuristic for visual transparency
  const hasChestOrBreath = /chest|pain|breath|सांस|छाती|दम/i.test(chiefComplaint);

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 border ${
          hasChestOrBreath ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-teal-50 text-teal-600 border-teal-200'
        }`}>
          {hasChestOrBreath ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t.redFlagNoticeTitle}
        </h2>
        <p className="text-slate-600 text-sm">
          {t.redFlagNoticeSubtitle}
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6 space-y-4">
        <div className={`p-4 rounded-2xl border ${
          hasChestOrBreath ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-teal-50/70 border-teal-200 text-teal-900'
        }`}>
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <strong className="font-bold block mb-1">
                {hasChestOrBreath ? 'Priority Clinical Review Flagged' : 'Standard OPD Review Scheduled'}
              </strong>
              {hasChestOrBreath
                ? 'Your reported symptoms (e.g. chest discomfort / breathing) have been flagged for priority triage review by the OPD nursing staff and duty physician.'
                : 'No immediate emergency triggers identified. Your case is queued for regular consultation with the attending physician.'}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">Safety & Governance Rules:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Red flag notifications serve only to alert healthcare staff and never constitute an automated diagnosis.</li>
            <li>The attending doctor reviews all reported symptoms, medical timelines, and vital signs before clinical consultation.</li>
          </ul>
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
          className="kiosk-btn flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-teal-600 text-white font-bold text-base hover:bg-teal-700 shadow-md shadow-teal-600/20"
        >
          <span>{t.next}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
