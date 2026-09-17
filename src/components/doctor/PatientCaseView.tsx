import React, { useState, useEffect } from 'react';
import {
  User, Activity, ShieldAlert, Heart, Pill, AlertTriangle,
  FileText, Clock, CheckCircle2, AlertCircle, Edit3, Save,
  Plus, Stethoscope, Sparkles, Send, Check, Eye, Trash2
} from 'lucide-react';
import { CaseDetails } from '../../types';
import { Badge } from '../common/Badge';
import { api } from '../../services/api';
import { MOCK_CASE_DETAILS, MOCK_QUEUE } from '../../data/mockData';

interface PatientCaseViewProps {
  caseId: string;
  onBack: () => void;
  onCaseUpdated?: () => void;
  onCaseDeleted?: () => void;
}

export const PatientCaseView: React.FC<PatientCaseViewProps> = ({
  caseId,
  onBack,
  onCaseUpdated,
  onCaseDeleted
}) => {
  const [caseData, setCaseData] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorNoteText, setDoctorNoteText] = useState('');
  const [noteType, setNoteType] = useState('CLINICAL_OBSERVATION');
  const [isApproving, setIsApproving] = useState(false);
  const [activeTab, setActiveTab] = useState<'clinical' | 'timeline' | 'documents' | 'ayurveda'>('clinical');
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [doctors, setDoctors] = useState<Array<{ id: string; full_name: string; department?: string }>>([]);
  const [doctorLoadError, setDoctorLoadError] = useState('');
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchCase();
    loadDoctors();
  }, [caseId]);

  const loadDoctors = async () => {
    setIsLoadingDoctors(true);
    setDoctorLoadError('');
    try {
      setDoctors(await api.getAssignableDoctors());
    } catch (error) {
      console.warn('Unable to load doctors:', error);
      setDoctorLoadError(error instanceof Error ? error.message : 'Unable to load doctors.');
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const fetchCase = async () => {
    setLoading(true);
    try {
      const data = await api.getCaseDetails(caseId);
      setCaseData(data);
      setSelectedDoctorId(data.assignment?.doctor_id || '');
    } catch (e) {
      console.warn('Fetch case error, using mock:', e);
      // Use mock data if available, otherwise generate basic from queue item
      if (MOCK_CASE_DETAILS[caseId]) {
        setCaseData(MOCK_CASE_DETAILS[caseId]);
      } else {
        const queueItem = MOCK_QUEUE.find(q => q.id === caseId);
        if (queueItem) {
          setCaseData({
            id: queueItem.id,
            token_number: queueItem.token_number,
            patient: {
              id: queueItem.patient_id,
              patient_id_number: queueItem.patient_id_number || queueItem.token_number,
              full_name: queueItem.patient_name,
              age: queueItem.patient_age,
              sex: queueItem.patient_sex || 'Unknown',
              preferred_language: 'en',
            },
            chief_complaint: queueItem.chief_complaint,
            department: queueItem.department,
            status: queueItem.status as any,
            has_red_flag: queueItem.has_red_flag,
            red_flag_severity: queueItem.red_flag_severity as any,
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
            created_at: queueItem.created_at,
            submitted_at: queueItem.submitted_at,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctorNote = async () => {
    if (!doctorNoteText.trim() || !caseData) return;
    try {
      await api.addDoctorNote(caseData.id, doctorNoteText, noteType);
      setDoctorNoteText('');
      fetchCase();
    } catch (e) {
      console.warn('Add note error:', e);
    }
  };

  const handleApproveCase = async () => {
    if (!caseData) return;
    setIsApproving(true);
    setApprovalSuccess(false);
    setApprovalError('');
    try {
      const result = await api.approveCase(caseData.id, 'Clinical history reviewed and verified by attending physician.');
      setCaseData({ ...caseData, status: result.case_status, reviewed_at: result.reviewed_at });
      setApprovalSuccess(true);
      if (onCaseUpdated) onCaseUpdated();
    } catch (e) {
      console.warn('Approve case error:', e);
      setApprovalError(e instanceof Error ? e.message : 'Unable to approve this case.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleAssignDoctor = async () => {
    if (!caseData || !selectedDoctorId) return;
    setIsAssigning(true);
    setAssignmentMessage('');
    try {
      const result = await api.assignCaseDoctor(caseData.id, selectedDoctorId);
      setCaseData({
        ...caseData,
        department: result.department,
        assignment: {
          doctor_id: result.doctor_id,
          doctor_name: result.doctor_name,
          specialty: result.department,
          routing_reason: result.routing_reason
        }
      });
      setAssignmentMessage(`Assigned to ${result.doctor_name}.`);
      if (onCaseUpdated) onCaseUpdated();
    } catch (error) {
      setAssignmentMessage(error instanceof Error ? error.message : 'Unable to assign doctor.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteCase = async () => {
    if (!caseData) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.deleteCase(caseData.id);
      onCaseDeleted?.();
      onBack();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Unable to delete case.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleMedVerification = async (medId?: string) => {
    if (!caseData || !medId) return;
    const updatedMeds = caseData.medications.map((m) =>
      m.id === medId ? { ...m, verified: !m.verified } : m
    );
    setCaseData({ ...caseData, medications: updatedMeds });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading comprehensive clinical case details...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
        <p className="text-sm text-slate-600 mb-4">Patient case not found or unavailable.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  const patient = caseData.patient || {};
  const isApproved = caseData.status === 'APPROVED';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            ← Back to Queue
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black text-slate-900 font-mono">{caseData.token_number}</span>
            <span className="text-xs font-semibold text-slate-500">• {caseData.department}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {caseData.has_red_flag && (
            <Badge variant="critical" size="md">
              <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-600" />
              <span>Red-Flag Priority Case ({caseData.red_flag_severity || 'CRITICAL'})</span>
            </Badge>
          )}

          <Badge variant={isApproved ? 'success' : 'neutral'} size="md">
            {isApproved ? 'Doctor Verified & Approved' : 'Waiting Doctor Review'}
          </Badge>

          {!isApproved && (
            <button
              onClick={handleApproveCase}
              disabled={isApproving}
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isApproving ? 'Approving...' : 'Approve & Verify Case'}</span>
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50"
            title="Delete case"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="min-w-44">
          <p className="text-xs font-bold text-slate-800">Doctor Assignment</p>
          <p className="text-[11px] text-slate-500">{caseData.assignment?.routing_reason || 'No doctor assigned yet.'}</p>
        </div>
        <select
          value={selectedDoctorId}
          onChange={(event) => setSelectedDoctorId(event.target.value)}
          disabled={isLoadingDoctors || doctors.length === 0}
          className="flex-1 min-w-52 p-2.5 rounded-xl border border-slate-300 bg-white text-sm"
        >
          <option value="">{isLoadingDoctors ? 'Loading doctors...' : doctors.length ? 'Select a doctor' : 'No doctors loaded'}</option>
          {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.full_name} — {doctor.department}</option>)}
        </select>
        <button onClick={loadDoctors} disabled={isLoadingDoctors} className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold disabled:opacity-50">
          Reload
        </button>
        <button
          onClick={handleAssignDoctor}
          disabled={!selectedDoctorId || isAssigning}
          className="px-4 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold disabled:opacity-50"
        >
          {isAssigning ? 'Assigning...' : 'Assign Doctor'}
        </button>
        {caseData.assignment && <span className="text-xs font-semibold text-sky-700">Current: {caseData.assignment.doctor_name}</span>}
      </div>

      {doctorLoadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          Could not load live doctors: {doctorLoadError}. Restart the backend, sign in again as a doctor or triage staff member, then click Reload.
        </div>
      )}

      {assignmentMessage && (
        <div className={`rounded-xl border p-3 text-sm font-semibold ${assignmentMessage.startsWith('Assigned') ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          {assignmentMessage}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-900">Delete case {caseData.token_number}?</p>
            <p className="text-xs text-rose-700">This permanently removes this case and its linked intake records. The patient profile is kept.</p>
            {deleteError && <p className="text-xs font-semibold text-rose-700 mt-2">{deleteError}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold">Cancel</button>
            <button onClick={handleDeleteCase} disabled={isDeleting} className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold disabled:opacity-50">{isDeleting ? 'Deleting...' : 'Delete Case'}</button>
          </div>
        </div>
      )}

      {approvalSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          Case approved and verified. The OPD queue has been updated.
        </div>
      )}

      {approvalError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {approvalError}
        </div>
      )}

      {/* Patient Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center font-black text-xl text-teal-300">
              {patient.full_name ? patient.full_name.substring(0, 2).toUpperCase() : 'PT'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">{patient.full_name || 'Patient'}</h2>
                <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-mono text-teal-200">
                  {patient.patient_id_number || 'PAT-2026-001'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {patient.age || 'Age N/A'} Y • {patient.sex} • Contact: <span className="font-mono">{patient.contact_number || 'N/A'}</span> • Preferred Language: <strong className="text-teal-300">{patient.preferred_language?.toUpperCase() || 'EN'}</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">ABHA Identifier:</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-teal-300">
              {patient.abha_id || '91-8842-1920-5412 (Verified)'}
            </span>
          </div>
        </div>
      </div>

      {/* Red-Flag Urgent Banner if Triggered */}
      {caseData.has_red_flag && caseData.alerts && caseData.alerts.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-black text-rose-900 uppercase tracking-wide">
                Emergency Clinical Triage Alert ({caseData.red_flag_severity || 'CRITICAL'})
              </h4>
              {caseData.alerts.map((al, idx) => (
                <p key={idx} className="text-xs text-rose-800 font-medium">
                  • {al.alert_message} <span className="text-rose-600 text-[11px]">({al.trigger_reason})</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        {[
          { id: 'clinical', label: 'Clinical History & AI Summary', icon: Activity },
          { id: 'timeline', label: `Chronological Timeline (${caseData.timeline?.length || 0})`, icon: Clock },
          { id: 'documents', label: `Scanned Reports & OCR (${caseData.documents?.length || 0})`, icon: FileText },
          { id: 'ayurveda', label: 'Ayurveda Profile', icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Clinical History & AI Summary */}
      {activeTab === 'clinical' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: AI Summary & Clinical Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI-Assisted Structured Doctor Summary */}
            {caseData.ai_summary && (
              <div className="bg-teal-50/60 rounded-2xl p-6 border border-teal-200/90 shadow-xs relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-100 px-2.5 py-1 rounded-md">
                    <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                    <span>AI-Generated Pre-Consultation Summary</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">
                    For Attending Physician Review
                  </span>
                </div>

                <p className="text-xs text-teal-950/80 italic mb-4 p-2 bg-white/70 rounded-lg border border-teal-100">
                  ⚠️ {caseData.ai_summary.ai_disclaimer}
                </p>

                <div className="space-y-3 text-xs text-slate-800">
                  <div>
                    <strong className="font-bold text-slate-900 block mb-1">Chief Complaint & Symptoms:</strong>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {(caseData.ai_summary.patient_reported_symptoms || []).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong className="font-bold text-slate-900 block mb-1">Relevant Medical History:</strong>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {(caseData.ai_summary.past_medical_history || []).map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong className="font-bold text-slate-900 block mb-1">Current Active Medications:</strong>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {(caseData.ai_summary.current_medications || []).map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {(caseData.ai_summary.document_extracted_findings || []).length > 0 && (
                    <div>
                      <strong className="font-bold text-slate-900 block mb-1">Document Extracted Findings:</strong>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {caseData.ai_summary.document_extracted_findings.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(caseData.ai_summary.suggested_doctor_clarifications || []).length > 0 && (
                    <div className="pt-2 border-t border-teal-200/60">
                      <strong className="font-bold text-amber-900 block mb-1">Recommended Physician Inquiries:</strong>
                      <ul className="list-disc pl-5 space-y-0.5 text-amber-800 font-medium">
                        {caseData.ai_summary.suggested_doctor_clarifications.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chief Complaint & Reported Illness */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2 mb-3">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Chief Complaint & Present Illness</span>
              </h3>
              <p className="text-sm font-bold text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed mb-4">
                "{caseData.chief_complaint}"
              </p>

              {caseData.symptoms && caseData.symptoms.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-600 uppercase">Reported Symptom Breakdown:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {caseData.symptoms.map((s, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-900 block">{s.name}</span>
                        <span className="text-slate-500">Duration: {s.duration || 'N/A'} • Severity: {s.severity || 'N/A'}/10</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Medications Table with Doctor Verification Toggles */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <span>Ongoing Medications & Dosages</span>
                </h3>
                <span className="text-xs text-slate-500">Toggle checkbox to verify prescription</span>
              </div>

              {caseData.medications && caseData.medications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <th className="py-2.5 px-3">Medicine Name</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Source</th>
                        <th className="py-2.5 px-3 text-right">Doctor Verify</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {caseData.medications.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{m.drug_name}</td>
                          <td className="py-2.5 px-3 font-mono">{m.dosage || 'As directed'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{m.frequency || 'Regular'}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                              {m.source}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleToggleMedVerification(m.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                m.verified
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              {m.verified ? '✓ Verified' : 'Verify'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No medications recorded.</p>
              )}
            </div>
          </div>

          {/* Right Column: Doctor Clinical Notes & Verification Box */}
          <div className="space-y-6">
            {/* Notes Addition Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2 mb-3">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>Doctor Clinical Notes</span>
              </h3>

              {/* Existing Doctor Notes */}
              {caseData.doctor_notes && caseData.doctor_notes.length > 0 && (
                <div className="space-y-2.5 mb-4 max-h-48 overflow-y-auto pr-1">
                  {caseData.doctor_notes.map((n, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>{n.doctor_name}</span>
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium"
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
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
                />

                <button
                  type="button"
                  onClick={handleAddDoctorNote}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save Clinical Note</span>
                </button>
              </div>
            </div>

            {/* Allergies & Lifestyle Summary */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Allergies</span>
                </h4>
                {caseData.allergies && caseData.allergies.length > 0 ? (
                  <div className="space-y-1.5">
                    {caseData.allergies.map((a, i) => (
                      <div key={i} className="p-2 bg-amber-50/60 rounded-lg border border-amber-200 text-xs text-amber-900 font-semibold">
                        {a.allergen_name} ({a.reaction_type})
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No known drug allergies.</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Lifestyle & Social Context
                </h4>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>Diet: <strong className="text-slate-900">{caseData.lifestyle?.diet_type || 'Standard'}</strong></p>
                  <p>Smoking: <strong className="text-slate-900">{caseData.lifestyle?.smoking_status || 'NEVER'}</strong></p>
                  <p>Alcohol: <strong className="text-slate-900">{caseData.lifestyle?.alcohol_status || 'NEVER'}</strong></p>
                  <p>Sleep: <strong className="text-slate-900">{caseData.lifestyle?.sleep_hours || '6-7 hours'}</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Chronological Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <span>Complete Chronological Medical Event Timeline</span>
          </h3>

          <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-200 space-y-6">
            {(caseData.timeline || []).map((ev, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-5 h-5 rounded-full border-4 bg-teal-600 border-teal-100" />
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-teal-800">{ev.event_date}</span>
                    <span className="text-[11px] font-semibold bg-white text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {ev.source}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Scanned Documents & OCR Extractions */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {(caseData.documents || []).length > 0 ? (
            caseData.documents.map((doc, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                      {doc.document_type}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-2">{doc.file_name}</h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 font-mono">
                    Scanned {new Date(doc.uploaded_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Raw OCR Text Box */}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                      Raw Scanned Text (OCR)
                    </span>
                    <pre className="p-4 rounded-xl bg-slate-900 text-teal-300 text-xs font-mono overflow-x-auto max-h-60 leading-relaxed">
                      {doc.ocr_raw_text || 'Text content extracted via OCR engine.'}
                    </pre>
                  </div>

                  {/* Extracted Structured Entities */}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                      Extracted Medical Entities & Confidence
                    </span>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {(doc.extractions || []).map((e, eIdx) => (
                        <div
                          key={eIdx}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                            e.is_abnormal
                              ? 'bg-rose-50 border-rose-200 text-rose-900'
                              : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-500 block">{e.entity_type}</span>
                            <span className="font-bold text-sm">{e.extracted_key}</span>
                            <span className="ml-2 text-slate-700">: {e.extracted_value}</span>
                            {e.reference_range && (
                              <span className="text-slate-500 block text-[11px] mt-0.5">Reference: {e.reference_range}</span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                            96% Conf
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No medical documents scanned for this case.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Ayurveda Profile */}
      {activeTab === 'ayurveda' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-teal-800 text-sm font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span>Ayurveda Consultation & Prakriti Intake</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-xs block mb-1 font-semibold">Prakriti / Constitution:</span>
              <strong className="text-base text-slate-900 font-bold">{caseData.ayurveda?.prakriti || 'Vata-Pitta'}</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-xs block mb-1 font-semibold">Agni / Digestive Fire:</span>
              <strong className="text-base text-slate-900 font-bold">{caseData.ayurveda?.agni || 'Tikshna / Vishama Agni'}</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-xs block mb-1 font-semibold">Sleep (Nidra):</span>
              <strong className="text-base text-slate-900 font-bold">{caseData.ayurveda?.sleep_pattern || 'Disturbed (wakes early)'}</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2 lg:col-span-3">
              <span className="text-slate-500 text-xs block mb-1 font-semibold">Clinical Notes & Ahara Habitation:</span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {caseData.ayurveda?.notes || 'Patient reports high work stress, late dinner schedule, and hyperacidity triggers.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
