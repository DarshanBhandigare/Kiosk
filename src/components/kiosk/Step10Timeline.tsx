import React from 'react';
import { Clock, Calendar, FileText, Activity, Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';

interface Step10Props {
  language: LanguageCode;
  onNext: () => void;
  onBack: () => void;
  chiefComplaint: string;
  clinicalHistory: any;
  scannedDocuments: any[];
}

export const Step10Timeline: React.FC<Step10Props> = ({
  language,
  onNext,
  onBack,
  chiefComplaint,
  clinicalHistory,
  scannedDocuments
}) => {
  const t = translations[language];

  // Synthesize visual timeline items
  const timelineEvents = [
    {
      date: 'Today (Current Visit)',
      type: 'CONSULTATION',
      title: 'OPD Intake & Triage',
      desc: chiefComplaint || 'Current health consultation',
      source: 'Patient Reported',
      isCurrent: true
    },
    ...scannedDocuments.map((doc: any) => ({
      date: 'Document Record (2026)',
      type: doc.document_type,
      title: doc.file_name,
      desc: (doc.extractions || []).map((e: any) => `${e.extracted_key}: ${e.extracted_value}`).slice(0, 3).join(', ') || 'Scanned medical record',
      source: 'OCR Scanned Document',
      isCurrent: false
    })),
    ...(clinicalHistory.medical_histories || []).map((h: any) => ({
      date: h.diagnosed_year_or_duration || 'Past Medical History',
      type: 'ILLNESS',
      title: h.condition_name,
      desc: `Status: ${h.status || 'Active'}`,
      source: 'Patient Reported',
      isCurrent: false
    }))
  ];

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t.timelineTitle}
        </h2>
        <p className="text-slate-600 text-sm">
          {t.timelineSubtitle}
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
        <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-200 space-y-8">
          {timelineEvents.map((ev, idx) => (
            <div key={idx} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-1 w-5 h-5 rounded-full border-4 ${
                  ev.isCurrent
                    ? 'bg-teal-600 border-teal-100 ring-2 ring-teal-500'
                    : 'bg-white border-teal-500'
                }`}
              />

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 hover:border-teal-300 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-teal-800 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{ev.date}</span>
                  </span>
                  <span className="text-[11px] font-semibold bg-white text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {ev.source}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 mt-1">{ev.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ev.desc}</p>
              </div>
            </div>
          ))}
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
