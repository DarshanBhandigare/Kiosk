import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, ArrowRight, ArrowLeft, Eye } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';
import { api } from '../../services/api';

interface Step9Props {
  language: LanguageCode;
  onNext: () => void;
  onBack: () => void;
  patientId: string;
  patientData: any;
  setPatientData: (data: any) => void;
  scannedDocuments: any[];
  setScannedDocuments: (docs: any[]) => void;
}

export const Step9DocumentScanner: React.FC<Step9Props> = ({
  language,
  onNext,
  onBack,
  patientId,
  patientData,
  setPatientData,
  scannedDocuments,
  setScannedDocuments
}) => {
  const t = translations[language];
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('PRESCRIPTION');
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const ensurePatientId = async () => {
    if (patientId) return patientId;
    if (!patientData.full_name?.trim() || !patientData.sex) {
      throw new Error('Complete the patient name and sex before uploading a document.');
    }
    const patient = await api.registerPatient({ ...patientData, preferred_language: language });
    setPatientData({ ...patientData, id: patient.id });
    return patient.id;
  };

  const sampleReports = [
    {
      title: "Chest Pain Prescription",
      type: "PRESCRIPTION",
      sampleText: `CITY MULTISPECIALITY HOSPITAL & RESEARCH CENTRE
Date: 12/01/2026
Patient: Demo Patient
Clinical Impression: Chest pain with hypertension risk factors
Rx:
1. Tab. Telmisartan 40 mg - 1 tab Once Daily (OD)
2. Tab. Metformin 500 mg - 1 tab Twice Daily (BD)
3. Tab. Atorvastatin 20 mg - 1 tab At Bedtime (HS)
4. Tab. Pantoprazole 40 mg - 1 tab Early morning empty stomach (OD)
Advice: Seek urgent clinical review for persistent or worsening chest pain.`,
      extractions: [
        { entity_type: 'DIAGNOSIS', extracted_key: 'Clinical Impression', extracted_value: 'Chest pain with hypertension risk factors' },
        { entity_type: 'MEDICINE', extracted_key: 'Telmisartan', extracted_value: '40 mg once daily' },
        { entity_type: 'MEDICINE', extracted_key: 'Metformin', extracted_value: '500 mg twice daily' },
        { entity_type: 'MEDICINE', extracted_key: 'Atorvastatin', extracted_value: '20 mg at bedtime' },
        { entity_type: 'MEDICINE', extracted_key: 'Pantoprazole', extracted_value: '40 mg once daily' }
      ]
    },
    {
      title: "Headache Prescription",
      type: "PRESCRIPTION",
      sampleText: `GENERAL OPD PRESCRIPTION
Date: 18/02/2026
Patient: Demo Patient
Clinical Impression: Acute migraine-type headache
Rx:
1. Tab. Paracetamol 650 mg - 1 tablet after food as needed
2. Tab. Naproxen 250 mg - 1 tablet twice daily after food for 3 days
3. Tab. Domperidone 10 mg - 1 tablet before food as needed
Advice: Rest in a quiet, dark room and maintain hydration.`,
      extractions: [
        { entity_type: 'DIAGNOSIS', extracted_key: 'Clinical Impression', extracted_value: 'Acute migraine-type headache' },
        { entity_type: 'MEDICINE', extracted_key: 'Paracetamol', extracted_value: '650 mg as needed' },
        { entity_type: 'MEDICINE', extracted_key: 'Naproxen', extracted_value: '250 mg twice daily for 3 days' },
        { entity_type: 'MEDICINE', extracted_key: 'Domperidone', extracted_value: '10 mg as needed' }
      ]
    },
    {
      title: "Fever and Cold Prescription",
      type: "PRESCRIPTION",
      sampleText: `GENERAL OPD PRESCRIPTION
Date: 22/02/2026
Patient: Demo Patient
Clinical Impression: Acute fever with upper respiratory symptoms
Rx:
1. Tab. Paracetamol 500 mg - 1 tablet every 6 hours as needed
2. Tab. Cetirizine 10 mg - 1 tablet at night for 5 days
3. Oral rehydration solution - frequent small sips
Advice: Monitor temperature and seek review for breathing difficulty.`,
      extractions: [
        { entity_type: 'DIAGNOSIS', extracted_key: 'Clinical Impression', extracted_value: 'Acute fever with upper respiratory symptoms' },
        { entity_type: 'MEDICINE', extracted_key: 'Paracetamol', extracted_value: '500 mg every 6 hours as needed' },
        { entity_type: 'MEDICINE', extracted_key: 'Cetirizine', extracted_value: '10 mg at night for 5 days' },
        { entity_type: 'MEDICINE', extracted_key: 'Oral rehydration solution', extracted_value: 'Frequent small sips' }
      ]
    },
    {
      title: "Acidity Prescription",
      type: "PRESCRIPTION",
      sampleText: `GASTROINTESTINAL OPD PRESCRIPTION
Date: 25/02/2026
Patient: Demo Patient
Clinical Impression: Acid reflux symptoms
Rx:
1. Tab. Pantoprazole 40 mg - 1 tablet before breakfast for 14 days
2. Syrup antacid - 10 ml after meals as needed
3. Tab. Simethicone 80 mg - 1 tablet after meals as needed
Advice: Eat smaller meals and avoid late-night spicy or oily food.`,
      extractions: [
        { entity_type: 'DIAGNOSIS', extracted_key: 'Clinical Impression', extracted_value: 'Acid reflux symptoms' },
        { entity_type: 'MEDICINE', extracted_key: 'Pantoprazole', extracted_value: '40 mg before breakfast for 14 days' },
        { entity_type: 'MEDICINE', extracted_key: 'Antacid syrup', extracted_value: '10 ml after meals as needed' },
        { entity_type: 'MEDICINE', extracted_key: 'Simethicone', extracted_value: '80 mg after meals as needed' }
      ]
    },
    {
      title: "Diabetes Follow-up Prescription",
      type: "PRESCRIPTION",
      sampleText: `DIABETES FOLLOW-UP PRESCRIPTION
Date: 01/03/2026
Patient: Demo Patient
Clinical Impression: Type 2 diabetes follow-up
Rx:
1. Tab. Metformin 500 mg - 1 tablet twice daily with meals
2. Tab. Glimepiride 1 mg - 1 tablet before breakfast
3. Continue home blood glucose monitoring
Advice: Bring glucose readings to the next review.`,
      extractions: [
        { entity_type: 'DIAGNOSIS', extracted_key: 'Clinical Impression', extracted_value: 'Type 2 diabetes follow-up' },
        { entity_type: 'MEDICINE', extracted_key: 'Metformin', extracted_value: '500 mg twice daily' },
        { entity_type: 'MEDICINE', extracted_key: 'Glimepiride', extracted_value: '1 mg before breakfast' },
        { entity_type: 'TEST_RESULT', extracted_key: 'Monitoring', extracted_value: 'Continue home blood glucose monitoring' }
      ]
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
      const activePatientId = await ensurePatientId();
      const docRes = await api.uploadDocument(activePatientId, file, sample.type);
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
        extractions: sample.extractions || [
          { id: '4', entity_type: 'LAB_TEST', extracted_key: 'HbA1c', extracted_value: '7.8 %', is_abnormal: true, reference_range: '< 5.7 %', confidence_score: 0.99 },
          { id: '5', entity_type: 'LAB_TEST', extracted_key: 'Fasting Sugar', extracted_value: '142 mg/dL', is_abnormal: true, reference_range: '70-100 mg/dL', confidence_score: 0.97 }
        ]
      };
      setScannedDocuments([...scannedDocuments, mockDoc]);
      setPreviewDoc(mockDoc);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    setUploadError(null);
    try {
      const activePatientId = await ensurePatientId();
      const docRes = await api.uploadDocument(activePatientId, file, selectedDocType);
      if (docRes.ocr_status !== 'COMPLETED') {
        throw new Error(docRes.ocr_raw_text || 'Text extraction could not be completed. Check live OCR configuration and try again.');
      }
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
        <label className="border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-2xl p-8 flex flex-col items-center justify-center bg-teal-50/40 hover:bg-teal-50/70 transition-all cursor-pointer mb-6">
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
        {uploadError && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-bold">Document processing needs attention</p>
              <p className="mt-0.5">{uploadError}</p>
              <p className="mt-1 text-amber-700">For image OCR, configure GEMINI_API_KEY on the backend. The sample documents below work offline.</p>
            </div>
          </div>
        )}

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
                    OCR Confidence {Math.round(Math.max(...(doc.extractions || []).map((item: any) => item.confidence_score || 0.96), 0) * 100)}%
                  </span>
                </div>

                {doc.ocr_raw_text && (
                  <details className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <summary className="cursor-pointer text-xs font-bold text-slate-700">View extracted text</summary>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-slate-600">{doc.ocr_raw_text}</pre>
                  </details>
                )}

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

