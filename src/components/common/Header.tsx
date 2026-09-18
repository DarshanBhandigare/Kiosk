import React from 'react';
import { Activity, User, ShieldAlert, FileText, Settings, Volume2, VolumeX, Stethoscope, Users, RefreshCw } from 'lucide-react';
import { LanguageCode, translations } from '../../i18n/translations';

interface HeaderProps {
  currentView: 'kiosk' | 'doctor' | 'staff' | 'admin';
  onSelectView: (view: 'kiosk' | 'doctor' | 'staff' | 'admin') => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  voiceGuidance: boolean;
  onToggleVoice: () => void;
  currentUser?: any;
  onQuickLogin?: (role: string) => void;
  onResetKiosk?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  language,
  onLanguageChange,
  voiceGuidance,
  onToggleVoice,
  currentUser,
  onQuickLogin,
  onResetKiosk
}) => {
  const t = translations[language];

  return (
    <header className="app-header sticky top-0 z-50 border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2 py-2 min-h-16">
          {/* Brand Name */}
          <div className="flex items-center min-w-0 flex-1 cursor-pointer" onClick={() => onSelectView('kiosk')}>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="display-heading text-xl font-extrabold tracking-tight text-slate-900">Medi<span className="text-teal-600">Kiosk</span></span>
                <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-wider bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200/60">
                  AI OPD Intake
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Clinical Information & Triage Preparation</p>
            </div>
          </div>

          {/* Mode Switcher Navigation */}
          <nav className="order-3 sm:order-none w-full sm:w-auto flex items-center justify-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 shadow-inner overflow-x-auto sm:max-w-[46vw]">
            <button
              onClick={() => onSelectView('kiosk')}
                className={`flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'kiosk'
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Patient Kiosk</span>
            </button>

            <button
              onClick={() => onSelectView('doctor')}
                className={`flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'doctor'
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Doctor Review</span>
            </button>

            <button
              onClick={() => onSelectView('staff')}
                className={`flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'staff'
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">OPD Triage</span>
            </button>

            <button
              onClick={() => onSelectView('admin')}
                className={`flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </nav>

          {/* Controls: Language, Voice, Quick Login */}
          <div className="flex items-center space-x-2">
            {/* Voice Guidance Toggle */}
            <button
              onClick={onToggleVoice}
              title={voiceGuidance ? t.voiceGuidanceOn : t.voiceGuidanceOff}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                voiceGuidance
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {voiceGuidance ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span className="hidden md:inline">{voiceGuidance ? 'Audio ON' : 'Audio OFF'}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  language === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  language === 'hi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="hidden sm:inline">हिंदी</span><span className="sm:hidden">हि</span>
              </button>
              <button
                onClick={() => onLanguageChange('mr')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  language === 'mr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="hidden sm:inline">मराठी</span><span className="sm:hidden">म</span>
              </button>
            </div>

            {/* Kiosk Reset Button */}
            {currentView === 'kiosk' && onResetKiosk && (
              <button
                onClick={onResetKiosk}
                title="Restart Kiosk Intake"
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
