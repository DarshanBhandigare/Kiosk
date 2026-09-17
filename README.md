# 🏥 MediKiosk - AI-Assisted Patient Case-Taking Software

> **Team**: Code Titans  
> **Domain**: Health Tech  
> **Problem Statement**: Patient Case-Taking Software for Hospitals and OPDs  
> **Core Principle**: MediKiosk is an information collection, organization, and summarization system. It **must never independently diagnose, prescribe medication, or replace a doctor**.

---

## 🌟 Executive Overview

**MediKiosk** transforms hospital outpatient intake through an accessible self-service kiosk tailored for rural, elderly, and multilingual patients. The platform bridges the pre-consultation information gap by capturing chief complaints, running adaptive clinical follow-up interviews in regional Indian languages (**English, हिंदी, मराठी**), performing OCR on physical prescriptions and lab reports, constructing a chronological medical timeline, screening for predefined red-flag symptoms, and delivering a structured, doctor-ready summary.

---

## 🏗️ Architecture & Core Components

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                   PATIENT KIOSK / DOCTOR WORKSPACE                     │
   │  React 19 / TypeScript / Tailwind CSS / Lucide Icons / WebSpeech API   │
   │  - 13-Step Patient Kiosk (Touch, Multilingual Voice, High Contrast)    │
   │  - Doctor Clinical Desktop (Split Triage, Timeline, Verification, Notes)│
   └──────────────────────────────────┬─────────────────────────────────────┘
                                      │ REST API (JSON & Multipart)
                                      ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                        FASTAPI BACKEND (Python)                        │
   │  ┌────────────────────────┐  ┌───────────────────────┐                 │
   │  │   API & Auth Routers   │  │  Services Layer       │                 │
   │  │  - /auth, /patients    │  │  - RedFlagEngine      │                 │
   │  │  - /sessions, /docs    │  │  - TimelineService    │                 │
   │  │  - /timeline, /doctor  │  │  - SummaryService     │                 │
   │  │  - /alerts, /ayurveda  │  │  - AuditService       │                 │
   │  └───────────┬────────────┘  └───────────┬───────────┘                 │
   │              │                           │                             │
   │  ┌───────────▼───────────────────────────▼───────────┐                 │
   │  │ Provider Abstraction Layer                        │                 │
   │  │  - AI Provider (BaseAIProvider -> Gemini / Mock)  │                 │
   │  │  - OCR Provider (BaseOCRProvider -> Vision / Mock)│                 │
   │  │  - Speech Provider (BaseSpeech -> WebSpeech/Mock) │                 │
   │  │  - ABDM / HMIS Sandbox (ABHA Verify & FHIR Export)│                 │
   │  └───────────────────────────────────────────────────┘                 │
   └──────────────────────────────────┬─────────────────────────────────────┘
                                      │ SQLAlchemy 2.0 ORM
                                      ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                  DATABASE & SECURE DOCUMENT STORAGE                    │
   │  - PostgreSQL / SQLite relational schema with 23 normalized tables     │
   │  - Private local document repository (encrypted/permissioned)          │
   │  - Immutable Audit Logs & Consent Version Tracking                     │
   └────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. 13-Step Accessible Patient Kiosk
1. **Welcome & Accessibility**: Hospital branding, voice guidance toggle, large touchable CTA, quick demo pre-fill.
2. **Language Selection**: English, Hindi (हिंदी), and Marathi (मराठी) with audio pronunciation preview.
3. **Patient Identification**: 14-digit ABHA ID lookup or quick demographic entry.
4. **Informed Consent**: Explicit AI-assistance and doctor-review disclosure (timestamped and versioned).
5. **Basic Information**: Name, age, sex, contact, emergency contact.
6. **Chief Complaint**: Real-time voice microphone with audio waveform pulse and transcript editor.
7. **Adaptive AI Health Interview**: Context-aware clinical follow-up questions with severity slider (1-10) and audio replay.
8. **Medical History & Ayurveda**: Chronic illnesses, ongoing medications, allergies, and optional Prakriti/Agni/Nidra intake.
9. **Medical Document Scanner**: Instant OCR extraction of prescriptions and lab reports with confidence scoring.
10. **Chronological Medical Timeline**: Integrated visual timeline of patient history and document findings.
11. **Red-Flag Safety Screening**: Rule-based detection of emergency symptoms.
12. **Review & Corrections**: Pre-submission summary with inline edit jumps.
13. **Submission & Token**: Case registered, unique OPD Token (e.g. `T-101`) issued.

### 2. Clinical Doctor & Triage Workspace
- **Live OPD Queue**: Filter by All, Priority Red-Flag, Waiting Review, or Approved.
- **AI-Assisted Structured Summary**: Clearly flagged with clinical disclaimers.
- **Doctor Verification**: Attending physician verifies and approves medication list and timeline events.
- **Clinical Doctor Notes**: Save observations, triage notes, and follow-up orders.
- **Red-Flag Rules Manager**: Configure hospital safety rules and triage thresholds.
- **Immutable Audit Trail**: Tamper-evident logging of access, consent, OCR, and approvals.
- **ABDM / HMIS Sandbox Hub**: Live ABHA verification and HL7/FHIR encounter bundle generation.

---

## 🔒 Medical Safety & Governance Guardrails

1. **Zero Automated Diagnosis**: MediKiosk structures and organizes information; it never outputs clinical diagnostic conclusions.
2. **Zero Automated Prescriptions**: Drug dosages and treatment courses must be prescribed solely by attending doctors.
3. **Clear Source Attribution**: Every piece of data is explicitly categorized as either *Patient Reported* or *Document Extracted*.
4. **Human-in-the-Loop Approval**: History and medications require physician sign-off before becoming part of the permanent record.
5. **Private Document Storage**: Medical reports and prescriptions are stored privately with authenticated endpoint access.

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- Python 3.11+
- Node.js v18+

### 1. Start the FastAPI Backend
```bash
# In workspace root
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Start the Frontend (Vite)
```bash
# In workspace root
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing

Run the comprehensive pytest test suite covering authentication, patient creation, kiosk adaptive flow, OCR document processing, doctor approval, and ABDM sandbox:

```bash
python -m pytest backend/tests -v
```

---

## 🔑 Preconfigured Demo Accounts

| Role | Username | Password | Purpose |
|------|----------|----------|---------|
| **Doctor** | `dr.sharma` | `Doctor@123` | Attending Physician OPD Workspace |
| **Doctor** | `dr.kulkarni` | `Doctor@123` | Cardiology Specialist |
| **Doctor** | `dr.vaidya` | `Doctor@123` | Ayurveda Consultation Specialist |
| **Staff** | `staff.priya` | `Staff@123` | OPD Triage & Nurse Station |
| **Admin** | `admin` | `Admin@123` | Hospital IT & Red-Flag Rules Configuration |

---

## 📦 Production Deployment

### Docker Compose
```bash
docker-compose up --build -d
```

---
*Built with ❤️ by Code Titans for MediKiosk • Health Tech Hackathon 2026*
