from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.app.models.models import Case, RedFlagRule, RedFlagAlert, Symptom, CaseSymptom

DEFAULT_RULES = [
    {
        "rule_code": "RF001",
        "name": "Acute Coronary / Chest Pain Syndrome",
        "description": "Chest pain with radiation to arm/jaw, diaphoresis, or severity >= 7",
        "severity": "CRITICAL",
        "required_symptom_keys": ["chest", "pain", "radiat", "jaw", "arm", "छाती", "दर्द", "दुखणे"],
        "additional_conditions": {"min_severity": 6},
        "alert_message": "CRITICAL: Patient reports severe chest discomfort with potential ischemic features. Immediate OPD triage nurse & duty physician evaluation required.",
        "action_required": "Immediate ECG triage & notify duty physician"
    },
    {
        "rule_code": "RF002",
        "name": "Acute Respiratory Distress",
        "description": "Severe breathlessness at rest or worsening dyspnea with stridor",
        "severity": "CRITICAL",
        "required_symptom_keys": ["breath", "dyspnea", "rest", "chok", "सांस", "दम", "श्वास"],
        "additional_conditions": {"min_severity": 7},
        "alert_message": "CRITICAL: Patient reports severe resting breathlessness. Check SpO2 immediately and alert triage physician.",
        "action_required": "SpO2 measurement, oxygen support check & physician alert"
    },
    {
        "rule_code": "RF003",
        "name": "Acute Neurological Deficit",
        "description": "Sudden onset limb weakness, facial drooping, slurred speech, or confusion",
        "severity": "CRITICAL",
        "required_symptom_keys": ["weakness", "speech", "paralysis", "slur", "droop", "कमजोरी", "बोली", "ताकद"],
        "additional_conditions": {},
        "alert_message": "CRITICAL: Potential acute neurological deficit detected. Initiate stroke screening protocol.",
        "action_required": "Immediate FAST stroke assessment by physician"
    },
    {
        "rule_code": "RF004",
        "name": "Severe Acute Abdomen",
        "description": "Severe abdominal pain (severity >= 8) with persistent vomiting or rigidity",
        "severity": "HIGH",
        "required_symptom_keys": ["abdomen", "stomach", "vomit", "rigidity", "पेट", "उल्टी", "पोट"],
        "additional_conditions": {"min_severity": 8},
        "alert_message": "HIGH: Severe acute abdominal discomfort reported. Clinical review required for acute surgical abdomen.",
        "action_required": "Surgical/General OPD priority triage"
    },
    {
        "rule_code": "RF005",
        "name": "High Fever with Toxicity",
        "description": "High fever with altered sensorium, extreme chills, or petechial rash",
        "severity": "HIGH",
        "required_symptom_keys": ["fever", "chill", "rash", "confus", "बुखार", "ताप", "कंपकंपी"],
        "additional_conditions": {"min_severity": 7},
        "alert_message": "HIGH: High-grade febrile illness with systemic symptoms. Check temperature and vitals.",
        "action_required": "Vitals assessment (Temp, Pulse, BP) and triage"
    }
]

class RedFlagEngine:
    @staticmethod
    def evaluate_case(db: Session, case_id: str) -> List[RedFlagAlert]:
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            return []

        # Fetch active rules
        rules = db.query(RedFlagRule).filter(RedFlagRule.is_active == True).all()
        if not rules:
            # If database has no rules seeded, load default rules temporarily
            for r_data in DEFAULT_RULES:
                new_r = RedFlagRule(**r_data)
                db.add(new_r)
            db.commit()
            rules = db.query(RedFlagRule).filter(RedFlagRule.is_active == True).all()

        # Gather all text associated with this case
        text_corpus = [case.chief_complaint or ""]
        max_severity = 0

        for cs in case.case_symptoms:
            name = cs.custom_name or (cs.symptom.name if cs.symptom else "")
            text_corpus.append(name)
            if cs.notes:
                text_corpus.append(cs.notes)
            if cs.severity and cs.severity > max_severity:
                max_severity = cs.severity

        # Check interview responses
        if case.session:
            for resp in case.session.interview_responses:
                text_corpus.append(resp.question_text)
                text_corpus.append(resp.response_text)

        full_text = " ".join(text_corpus).lower()
        generated_alerts = []
        highest_severity_tier = None

        for rule in rules:
            keys = rule.required_symptom_keys or []
            # Check if any rule keywords match
            matches = [k for k in keys if k.lower() in full_text]
            if matches:
                conditions = rule.additional_conditions or {}
                min_sev = conditions.get("min_severity", 0)
                if max_severity >= min_sev or min_sev == 0 or max_severity == 0:
                    # Trigger alert
                    trigger_reason = f"Triggered by symptom match [{', '.join(matches)}] with severity level {max_severity}/10"
                    alert = RedFlagAlert(
                        case_id=case.id,
                        rule_id=rule.id,
                        severity=rule.severity,
                        trigger_reason=trigger_reason,
                        alert_message=rule.alert_message
                    )
                    db.add(alert)
                    generated_alerts.append(alert)

                    if rule.severity == "CRITICAL":
                        highest_severity_tier = "CRITICAL"
                    elif rule.severity == "HIGH" and highest_severity_tier != "CRITICAL":
                        highest_severity_tier = "HIGH"
                    elif not highest_severity_tier:
                        highest_severity_tier = rule.severity

        if generated_alerts:
            case.has_red_flag = True
            case.red_flag_severity = highest_severity_tier or "HIGH"
        else:
            case.has_red_flag = False
            case.red_flag_severity = None

        db.commit()
        return generated_alerts
