import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { KioskWizard } from './components/kiosk/KioskWizard';
import { DoctorWorkspace } from './components/doctor/DoctorWorkspace';
import { OPDTriageWorkspace } from './components/triage/OPDTriageWorkspace';
import { AdminWorkspace } from './components/admin/AdminWorkspace';
import { LanguageCode } from './i18n/translations';
import { ShieldCheck, HeartPulse } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'kiosk' | 'doctor' | 'staff' | 'admin'>('kiosk');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [voiceGuidance, setVoiceGuidance] = useState(false);
  const [kioskKey, setKioskKey] = useState(0);

  const handleResetKiosk = () => {
    setKioskKey((prev) => prev + 1);
  };

  return (
    <div className="app-shell min-h-screen overflow-x-hidden flex flex-col text-slate-900 selection:bg-teal-100 selection:text-teal-900 font-sans">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onSelectView={setCurrentView}
        language={language}
        onLanguageChange={setLanguage}
        voiceGuidance={voiceGuidance}
        onToggleVoice={() => setVoiceGuidance(!voiceGuidance)}
        onResetKiosk={handleResetKiosk}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'kiosk' ? (
          <KioskWizard
            key={kioskKey}
            language={language}
            onLanguageChange={setLanguage}
            voiceGuidance={voiceGuidance}
            onToggleVoice={() => setVoiceGuidance(!voiceGuidance)}
            onOpenDoctorView={() => setCurrentView('doctor')}
          />
        ) : currentView === 'doctor' ? (
          <DoctorWorkspace initialRole="doctor" />
        ) : currentView === 'staff' ? (
          <OPDTriageWorkspace />
        ) : (
          <AdminWorkspace />
        )}
      </main>

      {/* Footer with Medical Safety Disclaimer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-slate-700 font-semibold">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span>MediKiosk • Code Titans</span>
          </div>

          <p className="text-[11px] text-slate-500 max-w-2xl">
            <strong>Medical Principle:</strong> MediKiosk is strictly an information collection, organization, and summarization assistant. It never independently diagnoses, prescribes medication, or replaces a licensed physician.
          </p>

          <div className="flex items-center space-x-1 text-[11px] text-teal-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>ABDM Ready • HIPAA / DISHA Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
