import React, { useState, useEffect } from 'react';
import {
  Users, Stethoscope, ShieldAlert, FileText, Shield, Settings,
  LogOut, Lock, RefreshCw
} from 'lucide-react';
import { OPDQueue } from './OPDQueue';
import { PatientCaseView } from './PatientCaseView';
import { RedFlagAlertsPanel } from './RedFlagAlertsPanel';
import { AuditLogViewer } from './AuditLogViewer';
import { AbdmSimulatorModal } from './AbdmSimulatorModal';
import { AdminRulesPanel } from './AdminRulesPanel';
import { QueueItem } from '../../types';
import { api } from '../../services/api';
import { MOCK_QUEUE, DEMO_USERS, DEMO_PASSWORDS } from '../../data/mockData';

interface DoctorWorkspaceProps {
  initialRole?: 'doctor' | 'staff' | 'admin';
}

export const DoctorWorkspace: React.FC<DoctorWorkspaceProps> = ({ initialRole = 'doctor' }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'alerts' | 'abdm' | 'audit' | 'rules'>('queue');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Quick Login state
  const defaultUser = initialRole === 'admin' ? 'admin.meera' : 'dr.sharma';
  const defaultPass = initialRole === 'admin' ? 'Admin@123' : 'Doctor@123';
  const [username, setUsername] = useState(defaultUser);
  const [password, setPassword] = useState(defaultPass);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const user = api.getStoredUser();
    if (user && (user.role === 'doctor' || user.role === 'admin')) {
      setCurrentUser(user);
    }
    // Do NOT auto-login â€” let the user see the login screen
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchQueue();
    }
  }, [currentUser]);

  // Synchronize queue whenever a case is deleted or updated across workspaces
  useEffect(() => {
    const handleCaseDeleted = (e: any) => {
      const deletedId = e.detail?.caseId;
      if (deletedId && selectedCaseId === deletedId) {
        setSelectedCaseId(null);
      }
      fetchQueue();
    };

    const handleQueueUpdated = () => {
      fetchQueue();
    };

    window.addEventListener('medikiosk_case_deleted', handleCaseDeleted);
    window.addEventListener('medikiosk_queue_updated', handleQueueUpdated);

    return () => {
      window.removeEventListener('medikiosk_case_deleted', handleCaseDeleted);
      window.removeEventListener('medikiosk_queue_updated', handleQueueUpdated);
    };
  }, [selectedCaseId]);

  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const data = currentUser?.role === 'doctor' ? await api.getMyAssignedCases() : await api.getQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Queue fetch fallback to mock data:', e);
      setQueue([...MOCK_QUEUE]);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleLogin = async (u: string, p: string) => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      // Try real backend first
      const res = await api.login(u, p);
      setCurrentUser(res);
    } catch {
      // Fallback: offline mock login
      const mockUser = DEMO_USERS[u];
      const mockPass = DEMO_PASSWORDS[u];
      if (mockUser && mockPass === p) {
        localStorage.setItem('medikiosk_token', mockUser.access_token);
        localStorage.setItem('medikiosk_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
      } else {
        setLoginError('Invalid username or password.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <div className="login-shell min-h-[calc(100vh-8rem)] flex items-center justify-center py-10 px-4">
        <div className="login-card bg-white/95 w-full max-w-md p-7 sm:p-9 rounded-[1.75rem] border border-slate-200 text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-900/15">
            <Lock className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">Secure clinical workspace</span>
          <h2 className="display-heading text-2xl font-extrabold text-slate-900 mt-2 mb-1">Clinical Staff Login</h2>
          <p className="text-xs text-slate-500 mb-7">Review patient intake, triage signals, and physician-ready summaries.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin(username, password);
            }}
            className="space-y-4 text-left"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            {loginError && <p className="text-xs text-rose-600 font-bold">{loginError}</p>}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-900/15 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? 'Logging in...' : 'Sign In to Clinical Workspace'}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs space-y-2 text-left">
            <span className="text-slate-500 font-semibold block">Quick Demo Doctor Logins:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsername('dr.sharma');
                  setPassword('Doctor@123');
                  handleLogin('dr.sharma', 'Doctor@123');
                }}
                className="p-2 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-lg text-left"
              >
                <strong className="block text-slate-900">Dr. Anjali Sharma</strong>
                <span className="text-[10px] text-slate-500">MD General Physician</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername('dr.kapoor');
                  setPassword('Doctor@123');
                  handleLogin('dr.kapoor', 'Doctor@123');
                }}
                className="p-2 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-lg text-left"
              >
                <strong className="block text-slate-900">Dr. Rajiv Kapoor</strong>
                <span className="text-[10px] text-slate-500">DM Cardiologist</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Workspace Sub-Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-200/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="display-heading text-lg font-extrabold text-slate-900">{currentUser.full_name}</h1>
            <p className="text-xs text-slate-500 font-medium">
              Role: <strong className="text-teal-700 capitalize">{currentUser.role || 'Doctor'}</strong> â€¢ Department: OPD Clinical
            </p>
          </div>
        </div>

        {/* Doctor Workspace Tabs */}
        <div className="flex items-center space-x-2">
          <nav className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => {
                setSelectedCaseId(null);
                setActiveTab('queue');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'queue' && !selectedCaseId
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>OPD Queue ({queue.length})</span>
            </button>

            <button
              onClick={() => {
                setSelectedCaseId(null);
                setActiveTab('alerts');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'alerts'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Red-Flag Alerts</span>
            </button>

            <button
              onClick={() => {
                setSelectedCaseId(null);
                setActiveTab('abdm');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'abdm'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>ABDM / HMIS</span>
            </button>

            <button
              onClick={() => {
                setSelectedCaseId(null);
                setActiveTab('rules');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'rules'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Rules Engine</span>
            </button>

            <button
              onClick={() => {
                setSelectedCaseId(null);
                setActiveTab('audit');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'audit'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Log</span>
            </button>
          </nav>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      {selectedCaseId ? (
        <PatientCaseView
          caseId={selectedCaseId}
          onBack={() => {
            setSelectedCaseId(null);
            fetchQueue();
          }}
          onCaseUpdated={fetchQueue}
          onCaseDeleted={fetchQueue}
        />
      ) : activeTab === 'queue' ? (
        <OPDQueue
          queue={queue}
          loading={loadingQueue}
          currentDoctorName={currentUser?.full_name}
          onSelectCase={(id) => setSelectedCaseId(id)}
          onRefresh={fetchQueue}
        />
      ) : activeTab === 'alerts' ? (
        <RedFlagAlertsPanel onSelectCase={(id) => setSelectedCaseId(id)} />
      ) : activeTab === 'abdm' ? (
        <AbdmSimulatorModal />
      ) : activeTab === 'rules' ? (
        <AdminRulesPanel />
      ) : (
        <AuditLogViewer />
      )}
    </div>
  );
};

