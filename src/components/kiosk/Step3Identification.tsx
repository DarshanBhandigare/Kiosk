import React, { useState } from 'react';
import { Search, CheckCircle2, Shield, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';
import { api } from '../../services/api';

interface Step3Props {
  language: LanguageCode;
  onNext: () => void;
  onBack: () => void;
  patientData: any;
  setPatientData: (data: any) => void;
}

export const Step3Identification: React.FC<Step3Props> = ({
  language,
  onNext,
  onBack,
  patientData,
  setPatientData
}) => {
  const t = translations[language];
  const [abhaInput, setAbhaInput] = useState(patientData.abha_id || '');
  const [loading, setLoading] = useState(false);
  const [verifiedAbha, setVerifiedAbha] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerifyAbha = async (idToVerify?: string) => {
    const id = idToVerify || abhaInput;
    if (!id.trim()) {
      setErrorMsg('Please enter an ABHA ID (e.g. 91-8842-1920-5412)');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.verifyAbha(id);
      setVerifiedAbha(res);
      setPatientData({
        ...patientData,
        abha_id: res.abha_id,
        full_name: res.full_name,
        sex: res.gender,
        contact_number: res.mobile,
        address: res.address,
        age: 54 // Default calculated from DOB
      });
    } catch (e: any) {
      setVerifiedAbha(null);
      setErrorMsg('Profile not found in this local demo. Use a sample ABHA ID or enter details manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillRamesh = () => {
    setAbhaInput('91-8842-1920-5412');
    handleVerifyAbha('91-8842-1920-5412');
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-teal-50 text-teal-800 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-teal-200/60">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          <span>Local ABHA Demo Mode</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t.identificationTitle}
        </h2>
        <p className="text-slate-600 text-sm">
          {t.identificationSubtitle}
        </p>
      </div>

      {/* ABHA Input Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          ABHA ID (Ayushman Bharat Health Account)
        </label>
        <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={abhaInput}
              onChange={(e) => setAbhaInput(e.target.value)}
              placeholder={t.abhaIdPlaceholder}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-slate-900 text-base focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => handleVerifyAbha()}
            disabled={loading}
            className="kiosk-btn flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span>{t.verifyAbha}</span>
          </button>
        </div>

        {/* Demo ABHA Quick Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500">Demo profiles:</span>
          <button
            type="button"
            onClick={handleQuickFillRamesh}
            className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-md border border-teal-200 transition-colors"
          >
            Ramesh Patil (Cardiology)
          </button>
          <button
            type="button"
            onClick={() => {
              setAbhaInput('91-9921-4412-8801');
              handleVerifyAbha('91-9921-4412-8801');
            }}
            className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-md border border-teal-200 transition-colors"
          >
            Sunita Deshmukh (Ayurveda)
          </button>
        </div>

        {errorMsg && (
          <p className="text-xs font-medium text-rose-600 mt-3 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Verified Profile Card Preview */}
      {verifiedAbha && (
        <div className="bg-emerald-50/80 rounded-2xl p-5 border border-emerald-300 shadow-sm mb-6 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Demo Profile Found</span>
                <h4 className="text-lg font-extrabold text-slate-900">{verifiedAbha.full_name}</h4>
                <p className="text-xs text-slate-600 font-mono">{verifiedAbha.abha_id} • {verifiedAbha.gender} • {verifiedAbha.mobile}</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
              Local Demo
            </span>
          </div>
        </div>
      )}

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
          <span>{verifiedAbha ? t.next : t.skipAbha}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
