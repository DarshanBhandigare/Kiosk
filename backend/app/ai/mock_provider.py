import re
from typing import Dict, Any, List
from backend.app.ai.base import BaseAIProvider

class MockAIProvider(BaseAIProvider):
    """
    Offline, deterministic AI provider for MediKiosk demo and fallback.
    Strictly follows healthcare safety rules: no diagnosis, no prescription,
    clear attribution of patient-reported vs. document data.
    """

    QUESTION_BANK = {
        "duration": {
            "en": "How long have you been experiencing this issue?",
            "hi": "आपको यह समस्या कितने समय से हो रही है?",
            "mr": "तुम्हाला हा त्रास किती दिवसांपासून होत आहे?"
        },
        "severity": {
            "en": "On a scale of 1 to 10 (where 10 is unbearable), how severe is the discomfort?",
            "hi": "1 से 10 के पैमाने पर (जहाँ 10 असहनीय है), तकलीफ कितनी तीव्र है?",
            "mr": "१ ते १० च्या प्रमाणात (जिथे १० असह्य वेदना आहे), त्रास किती तीव्र आहे?"
        },
        "chest_radiation": {
            "en": "Does the chest pain or discomfort spread to your left arm, neck, jaw, or back?",
            "hi": "क्या छाती का दर्द आपके बाएं हाथ, गर्दन, जबड़े या पीठ की तरफ फैलता है?",
            "mr": "छातीत होणाऱ्या वेदना डाव्या हाताकडे, मानेकडे, जबड्याकडे किंवा पाठीकडे पसरतात का?"
        },
        "breathlessness_exertion": {
            "en": "Do you feel shortness of breath while resting, or does it worsen when climbing stairs or walking?",
            "hi": "क्या सांस लेने में तकलीफ आराम करते समय होती है, या सीढ़ियां चढ़ने या चलने पर बढ़ जाती है?",
            "mr": "श्वास घेण्यास विश्रांती घेताना त्रास होतो की पायऱ्या चढताना किंवा चालताना जास्त वाढतो?"
        },
        "cough_sputum": {
            "en": "Is the cough dry or do you have phlegm / sputum? Any fever or blood in cough?",
            "hi": "क्या खांसी सूखी है या कफ/बलगम आ रहा है? क्या बुखार या खांसी में खून की शिकायत है?",
            "mr": "खोकला कोरडा आहे की कफ पडतो? ताप किंवा खोकल्यातून रक्त येण्याची तक्रार आहे का?"
        },
        "fever_chills": {
            "en": "How high has the fever been, and is it accompanied by chills, sweating, or body aches?",
            "hi": "बुखार कितना तेज रहा है, और क्या इसके साथ कंपकंपी, पसीना या बदन दर्द है?",
            "mr": "ताप किती जास्त आहे, आणि त्यासोबत थंडी वाजणे, घाम येणे किंवा अंगदुखी आहे का?"
        },
        "abdomen_trigger": {
            "en": "Does the abdominal pain or burning sensation worsen after meals, or on an empty stomach?",
            "hi": "क्या पेट का दर्द या जलन खाना खाने के बाद बढ़ती है, या खाली पेट रहने पर?",
            "mr": "पोटातील वेदना किंवा जळजळ जेवणानंतर वाढते की रिकाम्या पोटी?"
        },
        "joint_morning_stiffness": {
            "en": "Do you notice swelling or stiffness in the joints, especially when you wake up in the morning?",
            "hi": "क्या जोड़ों में सूजन या जकड़न महसूस होती है, विशेषकर सुबह सोकर उठने पर?",
            "mr": "सांध्यांमध्ये सूज किंवा ताठरता जाणवते का, विशेषतः सकाळी झोपेतून उठल्यावर?"
        },
        "ayurveda_agni": {
            "en": "How is your general digestive appetite and bowel regularity?",
            "hi": "आपकी भूख और पाचन क्रिया (अग्नि) कैसी रहती है?",
            "mr": "तुमची भूक आणि पचनशक्ती (अग्नी) कशी आहे?"
        }
    }

    async def generate_adaptive_followup(
        self,
        chief_complaint: str,
        answered_questions: List[Dict[str, Any]],
        language: str = "en"
    ) -> Dict[str, Any]:
        lang = language if language in ["en", "hi", "mr"] else "en"
        complaint_lower = chief_complaint.lower()
        answered_keys = {ans.get("question_key") for ans in answered_questions}

        # Step 1: Duration check
        if "duration" not in answered_keys:
            return {
                "has_next": True,
                "question_key": "duration",
                "question_text": self.QUESTION_BANK["duration"][lang],
                "category": "DURATION",
                "input_type": "VOICE_OR_TOUCH",
                "options": [
                    {"en": "Less than 24 hours", "hi": "24 घंटे से कम", "mr": "२४ तासांपेक्षा कमी"}[lang],
                    {"en": "2 to 7 days", "hi": "2 से 7 दिन", "mr": "२ ते ७ दिवस"}[lang],
                    {"en": "1 to 4 weeks", "hi": "1 से 4 हफ्ते", "mr": "१ ते ४ आठवडे"}[lang],
                    {"en": "More than 1 month", "hi": "1 महीने से अधिक", "mr": "१ महिन्यापेक्षा जास्त"}[lang]
                ]
            }

        # Step 2: Severity check
        if "severity" not in answered_keys:
            return {
                "has_next": True,
                "question_key": "severity",
                "question_text": self.QUESTION_BANK["severity"][lang],
                "category": "SEVERITY",
                "input_type": "SLIDER",
                "options": ["1 - Mild", "3 - Moderate", "6 - Severe", "9 - Extreme"]
            }

        # Step 3: Clinical domain-specific follow-ups
        # Case A: Chest pain / Palpitations
        if any(w in complaint_lower for w in ["chest", "pain", "heart", "छाती", "दर्द", "दुखणे", "धड़कन"]) and "chest_radiation" not in answered_keys:
            return {
                "has_next": True,
                "question_key": "chest_radiation",
                "question_text": self.QUESTION_BANK["chest_radiation"][lang],
                "category": "ASSOCIATED_SYMPTOMS",
                "input_type": "CHOICE",
                "options": [
                    {"en": "Yes, radiates to left arm/jaw", "hi": "हाँ, बाएं हाथ/जबड़े तक फैलता है", "mr": "होय, डाव्या हाताकडे/जबड्याकडे पसरतो"}[lang],
                    {"en": "No, localized to one spot", "hi": "नहीं, केवल एक जगह है", "mr": "नाही, फक्त एकाच ठिकाणी आहे"}[lang],
                    {"en": "Unsure", "hi": "निश्चित नहीं", "mr": "माहित नाही"}[lang]
                ]
            }

        # Case B: Breathlessness / Shortness of breath
        if any(w in complaint_lower for w in ["breath", "breathing", "asthma", "सांस", "दम", "श्वास"]) and "breathlessness_exertion" not in answered_keys:
            return {
                "has_next": True,
                "question_key": "breathlessness_exertion",
                "question_text": self.QUESTION_BANK["breathlessness_exertion"][lang],
                "category": "ASSOCIATED_SYMPTOMS",
                "input_type": "CHOICE",
                "options": [
                    {"en": "Present even while resting", "hi": "आराम करते समय भी होती है", "mr": "विश्रांती घेतानाही होतो"}[lang],
                    {"en": "Only during exertion/walking", "hi": "केवल चलने या मेहनत करने पर", "mr": "फक्त चालताना किंवा कष्ट करताना"}[lang],
                    {"en": "Only at night", "hi": "केवल रात में", "mr": "फक्त रात्रीच्या वेळी"}[lang]
                ]
            }

        # Case C: Cough / Cold
        if any(w in complaint_lower for w in ["cough", "cold", "sputum", "खांसी", "खोकला", "कफ"]) and "cough_sputum" not in answered_keys:
            return {
                "has_next": True,
                "question_key": "cough_sputum",
                "question_text": self.QUESTION_BANK["cough_sputum"][lang],
                "category": "ASSOCIATED_SYMPTOMS",
                "input_type": "CHOICE",
                "options": [
                    {"en": "Dry cough without sputum", "hi": "सूखी खांसी बिना बलगम", "mr": "कोरडा खोकला कफ नसलेला"}[lang],
                    {"en": "Productive cough with yellowish/white phlegm", "hi": "बलगम/कफ वाली खांसी", "mr": "कफ असलेला खोकला"}[lang],
                    {"en": "Cough with mild fever", "hi": "हल्के बुखार के साथ खांसी", "mr": "बारीक तापासह खोकला"}[lang]
                ]
            }

        # Case D: Fever
        if any(w in complaint_lower for w in ["fever", "temperature", "बुखार", "ताप", "अंगताप"]) and "fever_chills" not in answered_keys:
            return {
                "has_next": True,
                "question_key": "fever_chills",
                "question_text": self.QUESTION_BANK["fever_chills"][lang],
                "category": "ASSOCIATED_SYMPTOMS",
                "input_type": "CHOICE",
                "options": [
                    {"en": "High fever with chills", "hi": "कंपकंपी के साथ तेज बुखार", "mr": "थंडी वाजून येणारा तीव्र ताप"}[lang],
                    {"en": "Continuous low-grade fever", "hi": "लगातार हल्का बुखार", "mr": "सतत बारीक ताप"}[lang],
                    {"en": "Intermittent (comes and goes)", "hi": "रुक-रुक कर आने वाला बुखार", "mr": "अधूनमधून येणारा ताप"}[lang]
                ]
            }

        # Case E: Stomach / Abdomen / Acidity
        if any(w in complaint_lower for w in ["stomach", "abdomen", "acidity", "gas", "पेट", "गैस", "अम्लपित्त", "पोट"]) and "abdomen_trigger" not in answered_keys:
            return {
                "has_next": True,
                "question_key": "abdomen_trigger",
                "question_text": self.QUESTION_BANK["abdomen_trigger"][lang],
                "category": "ASSOCIATED_SYMPTOMS",
                "input_type": "CHOICE",
                "options": [
                    {"en": "Worse immediately after meals", "hi": "खाना खाने के तुरंत बाद बढ़ता है", "mr": "जेवणानंतर लगेच वाढते"}[lang],
                    {"en": "Worse on empty stomach / early morning", "hi": "खाली पेट या सुबह अधिक होता है", "mr": "सकाळी किंवा उपाशीपोटी जास्त जाणवते"}[lang],
                    {"en": "Associated with nausea and bloating", "hi": "जी मिचलाना और भारीपन", "mr": "मळमळ आणि पोट फुगणे"}[lang]
                ]
            }

        # Case F: Joints / Orthopedics
        if any(w in complaint_lower for w in ["joint", "knee", "back", "pain", "जोड़ों", "घुटना", "सांधे", "गुडघे"]) and "joint_morning_stiffness" not in answered_keys:
            return {
                "has_next": True,
                "question_key": "joint_morning_stiffness",
                "question_text": self.QUESTION_BANK["joint_morning_stiffness"][lang],
                "category": "ASSOCIATED_SYMPTOMS",
                "input_type": "CHOICE",
                "options": [
                    {"en": "Yes, severe morning stiffness (> 30 mins)", "hi": "हाँ, सुबह अधिक जकड़न रहती है", "mr": "होय, सकाळी जास्त ताठरता जाणवते"}[lang],
                    {"en": "Worse after walking or standing for long", "hi": "ज्यादा चलने या खड़े रहने पर बढ़ता है", "mr": "जास्त चालल्यावर किंवा उभे राहिल्यावर वाढते"}[lang],
                    {"en": "Mild discomfort only", "hi": "केवल हल्का दर्द", "mr": "फक्त थोडीशी वेदना"}[lang]
                ]
            }

        # If 3 or more questions answered or no other triggers, conclude interview
        return {
            "has_next": False,
            "question_key": None,
            "question_text": None,
            "category": "COMPLETE",
            "input_type": None,
            "options": None,
            "collected_summary": {
                "status": "SUFFICIENT_INFORMATION_COLLECTED",
                "total_responses": len(answered_questions)
            }
        }

    async def extract_entities_from_text(
        self,
        raw_text: str,
        document_type: str = "PRESCRIPTION"
    ) -> List[Dict[str, Any]]:
        entities = []
        text = raw_text.strip()

        # Regex heuristics for medications
        med_patterns = [
            (r"(?:Tab|Cap|Syp|Inj)?\.?\s*([A-Za-z0-9\-]+)\s+(\d+\s*(?:mg|mcg|ml|g))\s*(?:OD|BD|TDS|QID|HS|SOS|once daily|twice daily)?", "MEDICINE"),
            (r"(Metformin|Telmisartan|Atorvastatin|Amlodipine|Paracetamol|Azithromycin|Pantoprazole|Montelukast|Levothyroxine|Amoxicillin)\s*(\d+\s*mg)?", "MEDICINE"),
            (r"(HbA1c|FBS|PPBS|Serum Creatinine|Hemoglobin|Total Cholesterol|Triglycerides|Uric Acid|TSH|Platelet Count)\s*[:=\-]?\s*([0-9\.]+\s*(?:%|mg/dL|g/dL|mIU/L|/cumm)?)", "LAB_TEST"),
            (r"(?:Dr\.|Doctor)\s+([A-Za-z\s\.]+)", "DOCTOR"),
            (r"Date\s*:\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})", "DATE"),
            (r"(?:Diagnosis|Impression|Known Case of)\s*:\s*([A-Za-z0-9\s\,\-]+)", "DIAGNOSIS")
        ]

        # Extract matches
        for pattern, entity_type in med_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for m in matches:
                if entity_type == "MEDICINE":
                    name = m.group(1).strip()
                    dosage = m.group(2).strip() if len(m.groups()) > 1 and m.group(2) else "As directed"
                    entities.append({
                        "entity_type": "MEDICINE",
                        "extracted_key": name,
                        "extracted_value": dosage,
                        "reference_range": None,
                        "is_abnormal": False,
                        "confidence_score": 0.94,
                        "verified_by_doctor": False
                    })
                elif entity_type == "LAB_TEST":
                    test_name = m.group(1).strip()
                    val = m.group(2).strip() if len(m.groups()) > 1 and m.group(2) else ""
                    # Check abnormal thresholds
                    is_abnormal = False
                    ref_range = "Normal"
                    if "hba1c" in test_name.lower():
                        ref_range = "< 5.7 %"
                        try:
                            num_val = float(re.findall(r"[\d\.]+", val)[0])
                            if num_val >= 6.5:
                                is_abnormal = True
                        except Exception:
                            pass
                    elif "fbs" in test_name.lower() or "fasting" in test_name.lower():
                        ref_range = "70 - 100 mg/dL"
                    elif "creatinine" in test_name.lower():
                        ref_range = "0.7 - 1.3 mg/dL"

                    entities.append({
                        "entity_type": "LAB_TEST",
                        "extracted_key": test_name,
                        "extracted_value": val,
                        "reference_range": ref_range,
                        "is_abnormal": is_abnormal,
                        "confidence_score": 0.96,
                        "verified_by_doctor": False
                    })
                elif entity_type == "DOCTOR":
                    entities.append({
                        "entity_type": "DOCTOR",
                        "extracted_key": "Prescribing Doctor",
                        "extracted_value": m.group(1).strip(),
                        "reference_range": None,
                        "is_abnormal": False,
                        "confidence_score": 0.90,
                        "verified_by_doctor": False
                    })
                elif entity_type == "DATE":
                    entities.append({
                        "entity_type": "DATE",
                        "extracted_key": "Document Date",
                        "extracted_value": m.group(1).strip(),
                        "reference_range": None,
                        "is_abnormal": False,
                        "confidence_score": 0.98,
                        "verified_by_doctor": False
                    })
                elif entity_type == "DIAGNOSIS":
                    entities.append({
                        "entity_type": "DIAGNOSIS",
                        "extracted_key": "Document Mentioned Condition",
                        "extracted_value": m.group(1).strip()[:100],
                        "reference_range": None,
                        "is_abnormal": False,
                        "confidence_score": 0.88,
                        "verified_by_doctor": False
                    })

        # Deduplicate entities
        unique_entities = []
        seen = set()
        for e in entities:
            key = (e["entity_type"], e["extracted_key"].lower(), e["extracted_value"].lower())
            if key not in seen:
                seen.add(key)
                unique_entities.append(e)

        return unique_entities

    async def generate_doctor_summary(
        self,
        case_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        patient = case_data.get("patient", {})
        chief_complaint = case_data.get("chief_complaint", "Not specified")
        symptoms = case_data.get("symptoms", [])
        med_history = case_data.get("medical_histories", [])
        medications = case_data.get("medications", [])
        allergies = case_data.get("allergies", [])
        lifestyle = case_data.get("lifestyle", {})
        ayurveda = case_data.get("ayurveda", {})
        documents = case_data.get("documents", [])
        red_flags = case_data.get("red_flags", [])

        # Build clinical summary sections adhering to safety rules
        symptom_bullets = [
            f"{s.get('name', 'Symptom')} (Duration: {s.get('duration', 'Unspecified')}, Severity: {s.get('severity', 'N/A')}/10)"
            for s in symptoms
        ] if symptoms else [chief_complaint]

        history_bullets = [
            f"{h.get('condition_name')} ({h.get('diagnosed_year_or_duration', 'Chronic')})"
            for h in med_history
        ] if med_history else ["No significant chronic medical illness reported by patient."]

        med_bullets = [
            f"{m.get('drug_name')} {m.get('dosage', '')} - {m.get('frequency', 'Regular')} [Source: {m.get('source', 'PATIENT')}]"
            for m in medications
        ] if medications else ["No current medications reported."]

        allergy_bullets = [
            f"{a.get('allergen_name')} (Reaction: {a.get('reaction_type', 'Unspecified')}, Severity: {a.get('severity', 'MODERATE')})"
            for a in allergies
        ] if allergies else ["No known drug/food allergies reported."]

        doc_insights = []
        for doc in documents:
            extractions = doc.get("extractions", [])
            ext_summary = ", ".join([f"{e.get('extracted_key')}: {e.get('extracted_value')}" for e in extractions[:4]])
            doc_insights.append(f"{doc.get('document_type', 'Document')} ({doc.get('file_name')}): {ext_summary or 'Text scanned'}")
        if not doc_insights:
            doc_insights = ["No external medical documents uploaded."]

        missing_info = []
        if not medications:
            missing_info.append("Verification of current prescription medicines.")
        if not allergies:
            missing_info.append("Confirmation of drug allergy history.")
        if not med_history:
            missing_info.append("Past surgical and hospitalization history confirmation.")

        return {
            "ai_disclaimer": "AI-Assisted Intake Summary. Prepared solely for attending physician review. Does NOT constitute a clinical diagnosis or treatment prescription.",
            "patient_overview": f"{patient.get('full_name', 'Patient')}, {patient.get('age', 'Age N/A')} y/o {patient.get('sex', '')}, Preferred Language: {patient.get('preferred_language', 'en').upper()}.",
            "chief_complaint": chief_complaint,
            "patient_reported_symptoms": symptom_bullets,
            "past_medical_history": history_bullets,
            "current_medications": med_bullets,
            "reported_allergies": allergy_bullets,
            "document_extracted_findings": doc_insights,
            "red_flag_concerns": red_flags if red_flags else ["No automated red-flag triggers met."],
            "ayurveda_parameters": ayurveda if ayurveda else None,
            "lifestyle_context": f"Diet: {lifestyle.get('diet_type', 'Standard')}, Smoking: {lifestyle.get('smoking_status', 'NEVER')}, Alcohol: {lifestyle.get('alcohol_status', 'NEVER')}, Sleep: {lifestyle.get('sleep_hours', 'N/A')}",
            "suggested_doctor_clarifications": missing_info
        }
