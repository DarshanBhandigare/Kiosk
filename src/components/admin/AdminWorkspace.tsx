import React, { useState } from 'react';
import {
  Users, Activity, ShieldAlert, FileText, Settings, Clock,
  TrendingUp, Database, CheckCircle2, AlertTriangle, BarChart3,
  UserCheck, MonitorSmartphone, Languages, RefreshCw, Lock, Server,
  Stethoscope, LogOut
} from 'lucide-react';
import { MOCK_SYSTEM_STATS, MOCK_AUDIT_LOGS, MOCK_RED_FLAG_RULES, MOCK_QUEUE, DEMO_USERS, DEMO_PASSWORDS } from '../../data/mockData';

interface AdminDashboardProps {
  currentUser: any;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'rules' | 'audit' | 'system'>('overview');
  const stats = MOCK_SYSTEM_STATS;

  const StatCard = ({ icon: Icon, label, value, sub, color = 'teal', urgent = false }: any) => (
    <div className={`bg-white rounded-2xl border ${urgent ? 'border-rose-200 shadow-rose-100' : 'border-slate-200'} p-5 shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${urgent ? 'bg-rose-50' : `bg-${color}-50`}`}>
          <Icon className={`w-4.5 h-4.5 ${urgent ? 'text-rose-600' : `text-${color}-600`}`} size={18} />
        </div>
      </div>
      <p className={`text-3xl font-black ${urgent ? 'text-rose-700' : 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );

  const severityBadge = (s: string) => {
    const map: Record<string, string> = {
      CRITICAL: 'bg-rose-100 text-rose-700 border border-rose-200',
      WARN: 'bg-amber-100 text-amber-700 border border-amber-200',
      INFO: 'bg-teal-50 text-teal-700 border border-teal-200',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'rules', label: 'Red-Flag Rules', icon: ShieldAlert },
    { key: 'audit', label: 'Audit Log', icon: FileText },
    { key: 'system', label: 'System Status', icon: Server },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Admin Sub-Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold text-sm">
            {currentUser.avatar_initials || 'A'}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{currentUser.full_name}</h1>
            <p className="text-xs text-slate-500">Role: <strong className="text-violet-700">Admin</strong> • {currentUser.department}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <nav className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs flex-wrap gap-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === key
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-3">Today's Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard icon={Users} label="Total Patients" value={stats.today.total_patients} sub="OPD today" />
              <StatCard icon={Clock} label="Waiting Review" value={stats.today.waiting} sub="In queue" />
              <StatCard icon={Activity} label="Under Review" value={stats.today.under_review} sub="Active" color="amber" />
              <StatCard icon={CheckCircle2} label="Completed" value={stats.today.completed} sub="Approved" color="emerald" />
              <StatCard icon={ShieldAlert} label="Red Flags" value={stats.today.red_flags_total} sub="Total today" urgent={true} />
              <StatCard icon={AlertTriangle} label="Unacknowledged" value={stats.today.red_flags_unacknowledged} sub="Need attention" urgent={true} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dept Breakdown */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Top Departments — This Week</h3>
              <div className="space-y-3">
                {stats.week.top_departments.map(dept => {
                  const max = stats.week.top_departments[0].count;
                  const pct = Math.round((dept.count / max) * 100);
                  return (
                    <div key={dept.name} className="flex items-center space-x-3">
                      <span className="text-xs text-slate-600 w-36 shrink-0">{dept.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 w-6 text-right">{dept.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Language & Kiosk Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Kiosk & Language Stats — Today</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5"><MonitorSmartphone size={12} />Sessions Started</span>
                  <strong>{stats.today.kiosk_sessions_started}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Sessions Completed</span>
                  <strong className="text-teal-700">{stats.today.kiosk_sessions_completed}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5"><Clock size={12} />Avg Kiosk Time</span>
                  <strong>{stats.today.avg_kiosk_time_mins} min</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Documents Scanned</span>
                  <strong>{stats.today.documents_scanned}</strong>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Languages size={12} />Languages Used</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(stats.today.languages).map(([lang, count]) => (
                    <div key={lang} className="bg-teal-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-black text-teal-700">{count}</p>
                      <p className="text-[10px] text-teal-600 uppercase font-bold">{lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Marathi'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Summary Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-black text-slate-900">{stats.week.total_patients}</p>
              <p className="text-xs text-slate-500 mt-1">Patients This Week</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-black text-rose-700">{stats.week.red_flags}</p>
              <p className="text-xs text-slate-500 mt-1">Red Flags This Week</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-black text-teal-700">{stats.week.avg_kiosk_time_mins} min</p>
              <p className="text-xs text-slate-500 mt-1">Avg Kiosk Time (Week)</p>
            </div>
          </div>
        </div>
      )}

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Clinical Staff Accounts</h2>
            <span className="text-xs bg-violet-50 text-violet-700 px-3 py-1 rounded-full font-bold border border-violet-200">
              {Object.keys(DEMO_USERS).length} users
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Name</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Username</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Role</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Department</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Password (Demo)</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(DEMO_USERS).map((user: any) => (
                  <tr key={user.user_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                          user.role === 'admin' ? 'bg-violet-600' : user.role === 'doctor' ? 'bg-teal-600' : 'bg-sky-500'
                        }`}>
                          {user.avatar_initials}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{user.full_name}</p>
                          <p className="text-[10px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700">{user.username}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${
                        user.role === 'admin' ? 'bg-violet-100 text-violet-700' :
                        user.role === 'doctor' ? 'bg-teal-50 text-teal-700' : 'bg-sky-50 text-sky-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{user.department}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-mono border border-amber-200">
                        {DEMO_PASSWORDS[user.username]}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RED FLAG RULES TAB */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Red-Flag Detection Rules</h2>
            <span className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-bold border border-teal-200">
              {MOCK_RED_FLAG_RULES.filter(r => r.is_active).length} active rules
            </span>
          </div>
          <div className="grid gap-4">
            {MOCK_RED_FLAG_RULES.map(rule => (
              <div key={rule.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className={`mt-0.5 w-3 h-3 rounded-full shrink-0 ${rule.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{rule.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{rule.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    rule.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {rule.severity}
                  </span>
                  <span className="text-xs text-slate-500">{rule.trigger_count_today} triggers today</span>
                  <div className="flex items-center space-x-1.5">
                    <div className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={`text-[11px] font-bold ${rule.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {rule.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800">System Audit Log</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Time</th>
                  <th className="text-left font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Actor</th>
                  <th className="text-left font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Action</th>
                  <th className="text-left font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Resource</th>
                  <th className="text-left font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Details</th>
                  <th className="text-left font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Level</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_AUDIT_LOGS.map(log => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{log.actor}</td>
                    <td className="px-4 py-2.5">
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{log.action}</code>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{log.resource}</td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">{log.details}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${severityBadge(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SYSTEM STATUS TAB */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-800">System Status & Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-700">Application Info</h3>
              {[
                ['Version', stats.system.version],
                ['AI Provider', stats.system.ai_provider],
                ['OCR Engine', stats.system.ocr_provider],
                ['System Uptime', stats.system.uptime],
                ['DB Size', `${stats.system.db_size_mb} MB`],
                ['Last Backup', new Date(stats.system.last_backup).toLocaleDateString('en-IN')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-bold text-slate-800">{value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {[
                { label: 'Backend API', status: 'Offline (Demo Mode)', color: 'amber', icon: Server },
                { label: 'AI / Gemini', status: 'Mock Provider Active', color: 'teal', icon: Activity },
                { label: 'OCR Engine', status: 'Mock Provider Active', color: 'teal', icon: FileText },
                { label: 'Database', status: 'SQLite (Local Demo)', color: 'teal', icon: Database },
                { label: 'ABDM Integration', status: 'Simulator Mode', color: 'sky', icon: RefreshCw },
                { label: 'Kiosk Interface', status: 'Online', color: 'emerald', icon: MonitorSmartphone },
              ].map(({ label, status, color, icon: Icon }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Icon className="text-slate-400" size={15} />
                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      color === 'emerald' ? 'bg-emerald-500' :
                      color === 'teal' ? 'bg-teal-500' :
                      color === 'amber' ? 'bg-amber-400' : 'bg-sky-400'
                    }`} />
                    <span className={`text-xs font-bold ${
                      color === 'emerald' ? 'text-emerald-700' :
                      color === 'teal' ? 'text-teal-700' :
                      color === 'amber' ? 'text-amber-700' : 'text-sky-700'
                    }`}>{status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── LOGIN WRAPPER ────────────────────────────────────────────────────────────

interface AdminWorkspaceProps {
  onLogout?: () => void;
}

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({ onLogout: parentLogout }) => {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const stored = localStorage.getItem('medikiosk_admin_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [username, setUsername] = useState('admin.meera');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (u: string, p: string) => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      const user = DEMO_USERS[u];
      if (user && DEMO_PASSWORDS[u] === p) {
        if (user.role !== 'admin') {
          setError('Access denied: Admin credentials required.');
          setLoading(false);
          return;
        }
        localStorage.setItem('medikiosk_admin_user', JSON.stringify(user));
        setCurrentUser(user);
      } else {
        setError('Invalid username or password.');
      }
      setLoading(false);
    }, 400);
  };

  const handleLogout = () => {
    localStorage.removeItem('medikiosk_admin_user');
    setCurrentUser(null);
    parentLogout?.();
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center mx-auto mb-4 border border-violet-200">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">Admin Login</h2>
          <p className="text-xs text-slate-500 mb-6">Hospital Administration Portal</p>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(username, password); }} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Username</label>
              <input
                type="text" value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In to Admin Portal'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-left">
            <span className="text-slate-500 font-semibold block mb-2">Demo Admin Account:</span>
            <button
              type="button"
              onClick={() => { setUsername('admin.meera'); setPassword('Admin@123'); handleLogin('admin.meera', 'Admin@123'); }}
              className="w-full p-2.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl text-left transition-colors"
            >
              <strong className="block text-slate-900">Meera Desai</strong>
              <span className="text-[10px] text-slate-500">System Administrator • admin.meera / Admin@123</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />;
};
