import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Clock, AlertTriangle, User, RefreshCw } from 'lucide-react';
import { RedFlagAlert } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';
import { MOCK_ALERTS } from '../../data/mockData';

interface RedFlagAlertsPanelProps {
  onSelectCase: (caseId: string) => void;
}

export const RedFlagAlertsPanel: React.FC<RedFlagAlertsPanelProps> = ({ onSelectCase }) => {
  const [alerts, setAlerts] = useState<RedFlagAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts();
      setAlerts(data.length > 0 ? data : MOCK_ALERTS);
    } catch (e) {
      console.warn('Fetch alerts error, using mock:', e);
      setAlerts(MOCK_ALERTS);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.acknowledgeAlert(alertId);
      fetchAlerts();
    } catch (err) {
      console.warn('Acknowledge error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Hospital Triage Red-Flag Alert Center</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time safety rules engine detections. Nursing triage and duty physician acknowledgment required.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">Loading active emergency alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">No unacknowledged red-flag alerts.</p>
          <p className="text-xs text-slate-500 mt-1">All OPD patient intakes meet routine triage safety criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((al) => (
            <div
              key={al.id}
              onClick={() => onSelectCase(al.case_id)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4 ${
                al.is_acknowledged
                  ? 'bg-white border-slate-200'
                  : al.severity === 'CRITICAL'
                  ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-200/50 shadow-xs'
                  : 'bg-amber-50/70 border-amber-300'
              }`}
            >
              <div className="flex items-start space-x-3 max-w-2xl">
                <ShieldAlert
                  className={`w-6 h-6 shrink-0 mt-0.5 ${
                    al.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                  }`}
                />
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant={al.severity === 'CRITICAL' ? 'critical' : 'high'} size="sm">
                      {al.severity} ALERT
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500">
                      {new Date(al.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{al.alert_message}</h4>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Trigger reason: <span className="font-semibold text-slate-800">{al.trigger_reason}</span>
                  </p>
                  {al.is_acknowledged && (
                    <p className="text-[11px] text-emerald-700 font-bold mt-1">
                      ✓ Acknowledged by {al.acknowledged_by || 'Duty Physician'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!al.is_acknowledged && (
                  <button
                    onClick={(e) => handleAcknowledge(al.id, e)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={() => onSelectCase(al.case_id)}
                  className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold border border-teal-200"
                >
                  Review Case →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
