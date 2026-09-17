import React from 'react';
import { CheckCircle2, Ticket, Clock, Stethoscope, ArrowRight, RefreshCw, Printer } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';

interface Step13Props {
  language: LanguageCode;
  tokenNumber: string;
  department: string;
  hasRedFlag: boolean;
  onReset: () => void;
  onOpenDoctorView: () => void;
}

export const Step13Submission: React.FC<Step13Props> = ({
  language,
  tokenNumber,
  department,
  hasRedFlag,
  onReset,
  onOpenDoctorView
}) => {
  const t = translations[language];

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-md shadow-emerald-100 ring-8 ring-emerald-50">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
        {t.submissionSuccessTitle}
      </h2>
      <p className="text-slate-600 text-base max-w-md mx-auto mb-8">
        {t.waitingDoctor}
      </p>

      {/* OPD Token Card */}
      <div className="bg-white rounded-3xl p-8 border-2 border-teal-600 shadow-xl mb-8 max-w-md mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-teal-600 text-white text-[11px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
          OPD Token
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
          {t.tokenNumber}
        </span>
        <div className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono mb-4 text-teal-700">
          {tokenNumber || 'T-103'}
        </div>

        <div className="border-t border-dashed border-slate-200 pt-4 space-y-2 text-xs">
          <div className="flex justify-between font-semibold">
            <span className="text-slate-500">Department:</span>
            <span className="text-slate-900">{department || 'OPD General'}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-slate-500">Triage Status:</span>
            <span className={hasRedFlag ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
              {hasRedFlag ? 'Priority Triage (Red-Flag)' : 'Standard Routine'}
            </span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-slate-500">Est. Wait Time:</span>
            <span className="text-slate-900">~ 10-15 Minutes</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onReset}
          className="kiosk-btn w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-4 rounded-2xl shadow-md cursor-pointer"
        >
          <RefreshCw className="w-5 h-5" />
          <span>{t.returnHome}</span>
        </button>

        <button
          onClick={onOpenDoctorView}
          className="kiosk-btn w-full sm:w-auto flex items-center justify-center space-x-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-bold px-8 py-4 rounded-2xl transition-colors cursor-pointer"
        >
          <Stethoscope className="w-5 h-5 text-teal-700" />
          <span>View in Doctor Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
