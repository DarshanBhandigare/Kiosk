import React, { useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, ChevronRight, Clock, Lock,
  RefreshCw, ShieldAlert, Siren, UserCheck, Users
} from 'lucide-react';
import { QueueItem, RedFlagAlert } from '../../types';
import { api } from '../../services/api';

interface OPDTriageWorkspaceProps {
  onLogout?: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  WAITING_REVIEW: { label: 'Waiting Triage', className: 'bg-amber-100 text-amber-800' },
  TRIAGED: { label: 'Triaged', className: 'bg-sky-100 text-sky-800' },
  UNDER_REVIEW: { label: 'Escalated to Doctor', className: 'bg-rose-100 text-rose-800' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-100 text-emerald-800' },
  COMPLETED: { label: 'Completed', className: 'bg-slate-100 text-slate-700' },
};

const timeAgo = (iso: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
};

export const OPDTriageWorkspace: React.FC<OPDTriageWorkspaceProps> = ({ onLogout: parentLogout }) => {
  const storedUser = api.getStoredUser();
  const [currentUser, setCurrentUser] = useState<any>(storedUser?.role === 'staff' ? storedUser : null);
  const [username, setUsername] = useState('staff.priya');
  const [password, setPassword] = useState('Staff@123');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [alerts, setAlerts] = useState<RedFlagAlert[]>([]);
  const [selectedCase, setSelectedCase] = useState<QueueItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'priority' | 'waiting' | 'triaged'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTriageData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cases, activeAlerts] = await Promise.all([api.getQueue(), api.getAlerts(false)]);
      setQueue(cases);
      setAlerts(activeAlerts);
      setSelectedCase((current) => cases.find((item) => item.id === current?.id) || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the live OPD queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) loadTriageData();
  }, [currentUser]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await api.login(username, password);
      if (user.role !== 'staff') {
        api.logout();
        setError('Use a triage staff account to access this workspace.');
        return;
      }
      setCurrentUser(user);
    } catch {
      setError('Invalid triage staff username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    parentLogout?.();
  };

  const handleTriageAction = async (action: 'triage' | 'escalate') => {
    if (!selectedCase) return;
    setLoading(true);
    setError('');
    try {
      if (action === 'triage') {
        await api.markCaseTriaged(selectedCase.id);
      } else {
        await api.escalateCaseToDoctor(selectedCase.id);
      }
      await loadTriageData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update the case.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto mb-4 border border-sky-200">
            <Activity className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">OPD Triage Login</h2>
          <p className="text-xs text-slate-500 mb-6">Triage nurse and healthcare assistant access</p>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <input value={username} onChange={(event) => setUsername(event.target.value)} className="w-full p-3 rounded-xl border border-slate-300 text-sm" aria-label="Username" />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full p-3 rounded-xl border border-slate-300 text-sm" aria-label="Password" />
            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In to Triage'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const priorityCases = queue.filter((item) => item.has_red_flag);
  const waitingCases = queue.filter((item) => item.status === 'WAITING_REVIEW');
  const triagedCases = queue.filter((item) => item.status === 'TRIAGED');
  const filteredQueue = filter === 'priority' ? priorityCases : filter === 'waiting' ? waitingCases : filter === 'triaged' ? triagedCases : queue;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">OPD Triage</h1>
          <p className="text-xs text-slate-500">{currentUser.full_name} · Live shared OPD queue</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadTriageData} disabled={loading} className="p-2 rounded-xl border border-slate-200 text-slate-600"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          <button onClick={handleLogout} className="p-2 rounded-xl border border-slate-200 text-slate-600"><Lock className="w-4 h-4" /></button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          ['all', 'Total in OPD', queue.length, Users],
          ['priority', 'Priority cases', priorityCases.length, ShieldAlert],
          ['waiting', 'Waiting triage', waitingCases.length, Clock],
          ['triaged', 'Ready for doctor', triagedCases.length, CheckCircle2],
        ].map(([id, label, count, Icon]) => (
          <button key={id as string} onClick={() => setFilter(id as typeof filter)} className={`rounded-2xl border p-4 text-left ${filter === id ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white'}`}>
            <Icon className="w-5 h-5 text-sky-600 mb-2" />
            <p className="text-2xl font-black">{count as number}</p>
            <p className="text-xs text-slate-500">{label as string}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          {filteredQueue.map((item) => {
            const status = statusConfig[item.status] || statusConfig.WAITING_REVIEW;
            return (
              <button key={item.id} onClick={() => setSelectedCase(item)} className={`w-full rounded-2xl border p-4 text-left ${selectedCase?.id === item.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full ${item.has_red_flag ? 'bg-rose-500' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><span className="font-mono text-xs font-bold text-sky-700">{item.token_number}</span><span className="font-bold">{item.patient_name}</span>{item.has_red_flag && <span className="text-[10px] font-bold text-rose-700">PRIORITY</span>}</div>
                    <p className="text-sm text-slate-700 mt-1">{item.chief_complaint}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.department} · {timeAgo(item.created_at)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${status.className}`}>{status.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            );
          })}
          {!loading && filteredQueue.length === 0 && <p className="text-center py-12 text-slate-500">No cases in this queue.</p>}
        </div>

        <div className="space-y-4">
          {selectedCase ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="font-mono text-xs text-sky-700 font-bold">{selectedCase.token_number}</p>
              <h2 className="font-bold text-lg">{selectedCase.patient_name}</h2>
              <p className="text-sm text-slate-700 mt-3">{selectedCase.chief_complaint}</p>
              <p className="text-xs text-slate-500 mt-3">{selectedCase.patient_age || '—'} years · {selectedCase.patient_sex || 'Not recorded'} · {selectedCase.department}</p>
              <div className="mt-5 space-y-2">
                <button onClick={() => handleTriageAction('triage')} disabled={loading || selectedCase.status !== 'WAITING_REVIEW'} className="w-full py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"><UserCheck className="w-4 h-4" />Mark Triaged</button>
                {selectedCase.has_red_flag && <button onClick={() => handleTriageAction('escalate')} disabled={loading || selectedCase.status === 'UNDER_REVIEW'} className="w-full py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"><Siren className="w-4 h-4" />Escalate to Doctor</button>}
              </div>
            </div>
          ) : <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Select a live OPD case to triage it.</div>}

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 font-bold text-sm"><AlertTriangle className="w-4 h-4 text-rose-600" />Active alerts ({alerts.length})</div>
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {alerts.map((alert) => <div key={alert.id} className="p-3 text-xs"><p className="font-semibold text-slate-800">{alert.trigger_reason}</p><p className="text-slate-500 mt-1">{alert.alert_message}</p></div>)}
              {!alerts.length && <p className="p-4 text-xs text-slate-500">No unacknowledged alerts.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
