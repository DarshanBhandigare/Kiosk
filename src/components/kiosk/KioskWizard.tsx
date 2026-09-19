import React, { useState } from 'react';
import { Step1Welcome } from './Step1Welcome';
import { Step2Language } from './Step2Language';
import { Step3Identification } from './Step3Identification';
import { Step4Consent } from './Step4Consent';
import { Step5BasicInfo } from './Step5BasicInfo';
import { Step6ChiefComplaint } from './Step6ChiefComplaint';
import { Step7AIInterview } from './Step7AIInterview';
import { Step8MedicalHistory } from './Step8MedicalHistory';
import { Step9DocumentScanner } from './Step9DocumentScanner';
import { Step10Timeline } from './Step10Timeline';
import { Step11RedFlag } from './Step11RedFlag';
import { Step12Review } from './Step12Review';
import { Step13Submission } from './Step13Submission';
import { LanguageCode } from '../../i18n/translations';
import { api } from '../../services/api';

interface KioskWizardProps {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  voiceGuidance: boolean;
  onToggleVoice: () => void;
  onOpenDoctorView: () => void;
}

export const KioskWizard: React.FC<KioskWizardProps> = ({
  language,
  onLanguageChange,
  voiceGuidance,
  onToggleVoice,
  onOpenDoctorView
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId, setSessionId] = useState('');
  const [patientData, setPatientData] = useState<any>({
    full_name: '',
    age: 54,
    sex: 'Male',
    contact_number: '+91 98220 11223',
    preferred_language: language,
    abha_id: ''
  });
  const [consentGiven, setConsentGiven] = useState(true);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [interviewAnswers, setInterviewAnswers] = useState<any[]>([]);
  const [clinicalHistory, setClinicalHistory] = useState<any>({
    medical_histories: [],
    medications: [],
    allergies: [],
    lifestyle: { diet_type: 'Vegetarian', smoking_status: 'NEVER', alcohol_status: 'NEVER' },
    ayurveda: {}
  });
  const [scannedDocuments, setScannedDocuments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [submissionError, setSubmissionError] = useState('');

  // Initialize session on Step 1 -> 2 or 3
  const handleStartSession = async () => {
    try {
      const sess = await api.createSession(language);
      setSessionId(sess.id);
    } catch (e) {
      setSessionId(`sess-${Date.now()}`);
    }
    setCurrentStep(2);
  };

  const handleQuickDemoPrefill = async () => {
    setPatientData({
      full_name: 'Ramesh Patil',
      age: 54,
      sex: 'Male',
      contact_number: '+91 98220 11223',
      emergency_contact: 'Sunita Patil (+91 98220 11224)',
      preferred_language: 'mr',
      abha_id: '91-8842-1920-5412',
      address: 'Shivaji Nagar, Pune, Maharashtra'
    });
    setChiefComplaint('Chest tightness and heaviness spreading to left arm with mild breathlessness for 3 days');
    setInterviewAnswers([
      { question_key: 'duration', question_text: 'Duration of symptoms', response_text: '3 days' },
      { question_key: 'severity', question_text: 'Severity of discomfort', response_text: '7 / 10' },
      { question_key: 'chest_radiation', question_text: 'Radiation of chest discomfort', response_text: 'Yes, radiates to left arm/jaw' }
    ]);
    setClinicalHistory({
      medical_histories: [
        { condition_name: 'Essential Hypertension', status: 'ACTIVE', diagnosed_year_or_duration: '5 years' },
        { condition_name: 'Borderline Type 2 Diabetes', status: 'ACTIVE', diagnosed_year_or_duration: '2 years' }
      ],
      medications: [
        { drug_name: 'Telmisartan', dosage: '40mg', frequency: 'Once Daily (OD)' },
        { drug_name: 'Metformin', dosage: '500mg', frequency: 'Twice Daily (BD)' },
        { drug_name: 'Atorvastatin', dosage: '20mg', frequency: 'Bedtime (HS)' }
      ],
      allergies: [],
      lifestyle: { diet_type: 'Vegetarian', smoking_status: 'FORMER', alcohol_status: 'NEVER', sleep_hours: '6 hours' },
      ayurveda: {}
    });

    try {
      const sess = await api.createSession(language);
      setSessionId(sess.id);
    } catch (e) {
      setSessionId(`sess-${Date.now()}`);
    }

    setCurrentStep(6);
  };

  const handleSubmitCase = async () => {
    setIsSubmitting(true);
    setSubmissionError('');
    try {
      // 1. Register Patient
      let patId = patientData.id;
      if (!patId) {
        const pRes = await api.registerPatient({
          ...patientData,
          preferred_language: language
        });
        patId = pRes.id;
      }

      // 2. Submit Case
      const casePayload = {
        patient_id: patId,
        patient_name: patientData.full_name || 'New Patient',
        patient_age: patientData.age,
        patient_sex: patientData.sex,
        contact_number: patientData.contact_number,
        abha_id: patientData.abha_id,
        address: patientData.address,
        preferred_language: language,
        session_id: sessionId || `sess-${Date.now()}`,
        chief_complaint: chiefComplaint || 'General health consultation',
        department: chiefComplaint.toLowerCase().includes('chest') ? 'Cardiology' : 'OPD General',
        symptoms: [
          {
            name: 'Primary Chief Complaint',
            custom_name: chiefComplaint,
            duration: interviewAnswers.find((a) => a.question_key === 'duration')?.response_text || '3 days',
            severity: parseInt(interviewAnswers.find((a) => a.question_key === 'severity')?.response_text) || 7,
            is_primary: true
          }
        ],
        medical_histories: clinicalHistory.medical_histories || [],
        medications: clinicalHistory.medications || [],
        allergies: clinicalHistory.allergies || [],
        lifestyle: clinicalHistory.lifestyle,
        ayurveda: clinicalHistory.ayurveda,
        documents: scannedDocuments,
      };

      const result = await api.createAndSubmitCase(casePayload);
      setSubmissionResult(result);
      setCurrentStep(13);
    } catch (err) {
      console.warn('Case submission failed:', err);
      setSubmissionError(err instanceof Error ? err.message : 'Case submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetKiosk = () => {
    setCurrentStep(1);
    setSessionId('');
    setChiefComplaint('');
    setInterviewAnswers([]);
    setClinicalHistory({
      medical_histories: [],
      medications: [],
      allergies: [],
      lifestyle: { diet_type: 'Vegetarian', smoking_status: 'NEVER', alcohol_status: 'NEVER' },
      ayurveda: {}
    });
    setScannedDocuments([]);
    setSubmissionResult(null);
    setSubmissionError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 py-6">
      {/* Kiosk Step Progress Header */}
      {currentStep > 1 && currentStep < 13 && (
        <div className="max-w-3xl mx-auto px-4 mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
            <span>Step {currentStep} of 12</span>
            <span>{Math.round((currentStep / 12) * 100)}% Complete</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 12) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Step Renderers */}
      {currentStep === 1 && (
        <Step1Welcome
          language={language}
          onNext={handleStartSession}
          onSelectLanguage={onLanguageChange}
          voiceGuidance={voiceGuidance}
          onToggleVoice={onToggleVoice}
          onQuickDemo={handleQuickDemoPrefill}
        />
      )}

      {currentStep === 2 && (
        <Step2Language
          language={language}
          onSelectLanguage={onLanguageChange}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
          voiceGuidance={voiceGuidance}
        />
      )}

      {currentStep === 3 && (
        <Step3Identification
          language={language}
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
          patientData={patientData}
          setPatientData={setPatientData}
        />
      )}

      {currentStep === 4 && (
        <Step4Consent
          language={language}
          onNext={() => setCurrentStep(5)}
          onBack={() => setCurrentStep(3)}
          consentGiven={consentGiven}
          setConsentGiven={setConsentGiven}
        />
      )}

      {currentStep === 5 && (
        <Step5BasicInfo
          language={language}
          onNext={() => setCurrentStep(6)}
          onBack={() => setCurrentStep(4)}
          patientData={patientData}
          setPatientData={setPatientData}
        />
      )}

      {currentStep === 6 && (
        <Step6ChiefComplaint
          language={language}
          onNext={() => setCurrentStep(7)}
          onBack={() => setCurrentStep(5)}
          chiefComplaint={chiefComplaint}
          setChiefComplaint={setChiefComplaint}
          voiceGuidance={voiceGuidance}
        />
      )}

      {currentStep === 7 && (
        <Step7AIInterview
          language={language}
          onNext={() => setCurrentStep(8)}
          onBack={() => setCurrentStep(6)}
          sessionId={sessionId}
          chiefComplaint={chiefComplaint}
          interviewAnswers={interviewAnswers}
          setInterviewAnswers={setInterviewAnswers}
          voiceGuidance={voiceGuidance}
        />
      )}

      {currentStep === 8 && (
        <Step8MedicalHistory
          language={language}
          onNext={() => setCurrentStep(9)}
          onBack={() => setCurrentStep(7)}
          clinicalHistory={clinicalHistory}
          setClinicalHistory={setClinicalHistory}
        />
      )}

      {currentStep === 9 && (
        <Step9DocumentScanner
          language={language}
          onNext={() => setCurrentStep(10)}
          onBack={() => setCurrentStep(8)}
          patientId={patientData.id}
          patientData={patientData}
          setPatientData={setPatientData}
          scannedDocuments={scannedDocuments}
          setScannedDocuments={setScannedDocuments}
        />
      )}

      {currentStep === 10 && (
        <Step10Timeline
          language={language}
          onNext={() => setCurrentStep(11)}
          onBack={() => setCurrentStep(9)}
          chiefComplaint={chiefComplaint}
          clinicalHistory={clinicalHistory}
          scannedDocuments={scannedDocuments}
        />
      )}

      {currentStep === 11 && (
        <Step11RedFlag
          language={language}
          onNext={() => setCurrentStep(12)}
          onBack={() => setCurrentStep(10)}
          chiefComplaint={chiefComplaint}
          interviewAnswers={interviewAnswers}
        />
      )}

      {currentStep === 12 && (
        <Step12Review
          language={language}
          onNext={handleSubmitCase}
          onBack={() => setCurrentStep(11)}
          onJumpToStep={(s) => setCurrentStep(s)}
          patientData={patientData}
          chiefComplaint={chiefComplaint}
          interviewAnswers={interviewAnswers}
          clinicalHistory={clinicalHistory}
          scannedDocuments={scannedDocuments}
          isSubmitting={isSubmitting}
          submissionError={submissionError}
        />
      )}

      {currentStep === 13 && (
        <Step13Submission
          language={language}
          patientId={submissionResult?.patient_id || patientData.id || ''}
          caseId={submissionResult?.id || ''}
          tokenNumber={submissionResult?.token_number || 'T-101'}
          department={submissionResult?.department || 'OPD General'}
          hasRedFlag={Boolean(submissionResult?.has_red_flag)}
          onReset={handleResetKiosk}
          onOpenDoctorView={onOpenDoctorView}
        />
      )}
    </div>
  );
};
