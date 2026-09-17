import React from 'react';
import { CheckCircle2, User, Activity, Heart, Pill, FileText, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';

interface Step12Props {
  language: LanguageCode;
  onNext: () => void;
  onBack: () => void;
  onJumpToStep: (step: number) => void;
  patientData: any;
  chiefComplaint: string;
  interviewAnswers: any[];
  clinicalHistory: any;
  scannedDocuments: any[];
  isSubmitting: boolean;
  submissionError: string;
}

export const Step12Review: React.FC<Step12Props> = ({
  language,
  onNext,
  onBack,
  onJumpToStep,
  patientData,
  chiefComplaint,
  interviewAnswers,
  clinicalHistory,
  scannedDocuments,
  isSubmitting,
  submissionError
}) => {
  const t = translations[language];

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t.reviewTitle}
        </h2>
        <p className="text-slate-600 text-sm">
          Please review all details. You can make corrections before final submission to the doctor.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {submissionError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-sm font-medium">
            {submissionError}
          </div>
        )}
        {/* 1. Patient Demographics */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <User className="w-4 h-4 text-teal-600" />
              <span>{t.basicInfoTitle}</span>
            </h4>
            <button
              type="button"
              onClick={() => onJumpToStep(5)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md"
            >
              {t.edit}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Name:</span>
              <strong className="text-slate-900 font-bold">{patientData.full_name || 'Vijay Gaikwad'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Age / Sex:</span>
              <strong className="text-slate-900 font-bold">{patientData.age || 54} Y • {patientData.sex || 'Male'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Contact:</span>
              <strong className="text-slate-900 font-mono">{patientData.contact_number || '+91 98220 11223'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">ABHA ID:</span>
              <strong className="text-slate-900 font-mono">{patientData.abha_id || '91-8842-1920-5412'}</strong>
            </div>
          </div>
        </div>

        {/* 2. Chief Complaint & Answers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Chief Complaint & Symptoms</span>
            </h4>
            <button
              type="button"
              onClick={() => onJumpToStep(6)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md"
            >
              {t.edit}
            </button>
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            "{chiefComplaint}"
          </p>

          {interviewAnswers.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              {interviewAnswers.map((ans: any, idx: number) => (
                <div key={idx} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600 font-medium">{ans.question_text}:</span>
                  <span className="font-bold text-slate-900">{ans.response_text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Medical History & Medications */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>{t.medicalHistoryTitle}</span>
            </h4>
            <button
              type="button"
              onClick={() => onJumpToStep(8)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md"
            >
              {t.edit}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium block mb-1">Past Illnesses:</span>
              {(clinicalHistory.medical_histories || []).length > 0 ? (
                <ul className="list-disc pl-4 space-y-0.5 font-semibold text-slate-800">
                  {clinicalHistory.medical_histories.map((m: any, i: number) => (
                    <li key={i}>{m.condition_name}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-400 italic">None reported</span>
              )}
            </div>

            <div>
              <span className="text-slate-500 font-medium block mb-1">Current Medicines:</span>
              {(clinicalHistory.medications || []).length > 0 ? (
                <ul className="list-disc pl-4 space-y-0.5 font-semibold text-slate-800">
                  {clinicalHistory.medications.map((m: any, i: number) => (
                    <li key={i}>{m.drug_name} {m.dosage ? `(${m.dosage})` : ''}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-400 italic">None reported</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Scanned Documents */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Scanned Documents ({scannedDocuments.length})</span>
            </h4>
            <button
              type="button"
              onClick={() => onJumpToStep(9)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md"
            >
              {t.edit}
            </button>
          </div>
          {scannedDocuments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {scannedDocuments.map((d: any, idx: number) => (
                <span key={idx} className="text-xs font-semibold bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{d.file_name}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No external documents attached.</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="kiosk-btn flex items-center space-x-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </button>

        <button
          onClick={onNext}
          disabled={isSubmitting}
          className="kiosk-btn flex items-center space-x-2 px-10 py-4 rounded-2xl bg-teal-600 text-white font-black text-lg hover:bg-teal-700 shadow-xl shadow-teal-600/30 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Submitting Case...</span>
            </>
          ) : (
            <>
              <span>{t.submitCase}</span>
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
