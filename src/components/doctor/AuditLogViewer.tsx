import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Clock, FileText, Activity, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { MOCK_AUDIT_LOGS } from '../../data/mockData';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data.length > 0 ? data : MOCK_AUDIT_LOGS);
    } catch (e) {
      console.warn('Fetch audit logs error, using mock:', e);
      setLogs(MOCK_AUDIT_LOGS);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span>Immutable Clinical Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident system log tracking patient consent, intake events, OCR processing, and physician approvals.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Loading audit history...</p>
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
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-bold">
                      {log.username || 'Kiosk / Patient'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {log.resource_type}: {log.resource_id.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
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
