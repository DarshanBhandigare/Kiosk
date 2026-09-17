export const SUPPORTED_LANGUAGES = ['en', 'hi', 'mr'] as const;
export type LanguageCode = 'en' | 'hi' | 'mr';

export interface TranslationDictionary {
  welcomeTitle: string;
  welcomeSubtitle: string;
  startKiosk: string;
  voiceGuidance: string;
  voiceGuidanceOn: string;
  voiceGuidanceOff: string;
  languageSelectTitle: string;
  languageSelectSubtitle: string;
  identificationTitle: string;
  identificationSubtitle: string;
  abhaIdPlaceholder: string;
  verifyAbha: string;
  patientIdOrNew: string;
  skipAbha: string;
  consentTitle: string;
  consentSubtitle: string;
  consentBody: string;
  consentCheckbox: string;
  giveConsent: string;
  basicInfoTitle: string;
  fullName: string;
  age: string;
  sex: string;
  male: string;
  female: string;
  other: string;
  contactNumber: string;
  emergencyContact: string;
  chiefComplaintTitle: string;
  chiefComplaintSubtitle: string;
  speakNow: string;
  listening: string;
  stopListening: string;
  typeInstead: string;
  commonSymptoms: string;
  editTranscript: string;
  confirmAnswer: string;
  adaptiveInterviewTitle: string;
  repeatQuestion: string;
  skipQuestion: string;
  changeAnswer: string;
  severityLabel: string;
  durationLabel: string;
  medicalHistoryTitle: string;
  pastConditions: string;
  currentMedications: string;
  allergies: string;
  ayurvedaSection: string;
  ayurvedaToggle: string;
  documentUploadTitle: string;
  documentUploadSubtitle: string;
  uploadPrescription: string;
  uploadLabReport: string;
  uploadDischargeSummary: string;
  orUseSampleDoc: string;
  ocrProcessing: string;
  extractedFindings: string;
  timelineTitle: string;
  timelineSubtitle: string;
  redFlagNoticeTitle: string;
  redFlagNoticeSubtitle: string;
  reviewTitle: string;
  submitCase: string;
  submissionSuccessTitle: string;
  tokenNumber: string;
  waitingDoctor: string;
  returnHome: string;
  next: string;
  back: string;
  edit: string;
  verified: string;
  unverified: string;
  aiDisclaimer: string;
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    welcomeTitle: "Welcome to MediKiosk",
    welcomeSubtitle: "Self-Service Outpatient Case-Taking & Triage Assistant",
    startKiosk: "Start Case Intake",
    voiceGuidance: "Voice Guidance",
    voiceGuidanceOn: "Voice Guidance ON",
    voiceGuidanceOff: "Voice Guidance OFF",
    languageSelectTitle: "Choose Your Preferred Language",
    languageSelectSubtitle: "You can change your language anytime during the intake.",
    identificationTitle: "Patient Identification",
    identificationSubtitle: "Enter your ABHA Health ID or register quickly with mobile number.",
    abhaIdPlaceholder: "Enter 14-digit ABHA ID or username@abdm",
    verifyAbha: "Verify ABHA ID",
    patientIdOrNew: "Or continue with Mobile / Demographics",
    skipAbha: "Skip ABHA Verification",
    consentTitle: "Patient Consent & Privacy Disclosure",
    consentSubtitle: "Transparency regarding how your medical information is processed.",
    consentBody: "MediKiosk uses artificial intelligence solely to organize, transcribe, and structure your reported health history and scanned medical reports for your attending doctor. The system NEVER provides independent clinical diagnosis, treatment advice, or drug prescriptions. All information remains confidential and will be reviewed and verified by your consulting physician.",
    consentCheckbox: "I understand and consent to AI-assisted information collection for my doctor's review.",
    giveConsent: "I Agree & Proceed",
    basicInfoTitle: "Basic Information",
    fullName: "Full Name",
    age: "Age (Years)",
    sex: "Sex / Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    contactNumber: "Mobile Number",
    emergencyContact: "Emergency Contact / Next of Kin",
    chiefComplaintTitle: "What is your main health concern today?",
    chiefComplaintSubtitle: "Press the microphone to speak in your language, or type your complaint.",
    speakNow: "Tap to Speak",
    listening: "Listening... Please speak clearly",
    stopListening: "Done Speaking",
    typeInstead: "Type with Keyboard",
    commonSymptoms: "Common Reasons for Visit:",
    editTranscript: "Edit transcription if needed",
    confirmAnswer: "Confirm & Continue",
    adaptiveInterviewTitle: "Health Follow-Up Questions",
    repeatQuestion: "Repeat Question Audio",
    skipQuestion: "Skip this question",
    changeAnswer: "Change previous answer",
    severityLabel: "How severe is your discomfort? (1 = Mild, 10 = Unbearable)",
    durationLabel: "How long have you had this issue?",
    medicalHistoryTitle: "Medical History & Ongoing Medications",
    pastConditions: "Past or Chronic Illnesses",
    currentMedications: "Current Medicines You Are Taking",
    allergies: "Drug / Food Allergies",
    ayurvedaSection: "Ayurveda Consultation Details (Optional)",
    ayurvedaToggle: "Include Ayurveda Intake (Prakriti, Agni, Sleep)",
    documentUploadTitle: "Scan Medical Records & Reports",
    documentUploadSubtitle: "Scan prescriptions, lab test reports, or hospital discharge papers.",
    uploadPrescription: "Scan Prescription",
    uploadLabReport: "Scan Lab Report",
    uploadDischargeSummary: "Scan Discharge Summary",
    orUseSampleDoc: "Or select a sample document for demonstration",
    ocrProcessing: "Scanning document & extracting medical entities...",
    extractedFindings: "Extracted Clinical Entities",
    timelineTitle: "Chronological Medical History Timeline",
    timelineSubtitle: "Combined sequence of your reported conditions and scanned medical documents.",
    redFlagNoticeTitle: "Triage Safety Screening",
    redFlagNoticeSubtitle: "Automated rule-based checks for emergency clinical symptoms.",
    reviewTitle: "Review Your Case Information",
    submitCase: "Submit Case to OPD Doctor",
    submissionSuccessTitle: "Case Registered Successfully!",
    tokenNumber: "Your OPD Token Number",
    waitingDoctor: "Please proceed to the OPD Waiting Hall. The attending doctor will call your token number.",
    returnHome: "Start New Session",
    next: "Next Step",
    back: "Back",
    edit: "Edit",
    verified: "Doctor Verified",
    unverified: "Patient Reported",
    aiDisclaimer: "AI-Assisted Information Collection. Does not replace a physician."
  },
  hi: {
    welcomeTitle: "मेडीकियोस्क में आपका स्वागत है",
    welcomeSubtitle: "ओपीडी स्व-सेवा मरीज केस-टेकिंग और ट्राइएज सहायक",
    startKiosk: "केस शुरू करें",
    voiceGuidance: "आवाज़ मार्गदर्शन",
    voiceGuidanceOn: "आवाज़ चालू है",
    voiceGuidanceOff: "आवाज़ बंद है",
    languageSelectTitle: "अपनी पसंदीदा भाषा चुनें",
    languageSelectSubtitle: "आप किसी भी समय भाषा बदल सकते हैं।",
    identificationTitle: "मरीज की पहचान",
    identificationSubtitle: "अपना आभा (ABHA) आईडी दर्ज करें या मोबाइल नंबर से पंजीकरण करें।",
    abhaIdPlaceholder: "14-अंकीय आभा आईडी या नाम@abdm दर्ज करें",
    verifyAbha: "आभा आईडी सत्यापित करें",
    patientIdOrNew: "या मोबाइल नंबर से जारी रखें",
    skipAbha: "आभा छोड़ें और आगे बढ़ें",
    consentTitle: "मरीज की सहमति और गोपनीयता",
    consentSubtitle: "आपकी स्वास्थ्य जानकारी कैसे एकत्र की जाती है।",
    consentBody: "मेडीकियोस्क केवल आपके डॉक्टर की सहायता के लिए आपकी बीमारी के इतिहास और पुरानी पर्चियों को व्यवस्थित करता है। यह प्रणाली स्वयं कोई बीमारी का निदान या दवा की सलाह नहीं देती है। डॉक्टर आपके विवरण की स्वयं जांच करेंगे।",
    consentCheckbox: "मैं डॉक्टर के अवलोकन हेतु एआई-सहायक जानकारी संग्रह से सहमत हूँ।",
    giveConsent: "सहमति दें और आगे बढ़ें",
    basicInfoTitle: "बुनियादी जानकारी",
    fullName: "पूरा नाम",
    age: "उम्र (वर्ष)",
    sex: "लिंग",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    contactNumber: "मोबाइल नंबर",
    emergencyContact: "आपातकालीन संपर्क",
    chiefComplaintTitle: "आज आपको क्या मुख्य तकलीफ या समस्या है?",
    chiefComplaintSubtitle: "माइक बटन दबाकर बोलें या नीचे लिखें।",
    speakNow: "बोलने के लिए माइक दबाएं",
    listening: "सुन रहे हैं... कृपया स्पष्ट बोलें",
    stopListening: "बोलना समाप्त",
    typeInstead: "कीबोर्ड से लिखें",
    commonSymptoms: "अक्सर होने वाली समस्याएं:",
    editTranscript: "यदि आवश्यक हो तो लिखा हुआ सुधारें",
    confirmAnswer: "पुष्टि करें और आगे बढ़ें",
    adaptiveInterviewTitle: "स्वास्थ्य से जुड़े अनुवर्ती प्रश्न",
    repeatQuestion: "प्रश्न दोबारा सुनें",
    skipQuestion: "यह प्रश्न छोड़ें",
    changeAnswer: "पिछला उत्तर बदलें",
    severityLabel: "तकलीफ कितनी गंभीर है? (1 = हल्की, 10 = असहनीय)",
    durationLabel: "यह समस्या कितने समय से है?",
    medicalHistoryTitle: "पिछली बीमारियां और वर्तमान दवाएं",
    pastConditions: "पुरानी या पहले से मौजूद बीमारियां",
    currentMedications: "वर्तमान में ली जाने वाली दवाएं",
    allergies: "दवा या भोजन से एलर्जी",
    ayurvedaSection: "आयुर्वेद परामर्श विवरण (वैकल्पिक)",
    ayurvedaToggle: "आयुर्वेद जानकारी शामिल करें (प्रकृति, अग्नि, नींद)",
    documentUploadTitle: "दवा की पर्ची या रिपोर्ट स्कैन करें",
    documentUploadSubtitle: "पुरानी पर्चियां, लैब टेस्ट रिपोर्ट या डिस्चार्ज समरी जोड़ें।",
    uploadPrescription: "पर्ची स्कैन करें",
    uploadLabReport: "लैब रिपोर्ट स्कैन करें",
    uploadDischargeSummary: "डिस्चार्ज समरी स्कैन करें",
    orUseSampleDoc: "या डेमो के लिए नमूना रिपोर्ट चुनें",
    ocrProcessing: "दस्तावेज़ स्कैन हो रहा है और जानकारी निकाली जा रही है...",
    extractedFindings: "निकाली गई स्वास्थ्य जानकारी",
    timelineTitle: "स्वास्थ्य इतिहास की समयरेखा (टाइमलाइन)",
    timelineSubtitle: "आपकी पुरानी बीमारियों और रिपोर्टों का कालक्रम।",
    redFlagNoticeTitle: "सुरक्षा जांच (रेड फ्लैग)",
    redFlagNoticeSubtitle: "गंभीर लक्षणों की स्वचालित सुरक्षा जांच।",
    reviewTitle: "अपनी दर्ज जानकारी की समीक्षा करें",
    submitCase: "केस डॉक्टर को सबमिट करें",
    submissionSuccessTitle: "केस सफलतापूर्वक पंजीकृत हुआ!",
    tokenNumber: "आपका ओपीडी टोकन नंबर",
    waitingDoctor: "कृपया ओपीडी प्रतीक्षालय में बैठें। डॉक्टर आपका टोकन नंबर बुलाएंगे।",
    returnHome: "नया केस शुरू करें",
    next: "आगे बढ़ें",
    back: "पीछे जाएं",
    edit: "संशोधित करें",
    verified: "डॉक्टर द्वारा सत्यापित",
    unverified: "मरीज द्वारा दर्ज",
    aiDisclaimer: "एआई सहायक प्रणाली। यह डॉक्टर का विकल्प नहीं है।"
  },
  mr: {
    welcomeTitle: "मेडीकिओस्क मध्ये आपले स्वागत आहे",
    welcomeSubtitle: "ओपीडी स्व-सेवा रुग्ण केस-टेकिंग व ट्रायज सहाय्यक",
    startKiosk: "केस नोंदणी सुरू करा",
    voiceGuidance: "आवाज मार्गदर्शन",
    voiceGuidanceOn: "आवाज चालू आहे",
    voiceGuidanceOff: "आवाज बंद आहे",
    languageSelectTitle: "आपली पसंतीची भाषा निवडा",
    languageSelectSubtitle: "आपण कोणत्याही वेळी भाषा बदलू शकता.",
    identificationTitle: "रुग्ण ओळख",
    identificationSubtitle: "आपला आभा (ABHA) आयडी प्रविष्ट करा किंवा मोबाईल क्रमांकाने नोंदणी करा.",
    abhaIdPlaceholder: "१४-अंकी आभा आयडी किंवा नाव@abdm प्रविष्ट करा",
    verifyAbha: "आभा आयडी तपासा",
    patientIdOrNew: "किंवा मोबाईल क्रमांकाने पुढे जा",
    skipAbha: "आभा वगळा आणि पुढे जा",
    consentTitle: "रुग्ण संमती व गोपनीयता",
    consentSubtitle: "आपली वैद्यकीय माहिती कशी गोळा केली जाते.",
    consentBody: "मेडीकिओस्क केवळ आपल्या तपासणी डॉक्टरांच्या सोयीसाठी आपले लक्षणे व जुन्या पावत्यांची माहिती व्यवस्थित गोळा करते. ही प्रणाली कोणताही स्वतंत्र रोगनिदान अथवा औषधोपचार ठरवत नाही. तपासणी डॉक्टर सर्व माहितीची खात्री करतील.",
    consentCheckbox: "मी डॉक्टरांच्या तपासणीसाठी एआय-सहाय्यक माहिती संकलनास संमती देतो/देते.",
    giveConsent: "संमती देऊन पुढे जा",
    basicInfoTitle: "मूलभूत माहिती",
    fullName: "पूर्ण नाव",
    age: "वय (वर्षे)",
    sex: "लिंग",
    male: "पुरुष",
    female: "स्त्री",
    other: "इतर",
    contactNumber: "मोबाईल क्रमांक",
    emergencyContact: "तातडीचा संपर्क क्रमांक",
    chiefComplaintTitle: "आज आपल्याला काय मुख्य त्रास होत आहे?",
    chiefComplaintSubtitle: "माईकचे बटण दाबून बोला किंवा खाली टाईप करा.",
    speakNow: "बोलण्यासाठी माईक दाबा",
    listening: "ऐकत आहोत... कृपया स्पष्ट बोला",
    stopListening: "बोलणे पूर्ण झाले",
    typeInstead: "कीबोर्डने टाईप करा",
    commonSymptoms: "वारंवार आढळणाऱ्या तक्रारी:",
    editTranscript: "आवश्यक असल्यास मजकूर दुरुस्त करा",
    confirmAnswer: "खात्री करा व पुढे जा",
    adaptiveInterviewTitle: "आरोग्याबाबतचे पुढील प्रश्न",
    repeatQuestion: "प्रश्न पुन्हा ऐका",
    skipQuestion: "हा प्रश्न वगळा",
    changeAnswer: "मागील उत्तर बदला",
    severityLabel: "त्रास किती तीव्र आहे? (१ = सौम्य, १० = असह्य वेदना)",
    durationLabel: "हा त्रास किती दिवसांपासून होत आहे?",
    medicalHistoryTitle: "मागील आजार व चालू औषधे",
    pastConditions: "मागील किंवा जुने आजार",
    currentMedications: "सध्या घेत असलेली औषधे",
    allergies: "औषध किंवा अन्नाची ॲलर्जी",
    ayurvedaSection: "आयुर्वेद तपासणी तपशील (पर्यायी)",
    ayurvedaToggle: "आयुर्वेद माहिती जोडा (प्रकृती, अग्नी, झोप)",
    documentUploadTitle: "औषध पावती किंवा अहवाल स्कॅन करा",
    documentUploadSubtitle: "जुनी प्रिस्क्रिप्शन, रक्त तपासणी किंवा डिस्चार्ज पत्रक स्कॅन करा.",
    uploadPrescription: "प्रिस्क्रिप्शन स्कॅन करा",
    uploadLabReport: "लॅब रिपोर्ट स्कॅन करा",
    uploadDischargeSummary: "डिस्चार्ज समरी स्कॅन करा",
    orUseSampleDoc: "किंवा डेमोसाठी नमुना रिपोर्ट निवडा",
    ocrProcessing: "कागदपत्र स्कॅन करून माहिती काढली जात आहे...",
    extractedFindings: "निष्कर्षित वैद्यकीय माहिती",
    timelineTitle: "वैद्यकीय इतिहासाची टाईमलाईन",
    timelineSubtitle: "आपल्या आजारांचा आणि अहवालांचा कालक्रमानुसार तक्ता.",
    redFlagNoticeTitle: "सुरक्षा तपासणी (रेड फ्लॅग)",
    redFlagNoticeSubtitle: "गंभीर लक्षणांची स्वयंचलित सुरक्षा तपासणी.",
    reviewTitle: "नोंदवलेल्या माहितीचे पुनरावलोकन",
    submitCase: "केस डॉक्टरांना पाठवा",
    submissionSuccessTitle: "केस यशस्वीरीत्या नोंदवला गेला!",
    tokenNumber: "आपला ओपीडी टोकन क्रमांक",
    waitingDoctor: "कृपया ओपीडी प्रतीक्षा कक्षात बसा. डॉक्टर आपल्या टोकन क्रमांकाने बोलावतील.",
    returnHome: "नवीन केस सुरू करा",
    next: "पुढील पायरी",
    back: "मागे",
    edit: "बदला",
    verified: "डॉक्टरांनी प्रमाणित",
    unverified: "रुग्णाने नोंदवलेले",
    aiDisclaimer: "एआय सहाय्यक प्रणाली. हे डॉक्टरांचा पर्याय नाही."
  }
};
