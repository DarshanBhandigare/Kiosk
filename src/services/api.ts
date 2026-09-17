import { CaseDetails, QueueItem, Patient, MedicalDocument, TimelineEvent, RedFlagAlert } from '../types';
import { MOCK_QUEUE, MOCK_CASE_DETAILS } from '../data/mockData';

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
    // Client-side mock registry â€” works offline or when backend doesn't have the profile
    const MOCK_ABHA_PROFILES: Record<string, any> = {
      '91-8842-1920-5412': {
        status: 'VERIFIED', abha_id: '91-8842-1920-5412', abha_address: 'ramesh.patil@demo',
        full_name: 'Ramesh Patil', gender: 'Male', date_of_birth: '1972-06-15',
        mobile: '+91 98220 11223', address: 'Shivaji Nagar, Pune, Maharashtra',
        is_mock: true, disclaimer: 'Local demo profile.'
      },
      '91-9921-4412-8801': {
        status: 'VERIFIED', abha_id: '91-9921-4412-8801', abha_address: 'sunita.deshmukh@demo',
        full_name: 'Sunita Deshmukh', gender: 'Female', date_of_birth: '1984-03-22',
        mobile: '+91 97654 33211', address: 'Kothrud, Pune, Maharashtra',
        is_mock: true, disclaimer: 'Local demo profile.'
      },
      '91-7765-1230-9801': {
        status: 'VERIFIED', abha_id: '91-7765-1230-9801', abha_address: 'vijay.gaikwad@demo',
        full_name: 'Vijay Gaikwad', gender: 'Male', date_of_birth: '1966-11-08',
        mobile: '+91 94501 77832', address: 'Nashik Road, Nashik, Maharashtra',
        is_mock: true, disclaimer: 'Local demo profile.'
      },
      '91-8833-0122-4567': {
        status: 'VERIFIED', abha_id: '91-8833-0122-4567', abha_address: 'priya.kulkarni@demo',
        full_name: 'Priya Kulkarni', gender: 'Female', date_of_birth: '1990-07-14',
        mobile: '+91 99230 55678', address: 'Aundh, Pune, Maharashtra',
        is_mock: true, disclaimer: 'Local demo profile.'
      },
      '91-6654-7781-0023': {
        status: 'VERIFIED', abha_id: '91-6654-7781-0023', abha_address: 'meena.jadhav@demo',
        full_name: 'Meena Jadhav', gender: 'Female', date_of_birth: '1958-02-28',
        mobile: '+91 91234 88901', address: 'Aurangabad, Maharashtra',
        is_mock: true, disclaimer: 'Local demo profile.'
      },
      '91-7744-2288-9012': {
        status: 'VERIFIED', abha_id: '91-7744-2288-9012', abha_address: 'arjun.sharma@demo',
        full_name: 'Arjun Sharma', gender: 'Male', date_of_birth: '2003-09-03',
        mobile: '+91 98765 43210', address: 'Baner, Pune, Maharashtra',
        is_mock: true, disclaimer: 'Local demo profile.'
      },
      '91-5533-9912-0045': {
        status: 'VERIFIED', abha_id: '91-5533-9912-0045', abha_address: 'kavita.more@demo',
        full_name: 'Kavita More', gender: 'Female', date_of_birth: '1978-12-19',
        mobile: '+91 90128 34567', address: 'Hadapsar, Pune, Maharashtra',
        is_mock: true, disclaimer: 'Local demo profile.'
      },
      '91-4433-1122-8800': {
        status: 'VERIFIED', abha_id: '91-4433-1122-8800', abha_address: 'suresh.nair@demo',
        full_name: 'Suresh Nair', gender: 'Male', date_of_birth: '1952-04-10',
        mobile: '+91 87654 90012', address: 'Bandra West, Mumbai, Maharashtra',
        is_mock: true, disclaimer: 'Local demo profile.'
      },
    };

    // Normalise the input to xx-xxxx-xxxx-xxxx format for lookup
    const normalised = abha_id.trim();
    const digitsOnly = normalised.replace(/\D/g, '');
    const formatted = digitsOnly.length === 14
      ? `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6, 10)}-${digitsOnly.slice(10)}`
      : normalised;

    try {
      const res = await fetch(`${API_BASE}/abdm/verify-abha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abha_id: normalised })
      });
      if (res.ok) return res.json();
    } catch {
      // Backend unavailable â€” fall through to local mock
    }

    // Local mock fallback
    const localProfile = MOCK_ABHA_PROFILES[formatted] || MOCK_ABHA_PROFILES[normalised];
    if (localProfile) return localProfile;

    throw new Error('ABHA verification failed');
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
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.detail || 'Document upload failed');
    }
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

  async getAssignableDoctors() {
    const res = await fetch(`${API_BASE}/cases/doctors`, { headers: { ...getAuthHeader() } });
    if (!res.ok) throw new Error('Unable to load doctors');
    return res.json();
  },

  async assignCaseDoctor(caseId: string, doctorId: string) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/assign-doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ doctor_id: doctorId })
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.detail || 'Unable to assign doctor');
    }
    return res.json();
  },

  async getCaseDetails(caseId: string): Promise<CaseDetails> {
    const res = await fetch(`${API_BASE}/cases/${caseId}`);
    if (!res.ok) throw new Error('Failed to fetch case details');
    return res.json();
  },

  async deleteCase(caseId: string) {
    // Remove from in-memory mock queue and mock details if present
    const mockIdx = MOCK_QUEUE.findIndex((q) => q.id === caseId);
    if (mockIdx !== -1) {
      MOCK_QUEUE.splice(mockIdx, 1);
    }
    if (MOCK_CASE_DETAILS[caseId]) {
      delete MOCK_CASE_DETAILS[caseId];
    }

    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.detail || 'Unable to delete case');
      }
      const data = await res.json();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('medikiosk_case_deleted', { detail: { caseId } }));
        window.dispatchEvent(new CustomEvent('medikiosk_queue_updated'));
      }
      return data;
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('medikiosk_case_deleted', { detail: { caseId } }));
        window.dispatchEvent(new CustomEvent('medikiosk_queue_updated'));
      }
      throw error;
    }
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

