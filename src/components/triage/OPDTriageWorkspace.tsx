import React, { useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, ChevronRight, Clock, Lock,
  RefreshCw, ShieldAlert, Siren, UserCheck, Users, UserX, Trash2,
  Stethoscope, Send, AlertCircle, X, Check, HeartPulse, Sparkles
} from 'lucide-react';
import { QueueItem, RedFlagAlert, CaseDetails, DoctorNote } from '../../types';
import { api } from '../../services/api';

interface OPDTriageWorkspaceProps {
  onLogout?: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  WAITING_REVIEW: { label: 'Waiting Triage', className: 'bg-amber-100 text-amber-800' },
  TRIAGED: { label: 'Triaged', className: 'bg-sky-100 text-sky-800' },
  UNDER_REVIEW: { label: 'Escalated to Doctor', className: 'bg-rose-100 text-rose-800' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-100 text-emerald-800' },
  DIAGNOSED: { label: 'Diagnosed', className: 'bg-indigo-100 text-indigo-800' },
  COMPLETED: { label: 'Completed', className: 'bg-slate-100 text-slate-700' },
};

const formatNoteDate = (iso: string) => {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return iso;
  }
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
  const [doctors, setDoctors] = useState<{ id: string; full_name: string; department?: string }[]>([]);
  const [selectedCase, setSelectedCase] = useState<QueueItem | null>(null);
  const [selectedCaseDetails, setSelectedCaseDetails] = useState<CaseDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'priority' | 'waiting' | 'unassigned' | 'triaged'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Clinical Notes state
  const [noteType, setNoteType] = useState('CLINICAL_OBSERVATION');
  const [doctorNoteText, setDoctorNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  // Delete modal state
  const [caseToDelete, setCaseToDelete] = useState<QueueItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const loadTriageData = async (preserveSelectedId?: string) => {
    setLoading(true);
    setError('');
    try {
      const [cases, activeAlerts, docList] = await Promise.all([
        api.getQueue(),
        api.getAlerts(false),
        api.getAssignableDoctors().catch(() => [])
      ]);
      setQueue(cases);
      setAlerts(activeAlerts);
      if (Array.isArray(docList)) setDoctors(docList);

      const targetId = preserveSelectedId || selectedCase?.id;
      if (targetId) {
        const found = cases.find((item) => item.id === targetId);
        setSelectedCase(found || (cases.length > 0 ? cases[0] : null));
      } else if (cases.length > 0 && !selectedCase) {
        setSelectedCase(cases[0]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the live OPD queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) loadTriageData();
  }, [currentUser]);

  // Load detailed case data whenever selectedCase changes
  useEffect(() => {
    if (!selectedCase) {
      setSelectedCaseDetails(null);
      return;
    }

    let isMounted = true;
    const fetchDetails = async () => {
      setLoadingDetails(true);
      setNoteError('');
      try {
        const details = await api.getCaseDetails(selectedCase.id);
        if (isMounted) {
          setSelectedCaseDetails(details);
        }
      } catch (err) {
        console.warn('Failed to load full case details:', err);
        if (isMounted) {
          // Construct fallback from selectedCase
          setSelectedCaseDetails({
            id: selectedCase.id,
            token_number: selectedCase.token_number,
            patient: {
              id: selectedCase.patient_id,
              patient_id_number: selectedCase.patient_id_number || selectedCase.token_number,
              full_name: selectedCase.patient_name,
              age: selectedCase.patient_age,
              sex: selectedCase.patient_sex || 'Unknown',
              preferred_language: 'en'
            },
            chief_complaint: selectedCase.chief_complaint,
            department: selectedCase.department,
            assigned_doctor_name: selectedCase.assigned_doctor_name,
            status: selectedCase.status as any,
            has_red_flag: selectedCase.has_red_flag,
            red_flag_severity: selectedCase.red_flag_severity as any,
            symptoms: [],
            medical_histories: [],
            medications: [],
            allergies: [],
            family_histories: [],
            documents: [],
            timeline: [],
            alerts: [],
            doctor_notes: [],
            doctor_reviews: [],
            created_at: selectedCase.created_at
          });
        }
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [selectedCase?.id]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await api.login(username, password);
      if (user.role !== 'staff' && user.role !== 'doctor') {
        api.logout();
        setError('Use a triage staff or clinical account to access this workspace.');
        return;
      }
      setCurrentUser(user);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in to triage.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    parentLogout?.();
  };

  const handleAssignDoctor = async (doctorId: string) => {
    if (!selectedCase || !doctorId) return;
    setLoading(true);
    setError('');
    try {
      const updated = await api.assignCaseDoctor(selectedCase.id, doctorId);
      showToast(`Assigned to ${updated.doctor_name || 'doctor'}`);
      await loadTriageData(selectedCase.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign doctor.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriageAction = async (action: 'triage' | 'escalate') => {
    if (!selectedCase) return;
    setLoading(true);
    setError('');
    try {
      if (action === 'triage') {
        await api.markCaseTriaged(selectedCase.id);
        showToast(`Case ${selectedCase.token_number} marked as Triaged`);
      } else {
        await api.escalateCaseToDoctor(selectedCase.id);
        showToast(`Case ${selectedCase.token_number} escalated to Doctor`);
      }
      await loadTriageData(selectedCase.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update the case.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctorNote = async () => {
    if (!doctorNoteText.trim() || !selectedCase) return;
    setIsSavingNote(true);
    setNoteError('');
    try {
      const res = await api.addDoctorNote(selectedCase.id, doctorNoteText.trim(), noteType);
      
      const newNote: DoctorNote = {
        id: res?.id || `note-${Date.now()}`,
        doctor_name: res?.doctor_name || currentUser?.full_name || 'Triage Clinician',
        note_type: noteType,
        content: doctorNoteText.trim(),
        created_at: res?.created_at || new Date().toISOString()
      };

      setSelectedCaseDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          doctor_notes: [...(prev.doctor_notes || []), newNote]
        };
      });

      setDoctorNoteText('');
      showToast('Clinical note saved successfully');

      // Refresh case details in background
      api.getCaseDetails(selectedCase.id).then((freshDetails) => {
        setSelectedCaseDetails(freshDetails);
      }).catch(() => {});
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : 'Failed to save clinical note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const confirmDeleteCase = (caseItem: QueueItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCaseToDelete(caseItem);
    setDeleteError('');
  };

  const handleDeleteCase = async () => {
    if (!caseToDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.deleteCase(caseToDelete.id);
      const deletedToken = caseToDelete.token_number;
      const remaining = queue.filter((q) => q.id !== caseToDelete.id);
      setQueue(remaining);

      if (selectedCase?.id === caseToDelete.id) {
        const nextCase = remaining.length > 0 ? remaining[0] : null;
        setSelectedCase(nextCase);
      }

      setCaseToDelete(null);
      showToast(`Case ${deletedToken} was deleted successfully`);
      loadTriageData();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete case.');
    } finally {
      setIsDeleting(false);
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
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Staff Username</label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:border-sky-600 focus:outline-hidden"
                placeholder="e.g. staff.priya"
                aria-label="Username"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:border-sky-600 focus:outline-hidden"
                placeholder="••••••••"
                aria-label="Password"
              />
            </div>
            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            >
              {loading ? 'Signing in...' : 'Sign In to Triage'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isUnassigned = (item: QueueItem) =>
    !item.assigned_doctor_name ||
    item.assigned_doctor_name.trim() === '' ||
    item.assigned_doctor_name.trim().toLowerCase() === 'unassigned';

  const priorityCases = queue.filter((item) => item.has_red_flag);
  const waitingCases = queue.filter((item) => item.status === 'WAITING_REVIEW');
  const unassignedCases = queue.filter(isUnassigned);
  const triagedCases = queue.filter((item) => item.status === 'TRIAGED');
  const filteredQueue = filter === 'priority'
    ? priorityCases
    : filter === 'waiting'
    ? waitingCases
    : filter === 'unassigned'
    ? unassignedCases
    : filter === 'triaged'
    ? triagedCases
    : queue;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">OPD Triage & Live Queue</h1>
            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Live</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{currentUser.full_name} · Shared OPD triage desk</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTriageData()}
            disabled={loading}
            title="Refresh queue"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold cursor-pointer shadow-2xs transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          { id: 'all', label: 'Total in OPD', count: queue.length, icon: Users },
          { id: 'unassigned', label: 'Unassigned', count: unassignedCases.length, icon: UserX },
          { id: 'priority', label: 'Priority cases', count: priorityCases.length, icon: ShieldAlert },
          { id: 'waiting', label: 'Waiting triage', count: waitingCases.length, icon: Clock },
          { id: 'triaged', label: 'Ready for doctor', count: triagedCases.length, icon: CheckCircle2 },
        ].map(({ id, label, count, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id as typeof filter)}
            className={`rounded-2xl border p-4 text-left cursor-pointer transition-all ${
              filter === id
                ? 'border-sky-500 bg-sky-50 shadow-xs ring-2 ring-sky-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
            }`}
          >
            <Icon className="w-5 h-5 text-sky-600 mb-2" />
            <p className="text-2xl font-black text-slate-900">{count}</p>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Queue List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Queue Cases ({filteredQueue.length})
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Click to inspect & triage</span>
          </div>

          {filteredQueue.map((item) => {
            const status = statusConfig[item.status] || statusConfig.WAITING_REVIEW;
            const isSelected = selectedCase?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedCase(item)}
                className={`w-full rounded-2xl border p-4 text-left cursor-pointer transition-all relative group ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/70 shadow-sm ring-1 ring-sky-500/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                      item.has_red_flag ? 'bg-rose-500 animate-pulse ring-4 ring-rose-100' : 'bg-slate-300'
                    }`}
                  />
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                        {item.token_number}
                      </span>
                      <span className="font-bold text-slate-900 text-sm truncate">{item.patient_name}</span>
                      {item.has_red_flag && (
                        <span className="text-[10px] font-black tracking-wider text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                          PRIORITY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-medium line-clamp-2">{item.chief_complaint}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
                      <span>{item.department}</span>
                      <span>•</span>
                      <span className={item.assigned_doctor_name ? 'text-slate-700 font-semibold' : 'text-amber-600 font-medium'}>
                        {item.assigned_doctor_name || 'Unassigned'}
                      </span>
                      <span>•</span>
                      <span>{timeAgo(item.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => confirmDeleteCase(item, e)}
                      title="Delete this case"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && filteredQueue.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed p-6">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No cases in this view</p>
              <p className="text-xs text-slate-400 mt-1">Select another filter or wait for new patients at the kiosk.</p>
            </div>
          )}
        </div>

        {/* Right Column: Case Triage & Doctor Clinical Notes */}
        <div className="lg:col-span-7 space-y-5">
          {selectedCase ? (
            <div className="space-y-5">
              {/* Selected Case Header Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                        {selectedCase.token_number}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusConfig[selectedCase.status]?.className || 'bg-slate-100 text-slate-700'}`}>
                        {statusConfig[selectedCase.status]?.label || selectedCase.status}
                      </span>
                      {selectedCase.has_red_flag && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Red Flag ({selectedCase.red_flag_severity || 'HIGH'})</span>
                        </span>
                      )}
                    </div>
                    <h2 className="font-black text-xl text-slate-900 mt-2">{selectedCase.patient_name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedCase.patient_age ? `${selectedCase.patient_age} yrs` : 'Age not recorded'} ·{' '}
                      {selectedCase.patient_sex || 'Gender unrecorded'} · {selectedCase.department}
                    </p>
                  </div>

                  {/* Delete Case Button */}
                  <button
                    type="button"
                    onClick={() => confirmDeleteCase(selectedCase)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete Case</span>
                  </button>
                </div>

                {/* Chief Complaint & HPI */}
                <div className="py-4 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Chief Complaint & Reason for Visit
                  </span>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {selectedCase.chief_complaint}
                  </p>
                  {selectedCaseDetails?.hpi_summary && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {selectedCaseDetails.hpi_summary}
                    </p>
                  )}
                </div>

                {/* Patient Recorded Symptoms */}
                {selectedCaseDetails?.symptoms && selectedCaseDetails.symptoms.length > 0 && (
                  <div className="py-3 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Reported Symptoms ({selectedCaseDetails.symptoms.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedCaseDetails.symptoms.map((sym, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium flex items-center gap-1.5"
                        >
                          <span className="font-bold">{sym.custom_name || sym.name}</span>
                          {sym.duration && <span className="text-slate-400 text-[11px]">({sym.duration})</span>}
                          {sym.severity && (
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-md">
                              {sym.severity}/10
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assign / Re-route Doctor */}
                <div className="py-4 border-b border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Assign / Re-route Attending Physician:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={doctors.find((d) => d.full_name === selectedCase.assigned_doctor_name)?.id || ''}
                      onChange={(e) => {
                        if (e.target.value) handleAssignDoctor(e.target.value);
                      }}
                      disabled={loading}
                      className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-sky-600 focus:outline-hidden"
                    >
                      <option value="">
                        {selectedCase.assigned_doctor_name ? `Current: ${selectedCase.assigned_doctor_name}` : 'Select Doctor...'}
                      </option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.full_name} — {doc.department || 'General OPD'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Triage Actions */}
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTriageAction('triage')}
                    disabled={loading || selectedCase.status === 'TRIAGED'}
                    className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{selectedCase.status === 'TRIAGED' ? 'Case Triaged' : 'Mark as Triaged'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriageAction('escalate')}
                    disabled={loading || selectedCase.status === 'UNDER_REVIEW'}
                    className={`w-full py-3 rounded-xl font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs ${
                      selectedCase.has_red_flag
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Siren className="w-4 h-4" />
                    <span>Escalate to Doctor</span>
                  </button>
                </div>
              </div>

              {/* Doctor Clinical Notes Section (Functional and Styled to Match Design) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span>Doctor Clinical Notes</span>
                  </h3>
                  {loadingDetails && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Loading notes...
                    </span>
                  )}
                </div>

                {/* Existing Doctor / Triage Notes List */}
                {selectedCaseDetails?.doctor_notes && selectedCaseDetails.doctor_notes.length > 0 ? (
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                    {selectedCaseDetails.doctor_notes.map((n, i) => (
                      <div
                        key={n.id || i}
                        className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs shadow-2xs hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 mb-1.5">
                          <span className="text-slate-800 font-bold">{n.doctor_name || 'Attending Clinician'}</span>
                          <span className="font-mono text-slate-400">{formatNoteDate(n.created_at)}</span>
                        </div>
                        <p className="text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">{n.content}</p>
                        {n.note_type && (
                          <div className="mt-2">
                            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                              {n.note_type.replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  !loadingDetails && (
                    <p className="text-xs text-slate-400 italic mb-4 bg-slate-50 p-3.5 rounded-xl border border-dashed border-slate-200 text-center">
                      No clinical notes recorded yet. Add observations or triage instructions below.
                    </p>
                  )
                )}

                {/* Add Clinical Note Form */}
                <div className="space-y-3">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-bold bg-white focus:border-teal-600 focus:outline-hidden"
                  >
                    <option value="CLINICAL_OBSERVATION">Clinical Observation</option>
                    <option value="TRIAGE_NOTE">Triage & Priority Note</option>
                    <option value="FOLLOW_UP">Follow-Up Action</option>
                  </select>

                  <textarea
                    rows={3}
                    value={doctorNoteText}
                    onChange={(e) => setDoctorNoteText(e.target.value)}
                    placeholder="Enter physician clinical observations, preliminary checks, or test orders..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden placeholder:text-slate-400"
                  />

                  {noteError && <p className="text-xs text-rose-600 font-bold">{noteError}</p>}

                  <button
                    type="button"
                    onClick={handleAddDoctorNote}
                    disabled={isSavingNote || !doctorNoteText.trim()}
                    className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSavingNote ? 'animate-spin' : ''}`} />
                    <span>{isSavingNote ? 'Saving Clinical Note...' : 'Save Clinical Note'}</span>
                  </button>
                </div>
              </div>

              {/* Active Alerts section */}
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between font-bold text-xs text-slate-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Active Safety Alerts ({alerts.length})</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-3.5 text-xs hover:bg-slate-50 transition-colors">
                      <p className="font-bold text-rose-700">{alert.trigger_reason}</p>
                      <p className="text-slate-600 mt-0.5">{alert.alert_message}</p>
                    </div>
                  ))}
                  {!alerts.length && <p className="p-4 text-xs text-slate-400 text-center">No unacknowledged alerts in system.</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">No Case Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Select a patient case from the live queue on the left to review triage details, record clinical notes, or manage routing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {caseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">Delete Triage Case?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete case <span className="font-bold text-slate-800">{caseToDelete.token_number}</span> ({caseToDelete.patient_name})?
              </p>
              <p className="text-[11px] text-rose-600 font-semibold mt-2 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                This will permanently delete the case, intake summaries, red flag alerts, and associated clinical notes from the queue.
              </p>
            </div>

            {deleteError && (
              <p className="text-xs text-rose-600 font-bold text-center bg-rose-50 p-2 rounded-lg">{deleteError}</p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCaseToDelete(null)}
                disabled={isDeleting}
                className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCase}
                disabled={isDeleting}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

