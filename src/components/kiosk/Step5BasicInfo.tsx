import React, { useState } from 'react';
import { User, Phone, Calendar, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';

interface Step5Props {
  language: LanguageCode;
  onNext: () => void;
  onBack: () => void;
  patientData: any;
  setPatientData: (data: any) => void;
}

export const Step5BasicInfo: React.FC<Step5Props> = ({
  language,
  onNext,
  onBack,
  patientData,
  setPatientData
}) => {
  const t = translations[language];
  const [error, setError] = useState('');

  const handleProceed = () => {
    if (!patientData.full_name?.trim()) {
      setError('Please enter patient full name.');
      return;
    }
    if (!patientData.sex) {
      setError('Please select sex/gender.');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t.basicInfoTitle}
        </h2>
        <p className="text-slate-600 text-sm">
          Basic demographic details for clinical case registration.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6 space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            {t.fullName} *
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={patientData.full_name || ''}
              onChange={(e) => setPatientData({ ...patientData, full_name: e.target.value })}
              placeholder="e.g. Ramesh Patil"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-base focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Age and Sex Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.age}
            </label>
            <div className="relative">
              <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="number"
                min={1}
                max={120}
                value={patientData.age || ''}
                onChange={(e) => setPatientData({ ...patientData, age: parseInt(e.target.value) || '' })}
                placeholder="e.g. 54"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-base focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.sex} *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Male', 'Female', 'Other'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPatientData({ ...patientData, sex: s })}
                  className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                    patientData.sex === s
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s === 'Male' ? t.male : s === 'Female' ? t.female : t.other}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contact & Emergency Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.contactNumber}
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                value={patientData.contact_number || ''}
                onChange={(e) => setPatientData({ ...patientData, contact_number: e.target.value })}
                placeholder="e.g. +91 98220 11223"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-base focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.emergencyContact}
            </label>
            <input
              type="text"
              value={patientData.emergency_contact || ''}
              onChange={(e) => setPatientData({ ...patientData, emergency_contact: e.target.value })}
              placeholder="e.g. Relative name & phone"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-base focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
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
          <span>{t.next}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
