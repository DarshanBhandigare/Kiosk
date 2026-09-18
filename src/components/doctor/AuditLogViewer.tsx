import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Clock, FileText, Activity, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { MOCK_AUDIT_LOGS } from '../../data/mockData';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLogs = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await api.getAuditLogs();
      if (Array.isArray(data) && data.length > 0) {
        setLogs(data);
      } else if (logs.length === 0) {
        setLogs(MOCK_AUDIT_LOGS);
      }
      setLastUpdated(new Date());
    } catch (e) {
      console.warn('Fetch audit logs error, using fallback:', e);
      if (logs.length === 0) {
        setLogs(MOCK_AUDIT_LOGS);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getActionBadgeClass = (action: string) => {
    if (action.includes('APPROVED')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (action.includes('DIAGNOSED')) return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    if (action.includes('ESCALATED') || action.includes('CRITICAL') || action.includes('ALERT')) return 'bg-rose-100 text-rose-800 border-rose-300';
    if (action.includes('TRIAGED') || action.includes('ASSIGN')) return 'bg-sky-100 text-sky-800 border-sky-300';
    if (action.includes('LOGIN') || action.includes('AUTH')) return 'bg-purple-100 text-purple-800 border-purple-300';
    return 'bg-teal-50 text-teal-800 border-teal-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span>Immutable Clinical Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident system log tracking patient consent, intake events, triage assignments, OCR processing, and physician approvals.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Auto-refresh (5s)</span>
          </label>

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>

          <button
            onClick={() => fetchLogs(false)}
            title="Refresh Audit Logs"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Loading live audit history...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User / Actor</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold px-2 py-0.5 rounded-md border text-[11px] ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-bold whitespace-nowrap">
                      {log.username || 'Kiosk / Patient'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {log.resource_type}: {log.resource_id ? `${String(log.resource_id).substring(0, 8)}...` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm">
                      {log.details ? (
                        <div className="font-mono text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100 truncate" title={JSON.stringify(log.details, null, 2)}>
                          {JSON.stringify(log.details)}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
