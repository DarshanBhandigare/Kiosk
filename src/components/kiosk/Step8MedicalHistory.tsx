import React, { useState } from 'react';
import { Plus, Trash2, Heart, Pill, AlertTriangle, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';

interface Step8Props {
  language: LanguageCode;
  onNext: () => void;
  onBack: () => void;
  clinicalHistory: any;
  setClinicalHistory: (data: any) => void;
}

export const Step8MedicalHistory: React.FC<Step8Props> = ({
  language,
  onNext,
  onBack,
  clinicalHistory,
  setClinicalHistory
}) => {
  const t = translations[language];
  const [showAyurveda, setShowAyurveda] = useState(Boolean(clinicalHistory.ayurveda?.prakriti));

  // Quick condition chips
  const commonConditions = [
    { key: 'Hypertension', label: 'Hypertension (उच्च रक्तदाब / हाई बीपी)' },
    { key: 'Type 2 Diabetes', label: 'Diabetes (मधुमेह / शुगर)' },
    { key: 'Asthma', label: 'Asthma / Respiratory (दमा / श्वासविकार)' },
    { key: 'Thyroid', label: 'Thyroid Disorder (थायराइड)' },
    { key: 'Acidity / GERD', label: 'Chronic Acidity (आम्लपित्त / गैस)' },
    { key: 'Arthritis', label: 'Joint Arthritis (सांधेदुखी / गठिया)' }
  ];

  const handleToggleCondition = (cond: string) => {
    const current = clinicalHistory.medical_histories || [];
    const exists = current.some((m: any) => m.condition_name === cond);
    if (exists) {
      setClinicalHistory({
        ...clinicalHistory,
        medical_histories: current.filter((m: any) => m.condition_name !== cond)
      });
    } else {
      setClinicalHistory({
        ...clinicalHistory,
        medical_histories: [...current, { condition_name: cond, status: 'ACTIVE', diagnosed_year_or_duration: 'Known history' }]
      });
    }
  };

  const handleAddMedication = (drugName: string, dosage: string, freq: string) => {
    if (!drugName.trim()) return;
    const current = clinicalHistory.medications || [];
    setClinicalHistory({
      ...clinicalHistory,
      medications: [...current, { drug_name: drugName, dosage, frequency: freq, source: 'PATIENT_REPORTED' }]
    });
  };

  const [newDrug, setNewDrug] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFreq, setNewFreq] = useState('Once daily');

  const [newAllergen, setNewAllergen] = useState('');
  const [newReaction, setNewReaction] = useState('');

  const handleAddAllergy = () => {
    if (!newAllergen.trim()) return;
    const current = clinicalHistory.allergies || [];
    setClinicalHistory({
      ...clinicalHistory,
      allergies: [...current, { allergen_name: newAllergen, reaction_type: newReaction || 'Skin rash / Discomfort', severity: 'MODERATE' }]
    });
    setNewAllergen('');
    setNewReaction('');
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t.medicalHistoryTitle}
        </h2>
        <p className="text-slate-600 text-sm">
          Please select or enter any existing illnesses, medications, or allergies.
        </p>
      </div>

      {/* 1. Past Conditions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
        <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          <Heart className="w-4 h-4 text-rose-500" />
          <span>{t.pastConditions}</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
          {commonConditions.map((c) => {
            const isSelected = (clinicalHistory.medical_histories || []).some((m: any) => m.condition_name === c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => handleToggleCondition(c.key)}
                className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Current Medications */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
        <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          <Pill className="w-4 h-4 text-teal-600" />
          <span>{t.currentMedications}</span>
        </label>

        {/* Existing Meds List */}
        {(clinicalHistory.medications || []).length > 0 && (
          <div className="space-y-2 mb-4">
            {clinicalHistory.medications.map((m: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-900">{m.drug_name}</span>
                  <span className="text-slate-500 ml-2">({m.dosage || 'Dosage N/A'} • {m.frequency})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const filtered = clinicalHistory.medications.filter((_: any, i: number) => i !== idx);
                    setClinicalHistory({ ...clinicalHistory, medications: filtered });
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Med Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="text"
            value={newDrug}
            onChange={(e) => setNewDrug(e.target.value)}
            placeholder="Medicine name (e.g. Telmisartan)"
            className="sm:col-span-2 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
          />
          <input
            type="text"
            value={newDosage}
            onChange={(e) => setNewDosage(e.target.value)}
            placeholder="Dosage (e.g. 40mg)"
            className="p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
          />
          <button
            type="button"
            onClick={() => {
              handleAddMedication(newDrug, newDosage, newFreq);
              setNewDrug('');
              setNewDosage('');
            }}
            className="flex items-center justify-center space-x-1 bg-teal-50 text-teal-800 border border-teal-200 font-bold p-2.5 rounded-xl text-xs hover:bg-teal-100 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* 3. Allergies */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
        <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>{t.allergies}</span>
        </label>

        {(clinicalHistory.allergies || []).length > 0 && (
          <div className="space-y-2 mb-4">
            {clinicalHistory.allergies.map((a: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
                <div>
                  <span className="font-bold text-amber-900">{a.allergen_name}</span>
                  <span className="text-amber-700 ml-2">({a.reaction_type})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const filtered = clinicalHistory.allergies.filter((_: any, i: number) => i !== idx);
                    setClinicalHistory({ ...clinicalHistory, allergies: filtered });
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newAllergen}
            onChange={(e) => setNewAllergen(e.target.value)}
            placeholder="Allergy (e.g. Penicillin, Sulfa, Peanuts)"
            className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
          />
          <button
            type="button"
            onClick={handleAddAllergy}
            className="flex items-center space-x-1 bg-amber-50 text-amber-900 border border-amber-200 font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-amber-100 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Allergy</span>
          </button>
        </div>
      </div>

      {/* 4. Ayurveda Module Accordion */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t.ayurvedaSection}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAyurveda(!showAyurveda)}
            className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200"
          >
            {showAyurveda ? 'Hide Details' : '+ Add Ayurveda Intake'}
          </button>
        </div>

        {showAyurveda && (
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prakriti / Constitution</label>
                <select
                  value={clinicalHistory.ayurveda?.prakriti || ''}
                  onChange={(e) => setClinicalHistory({
                    ...clinicalHistory,
                    ayurveda: { ...(clinicalHistory.ayurveda || {}), prakriti: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                >
                  <option value="">Select Prakriti</option>
                  <option value="Vata">Vata (वात)</option>
                  <option value="Pitta">Pitta (पित्त)</option>
                  <option value="Kapha">Kapha (कफ)</option>
                  <option value="Vata-Pitta">Vata-Pitta (वात-पित्त)</option>
                  <option value="Pitta-Kapha">Pitta-Kapha (पित्त-कफ)</option>
                  <option value="Tridoshic">Tridoshic (त्रिदोषज)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Agni / Digestive Fire</label>
                <select
                  value={clinicalHistory.ayurveda?.agni || ''}
                  onChange={(e) => setClinicalHistory({
                    ...clinicalHistory,
                    ayurveda: { ...(clinicalHistory.ayurveda || {}), agni: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                >
                  <option value="">Select Agni</option>
                  <option value="Sama Agni">Sama Agni (Balanced)</option>
                  <option value="Tikshna Agni">Tikshna Agni (Hyperactive / Acidic)</option>
                  <option value="Manda Agni">Manda Agni (Sluggish / Heavy)</option>
                  <option value="Vishama Agni">Vishama Agni (Irregular)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sleep Pattern (Nidra)</label>
                <input
                  type="text"
                  value={clinicalHistory.ayurveda?.sleep_pattern || ''}
                  onChange={(e) => setClinicalHistory({
                    ...clinicalHistory,
                    ayurveda: { ...(clinicalHistory.ayurveda || {}), sleep_pattern: e.target.value }
                  })}
                  placeholder="e.g. Disturbed, wakes up at 2 AM"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diet / Ahara Habitation</label>
                <input
                  type="text"
                  value={clinicalHistory.lifestyle?.diet_type || 'Vegetarian'}
                  onChange={(e) => setClinicalHistory({
                    ...clinicalHistory,
                    lifestyle: { ...(clinicalHistory.lifestyle || {}), diet_type: e.target.value }
                  })}
                  placeholder="e.g. Vegetarian, occasional spicy"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>
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
