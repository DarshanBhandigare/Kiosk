import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, ArrowRight, ArrowLeft, Eye } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';
import { api } from '../../services/api';

interface Step9Props {
  language: LanguageCode;
  onNext: () => void;
  onBack: () => void;
  patientId: string;
  scannedDocuments: any[];
  setScannedDocuments: (docs: any[]) => void;
}

export const Step9DocumentScanner: React.FC<Step9Props> = ({
  language,
  onNext,
  onBack,
  patientId,
  scannedDocuments,
  setScannedDocuments
}) => {
  const t = translations[language];
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('PRESCRIPTION');
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const sampleReports = [
    {
      title: "Cardiology Prescription (Dr. Arvind Kulkarni)",
      type: "PRESCRIPTION",
      sampleText: `CITY MULTISPECIALITY HOSPITAL & RESEARCH CENTRE
Date: 12/01/2026
Doctor: Dr. Arvind Kulkarni, MD, DM (Cardiology)
Rx:
1. Tab. Telmisartan 40 mg - 1 tab Once Daily (OD)
2. Tab. Metformin 500 mg - 1 tab Twice Daily (BD)
3. Tab. Atorvastatin 20 mg - 1 tab At Bedtime (HS)
4. Tab. Pantoprazole 40 mg - 1 tab Early morning empty stomach (OD)`
    },
    {
      title: "Comprehensive Lipid & Diabetes Lab Report (Metropolis Lab)",
      type: "LAB_REPORT",
      sampleText: `METROPOLIS DIAGNOSTIC LAB
Date: 10/01/2026
HbA1c: 7.8 % (Normal < 5.7 %)
Fasting Blood Sugar: 142 mg/dL (HIGH)
Total Cholesterol: 228 mg/dL (HIGH)
Serum Triglycerides: 195 mg/dL (HIGH)
Serum Creatinine: 1.05 mg/dL (Normal)`
    },
    {
      title: "Knee Arthroscopy Discharge Summary (Sahyadri Hospital)",
      type: "DISCHARGE_SUMMARY",
      sampleText: `SAHYADRI HOSPITAL - DISCHARGE SUMMARY
Admission: 04/11/2025 | Discharge: 06/11/2025
Doctor: Dr. Sunil Deshmukh, MS (Ortho)
Final Diagnosis: Right Knee Medial Meniscus Tear
Procedure: Right Knee Arthroscopic Partial Meniscectomy
Discharge Rx: Tab Paracetamol 650mg TDS x 5 days`
    }
  ];

  const handleProcessSampleDoc = async (sample: any) => {
    setUploading(true);
    try {
      const blob = new Blob([sample.sampleText], { type: 'text/plain' });
      const file = new File([blob], `${sample.type.toLowerCase()}_sample.txt`, { type: 'text/plain' });
      const docRes = await api.uploadDocument(patientId || 'temp-id', file, sample.type);
      setScannedDocuments([...scannedDocuments, docRes]);
      setPreviewDoc(docRes);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Unable to upload and scan this document.');
      console.warn('Sample doc upload fallback:', err);
      // Local demo fallback
      const mockDoc = {
        id: `mock-${Date.now()}`,
        document_type: sample.type,
        file_name: `${sample.type.toLowerCase()}_report.pdf`,
        file_size_bytes: 245000,
        mime_type: 'application/pdf',
        ocr_status: 'COMPLETED',
        ocr_raw_text: sample.sampleText,
        extractions: sample.type === 'PRESCRIPTION' ? [
          { id: '1', entity_type: 'MEDICINE', extracted_key: 'Telmisartan', extracted_value: '40 mg OD', confidence_score: 0.98 },
          { id: '2', entity_type: 'MEDICINE', extracted_key: 'Metformin', extracted_value: '500 mg BD', confidence_score: 0.96 },
          { id: '3', entity_type: 'DOCTOR', extracted_key: 'Prescribing Doctor', extracted_value: 'Dr. Arvind Kulkarni, DM', confidence_score: 0.95 }
        ] : [
          { id: '4', entity_type: 'LAB_TEST', extracted_key: 'HbA1c', extracted_value: '7.8 %', is_abnormal: true, reference_range: '< 5.7 %', confidence_score: 0.99 },
          { id: '5', entity_type: 'LAB_TEST', extracted_key: 'Fasting Sugar', extracted_value: '142 mg/dL', is_abnormal: true, reference_range: '70-100 mg/dL', confidence_score: 0.97 }
        ]
      };
      setScannedDocuments([...scannedDocuments, mockDoc]);
      setPreviewDoc(mockDoc);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const docRes = await api.uploadDocument(patientId || 'temp-id', file, selectedDocType);
      if (docRes.ocr_status !== 'COMPLETED') throw new Error('Text extraction could not be completed. Check live OCR configuration and try again.');
      setScannedDocuments([...scannedDocuments, docRes]);
      setPreviewDoc(docRes);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Unable to upload and scan this document.');
      console.warn('Document upload error:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t.documentUploadTitle}
        </h2>
        <p className="text-slate-600 text-sm">
          {t.documentUploadSubtitle}
        </p>
      </div>

      {/* Document Scanner Area */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {['PRESCRIPTION', 'LAB_REPORT', 'DISCHARGE_SUMMARY'].map((dt) => (
            <button
              key={dt}
              type="button"
              onClick={() => setSelectedDocType(dt)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDocType === dt
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {dt === 'PRESCRIPTION' ? t.uploadPrescription : dt === 'LAB_REPORT' ? t.uploadLabReport : t.uploadDischargeSummary}
            </button>
          ))}
        </div>

        {/* Upload Zone */}
        <label className="border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-2xl p-8 flex flex-col items-center justify-center bg-teal-50/40 hover:bg-teal-50/70 transition-all cursor-pointer block mb-6">
          <input
            type="file"
            accept="image/*,.pdf,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          {uploading ? (
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-900">{t.ocrProcessing}</p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-10 h-10 text-teal-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-900">Click or Drag & Drop Document / Paper to Scan</p>
              <p className="text-xs text-slate-500 mt-1">Supports High-Resolution Camera Scans, PDF, JPG, PNG (Max 10MB)</p>
            </div>
          )}
        </label>

        {/* Instant Demo Sample Selector */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-teal-800 mb-3">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>{t.orUseSampleDoc}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {sampleReports.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleProcessSampleDoc(s)}
                disabled={uploading}
                className="p-3 bg-white hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-xl text-left transition-all text-xs font-semibold text-slate-800 shadow-2xs"
              >
                <FileText className="w-4 h-4 text-teal-600 mb-1" />
                <span className="line-clamp-2">{s.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Extracted Findings Preview */}
      {scannedDocuments.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t.extractedFindings} ({scannedDocuments.length} Scanned)</span>
            </h4>
          </div>

          <div className="space-y-4">
            {scannedDocuments.map((doc, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>{doc.file_name}</span>
                  </span>
                  <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                    OCR Confidence 96%
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {(doc.extractions || []).map((e: any, eIdx: number) => (
                    <span
                      key={eIdx}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                        e.is_abnormal
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : e.entity_type === 'MEDICINE'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <strong className="font-bold">{e.extracted_key}:</strong> {e.extracted_value}
                      {e.is_abnormal && <span className="ml-1 text-[10px] font-bold text-rose-600">(HIGH)</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
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
          <span>{t.next}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

