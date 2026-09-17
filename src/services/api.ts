import { CaseDetails, QueueItem, Patient, MedicalDocument, TimelineEvent, RedFlagAlert } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('medikiosk_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(username: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('medikiosk_token', data.access_token);
    localStorage.setItem('medikiosk_user', JSON.stringify(data));
    return data;
  },

  logout() {
    localStorage.removeItem('medikiosk_token');
    localStorage.removeItem('medikiosk_user');
  },

  getStoredUser() {
    const u = localStorage.getItem('medikiosk_user');
    return u ? JSON.parse(u) : null;
  },

  // Patients & ABHA
  async verifyAbha(abha_id: string) {
    const res = await fetch(`${API_BASE}/abdm/verify-abha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abha_id })
    });
    if (!res.ok) throw new Error('ABHA verification failed');
    return res.json();
  },

  async registerPatient(patientData: Partial<Patient>) {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    if (!res.ok) throw new Error('Patient registration failed');
    return res.json();
  },

  async recordConsent(patientId: string, consentGiven = true) {
    const res = await fetch(`${API_BASE}/patients/${patientId}/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId, consent_given: consentGiven })
    });
    if (!res.ok) throw new Error('Consent recording failed');
    return res.json();
  },

  // Kiosk Sessions & Adaptive Interview
  async createSession(language: string, patientId?: string) {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, patient_id: patientId })
    });
    if (!res.ok) throw new Error('Failed to create kiosk session');
    return res.json();
  },

  async startInterview(sessionId: string, chiefComplaint: string, language: string) {
    const res = await fetch(
      `${API_BASE}/interview/start?session_id=${sessionId}&chief_complaint=${encodeURIComponent(chiefComplaint)}&language=${language}`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error('Interview start failed');
    return res.json();
  },

  async submitAnswer(payload: {
    session_id: string;
    question_key: string;
    question_text: string;
    response_text: string;
    input_mode: string;
    language: string;
  }) {
    const res = await fetch(`${API_BASE}/interview/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Answer submission failed');
    return res.json();
  },

  // Documents & OCR
  async uploadDocument(patientId: string, file: File, documentType: string, caseId?: string) {
    const formData = new FormData();
    formData.append('patient_id', patientId);
    formData.append('document_type', documentType);
    if (caseId) formData.append('case_id', caseId);
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Document upload failed');
    return res.json();
  },

  async verifyExtraction(extractionId: string, isVerified = true) {
    const res = await fetch(`${API_BASE}/documents/extraction/${extractionId}/verify?is_verified=${isVerified}`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Extraction verification failed');
    return res.json();
  },

  // Cases & Queue
  async createAndSubmitCase(caseData: any) {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.detail || 'Case submission failed');
    }
    return res.json();
  },

  async getQueue(filters?: { status?: string; has_red_flag?: boolean; department?: string }): Promise<QueueItem[]> {
    let url = `${API_BASE}/cases`;
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.has_red_flag !== undefined) params.append('has_red_flag', String(filters.has_red_flag));
    if (filters?.department) params.append('department', filters.department);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch patient queue');
    return res.json();
  },

  async getCaseDetails(caseId: string): Promise<CaseDetails> {
    const res = await fetch(`${API_BASE}/cases/${caseId}`);
    if (!res.ok) throw new Error('Failed to fetch case details');
    return res.json();
  },

  // Doctor Actions
  async addDoctorNote(caseId: string, content: string, noteType = 'CLINICAL_OBSERVATION') {
    const res = await fetch(`${API_BASE}/doctor/cases/${caseId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ content, note_type: noteType })
    });
    if (!res.ok) throw new Error('Failed to add doctor note');
    return res.json();
  },

  async approveCase(caseId: string, notes = 'Case history reviewed and approved.') {
    const res = await fetch(`${API_BASE}/doctor/cases/${caseId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ verification_notes: notes, status: 'APPROVED' })
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.detail || 'Failed to approve case');
    }
    return res.json();
  },

  async markCaseTriaged(caseId: string) {
    const res = await fetch(`${API_BASE}/triage/cases/${caseId}/mark-triaged`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Unable to mark this case as triaged');
    return res.json();
  },

  async escalateCaseToDoctor(caseId: string) {
    const res = await fetch(`${API_BASE}/triage/cases/${caseId}/escalate`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Unable to escalate this case to the doctor');
    return res.json();
  },

  // Alerts
  async getAlerts(isAcknowledged?: boolean): Promise<RedFlagAlert[]> {
    let url = `${API_BASE}/alerts`;
    if (isAcknowledged !== undefined) url += `?is_acknowledged=${isAcknowledged}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async acknowledgeAlert(alertId: string) {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/review`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  // Admin & Stats
  async getSystemStats() {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error('Failed to fetch system stats');
    return res.json();
  },

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/admin/audit-logs`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getRedFlagRules() {
    const res = await fetch(`${API_BASE}/admin/rules`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch red flag rules');
    return res.json();
  }
};
