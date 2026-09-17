import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import Case, MedicalTimelineEvent, Document

class TimelineService:
    @staticmethod
    def build_case_timeline(db: Session, case_id: str) -> List[MedicalTimelineEvent]:
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            return []

        # Clear previously auto-generated events for this case to avoid duplication
        db.query(MedicalTimelineEvent).filter(
            MedicalTimelineEvent.case_id == case.id,
            MedicalTimelineEvent.verified == False
        ).delete()

        today_str = datetime.datetime.utcnow().strftime("%Y-%m-%d")
        events: List[MedicalTimelineEvent] = []

        # 1. Current OPD Consultation Event
        current_event = MedicalTimelineEvent(
            patient_id=case.patient_id,
            case_id=case.id,
            event_date=today_str,
            event_type="CONSULTATION",
            title="OPD Case Intake (Current Visit)",
            description=f"Chief complaint: {case.chief_complaint}",
            source="PATIENT_REPORTED",
            confidence="HIGH",
            verified=False
        )
        events.append(current_event)

        # 2. Patient Reported Medical Histories (Surgeries, Hospitalizations, Chronic conditions)
        for mh in case.medical_histories:
            event_type = "REPORTED_ILLNESS"
            if mh.is_surgery:
                event_type = "PROCEDURE"
            elif mh.is_hospitalization:
                event_type = "HOSPITALIZATION"

            hist_event = MedicalTimelineEvent(
                patient_id=case.patient_id,
                case_id=case.id,
                event_date=mh.diagnosed_year_or_duration or "Past History",
                event_type=event_type,
                title=mh.condition_name,
                description=f"Status: {mh.status}. {mh.notes or ''}".strip(),
                source="PATIENT_REPORTED",
                confidence="HIGH" if mh.diagnosed_year_or_duration else "UNCERTAIN_DATE",
                verified=False
            )
            events.append(hist_event)

        # 3. Document Extracted Events (Prescriptions & Lab Reports)
        for doc in case.documents:
            doc_date = None
            doc_doctor = None
            extracted_items = []
            for ext in doc.extractions:
                if ext.entity_type == "DATE":
                    doc_date = ext.extracted_value
                elif ext.entity_type == "DOCTOR":
                    doc_doctor = ext.extracted_value
                else:
                    extracted_items.append(f"{ext.extracted_key}: {ext.extracted_value}")

            date_str = doc_date or doc.uploaded_at.strftime("%Y-%m-%d")
            ev_type = "PRESCRIPTION" if doc.document_type == "PRESCRIPTION" else "LAB_TEST"
            if doc.document_type == "DISCHARGE_SUMMARY":
                ev_type = "HOSPITALIZATION"

            doc_desc = f"Extracted findings: {', '.join(extracted_items[:4])}"
            if doc_doctor:
                doc_desc += f" (Doctor: {doc_doctor})"

            doc_event = MedicalTimelineEvent(
                patient_id=case.patient_id,
                case_id=case.id,
                event_date=date_str,
                event_type=ev_type,
                title=f"{doc.document_type.replace('_', ' ').title()} - {doc.file_name}",
                description=doc_desc,
                source="DOCUMENT_EXTRACTED",
                confidence="HIGH" if doc_date else "MEDIUM",
                verified=False
            )
            events.append(doc_event)

        # Persist all events
        for ev in events:
            db.add(ev)
        db.commit()

        # Return sorted events (chronological order)
        all_events = db.query(MedicalTimelineEvent).filter(
            MedicalTimelineEvent.patient_id == case.patient_id
        ).order_by(MedicalTimelineEvent.created_at.desc()).all()

        return all_events
