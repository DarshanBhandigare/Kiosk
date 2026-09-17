import React, { useState } from 'react';
import { Shield, Search, CheckCircle2, RefreshCw, Send, Loader2, FileCode } from 'lucide-react';
import { api } from '../../services/api';

export const AbdmSimulatorModal: React.FC = () => {
  const [abhaInput, setAbhaInput] = useState('91-8842-1920-5412');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    setSyncStatus('');
    try {
      const res = await api.verifyAbha(abhaInput);
      setResult(res);
    } catch (e) {
      console.warn('Verify error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncHmis = () => {
    setSyncStatus('FHIR Encounter Resource successfully serialized & queued for ABDM Health Information Exchange (HIE-CM).');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
          <Shield className="w-4 h-4 text-teal-600" />
          <span>ABDM (Ayushman Bharat Digital Mission) & HMIS Hub</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Sandbox Health Record Gateway
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Simulates ABHA (Ayushman Bharat Health Account) verification and FHIR clinical artifact bundle exchange.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">1. Verify ABHA Identifier</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={abhaInput}
              onChange={(e) => setAbhaInput(e.target.value)}
              placeholder="e.g. 91-8842-1920-5412"
              className="flex-1 p-3 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
            />
            <button
              onClick={handleVerify}
              disabled={loading}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Lookup</span>
            </button>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center font-bold text-slate-900 pb-2 border-b border-slate-200">
                <span>{result.full_name}</span>
                <span className="text-emerald-700 font-bold">✓ ABDM Verified</span>
              </div>
              <p className="text-slate-600">ABHA Address: <strong className="text-slate-900 font-mono">{result.abha_address}</strong></p>
              <p className="text-slate-600">Mobile: <strong className="text-slate-900 font-mono">{result.mobile}</strong></p>
              <p className="text-slate-600">Address: <strong className="text-slate-900">{result.address}</strong></p>
              <span className="text-[10px] text-slate-400 block pt-1 italic">{result.disclaimer}</span>
            </div>
          )}
        </div>

        {/* HMIS / FHIR Exporter Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">2. HMIS / FHIR Bundle Simulator</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Exports MediKiosk structured clinical summaries and verified medical histories into standardized HL7/FHIR Bundle resources for hospital HMIS synchronization.
          </p>

          <button
            onClick={handleSyncHmis}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Generate & Sync FHIR Encounter Bundle</span>
          </button>

          {syncStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{syncStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
