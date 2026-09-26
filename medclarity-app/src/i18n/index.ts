import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LANGUAGE_STORAGE_KEY = 'user_language';

const resources = {
  en: {
    translation: {
      appName: 'MedClarity AI',
      tagline: 'Your AI Health Companion',

      // Common
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      edit: 'Edit',
      delete: 'Delete',
      close: 'Close',
      retry: 'Retry',
      continueBtn: 'Continue',
      welcome: 'Welcome',
      scanPrescription: 'Scan Prescription',
      history: 'History',
      profile: 'Profile',
      settings: 'Settings',
      home: 'Home',
      medicines: 'Medicines',
      errorTitle: 'Something Went Wrong',
      search: 'Search',

      // Login
      loginTitle: 'Welcome to MedClarity',
      loginSubtitle: 'Enter your phone number or email to receive a verification code',
      inputPlaceholder: 'Email or phone number',
      getOtp: 'Get OTP',
      termsNotice: 'By continuing, you agree to our Terms of Service & Privacy Policy.',

      // OTP
      otpTitle: 'Verify Code',
      otpSubtitle: 'We sent a 6-digit code to your registered contact',
      verifyBtn: 'Verify & Continue',
      resendCode: 'Resend Code',
      otpInvalid: 'Invalid OTP code. Please enter 6 digits.',

      // Language Selection
      chooseAppLanguage: 'Choose App Language',
      selectLanguageTitle: 'Choose App Language',
      selectLanguageSubtitle: 'Select your preferred language to continue / தொடர உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
      englishCard: 'English',
      tamilCard: 'தமிழ்',
      englishSub: 'Continue in English',
      tamilSub: 'தமிழில் தொடரவும்',

      // Mode Selection
      selectModeTitle: 'Choose Your Experience',
      patientModeTitle: 'Continue as Patient',
      patientModeDesc: 'View schedule, scan prescriptions & get friendly daily voice reminders',
      caregiverModeTitle: 'Continue as Caregiver',
      caregiverModeDesc: 'Monitor adherence, manage medicine schedules & stay notified for loved ones',

      // Trust Badges
      whoGrounded: 'WHO Grounded',
      humanVerified: 'Human Verified',
      multilingual: 'Multilingual',
      securePrivate: 'Secure & Private',

      // Onboarding
      skip: 'Skip',
      onboarding1Title: 'Scan Any Prescription',
      onboarding1Desc: 'Take a clear photo of handwritten doctor prescriptions. Our AI extracts medicine names & instructions.',
      onboarding2Title: 'Easy-to-Understand Advice',
      onboarding2Desc: 'Get clear information on dosage, timing, and before/after food instructions grounded in WHO EML & India NLEM guidelines.',
      onboarding3Title: 'Never Miss a Dose',
      onboarding3Desc: 'Receive warm, gentle voice reminders timed for your exact schedule.',
      getStarted: 'Get Started',

      // Patient Dashboard
      welcomeHeader: 'Hello, ',
      todaysSchedule: "Today's Schedule",
      streakTitle: 'Health Adherence Tree',
      streakSubtext: 'Keep taking your medicines on time to help your tree grow!',
      scanPrescriptionBtn: 'Scan Prescription',
      myMedicinesBtn: 'My Medicines',
      noRemindersToday: 'No medicine reminders scheduled for today.',
      upcoming: 'Upcoming',
      completed: 'Completed',
      missed: 'Missed',
      takenAction: 'Taken ✓',
      snoozeAction: 'Snooze',

      // Scan Prescription Workflow
      scanTitle: 'Scan Prescription',
      scanSubtitle: 'Align the prescription within the box or choose an image from gallery',
      captureBtn: 'Take Photo',
      galleryBtn: 'Choose from Gallery',
      processingOcr: 'Reading prescription handwriting...',
      ocrVerifyTitle: 'Verify Prescription Text',
      ocrVerifySubtitle: 'Please review and edit any misread words before AI processing:',
      processAiBtn: 'Interpret Medication Info',
      aiProcessingMsg: 'Analyzing medicine details against WHO guidelines...',

      // Analysis Loading (5 Clinical Stages)
      analyzingPrescriptionTitle: 'Analyzing Prescription',
      analyzingPrescriptionSubtitle: 'Clinical AI pipeline verifying against WHO & CDSCO guidelines',
      stage1: 'Extracting prescription text',
      stage2: 'Identifying medicines',
      stage3: 'Reading dosage and frequency',
      stage4: 'Checking medicine information',
      stage5: 'Generating patient-friendly explanation',
      estimatedProgress: 'Processing clinical pipeline...',

      // Results
      resultsTitle: 'Prescription Analysis',
      sourceCitation: 'Source: Grounded in WHO Model List of Essential Medicines (23rd Ed, 2023) & CDSCO India NLEM 2022.',
      doctorDisclaimer: 'Disclaimer: This summary is for guidance. Please verify with your doctor or pharmacist.',
      playAudio: 'Listen to Voice Explanation',
      stopAudio: 'Stop Audio',
      setReminders: 'Set Reminders for These Medicines',
      saveOnly: 'Save Only',
      beforeFood: 'Take Before Food',
      afterFood: 'Take After Food',
      withFood: 'Take With Food',

      // Patients & Caregiver
      patientsTitle: 'Patients',
      searchPatient: 'Search patient by name or phone...',
      addPatientBtn: 'Add Patient',
      addPatientTitle: 'Register New Patient',
      patientName: 'Patient Name',
      patientAge: 'Age',
      patientGender: 'Gender',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      patientPhone: 'Phone Number',
      patientRelationship: 'Relationship (Optional)',
      relationshipPlaceholder: 'e.g. Father, Mother, Spouse, Child',
      patientNotes: 'Notes (Optional)',
      notesPlaceholder: 'e.g. Hypertension, Diabetic, takes BP medicine',
      savePatient: 'Save Patient',
      editPatient: 'Edit Patient',
      patientDetailsTitle: 'Patient Details',
      activeMedicines: 'Active Medicines',
      upcomingReminders: 'Upcoming Reminders',
      addMedicineScheduleBtn: 'Add Medicine Schedule',
      noPatientsFound: 'No patients found.',
      noActiveMedicines: 'No active medicines added yet.',
      caregiverTitle: 'Caregiver Overview',
      linkedPatients: 'Linked Patients',
      linkPatientBtn: '+ Add / Link Patient',
      patientAdherence: 'Adherence',
      treeStage: 'Tree Level',
      viewPatientDetails: 'View Details',
      patientCodePlaceholder: 'Enter Patient Code or Phone',
      linkSuccess: 'Patient linked successfully!',
      missedAlert: 'Missed Dose Alert',
      caregiverNotice: 'Caregivers receive notifications only when a dose is missed.',

      // Dedicated Medicine Schedule Form
      addScheduleTitle: 'Add Medicine Schedule',
      scheduleFor: 'Schedule For',
      timeOfDayLabel: 'Reminder Time',
      morning: 'Morning',
      afternoon: 'Afternoon',
      night: 'Night',
      startDate: 'Start Date',
      endDate: 'End Date',
      frequencyLabel: 'Frequency',
      daily: 'Daily',
      alternateDays: 'Alternate Days',
      asNeeded: 'As Needed',
      exactTime: 'Custom Clock Time',
      saveScheduleBtn: 'Save Schedule',
      selectTimePrompt: 'Select Reminder Time',
      quickPresets: 'Quick Suggestions',
      hours: 'Hrs',
      minutes: 'Min',
      reminderEnabled: 'Reminder Enabled',
      reminderDisabled: 'Reminder Disabled',
      deleteReminderPrompt: 'Are you sure you want to delete this reminder?',
      notificationSent: 'Notification Sent',

      // Reminder Setup
      reminderSetupTitle: 'Reminder Setup',
      medicineName: 'Medicine Name',
      dosage: 'Dosage (e.g. 1 Tablet / 500mg)',
      relationToFood: 'Relation to Food',
      scheduledTime: 'Scheduled Time',
      identifierTitle: 'Personal Identifier (Optional)',
      identifierPlaceholder: 'e.g. White Bottle, Blue Strip',
      attachPhoto: 'Attach Medicine Photo',
      photoAttached: 'Photo Attached ✓',
      confirmNext: 'Confirm & Next',
      addAnother: '+ Add Another Medicine',

      // My Medicines
      myMedicinesTitle: 'My Active Medicines',
      addNewMedicine: '+ Add New Medicine',
      fromScan: 'Scan a Prescription',
      manualEntry: 'Manual Entry',
      noMedicinesYet: 'No active medicines added yet.',

      // History
      historyTitle: 'Adherence Log',
      historySubtitle: 'Record of past medication reminders',

      // Settings
      settingsTitle: 'Settings & Profile',
      languageSetting: 'App Language',
      modeSetting: 'Current Role',
      notificationsSetting: 'Reminder Notifications',
      profileTitle: 'User Profile',
      logout: 'Log Out',

      // Signup
      signupTitle: 'Create Account',
      signupSubtitle: 'Join MedClarity AI for smart, accessible medication management',
      fullNamePlaceholder: 'Full Name',
      alreadyHaveAccount: 'Already have an account?',
      loginLink: 'Log In',
      createAccountBtn: 'Create Account & Verify',

      // Medicine Details
      medicineDetailsTitle: 'Medicine Details',
      medicineInfo: 'Dosage & Schedule',
      instructionsTitle: 'How to Take',
      sideEffectsTitle: 'Possible Side Effects',
      precautionsTitle: 'Safety Precautions',
      whoVerified: 'WHO Model List Verified',
      listenAudioSummary: 'Listen to Voice Breakdown',

      // Voice Explanation
      voiceExplanationTitle: 'Voice Audio Guide',
      voiceExplanationSubtitle: 'Clear spoken prescription instructions',
      nowSpeaking: 'Now Explaining',
      speedSlow: '0.75x Slow',
      speedNormal: '1.0x Normal',
      speedFast: '1.25x Fast',
      replayVoice: 'Replay from start',
      askAiQuestion: 'Ask AI Assistant a Question',

      // Reminder Success
      reminderSuccessTitle: 'Reminder Scheduled!',
      reminderSuccessSubtitle: 'Your medication reminder is active with daily notifications',
      reminderScheduledMsg: 'We will notify you at your scheduled dose time.',
      viewAllReminders: 'View All Reminders',
      backToHome: 'Back to Home',

      // Profile
      profileHeader: 'Patient Profile',
      personalInfo: 'Personal Information',
      healthDetails: 'Health & Medical Info',
      bloodGroup: 'Blood Group',
      allergies: 'Known Allergies',
      caregiverCode: 'Caregiver Share Code',
      emergencyContact: 'Emergency Contact',
    },
  },
  ta: {
    translation: {
      appName: 'மெட்கிளாரிட்டி AI',
      tagline: 'உங்கள் AI சுகாதார உதவியாளர்',

      // Common
      confirm: 'உறுதி செய்',
      cancel: 'ரத்து செய்',
      save: 'சேமி',
      back: 'பின்செல்',
      next: 'அடுத்து',
      done: 'முடிந்தது',
      edit: 'திருத்து',
      delete: 'நீக்கு',
      close: 'மூடு',
      retry: 'மீண்டும் முயல்க',
      continueBtn: 'தொடரவும்',
      welcome: 'வரவேற்கிறோம்',
      scanPrescription: 'மருந்துச் சீட்டை ஸ்கேன் செய்யவும்',
      history: 'வரலாறு',
      profile: 'சுயவிவரம்',
      settings: 'அமைப்புகள்',
      home: 'முகப்பு',
      medicines: 'மருந்துகள்',
      errorTitle: 'பிழை ஏற்பட்டது',
      search: 'தேடுக',

      // Login
      loginTitle: 'மெட்கிளாரிட்டிக்கு நல்வரவு',
      loginSubtitle: 'சரிபார்ப்பு குறியீட்டைப் பெற மின்னஞ்சல் அல்லது தொலைபேசி எண்ணை உள்ளிடவும்',
      inputPlaceholder: 'மின்னஞ்சல் அல்லது தொலைபேசி எண்',
      getOtp: 'OTP பெறுக',
      termsNotice: 'தொடர்வதன் மூலம், எங்களின் சேவை விதிகள் மற்றும் தனியுரிமைக் கொள்கையை ஏற்கிறீர்கள்.',

      // OTP
      otpTitle: 'குறியீட்டை சரிபார்க்கவும்',
      otpSubtitle: 'உங்கள் தொடர்புக்கு 6 இலக்க OTP குறியீட்டை அனுப்பியுள்ளோம்',
      verifyBtn: 'சரிபார்த்து தொடரவும்',
      resendCode: 'மறுபடியும் அனுப்புக',
      otpInvalid: 'செல்லுபடியாகாத OTP. 6 இலக்கங்களை உள்ளிடவும்.',

      // Language Selection
      chooseAppLanguage: 'பயன்பாட்டு மொழியைத் தேர்ந்தெடுக்கவும்',
      selectLanguageTitle: 'பயன்பாட்டு மொழியைத் தேர்ந்தெடுக்கவும்',
      selectLanguageSubtitle: 'தொடர உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
      englishCard: 'English',
      tamilCard: 'தமிழ்',
      englishSub: 'Continue in English',
      tamilSub: 'தமிழில் தொடரவும்',

      // Mode Selection
      selectModeTitle: 'உங்கள் முறையைத் தேர்ந்தெடுக்கவும்',
      patientModeTitle: 'நோயாளி முறை',
      patientModeDesc: 'அட்டவணையைப் பார்க்கவும், சீட்டை ஸ்கேன் செய்யவும், குரல் நினைவூட்டல்களைப் பெறவும்',
      caregiverModeTitle: 'பராமரிப்பாளர் முறை',
      caregiverModeDesc: 'உங்கள் குடும்பத்தினரின் மருந்து அட்டவணையை கண்காணிக்கவும்',

      // Trust Badges
      whoGrounded: 'WHO அங்கீகாரம்',
      humanVerified: 'மனித சரிபார்ப்பு',
      multilingual: 'பல மொழிகள்',
      securePrivate: 'பாதுகாப்பானது',

      // Onboarding
      skip: 'தவிர்',
      onboarding1Title: 'மருத்துவ சீட்டை ஸ்கேன் செய்க',
      onboarding1Desc: 'மருத்துவர் எழுதிய சீட்டைப் படம் பிடிக்கவும். AI மருந்தின் பெயரை அறியும்.',
      onboarding2Title: 'எளிமையான விளக்கம்',
      onboarding2Desc: 'உணவுக்கு முன்/பின் சாப்பிடும் முறையை WHO வழிகாட்டுதல்களின்படி எளிதாகப் பெறலாம்.',
      onboarding3Title: 'மருந்தை தவறவிடாதீர்கள்',
      onboarding3Desc: 'சரியான நேரத்தில் அன்பான குரல் நினைவூட்டல்களைப் பெறுங்கள்.',
      getStarted: 'தொடங்கலாம்',

      // Patient Dashboard
      welcomeHeader: 'வணக்கம், ',
      todaysSchedule: 'இன்றைய மருந்து அட்டவணை',
      streakTitle: 'வளர்ச்சி மரம்',
      streakSubtext: 'மருந்துகளை தவறாமல் உட்கொண்டு உங்கள் மரத்தை வளருங்கள்!',
      scanPrescriptionBtn: 'மருந்துச் சீட்டை ஸ்கேன் செய்யவும்',
      myMedicinesBtn: 'என் மருந்துகள்',
      noRemindersToday: 'இன்று எந்த நினைவூட்டலும் இல்லை.',
      upcoming: 'வரவிருப்பது',
      completed: 'முடிந்தது',
      missed: 'தவறியது',
      takenAction: 'எடுத்துக்கொண்டேன் ✓',
      snoozeAction: 'தள்ளிப்போடு',

      // Scan Prescription Workflow
      scanTitle: 'மருந்துச் சீட்டை ஸ்கேன் செய்யவும்',
      scanSubtitle: 'மருத்துவ சீட்டை பெட்டிக்குள் சரியாக வைக்கவும்',
      captureBtn: 'படம் எடுக்கவும்',
      galleryBtn: 'கேலரியில் தேர்ந்தெடுக்கவும்',
      processingOcr: 'சீட்டில் உள்ள உரையைப் படிக்கிறது...',
      ocrVerifyTitle: 'உரையை சரிபார்க்கவும்',
      ocrVerifySubtitle: 'செயலாக்கத்திற்கு முன் உரையைச் சரிபார்க்கவும்:',
      processAiBtn: 'மருந்து தகவலை அறியவும்',
      aiProcessingMsg: 'WHO வழிகாட்டுதல்களுடன் மருந்தை பகுப்பாய்வு செய்கிறது...',

      // Analysis Loading (5 Clinical Stages in Pure Unicode Tamil)
      analyzingPrescriptionTitle: 'மருந்துச் சீட்டு பகுப்பாய்வு',
      analyzingPrescriptionSubtitle: 'மருத்துவ வழிகாட்டுதல்களுடன் சரிபார்க்கப்படுகிறது',
      stage1: 'மருந்துச் சீட்டு உரையைப் பிரித்தெடுக்கிறது',
      stage2: 'மருந்துகளை அடையாளம் காண்கிறது',
      stage3: 'மருந்தின் அளவு மற்றும் கால அளவைப் படிக்கிறது',
      stage4: 'மருந்து தகவல்களை சரிபார்க்கிறது',
      stage5: 'நோயாளிக்கு புரியும் எளிய விளக்கத்தை உருவாக்குகிறது',
      estimatedProgress: 'செயலாக்கம் நடைபெறுகிறது...',

      // Results
      resultsTitle: 'மருந்து பகுப்பாய்வு',
      sourceCitation: 'ஆதாரம்: WHO மாதிரி அத்தியாவசிய மருந்துகள் பட்டியல் 2023 & NLEM 2022.',
      doctorDisclaimer: 'குறிப்பு: இது வழிகாட்டல் மட்டுமே. உங்கள் மருத்துவரிடம் உறுதிப்படுத்தவும்.',
      playAudio: 'குரல் விளக்கத்தைக் கேட்கவும்',
      stopAudio: 'குரலை நிறுத்து',
      setReminders: 'நினைவூட்டல் அமைக்கவும்',
      saveOnly: 'சேமிக்க மட்டும்',
      beforeFood: 'உணவுக்கு முன் எடுக்கவும்',
      afterFood: 'உணவுக்குப் பின் எடுக்கவும்',
      withFood: 'உணவுடன் எடுக்கவும்',

      // Patients & Caregiver (100% Unicode Tamil)
      patientsTitle: 'நோயாளிகள்',
      searchPatient: 'பெயர் அல்லது தொலைபேசி மூலம் தேடுக...',
      addPatientBtn: 'நோயாளியைச் சேர்க்கவும்',
      addPatientTitle: 'புதிய நோயாளியைப் பதிவு செய்க',
      patientName: 'நோயாளியின் பெயர்',
      patientAge: 'வயது',
      patientGender: 'பாலினம்',
      male: 'ஆண்',
      female: 'பெண்',
      other: 'மற்றவை',
      patientPhone: 'தொலைபேசி எண்',
      patientRelationship: 'உறவுமுறை (விருப்பத்தேர்வு)',
      relationshipPlaceholder: 'எ.கா: தந்தை, தாய், மனைவி, கணவர்',
      patientNotes: 'மருத்துவக் குறிப்புகள் (விருப்பத்தேர்வு)',
      notesPlaceholder: 'எ.கா: இரத்த அழுத்தம், நீரிழிவு மாத்திரை',
      savePatient: 'நோயாளியைச் சேமிக்கவும்',
      editPatient: 'நோயாளியைத் திருத்து',
      patientDetailsTitle: 'நோயாளி விவரங்கள்',
      activeMedicines: 'செயலில் உள்ள மருந்துகள்',
      upcomingReminders: 'வரவிருக்கும் நினைவூட்டல்கள்',
      addMedicineScheduleBtn: 'மருந்து அட்டவணையைச் சேர்க்கவும்',
      noPatientsFound: 'நோயாளிகள் யாரும் இல்லை.',
      noActiveMedicines: 'செயலில் உள்ள மருந்துகள் எதுவும் இல்லை.',
      caregiverTitle: 'பராமரிப்பாளர் பக்கம்',
      linkedPatients: 'இணைக்கப்பட்ட நோயாளிகள்',
      linkPatientBtn: '+ புதிய நோயாளியைச் சேர்க்கவும்',
      patientAdherence: 'பின்பற்றல் அளவு',
      treeStage: 'மரத்தின் நிலை',
      viewPatientDetails: 'விவரங்களைப் பார்',
      patientCodePlaceholder: 'நோயாளி குறியீடு அல்லது எண்',
      linkSuccess: 'நோயாளி இணைக்கப்பட்டார்!',
      missedAlert: 'மருந்து தவறவிட்ட எச்சரிக்கை',
      caregiverNotice: 'மருந்தை தவறவிட்டால் மட்டுமே பராமரிப்பாளருக்கு அறிவிப்பு வரும்.',

      // Dedicated Medicine Schedule Form (100% Unicode Tamil)
      addScheduleTitle: 'மருந்து அட்டவணை அமைத்தல்',
      scheduleFor: 'நோயாளிக்கான அட்டவணை',
      timeOfDayLabel: 'நினைவூட்டல் நேரம்',
      morning: 'காலை',
      afternoon: 'மதியம்',
      night: 'இரவு',
      startDate: 'தொடக்க தேதி',
      endDate: 'முடிவு தேதி',
      frequencyLabel: 'அதிர்வெண்',
      daily: 'தினசரி',
      alternateDays: 'ஒரு நாள் விட்டு ஒரு நாள்',
      asNeeded: 'தேவைப்படும் போது',
      exactTime: 'கடிகார நேரம்',
      saveScheduleBtn: 'அட்டவணையைச் சேமிக்கவும்',
      selectTimePrompt: 'நேரத்தைத் தேர்ந்தெடுக்கவும்',
      quickPresets: 'விரைவு தேர்வுகள்',
      hours: 'மணி',
      minutes: 'நிமிடம்',
      reminderEnabled: 'நினைவூட்டல் இயக்கப்பட்டது',
      reminderDisabled: 'நினைவூட்டல் முடக்கப்பட்டது',
      deleteReminderPrompt: 'இந்த நினைவூட்டலை நீக்க விரும்புகிறீர்களா?',
      notificationSent: 'அறிவிப்பு அனுப்பப்பட்டது',

      // Reminder Setup
      reminderSetupTitle: 'நினைவூட்டல் அமைத்தல்',
      medicineName: 'மருந்தின் பெயர்',
      dosage: 'அளவு (எ.கா: 1 மாத்திரை / 500mg)',
      relationToFood: 'உணவு முறை',
      scheduledTime: 'நேரம்',
      identifierTitle: 'அடையாளக் குறிப்பு (விருப்பத்தேர்வு)',
      identifierPlaceholder: 'எ.கா: வெள்ளை பாட்டில், நீல அட்டை',
      attachPhoto: 'மருந்து படம் இணைக்க',
      photoAttached: 'படம் இணைக்கப்பட்டது ✓',
      confirmNext: 'உறுதி செய்து அடுத்து செல்',
      addAnother: '+ அடுத்த மருந்து சேர்',

      // My Medicines
      myMedicinesTitle: 'என் செயலில் உள்ள மருந்துகள்',
      addNewMedicine: '+ புதிய மருந்து சேர்',
      fromScan: 'சீட் ஸ்கேன் மூலம்',
      manualEntry: 'நேரடி பதிவு',
      noMedicinesYet: 'மருந்துகள் எதுவும் சேர்க்கப்படவில்லை.',

      // History
      historyTitle: 'பதிவுகள்',
      historySubtitle: 'முந்தைய மருந்து நினைவூட்டல் வரலாறு',

      // Settings
      settingsTitle: 'அமைப்புகள்',
      languageSetting: 'செயலி மொழி',
      modeSetting: 'தற்போதைய முறை',
      notificationsSetting: 'நினைவூட்டல் அறிவிப்புகள்',
      profileTitle: 'பயனர் சுயவிவரம்',
      logout: 'வெளியேறு',

      // Signup
      signupTitle: 'கணக்கை உருவாக்கவும்',
      signupSubtitle: 'மருந்து மேலாண்மைக்கான ஸ்மார்ட் உதவியாளர்',
      fullNamePlaceholder: 'முழு பெயர்',
      alreadyHaveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
      loginLink: 'உள்நுழைக',
      createAccountBtn: 'கணக்கை உருவாக்கி OTP பெறுக',

      // Medicine Details
      medicineDetailsTitle: 'மருந்து விவரங்கள்',
      medicineInfo: 'மருந்தின் அளவு மற்றும் நேரம்',
      instructionsTitle: 'சாப்பிடும் முறை',
      sideEffectsTitle: 'பக்க விளைவுகள்',
      precautionsTitle: 'பாதுகாப்பு முன்னெச்சரிக்கைகள்',
      whoVerified: 'WHO அங்கீகரிக்கப்பட்ட மருந்து',
      listenAudioSummary: 'குரல் விளக்கத்தைக் கேட்கவும்',

      // Voice Explanation
      voiceExplanationTitle: 'குரல் வழிகாட்டி',
      voiceExplanationSubtitle: 'தெளிவான ஒலி வடிவிலான மருந்து வழிமுறைகள்',
      nowSpeaking: 'இப்போது விளக்குவது',
      speedSlow: '0.75x மெதுவாக',
      speedNormal: '1.0x இயல்பாக',
      speedFast: '1.25x வேகமாக',
      replayVoice: 'மீண்டும் கேட்கவும்',
      askAiQuestion: 'AI உதவியாளரிடம் கேள்வி கேட்க',

      // Reminder Success
      reminderSuccessTitle: 'நினைவூட்டல் அமைக்கப்பட்டது!',
      reminderSuccessSubtitle: 'தினசரி அறிவிப்புகளுடன் மருந்து நினைவூட்டல் தயார்',
      reminderScheduledMsg: 'சரியான நேரத்தில் உங்களுக்கு அறிவிப்பு வரும்.',
      viewAllReminders: 'எல்லா நினைவூட்டல்களையும் பார்க்க',
      backToHome: 'முகப்புக்குச் செல்',

      // Profile
      profileHeader: 'நோயாளி விவரக்குறிப்பு',
      personalInfo: 'தனிப்பட்ட விவரங்கள்',
      healthDetails: 'சுகாதாரத் தகவல்கள்',
      bloodGroup: 'இரத்த வகை',
      allergies: 'ஒவ்வாமைகள் (Allergies)',
      caregiverCode: 'பராமரிப்பாளர் பகிர்வு குறியீடு',
      emergencyContact: 'அவசர தொடர்பு எண்',
    },
  },
};

// Initialize i18next
i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // Default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Helper to update & persist language
export const changeAppLanguage = async (lang: 'en' | 'ta') => {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
};

// Helper to load saved language on boot
export const loadSavedLanguage = async () => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLang === 'en' || savedLang === 'ta') {
      await i18n.changeLanguage(savedLang);
      return savedLang;
    }
  } catch (error) {
    console.error('Failed to load saved language:', error);
  }
  return 'en';
};

export default i18n;
