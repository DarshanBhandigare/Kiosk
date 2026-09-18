import React, { useState } from 'react';
import { CheckCircle2, Ticket, Clock, Stethoscope, ArrowRight, RefreshCw, Printer, Upload, Loader2, FileCheck2, AlertCircle } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';
import { api } from '../../services/api';

interface Step13Props {
  language: LanguageCode;
  patientId: string;
  caseId: string;
  tokenNumber: string;
  department: string;
  hasRedFlag: boolean;
  onReset: () => void;
  onOpenDoctorView: () => void;
}

export const Step13Submission: React.FC<Step13Props> = ({
  language,
  patientId,
  caseId,
  tokenNumber,
  department,
  hasRedFlag,
  onReset,
  onOpenDoctorView
}) => {
  const t = translations[language];
  const [documentType, setDocumentType] = useState('PRESCRIPTION');
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      if (!patientId || !caseId) throw new Error('The token record is not ready for document upload.');
      await api.uploadDocument(patientId, file, documentType, caseId);
      setUploadedFile(file.name);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unable to upload this document.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

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
        <div className="text-5xl sm:text-6xl font-black tracking-tight font-mono mb-4 text-teal-700">
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

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-8 max-w-xl mx-auto text-left">
        <div className="flex items-center gap-2 mb-1">
          <Upload className="w-5 h-5 text-teal-600" />
          <h3 className="text-base font-black text-slate-900">Upload a prescription or report</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">You can attach documents now using your OPD token. This step is optional.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {['PRESCRIPTION', 'LAB_REPORT', 'DISCHARGE_SUMMARY'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDocumentType(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${documentType === type ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {type === 'PRESCRIPTION' ? 'Prescription' : type === 'LAB_REPORT' ? 'Lab report' : 'Discharge summary'}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/50 px-4 py-4 text-xs font-bold text-teal-800 hover:bg-teal-50">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span>{uploading ? 'Uploading and extracting...' : 'Choose document'}</span>
          <input type="file" accept="image/*,.pdf,.txt" onChange={handleDocumentUpload} disabled={uploading} className="hidden" />
        </label>
        {uploadedFile && <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><FileCheck2 className="h-4 w-4" /> {uploadedFile} uploaded for token {tokenNumber}.</p>}
        {uploadError && <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-rose-700"><AlertCircle className="h-4 w-4" /> {uploadError}</p>}
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
