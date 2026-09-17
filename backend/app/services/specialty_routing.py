from sqlalchemy.orm import Session

from backend.app.models.models import Case, CaseAssignment, Role, User

ROUTING_RULES = (
    ("Cardiology", ("chest pain", "chest tightness", "heart", "palpitation", "left arm", "cardiac")),
    ("Neurology", ("seizure", "headache", "weakness", "dizziness", "paralysis", "numbness")),
    ("Pulmonology", ("cough", "wheezing", "asthma", "breathlessness", "shortness of breath")),
    ("Orthopaedics", ("knee", "joint pain", "fracture", "back pain", "bone pain")),
    ("Ayurveda Consultation", ("ayurveda", "acidity", "gastritis", "indigestion")),
)


def route_case_to_specialist(db: Session, case: Case) -> CaseAssignment | None:
    symptom_text = " ".join(symptom.custom_name or "" for symptom in case.case_symptoms)
    reported_text = f"{case.chief_complaint} {symptom_text}".lower()
    specialty = "Internal Medicine / OPD"
    matched_terms: tuple[str, ...] = ()

    for candidate_specialty, terms in ROUTING_RULES:
        matched = tuple(term for term in terms if term in reported_text)
        if matched:
            specialty = candidate_specialty
            matched_terms = matched
            break

    doctor = db.query(User).join(Role).filter(
        Role.name == "doctor",
        User.department == specialty,
        User.is_active.is_(True),
    ).first()
    if not doctor:
        return None

    case.department = specialty
    reason = "Reported symptoms matched: " + ", ".join(matched_terms) if matched_terms else "No specialty keywords matched; routed to general medicine."
    assignment = CaseAssignment(
        case_id=case.id,
        doctor_id=doctor.id,
        specialty=specialty,
        routing_reason=reason,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment
