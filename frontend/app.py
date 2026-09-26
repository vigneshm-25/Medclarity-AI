import os
import streamlit as st
import requests
import pandas as pd
import urllib.parse
from dotenv import load_dotenv
from i18n import t

# Load environment variables
load_dotenv()
BACKEND_URL = os.getenv("BACKEND_URL", "https://medclarity-ai.onrender.com")

# Pre-startup keys validation
missing_keys = []
if not os.getenv("OPENAI_API_KEY"):
    missing_keys.append("OPENAI_API_KEY")

if missing_keys:
    st.error(f"❌ **Missing Configuration:** The following environment variables are missing in `.env`: `{', '.join(missing_keys)}`. Please configure them to run MedClarity AI.")
    st.stop()

# --- IMPROVEMENT: PRE-DEFINED TOP 50 COMMON INDIAN MEDICINES DICTIONARY AS FALLBACK ---
# This dictionary serves as an intelligent local fallback if the Gemini API or backend is offline.
COMMON_INDIAN_MEDICINES = {
    "dolo": {
        "name": "Paracetamol (Dolo 650)",
        "simple_dosage": "650mg (1 tablet)",
        "simple_timing": "Take 3 to 4 times daily after food, only if you have fever or severe pain.",
        "simple_purpose": "Used to reduce high body temperature and relieve body pain.",
        "simple_duration": "Take for 3 days or as needed."
    },
    "crocin": {
        "name": "Paracetamol (Crocin)",
        "simple_dosage": "500mg (1 tablet)",
        "simple_timing": "Take 3 times daily after food, only when needed for fever or mild pain.",
        "simple_purpose": "Used to lower fever and relieve minor body aches.",
        "simple_duration": "Take for 3 days or as needed."
    },
    "paracetamol": {
        "name": "Paracetamol",
        "simple_dosage": "500mg or 650mg (1 tablet)",
        "simple_timing": "Take 3 times daily after food, only if you have fever or headache.",
        "simple_purpose": "Used to treat fever, headaches, and general body aches.",
        "simple_duration": "Take for 3 days or as needed."
    },
    "mox": {
        "name": "Amoxicillin (Mox 500)",
        "simple_dosage": "500mg (1 capsule)",
        "simple_timing": "Take 2 times daily (once in the morning, once at night) after food.",
        "simple_purpose": "An antibiotic used to kill harmful germs causing throat, chest, or ear infections.",
        "simple_duration": "Take for exactly 5 days. Do not stop early."
    },
    "amoxicillin": {
        "name": "Amoxicillin",
        "simple_dosage": "500mg (1 capsule)",
        "simple_timing": "Take 2 times daily (morning and night) after food.",
        "simple_purpose": "An antibiotic medicine used to treat bacterial infections.",
        "simple_duration": "Take for exactly 5 days. Complete the course."
    },
    "glycomet": {
        "name": "Metformin (Glycomet)",
        "simple_dosage": "500mg (1 tablet)",
        "simple_timing": "Take once daily with your morning meal (breakfast).",
        "simple_purpose": "Used to control blood sugar levels for diabetes management.",
        "simple_duration": "Ongoing daily treatment. Follow doctor's schedule."
    },
    "metformin": {
        "name": "Metformin",
        "simple_dosage": "500mg (1 tablet)",
        "simple_timing": "Take twice daily (morning and night) immediately after food.",
        "simple_purpose": "Helps lower blood sugar levels in patients with diabetes.",
        "simple_duration": "Ongoing daily treatment as advised by doctor."
    },
    "pan": {
        "name": "Pantoprazole (Pan 40)",
        "simple_dosage": "40mg (1 tablet)",
        "simple_timing": "Take once daily in the morning on an empty stomach, 30 minutes before eating.",
        "simple_purpose": "Reduces excess stomach acid to treat acidity, heartburn, and gas.",
        "simple_duration": "Take for 10 to 14 days."
    },
    "pantoprazole": {
        "name": "Pantoprazole",
        "simple_dosage": "40mg (1 tablet)",
        "simple_timing": "Take once daily in the morning before breakfast on an empty stomach.",
        "simple_purpose": "Used to prevent acidity, stomach ulcers, and acid reflux.",
        "simple_duration": "Take for 7 to 14 days."
    },
    "alerid": {
        "name": "Cetirizine (Alerid)",
        "simple_dosage": "10mg (1 tablet)",
        "simple_timing": "Take once daily at bedtime (nighttime) with water.",
        "simple_purpose": "Used for runny nose, sneezing, skin allergies, and itching. May cause drowsiness.",
        "simple_duration": "Take for 3 to 5 days."
    },
    "cetirizine": {
        "name": "Cetirizine",
        "simple_dosage": "10mg (1 tablet)",
        "simple_timing": "Take once daily at bedtime (nighttime). Avoid driving as it causes drowsiness.",
        "simple_purpose": "An anti-allergy medicine for cold, sneezing, and itching.",
        "simple_duration": "Take for 3 to 5 days."
    },
    "azithral": {
        "name": "Azithromycin (Azithral)",
        "simple_dosage": "500mg (1 tablet)",
        "simple_timing": "Take once daily at the same time every day, 1 hour before or 2 hours after food.",
        "simple_purpose": "A powerful antibiotic for throat, lung, sinus, and skin infections.",
        "simple_duration": "Take for exactly 3 days."
    },
    "azithromycin": {
        "name": "Azithromycin",
        "simple_dosage": "500mg (1 tablet)",
        "simple_timing": "Take once daily on an empty stomach or as directed.",
        "simple_purpose": "Used to treat bacterial respiratory and skin infections.",
        "simple_duration": "Take for exactly 3 or 5 days."
    },
    "rantac": {
        "name": "Ranitidine (Rantac)",
        "simple_dosage": "150mg (1 tablet)",
        "simple_timing": "Take twice daily (once in morning, once at night) before food.",
        "simple_purpose": "Used to prevent acidity, heartburn, and gas bloating.",
        "simple_duration": "Take for 5 to 7 days."
    },
    "ranitidine": {
        "name": "Ranitidine",
        "simple_dosage": "150mg (1 tablet)",
        "simple_timing": "Take twice daily before breakfast and dinner.",
        "simple_purpose": "An acid-reducing medicine that protects the stomach from acidity.",
        "simple_duration": "Take for 5 to 7 days."
    },
    "voveran": {
        "name": "Diclofenac (Voveran)",
        "simple_dosage": "50mg (1 tablet)",
        "simple_timing": "Take twice daily strictly after food to avoid stomach pain.",
        "simple_purpose": "A strong painkiller used to reduce joint swelling, bone, and muscle pain.",
        "simple_duration": "Take for 3 to 5 days only."
    },
    "diclofenac": {
        "name": "Diclofenac",
        "simple_dosage": "50mg (1 tablet)",
        "simple_timing": "Take twice daily strictly after food with water.",
        "simple_purpose": "Used to treat severe body pain, inflammation, and joint pain.",
        "simple_duration": "Take for 3 to 5 days only."
    },
    "omez": {
        "name": "Omeprazole (Omez)",
        "simple_dosage": "20mg (1 capsule)",
        "simple_timing": "Take once daily in the morning before breakfast on an empty stomach.",
        "simple_purpose": "Helps reduce stomach acid and relieves acid reflux and indigestion.",
        "simple_duration": "Take for 10 to 14 days."
    },
    "omeprazole": {
        "name": "Omeprazole",
        "simple_dosage": "20mg (1 capsule)",
        "simple_timing": "Take once daily in the morning before eating anything.",
        "simple_purpose": "Used to prevent and heal stomach acid ulcers and acid burn.",
        "simple_duration": "Take for 7 to 14 days."
    },
    "domstal": {
        "name": "Domperidone (Domstal)",
        "simple_dosage": "10mg (1 tablet)",
        "simple_timing": "Take 2 to 3 times daily, 30 minutes before food.",
        "simple_purpose": "Used to treat nausea, vomiting, and stomach bloating/gas.",
        "simple_duration": "Take for 3 to 5 days."
    },
    "domperidone": {
        "name": "Domperidone",
        "simple_dosage": "10mg (1 tablet)",
        "simple_timing": "Take 2 to 3 times daily before food.",
        "simple_purpose": "An anti-vomiting medicine that regulates stomach movement.",
        "simple_duration": "Take for 3 to 5 days."
    },
    "augmentin": {
        "name": "Amoxicillin + Clavulanic Acid (Augmentin 625)",
        "simple_dosage": "625mg (1 tablet)",
        "simple_timing": "Take twice daily (once after breakfast, once after dinner).",
        "simple_purpose": "A broad-spectrum antibiotic to cure bacterial chest, dental, and skin infections.",
        "simple_duration": "Take for exactly 5 days. Do not skip."
    },
    "lipivas": {
        "name": "Atorvastatin (Lipivas)",
        "simple_dosage": "10mg (1 tablet)",
        "simple_timing": "Take once daily at night (bedtime) after food.",
        "simple_purpose": "Used to lower bad cholesterol levels and protect the heart.",
        "simple_duration": "Ongoing daily treatment as prescribed."
    },
    "atorvastatin": {
        "name": "Atorvastatin",
        "simple_dosage": "10mg or 20mg (1 tablet)",
        "simple_timing": "Take once daily at nighttime after dinner.",
        "simple_purpose": "Helps lower blood cholesterol levels and prevents heart disease.",
        "simple_duration": "Ongoing daily treatment."
    },
    "amlopin": {
        "name": "Amlodipine (Amlopin)",
        "simple_dosage": "5mg (1 tablet)",
        "simple_timing": "Take once daily in the morning after food at a fixed time.",
        "simple_purpose": "Used to treat high blood pressure and protect heart function.",
        "simple_duration": "Ongoing daily treatment."
    },
    "amlodipine": {
        "name": "Amlodipine",
        "simple_dosage": "5mg (1 tablet)",
        "simple_timing": "Take once daily at the same time every morning.",
        "simple_purpose": "Lowers high blood pressure to prevent strokes or heart attacks.",
        "simple_duration": "Ongoing daily treatment."
    },
    "telma": {
        "name": "Telmisartan (Telma 40)",
        "simple_dosage": "40mg (1 tablet)",
        "simple_timing": "Take once daily at a fixed time, with or without food.",
        "simple_purpose": "Common medicine for managing high blood pressure.",
        "simple_duration": "Ongoing daily treatment."
    },
    "telmisartan": {
        "name": "Telmisartan",
        "simple_dosage": "40mg (1 tablet)",
        "simple_timing": "Take once daily in the morning at a fixed time.",
        "simple_purpose": "Keeps high blood pressure under control to safeguard heart and kidneys.",
        "simple_duration": "Ongoing daily treatment."
    },
    "ecosprin": {
        "name": "Aspirin (Ecosprin 75)",
        "simple_dosage": "75mg (1 tablet)",
        "simple_timing": "Take once daily after lunch or dinner strictly after food.",
        "simple_purpose": "A blood thinner used to prevent blood clots and heart attacks.",
        "simple_duration": "Ongoing daily treatment as advised."
    },
    "aspirin": {
        "name": "Aspirin",
        "simple_dosage": "75mg or 150mg (1 tablet)",
        "simple_timing": "Take once daily after a meal.",
        "simple_purpose": "Thinners the blood to avoid blockages in heart blood vessels.",
        "simple_duration": "Ongoing daily treatment."
    },
    "brufen": {
        "name": "Ibuprofen (Brufen)",
        "simple_dosage": "400mg (1 tablet)",
        "simple_timing": "Take twice daily strictly after food to protect stomach walls.",
        "simple_purpose": "Reduces pain, fever, swelling, and muscle inflammation.",
        "simple_duration": "Take for 3 days only."
    },
    "ibuprofen": {
        "name": "Ibuprofen",
        "simple_dosage": "400mg (1 tablet)",
        "simple_timing": "Take 2 to 3 times daily strictly after food.",
        "simple_purpose": "Used for toothache, backache, headache, and swelling relief.",
        "simple_duration": "Take for 3 days only."
    },
    "zincovit": {
        "name": "Multivitamins + Minerals (Zincovit)",
        "simple_dosage": "1 tablet",
        "simple_timing": "Take once daily after food, preferably after lunch.",
        "simple_purpose": "A supplement to boost daily energy, improve immunity, and support recovery.",
        "simple_duration": "Take for 30 days."
    },
    "shelcal": {
        "name": "Calcium + Vitamin D3 (Shelcal)",
        "simple_dosage": "1 tablet",
        "simple_timing": "Take once daily after food, preferably with milk or water after dinner.",
        "simple_purpose": "Bone health supplement to keep bones and teeth strong.",
        "simple_duration": "Take for 30 days."
    },
    "dexorange": {
        "name": "Iron + Folic Acid Syrup (Dexorange)",
        "simple_dosage": "10ml (2 spoons)",
        "simple_timing": "Take once daily after food in the morning.",
        "simple_purpose": "A nutritional supplement to increase blood levels (hemoglobin) and treat weakness.",
        "simple_duration": "Take for 30 days."
    },
    "folvite": {
        "name": "Folic Acid (Folvite)",
        "simple_dosage": "5mg (1 tablet)",
        "simple_timing": "Take once daily after food.",
        "simple_purpose": "Vitamin supplement to help build red blood cells and treat anemia.",
        "simple_duration": "Take for 30 days."
    },
    "veloz": {
        "name": "Rabeprazole (Veloz 20)",
        "simple_dosage": "20mg (1 tablet)",
        "simple_timing": "Take once daily in the morning 30 minutes before breakfast.",
        "simple_purpose": "Used to treat gas, acid burn, stomach pain, and acid reflux.",
        "simple_duration": "Take for 10 days."
    },
    "rabeprazole": {
        "name": "Rabeprazole",
        "simple_dosage": "20mg (1 tablet)",
        "simple_timing": "Take once daily before eating breakfast.",
        "simple_purpose": "Controls acid production in the stomach to prevent heartburn.",
        "simple_duration": "Take for 7 to 10 days."
    },
    "emset": {
        "name": "Ondansetron (Emset)",
        "simple_dosage": "4mg (1 tablet)",
        "simple_timing": "Take once immediately when feeling vomiting sensation, 30 minutes before food.",
        "simple_purpose": "Used to stop vomiting and control nausea.",
        "simple_duration": "Take only as needed."
    },
    "ondansetron": {
        "name": "Ondansetron",
        "simple_dosage": "4mg (1 tablet)",
        "simple_timing": "Take when needed for vomiting, before food.",
        "simple_purpose": "Prevents nausea, stomach upset, and vomiting sensations.",
        "simple_duration": "Take only as needed."
    },
    "lanoxin": {
        "name": "Digoxin (Lanoxin)",
        "simple_dosage": "0.25mg (1 tablet)",
        "simple_timing": "Take once daily at the same time, with or without food.",
        "simple_purpose": "Heart medicine used to regulate irregular heartbeats and help heart pumping.",
        "simple_duration": "Ongoing daily treatment. Follow doctor's schedule carefully."
    },
    "digoxin": {
        "name": "Digoxin",
        "simple_dosage": "0.25mg (1 tablet)",
        "simple_timing": "Take once daily at a fixed time.",
        "simple_purpose": "Used to treat chronic heart failure and atrial fibrillation.",
        "simple_duration": "Ongoing daily treatment."
    },
    "lasix": {
        "name": "Furosemide (Lasix)",
        "simple_dosage": "40mg (1 tablet)",
        "simple_timing": "Take once daily in the morning after breakfast. Causes frequent urination.",
        "simple_purpose": "Water pill to remove excess water and reduce swelling in feet and lungs.",
        "simple_duration": "Take as directed by doctor."
    },
    "furosemide": {
        "name": "Furosemide",
        "simple_dosage": "40mg (1 tablet)",
        "simple_timing": "Take once daily in the morning after breakfast.",
        "simple_purpose": "Used to lower swelling and high blood pressure by flushing out extra fluids.",
        "simple_duration": "Take as directed."
    },
    "alprax": {
        "name": "Alprazolam (Alprax)",
        "simple_dosage": "0.25mg (1 tablet)",
        "simple_timing": "Take once daily at night strictly before sleeping.",
        "simple_purpose": "Used to treat anxiety and sleep disorders. Can cause habit formation; use with caution.",
        "simple_duration": "Take strictly for 3 to 7 days as directed by doctor."
    },
    "alprazolam": {
        "name": "Alprazolam",
        "simple_dosage": "0.25mg (1 tablet)",
        "simple_timing": "Take once daily at night before sleeping.",
        "simple_purpose": "Calms the nerves, aids sleep, and reduces severe anxiety.",
        "simple_duration": "Short-term use only as directed."
    },
    "clonazepam": {
        "name": "Clonazepam",
        "simple_dosage": "0.5mg (1 tablet)",
        "simple_timing": "Take once daily at bedtime.",
        "simple_purpose": "Used for seizure disorders, panic attacks, and severe anxiety.",
        "simple_duration": "Short term as directed by doctor."
    },
    "asthalin": {
        "name": "Salbutamol (Asthalin Inhaler)",
        "simple_dosage": "1 or 2 puffs",
        "simple_timing": "Inhale puffs when feeling breathlessness or wheezing cough.",
        "simple_purpose": "Quickly opens breathing tubes during asthma attacks or cough.",
        "simple_duration": "Use only as needed for breathing comfort."
    },
    "salbutamol": {
        "name": "Salbutamol",
        "simple_dosage": "2mg or 4mg (1 tablet)",
        "simple_timing": "Take twice daily after food.",
        "simple_purpose": "Dilates air passages to make breathing easier in asthma patients.",
        "simple_duration": "Take for 5 days or as needed."
    },
    "combiflam": {
        "name": "Ibuprofen + Paracetamol (Combiflam)",
        "simple_dosage": "1 tablet",
        "simple_timing": "Take twice daily strictly after food.",
        "simple_purpose": "Combines a painkiller and fever reducer to relieve headaches and toothaches.",
        "simple_duration": "Take for 3 days only."
    }
}

# Localized translations for trust indicators, disclaimers, and cards across all 8 supported languages
DISCLAIMER_TRANSLATIONS = {
    "English": {
        "title_badge": "✅ Sourced from WHO & NLEM 2022",
        "popover_desc": "Our answers are based on official WHO and Indian government medicine lists, not guesses. Still, always double check with your doctor or pharmacist.",
        "footer_badge": "📋 Based on official medicine guides · Confirm with a pharmacist",
        "view_sources": "🔍 View sources",
        "low_confidence_msg": "⚠️ We're not fully sure about this reading — please check the prescription again or ask your pharmacist.",
        "no_sources": "No official sources matched this segment.",
        "matches_found": "Following matches were found in official medical manuals database:"
    },
    "Tamil": {
        "title_badge": "✅ WHO & NLEM 2022-லிருந்து பெறப்பட்டது",
        "popover_desc": "எங்கள் பதில்கள் அதிகாரப்பூர்வ WHO மற்றும் இந்திய அரசு மருந்து பட்டியல்களின் அடிப்படையில் அமைந்தவை, யூகங்கள் அல்ல. இருப்பினும், எப்போதும் உங்கள் மருத்துவர் அல்லது மருந்தாளுநரிடம் சரிபார்க்கவும்.",
        "footer_badge": "📋 அதிகாரப்பூர்வ மருந்து வழிகாட்டிகளின்படி · மருந்தாளுநரிடம் உறுதிப்படுத்தவும்",
        "view_sources": "🔍 ஆதாரங்களைக் காண்க",
        "low_confidence_msg": "⚠️ இந்த மருந்து சீட்டை எங்களால் முழுமையாகப் புரிந்துகொள்ள முடியவில்லை — தயவுசெய்து உங்கள் மருந்து சீட்டை மீண்டும் சரிபார்க்கவும் அல்லது மருந்தாளுநரிடம் கேட்கவும்.",
        "no_sources": "இந்த பகுதியுடன் அதிகாரப்பூர்வ ஆதாரங்கள் எதுவும் பொருந்தவில்லை.",
        "matches_found": "அதிகாரப்பூர்வ மருத்துவ கையேடுகளின் தரவுத்தளத்தில் பின்வரும் பொருத்தங்கள் கண்டறியப்பட்டன:"
    },
    "Hindi": {
        "title_badge": "✅ WHO और NLEM 2022 से सत्यापित",
        "popover_desc": "हमारे उत्तर आधिकारिक WHO और भारत सरकार की दवा सूचियों पर आधारित हैं, अनुमान पर नहीं। फिर भी, हमेशा अपने डॉक्टर या फार्मासिस्ट से इसकी पुष्टि करें।",
        "footer_badge": "📋 आधिकारिक दवा गाइड पर आधारित · फार्मासिस्ट से पुष्टि करें",
        "view_sources": "🔍 स्रोत देखें",
        "low_confidence_msg": "⚠️ हम इस पर्चे को पूरी तरह से समझ नहीं पा रहे हैं — कृपया पर्चे को फिर से जाँचें या अपने फार्मासिस्ट से पूछें।",
        "no_sources": "इस हिस्से से कोई आधिकारिक स्रोत मेल नहीं खाता।",
        "matches_found": "आधिकारिक चिकित्सा नियमावली डेटाबेस में निम्नलिखित मिलान पाए गए:"
    },
    "Telugu": {
        "title_badge": "✅ WHO & NLEM 2022 నుండి సేకరించబడింది",
        "popover_desc": "మా సమాధానాలు అధికారిక WHO మరియు భారత ప్రభుత్వ మందుల జాబితాలపై ఆధారపడి ఉంటాయి, ఊహలు కావు. అయినప్పటికీ, ఎల్లప్పుడూ మీ డాక్టర్ లేదా ఫార్మసిస్ట్‌తో సరిచూసుకోండి.",
        "footer_badge": "📋 అధికారిక మందుల మార్గదర్శకాల ఆధారంగా · ఫార్మసిస్ట్‌తో ధృవీకరించుకోండి",
        "view_sources": "🔍 ఆధారాలను చూడండి",
        "low_confidence_msg": "⚠️ మేము ఈ ప్రిస్క్రిप्షన్‌ను పూర్తిగా ధృవీకరించలేకపోతున్నాము — దయచేసి ప్రిస్క్రిप्షన్‌ను మళ్لى తనిఖీ చేయండి లేదా మీ ఫార్మసిస్ట్‌ను అడగండి।",
        "no_sources": "ఈ విభాगाనికి సరిపోయే అధికారిక ఆధారాలు లేవు.",
        "matches_found": "అధికారిక వైద్య కையேళ్ల డేటాబేస్‌లో క్రింది సరిపోలికలు కనుగొనబడ్డాయి:"
    },
    "Kannada": {
        "title_badge": "✅ WHO ಮತ್ತು NLEM 2022 ರಿಂದ ಪಡೆಯಲಾಗಿದೆ",
        "popover_desc": "ನಮ್ಮ ಉತ್ತರಗಳು ಅಧಿಕೃತ WHO ಮತ್ತು ಭಾರತ ಸರ್ಕಾರದ ಔಷಧಿ ಪಟ್ಟಿಗಳನ್ನು ಆಧರಿಸಿವೆ, ಊಹೆಗಳಲ್ಲ. ಆದರೂ, ಯಾವಾಗಲೂ ನಿಮ್ಮ ವೈದ್ಯರು ಅಥವಾ ಫಾರ್ಮಾಸಿಸ್ಟ್ ಜೊತೆ ಪರಿಶೀಲಿಸಿ.",
        "footer_badge": "📋 ಅಧಿಕೃತ ಔಷಧಿ ಮಾರ್ಗದರ್ಶಿಗಳ ಆಧಾರಿತ · ಫಾರ್ಮಾಸಿಸ್ಟ್ ಜೊತೆ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ",
        "view_sources": "🔍 ಮೂಲಗಳನ್ನು ನೋಡಿ",
        "low_confidence_msg": "⚠️ ಈ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಬಗ್ಗೆ ನಮಗೆ ಸಂಪೂರ್ಣ ಖಚಿತತೆಯಿಲ್ಲ — ದಯವಿಟ್ಟು ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅನ್ನು ಮತ್ತೊಮ್ಮೆ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಫಾರ್ಮಾಸಿಸ್ಟ್ ಬಳಿ ಕೇಳಿ.",
        "no_sources": "ಈ ಭಾಗಕ್ಕೆ ಯಾವುದೇ ಅಧಿಕೃತ ಮೂಲಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.",
        "matches_found": "ಅಧಿಕೃತ ವೈದ್ಯಕೀಯ ಕೈಪಿಡಿಗಳ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಈ ಕೆಳಗಿನ ಹೊಂದಾಣಿಕೆಗಳು ಕಂಡುಬಂದಿವೆ:"
    },
    "Malayalam": {
        "title_badge": "✅ WHO, NLEM 2022 എന്നിവയിൽ നിന്ന് ശേഖരിച്ചത്",
        "popover_desc": "ഞങ്ങളുടെ ഉത്തരങ്ങൾ ഔദ്യോഗിക WHO, ഇന്ത്യൻ സർക്കാർ മരുന്നുകളുടെ പട്ടികകളെ അടിസ്ഥാനമാക്കിയുള്ളതാണ്, ഊഹങ്ങളല്ല. എങ്കിലും, എപ്പോഴും നിങ്ങളുടെ ഡോക്ടറോ ഫാർമസിസ്റ്റോ ആയി ഉറപ്പുവരുത്തുക.",
        "footer_badge": "📋 ഔദ്യോഗിക മരുന്ന് ഗൈഡുകളെ അടിസ്ഥാനമാക്കിയുള്ളത് · ഫാർമസിസ്റ്റുമായി ഉറപ്പുവരുത്തുക",
        "view_sources": "🔍 ഉറവിടങ്ങൾ കാണുക",
        "low_confidence_msg": "⚠️ ഈ കുറിപ്പടി പൂർണ്ണമായും വായിക്കാൻ ഞങ്ങൾക്ക് കഴിഞ്ഞിട്ടില്ല — ദയവായി കുറിപ്പടി വീണ്ടും പരിശോധിക്കുക അല്ലെങ്കിൽ ഫാർമസിസ്റ്റുമായി ബന്ധപ്പെടുക.",
        "no_sources": "ഈ ഭാഗവുമായി പൊരുത്തപ്പെടുന്ന ഔദ്യോഗിക ഉറവിടങ്ങളില്ല.",
        "matches_found": "ഔദ്യോഗിക മെഡിക്കൽ കെയേടുകളുടെ ഡാറ്റാബേസിൽ താഴെ പറയുന്ന പൊരുത്തങ്ങൾ കണ്ടെത്തിയിട്ടുണ്ട്:"
    },
    "Bengali": {
        "title_badge": "✅ WHO এবং NLEM 2022 থেকে সংগৃহীত",
        "popover_desc": "আমাদের উত্তরগুলি বিশ্ব স্বাস্থ্য সংস্থা (WHO) এবং ভারত সরকারের অফিসিয়াল ওষুধের তালিকার উপর ভিত্তি করে তৈরি, কোনো অনুমান নয়। তবুও, সর্বদা আপনার ডাক্তার বা ফার্মাসিস্টের সাথে পরামর্শ করুন।",
        "footer_badge": "📋 অফিসিয়াল ওষুধ নির্দেশিকা ভিত্তিক · ফার্মাসিস্টের সাথে নিশ্চিত করুন",
        "view_sources": "🔍 উৎসগুলি দেখুন",
        "low_confidence_msg": "⚠️ আমরা এই প্রেসক্রিপশনটি পুরোপুরি বুঝতে পারছি না — দয়া করে প্রেসক্রিপশনটি আবার পরীক্ষা করুন অথবা আপনার ফার্মাসিস্টের সাথে কথা বলুন।",
        "no_sources": "এই অংশের সাথে কোনো অফিসিয়াল উৎস মেলেনি।",
        "matches_found": "অফিসিয়াল মেডিকেল ম্যানুয়াল ডাটাবেসে নিম্নলিখিত মিলগুলি পাওয়া গেছে:"
    },
    "Marathi": {
        "title_badge": "✅ WHO आणि NLEM 2022 कडून सत्यापित",
        "popover_desc": "आमची उत्तरे अधिकृत WHO आणि भारत सरकारच्या औषध सूचीवर आधारित आहेत, अंदाज नाही. तरीही, नेहमी आपल्या डॉक्टर किंवा फार्मासिस्टशी चर्चा करा.",
        "footer_badge": "📋 अधिकृत औषध मार्गदर्शिकेवर आधारित · फार्मासिस्टकडून खात्री करा",
        "view_sources": "🔍 स्रोत पहा",
        "low_confidence_msg": "⚠️ आम्हाला या प्रिस्क्रिप्शनबद्दल पूर्ण खात्री नाही — कृपया प्रिस्क्रिप्शन पुन्हा तपासा किंवा आपल्या फार्मासिस्टशी संपर्क साधा।",
        "no_sources": "या भागाशी कोणताही अधिकृत स्रोत जुळत नाही.",
        "matches_found": "अधिकृत वैद्यकीय नियमावली डेटाबेसमध्ये खालील जुळण्या आढळल्या:"
    }
}

def render_sources_expander(sources: list, lang_key: str):
    trans = DISCLAIMER_TRANSLATIONS.get(lang_key, DISCLAIMER_TRANSLATIONS["English"])
    with st.expander(trans["view_sources"]):
        if sources:
            st.markdown(f"**{trans['matches_found']}**")
            for idx, src in enumerate(sources):
                doc_name = src.get("source", "Unknown Document")
                page = src.get("page", "Unknown Page")
                content = src.get("content", "").strip()
                st.markdown(f"**{idx + 1}. {doc_name} (Page {page})**")
                st.markdown(f"*{content[:300]}...*")
                st.markdown("---")
        else:
            st.write(trans["no_sources"])

# --- IMPROVEMENT: DYNAMIC DRUG-TO-DRUG INTERACTION CHECKER ---
# Analyzes the list of parsed medicines and checks for known dangerous combinations.
def check_drug_interactions(medicines):
    names = [med["name"].lower() for med in medicines]
    warnings = []
    
    # 1. Aspirin + Blood Thinner
    has_aspirin = any("aspirin" in n or "ecosprin" in n for n in names)
    has_clopidogrel = any("clopidogrel" in n or "clopilet" in n for n in names)
    has_warfarin = any("warfarin" in n or "uniwarfin" in n for n in names)
    if (has_aspirin or has_clopidogrel) and has_warfarin:
        warnings.append("⚠️ **Aspirin / Clopidogrel + Warfarin**: Combining these blood thinners together significantly increases the risk of serious stomach or internal bleeding. Please consult your doctor immediately.")
    
    # 2. Multiple NSAIDs
    nsaids = ["ibuprofen", "brufen", "diclofenac", "voveran", "combiflam", "naproxen", "aspirin", "ecosprin"]
    nsaids_found = [n for n in names if any(nsaid in n for nsaid in nsaids)]
    # Filter out duplicates
    nsaids_found_unique = list(set([n.split("(")[0].strip() for n in nsaids_found]))
    if len(nsaids_found_unique) > 1:
        warnings.append(f"⚠️ **Multiple Painkillers (NSAIDs)**: You have multiple painkillers ({', '.join(nsaids_found_unique)}) in your prescription. Taking them together increases the risk of severe stomach ulcers, heartburn, or kidney damage. Take only one as advised by your doctor.")
        
    # 3. Sildenafil + Nitroglycerin
    has_sildenafil = any("sildenafil" in n or "viagra" in n for n in names)
    has_nitroglycerin = any("nitroglycerin" in n or "sorbitrate" in n for n in names)
    if has_sildenafil and has_nitroglycerin:
        warnings.append("⚠️ **Sildenafil (Viagra) + Nitroglycerin (Sorbitrate)**: This combination can cause a sudden, dangerous, and life-threatening drop in blood pressure. Never take them together.")
        
    # 4. Digoxin + Lasix (Furosemide)
    has_digoxin = any("digoxin" in n or "lanoxin" in n for n in names)
    has_lasix = any("lasix" in n or "furosemide" in n for n in names)
    if has_digoxin and has_lasix:
        warnings.append("⚠️ **Digoxin + Lasix (Furosemide)**: Lasix can lower your potassium levels, which increases the toxicity of Digoxin and may lead to heart rhythm problems. Monitor your health closely.")

    # 5. Alprazolam + Clonazepam
    has_alprax = any("alprazolam" in n or "alprax" in n for n in names)
    has_clone = any("clonazepam" in n or "clone" in n for n in names)
    if has_alprax and has_clone:
        warnings.append("⚠️ **Multiple Sedatives (Alprazolam + Clonazepam)**: You have two sleep/anxiety medications. Taking them together causes excessive drowsiness and is not recommended unless explicitly advised.")

    return warnings

# --- IMPROVEMENT: OFFLINE LOCAL PARSER FALLBACK ---
# Parsers text locally using the top 50 common Indian medicines dictionary if APIs fail.
def fallback_local_parse(text, target_lang="English"):
    import re
    text_lower = text.lower()
    detected_medicines = []
    
    for key, med in COMMON_INDIAN_MEDICINES.items():
        if re.search(r'\b' + re.escape(key) + r'\b', text_lower):
            dosage = med["simple_dosage"]
            timing = med["simple_timing"]
            purpose = med["simple_purpose"]
            duration = med["simple_duration"]
            
            # Context-sensitive timing parsing
            match = re.search(re.escape(key) + r'(.{1,40})', text_lower)
            if match:
                window = match.group(1)
                if "bid" in window or "twice" in window or "2 times" in window:
                    timing = "Take 2 times a day (once in the morning, once at night) after food." if ("after" in window or "pc" in window) else "Take 2 times a day, before food."
                elif "tid" in window or "three" in window or "3 times" in window:
                    timing = "Take 3 times a day (morning, afternoon, night)."
                elif "qd" in window or "once daily" in window or "once a day" in window:
                    timing = "Take once daily."
            
            detected_medicines.append({
                "name": med["name"],
                "simple_dosage": dosage,
                "simple_timing": timing,
                "simple_purpose": purpose,
                "simple_duration": duration
            })
            
    # De-duplicate
    unique_meds = []
    seen = set()
    for m in detected_medicines:
        if m["name"] not in seen:
            unique_meds.append(m)
            seen.add(m["name"])
            
    # Extract Patient Name, Doctor, Date, Symptoms locally using regex
    patient_match = re.search(r'patient:\s*([a-zA-Z\s0-9]+)', text, re.IGNORECASE)
    patient_name = patient_match.group(1).strip() if patient_match else "Unknown Patient"
    
    doctor_match = re.search(r'dr\.\s*([a-zA-Z\s]+)', text, re.IGNORECASE)
    doctor_name = doctor_match.group(1).strip() if doctor_match else "Unknown Doctor"
    
    date_match = re.search(r'date:\s*([0-9/\-\.]+)', text, re.IGNORECASE)
    date_val = date_match.group(1).strip() if date_match else "Not Available"
    
    symptoms_match = re.search(r'symptoms:\s*([a-zA-Z\s,]+)', text, re.IGNORECASE)
    symptoms = [s.strip() for s in symptoms_match.group(1).split(",")] if symptoms_match else []
    
    fallback_data = {
        "patient_name": patient_name,
        "doctor_name": doctor_name,
        "date": date_val,
        "symptoms": symptoms,
        "clinical_notes": "Analyzed locally using offline drug safety dictionary.",
        "safety_status": "SAFE",
        "emergency_alert": False,
        "patient_advisory_en": "Standard precautions apply. Take medicine on time.",
        "red_flags": [],
        "precautions_en": [],
        "simplified_en": {
            "patient_greeting": f"Hello {patient_name}!",
            "simple_summary": "Based on local matching of common drugs in your prescription.",
            "medicines": unique_meds,
            "helpful_tips": ["Drink plenty of warm water.", "Get enough rest.", "Avoid cold drinks."]
        },
        "translated_guide": {
            "patient_greeting": f"வணக்கம் {patient_name}!" if target_lang == "Tamil" else f"नमस्ते {patient_name}!",
            "simple_summary": "உள்ளூர் ஆஃப்லைன் அகராதி மூலம் பகுப்பாய்வு செய்யப்பட்டது." if target_lang == "Tamil" else "स्थानीय ऑफ़लाइन शब्दकोश के माध्यम से विश्लेषण किया गया।",
            "medicines": [
                {
                    "name": m["name"],
                    "simple_dosage": m["simple_dosage"],
                    "simple_timing": m["simple_timing"],
                    "simple_purpose": m["simple_purpose"],
                    "simple_duration": m["simple_duration"]
                } for m in unique_meds
            ],
            "helpful_tips": ["ஓய்வெடுக்கவும்.", "வெந்நீர் குடிக்கவும்."] if target_lang == "Tamil" else ["आराम करें।", "गुनगुना पानी पीएं।"],
            "safety_advisory": "பாதுகாப்பானது." if target_lang == "Tamil" else "सुरक्षित है।"
        },
        "reminders": [
            {
                "medicine_name": m["name"],
                "dosage": m["simple_dosage"],
                "time_of_day": "08:00 AM",
                "frequency": "Daily",
                "relation_to_food": "After Food",
                "duration": m["simple_duration"]
            } for m in unique_meds
        ],
        "rag_context": "Local offline fallback context."
    }
    # Duplicate translated_guide into tamil_guide for backward compatibility
    fallback_data["tamil_guide"] = fallback_data["translated_guide"]
    return fallback_data

# --- NEW FEATURE: VISUAL MEDICINE TIMELINE GENERATOR ---
def generate_schedule_grid(reminders):
    morning = []
    afternoon = []
    night = []
    for r in reminders:
        time = r["time_of_day"].upper()
        med_str = f"**{r['medicine_name']}** ({r.get('dosage', '1 tablet')}) - {r.get('relation_to_food', 'After Food')}"
        if any(x in time for x in ["07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "MORNING"]):
            morning.append(med_str)
        elif any(x in time for x in ["12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "AFTERNOON"]):
            afternoon.append(med_str)
        elif any(x in time for x in ["06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "NIGHT", "BEDTIME", "HS"]):
            night.append(med_str)
    return morning, afternoon, night

def rerun_app():
    """Bulletproof rerun helper accommodating all Streamlit versions."""
    if hasattr(st, "rerun"):
        st.rerun()
    else:
        st.experimental_rerun()


# ── Full pipeline runner ─────────────────────────────────────────────────────
# CRITICAL RULES:
#   1. st.status() lives HERE (not inside the button handler) so it can update
#      its own label when the request finishes or fails.
#   2. ALL session-state writes happen BEFORE this function returns.
#   3. st.rerun() is NEVER called from inside this function – the caller does it
#      exactly once after all state is committed.
def run_full_pipeline(text, target_lang, lang_iso):
    """Calls the backend pipeline and returns the result dict.
    On success or fallback, the result is always written to session_state
    BEFORE returning so the caller can safely rerun.
    """
    import time
    payload = {"text": text, "target_lang": target_lang}

    # ── Primary attempt inside a visible status widget ───────────────────────
    with st.status("✨ MedClarity AI is analysing your prescription…", expanded=True) as status:
        try:
            status.write("🔍 Reading prescription text…")
            status.write("🧠 Simplifying medical terms & abbreviations…")
            status.write("🌐 Translating to selected language…")
            status.write("🛡️ Running safety evaluation checks…")
            status.write("📚 Searching WHO clinical database (RAG)…")
            status.write("⏰ Generating medicine schedule & alarms…")
            status.write("🔊 Preparing voice audio guide…")
            status.write("✅ Saving reminders to database…")

            response = requests.post(
                f"{BACKEND_URL}/api/process-text",
                json=payload,
                timeout=120
            )

            if response.status_code == 200:
                result = response.json()
                st.session_state.processed_data   = result
                st.session_state.last_prescription = result
                st.session_state.analysis_done     = True
                st.session_state.step              = 2
                status.update(
                    label="✅ Analysis Complete! Scroll down to see results.",
                    state="complete",
                    expanded=False
                )
                return result

            # Non-200 → surface the error visibly, then fall through to fallback
            error_detail = ""
            try:
                error_detail = response.json().get("detail", response.text[:300])
            except Exception:
                error_detail = response.text[:300]
            status.update(
                label=f"⚠️ Backend returned HTTP {response.status_code}",
                state="error",
                expanded=True
            )
            st.error(
                f"**Backend Error (HTTP {response.status_code}):** {error_detail}\n\n"
                "Falling back to offline medicine dictionary."
            )

        except Exception as exc:
            # Any other unexpected exception
            status.update(
                label=f"❌ Unexpected error",
                state="error",
                expanded=True
            )
            st.error(
                f"**Unexpected error during analysis:** {str(exc)}\n\n"
                "Using offline medicine dictionary."
            )

    # ── Offline fallback (reached only when primary request failed) ──────────
    st.info("🔄 Using offline medicine dictionary as fallback…")
    fallback = fallback_local_parse(text, target_lang=target_lang)
    st.session_state.processed_data   = fallback
    st.session_state.last_prescription = fallback
    st.session_state.analysis_done     = True
    st.session_state.step              = 2
    return fallback

# Set Page Config for Accessible, High-Contrast Modern Interface
st.set_page_config(
    page_title="MedClarity AI - Multilingual Health Assistant",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Logo Path Resolution
LOGO_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Medclarity logo.png"))
if not os.path.exists(LOGO_PATH):
    LOGO_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "Medclarity logo.png"))

# --- IMPROVEMENT: GLOBAL TEAL/SEAFOAM CUSTOM THEME WITH HIGH-CONTRAST ACCESSIBLE TYPOGRAPHY ---
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    :root {
        --primary-teal: #2A9D8F;
        --primary-dark: #1D7068;
        --seafoam-light: #E8F6F4;
        --bg-warm-neutral: #FAF9F6;
        --text-dark: #0F172A;
        --text-muted: #475569;
        --card-bg: #FFFFFF;
        --card-border: #E2E8F0;
        --warning-amber-bg: #FFFBEB;
        --warning-amber-text: #92400E;
        --warning-amber-border: #F59E0B;
        --danger-red-bg: #FEF2F2;
        --danger-red-text: #991B1B;
        --danger-red-border: #EF4444;
        --success-green-bg: #F0FDF4;
        --success-green-border: #10B981;
    }

    /* Global scaling & font hierarchy for low-literacy and elderly readability (Min 16px, prescription 18-20px) */
    html, body, [class*="css"], p, span, li, table, div {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 17px !important;
        color: var(--text-dark);
        line-height: 1.6;
    }

    .stApp {
        background-color: var(--bg-warm-neutral);
    }

    .main .block-container {
        padding-top: 1.2rem !important;
        padding-bottom: 3rem !important;
        max-width: 1200px;
    }

    /* High Contrast Titles & Subtitles */
    .main-title {
        font-size: 2.6rem !important;
        font-weight: 800;
        color: #1D7068;
        letter-spacing: -0.5px;
        margin-bottom: 2px;
    }
    
    .subtitle {
        font-size: 1.15rem;
        color: var(--text-muted);
        font-weight: 500;
        margin-bottom: 12px;
    }

    /* Prescription Text Area High Readability (18px-20px) */
    textarea {
        font-family: 'Plus Jakarta Sans', monospace !important;
        font-size: 19px !important;
        line-height: 1.7 !important;
        color: #0F172A !important;
        background-color: #FFFFFF !important;
        border: 2px solid #CBD5E1 !important;
        border-radius: 12px !important;
        padding: 14px !important;
    }
    textarea:focus {
        border-color: var(--primary-teal) !important;
        box-shadow: 0 0 0 3px rgba(42, 157, 143, 0.2) !important;
    }

    /* Rounded Cards / Containers with Subtle Shadows */
    .card-general {
        background-color: var(--card-bg);
        border: 1px solid var(--card-border);
        border-left: 6px solid var(--primary-teal);
        border-radius: 16px;
        padding: 22px 24px;
        margin-bottom: 22px;
        box-shadow: 0 4px 14px rgba(42, 157, 143, 0.06);
    }

    .card-green {
        background-color: var(--success-green-bg);
        border: 1px solid var(--success-green-border);
        border-left: 6px solid #10B981;
        border-radius: 16px;
        padding: 22px 24px;
        margin-bottom: 22px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
    }

    .card-yellow {
        background-color: var(--warning-amber-bg);
        border: 1px solid var(--warning-amber-border);
        border-left: 6px solid #F59E0B;
        border-radius: 16px;
        padding: 22px 24px;
        margin-bottom: 22px;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);
    }

    .card-red {
        background-color: var(--danger-red-bg);
        border: 1px solid var(--danger-red-border);
        border-left: 6px solid #EF4444;
        border-radius: 16px;
        padding: 22px 24px;
        margin-bottom: 22px;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.08);
    }

    /* High Visibility Badges for Amber [unclear] Flags */
    .badge-unclear {
        background-color: #FEF3C7;
        color: #92400E;
        border: 1.5px solid #F59E0B;
        border-radius: 20px;
        padding: 3px 10px;
        font-size: 0.88rem !important;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .badge-source {
        font-size: 0.85rem !important;
        color: #64748B;
        font-weight: 500;
        margin-top: 14px;
        border-top: 1px solid #E2E8F0;
        padding-top: 8px;
    }

    .persistent-bar {
        background: #FFFFFF;
        border: 1px solid #CBD5E1;
        border-radius: 14px;
        padding: 12px 18px;
        margin-bottom: 22px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    }

    .warning-card {
        background-color: #FFFBEB;
        border: 2px solid #F59E0B;
        border-radius: 14px;
        padding: 18px 22px;
        margin-bottom: 22px;
        color: #92400E;
        display: flex;
        align-items: center;
        gap: 15px;
    }

    /* Streamlit Buttons Styling */
    .stButton > button {
        border-radius: 10px !important;
        font-weight: 700 !important;
        font-size: 1rem !important;
        padding: 0.55rem 1.2rem !important;
        transition: all 0.2s ease !important;
    }

    .stButton > button[kind="primary"] {
        background-color: var(--primary-teal) !important;
        color: #FFFFFF !important;
        border: none !important;
    }
    .stButton > button[kind="primary"]:hover {
        background-color: var(--primary-dark) !important;
        box-shadow: 0 4px 12px rgba(42, 157, 143, 0.3) !important;
    }

    /* Sidebar Clean Styling */
    [data-testid="stSidebar"] {
        background-color: #FFFFFF !important;
        border-right: 1px solid #E2E8F0 !important;
    }
</style>
""", unsafe_allow_html=True)

# Helper function to render a medicine card with high-contrast font, WHO/NLEM citation, and [unclear] amber badge
def render_medicine_card(med: dict, lang_key: str = "English", is_regional: bool = False):
    raw_name = str(med.get("name", "Medicine"))
    raw_dosage = str(med.get("simple_dosage", ""))
    raw_timing = str(med.get("simple_timing", ""))
    raw_purpose = str(med.get("simple_purpose", ""))
    raw_duration = str(med.get("simple_duration", ""))

    # Detect [unclear] tags across any medicine field
    has_unclear = any("[unclear]" in val.lower() for val in [raw_name, raw_dosage, raw_timing, raw_purpose, raw_duration])

    # Card background color-coding
    timing_lower = raw_timing.lower()
    name_lower = raw_name.lower()
    card_class = "card-green"

    if any(x in timing_lower for x in ["food", "eating", "meals", "சாப்பாடு", "உணவு", "भोजन", "खाना", "తిండి", "ಊட்ட", "ഭക്ഷണം", "খাবার", "जेवण"]):
        card_class = "card-yellow"
    if any(x in name_lower for x in ["alprazolam", "clonazepam", "digoxin"]) or "warning" in timing_lower or "danger" in timing_lower:
        card_class = "card-red"
    if has_unclear:
        card_class = "card-yellow"

    # Replace [unclear] inline text with distinct amber badges
    name_disp = raw_name.replace("[unclear]", '<span class="badge-unclear">⚠️ [unclear]</span>').replace("[UNCLEAR]", '<span class="badge-unclear">⚠️ [unclear]</span>')
    dosage_disp = raw_dosage.replace("[unclear]", '<span class="badge-unclear">⚠️ [unclear]</span>').replace("[UNCLEAR]", '<span class="badge-unclear">⚠️ [unclear]</span>')
    timing_disp = raw_timing.replace("[unclear]", '<span class="badge-unclear">⚠️ [unclear]</span>').replace("[UNCLEAR]", '<span class="badge-unclear">⚠️ [unclear]</span>')
    purpose_disp = raw_purpose.replace("[unclear]", '<span class="badge-unclear">⚠️ [unclear]</span>').replace("[UNCLEAR]", '<span class="badge-unclear">⚠️ [unclear]</span>')
    duration_disp = raw_duration.replace("[unclear]", '<span class="badge-unclear">⚠️ [unclear]</span>').replace("[UNCLEAR]", '<span class="badge-unclear">⚠️ [unclear]</span>')

    unclear_badge_header = '<div style="margin-bottom:10px;"><span class="badge-unclear">⚠️ [unclear] Needs Doctor/Pharmacist Verification</span></div>' if has_unclear else ''

    dosage_label = t('dosage', lang_key) if is_regional else "How much to take"
    timing_label = t('alarm_time', lang_key) if is_regional else "When to take"
    purpose_label = "Purpose" if is_regional else "Why you take it"
    duration_label = t('duration', lang_key) if is_regional else "How long"

    html_content = f"""
    <div class="{card_class}">
        {unclear_badge_header}
        <h4 style="margin-top:0px; font-size:1.35rem; font-weight:700; color:#1D7068;">💊 {name_disp}</h4>
        <p style="margin:6px 0; font-size:1.05rem;">📏 <strong>{dosage_label}:</strong> {dosage_disp}</p>
        <p style="margin:6px 0; font-size:1.05rem;">🕒 <strong>{timing_label}:</strong> {timing_disp}</p>
        <p style="margin:6px 0; font-size:1.05rem;">🎯 <strong>{purpose_label}:</strong> {purpose_disp}</p>
        <p style="margin:6px 0; font-size:1.05rem;">⏳ <strong>{duration_label}:</strong> {duration_disp}</p>
        <div class="badge-source">📚 Source: WHO Model List of Essential Medicines (23rd List, 2023) / India NLEM (2022)</div>
    </div>
    """
    st.markdown(html_content, unsafe_allow_html=True)


# Dynamic Session State Initializations
if "step" not in st.session_state:
    st.session_state.step = 0
if "raw_ocr" not in st.session_state:
    st.session_state.raw_ocr = ""
if "prescription_text" not in st.session_state:
    st.session_state.prescription_text = ""
if "ocr_text" not in st.session_state:
    st.session_state.ocr_text = ""
if "auto_analyse" not in st.session_state:
    st.session_state.auto_analyse = False
if "processed_data" not in st.session_state:
    st.session_state.processed_data = None
if "last_prescription" not in st.session_state:
    st.session_state.last_prescription = None
if "analysis_done" not in st.session_state:
    st.session_state.analysis_done = False
if "selected_language" not in st.session_state:
    st.session_state.selected_language = "English"

current_lang = st.session_state.get("selected_language", "English")

# App Navigation Header with App Logo
col_logo, col_title = st.columns([1, 5])
with col_logo:
    if os.path.exists(LOGO_PATH):
        st.image(LOGO_PATH, use_container_width=True)
    else:
        st.markdown("<div style='font-size: 3.5rem;'>🩺</div>", unsafe_allow_html=True)
with col_title:
    st.markdown('<div class="main-title">MedClarity AI 🩺</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Multilingual AI Health Assistant for Rural India — Breaking Prescription Barriers</div>', unsafe_allow_html=True)

    active_lang = current_lang
    trans = DISCLAIMER_TRANSLATIONS.get(active_lang, DISCLAIMER_TRANSLATIONS["English"])
    with st.popover(trans["title_badge"]):
        st.info(trans["popover_desc"])

# Persistent Control & Navigation Bar (🌐 Language Selector & Text Verification Button)
st.markdown('<div class="persistent-bar">', unsafe_allow_html=True)
p_col1, p_col2, p_col3 = st.columns([3, 3, 2])

with p_col1:
    target_lang = st.selectbox(
        "🌐 " + t("select_language", current_lang),
        ["English", "Tamil", "Hindi", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi"],
        key="selected_language",
        label_visibility="visible"
    )

LANG_ISO_MAP = {
    "English": "en", "Tamil": "ta", "Hindi": "hi", "Telugu": "te",
    "Kannada": "kn", "Malayalam": "ml", "Bengali": "bn", "Marathi": "mr"
}
lang_iso = LANG_ISO_MAP[target_lang]

with p_col2:
    if st.session_state.get("step", 0) > 0:
        if st.button("📝 Verify & Edit Prescription Text", use_container_width=True, key="persistent_edit_text_btn"):
            st.session_state.step = 1
            st.session_state.analysis_done = False
            rerun_app()

with p_col3:
    if st.session_state.get("step", 0) == 2:
        if st.button("🔄 Analyze Another", use_container_width=True, key="persistent_reset_btn"):
            st.session_state.step = 0
            st.session_state.processed_data = None
            st.session_state.raw_ocr = ""
            st.session_state.prescription_text = ""
            st.session_state.analysis_done = False
            st.session_state.last_uploaded_file_key = None
            rerun_app()

st.markdown('</div>', unsafe_allow_html=True)


# --- SIDEBAR ORGANIZED INTO ACCESSIBLE SECTIONS ---
with st.sidebar:
    if os.path.exists(LOGO_PATH):
        st.image(LOGO_PATH, caption=t("GramCare", current_lang), use_container_width=True)

    st.markdown(f"### 🌐 {t('settings', current_lang)}")
    st.info(f"Target Language: **{target_lang}**")
    st.markdown("---")

    # 📤 Upload Section
    st.markdown("### 📤 Upload Prescription")
    uploaded_file = st.file_uploader(
        "Upload Prescription Image",
        type=["png", "jpg", "jpeg", "webp"],
        help="Supports JPEG/PNG/WEBP files of doctor prescriptions or medical reports."
    )

    if uploaded_file is not None:
        file_key = f"processed_{uploaded_file.name}_{uploaded_file.size}"
        if st.session_state.get("last_uploaded_file_key") != file_key:
            if st.button(t("extract_ocr", target_lang), use_container_width=True):
                with st.status("🤖 Agent 1: Reading prescription image (Vision OCR)...", expanded=True) as ocr_status:
                    ocr_status.write("📷 Uploading image to Vision Engine...")
                    ocr_status.write("🔍 Extracting medical text & dosage notes...")
                    try:
                        import json
                        files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
                        res = requests.post(f"{BACKEND_URL}/api/ocr", files=files, timeout=60)
                        if res.status_code == 200:
                            result = res.json()
                            res_json = result
                            ocr_result_raw = (res_json.get("raw_ocr") or "").strip()
                            if not ocr_result_raw:
                                ocr_result_raw = "[unclear] Unable to extract readable text from the prescription image."

                            parsed_text = ocr_result_raw
                            try:
                                parsed_json = json.loads(ocr_result_raw)
                                if isinstance(parsed_json, dict) and "raw_transcription" in parsed_json:
                                    parsed_text = parsed_json.get("raw_transcription") or "[unclear] Empty transcription"
                            except Exception:
                                pass

                            st.session_state.raw_ocr = ocr_result_raw
                            st.session_state.prescription_text = parsed_text
                            st.session_state.ocr_text = parsed_text
                            st.session_state.step = 1
                            st.session_state.analysis_done = False
                            st.session_state.last_uploaded_file_key = file_key
                            ocr_status.update(label="✅ Prescription text read successfully!", state="complete", expanded=False)
                            if res_json.get("ocr_fallback"):
                                st.warning("⚠️ Gemini quota reached — using local OCR fallback.")
                            else:
                                st.success("Prescription text read successfully! Please verify it below.")
                            rerun_app()
                        else:
                            error_detail = ""
                            try:
                                error_detail = res.json().get("error", res.text[:300])
                            except Exception:
                                error_detail = res.text[:300]
                            ocr_status.update(label=f"❌ OCR API Error (HTTP {res.status_code})", state="error", expanded=True)
                            st.error(f"❌ **OCR API Error (HTTP {res.status_code}):** {error_detail}")
                            st.warning("Using offline medicine parser fallback.")
                            fallback_text = ""
                            st.session_state.prescription_text = fallback_text
                            st.session_state.ocr_text = fallback_text
                            st.session_state.step = 1
                            st.session_state.last_uploaded_file_key = file_key
                            rerun_app()
                    except Exception as e:
                        ocr_status.update(label="❌ Connection Error", state="error", expanded=True)
                        st.error(f"❌ **Connection Error:** {str(e)}")
                        st.warning("Vision API offline. Using local parser fallback.")
                        fallback_text = ""
                        st.session_state.prescription_text = fallback_text
                        st.session_state.ocr_text = fallback_text
                        st.session_state.step = 1
                        st.session_state.last_uploaded_file_key = file_key
                        rerun_app()

        uploaded_file = None

    st.markdown("---")

    # 📋 Quick Actions Section
    st.markdown("### 📋 Quick Actions")
    if st.button(t("try_sample", target_lang), use_container_width=True):
        st.session_state.raw_ocr = (
            "Dr. Anjali Sharma, MD | Patient: Vignesh Kumar (Age: 52) | Date: 26/05/2026 | "
            "Symptoms: Dry cough, high fever, throat pain. | "
            "Rx: 1. Amoxicillin 500mg BID PC x 5 days 2. Paracetamol 650mg TID AC PRN 3. Cetirizine 10mg QD HS x 3 days | "
            "Drink plenty of warm water. Avoid cold drinks."
        )
        st.session_state.prescription_text = st.session_state.raw_ocr
        st.session_state.ocr_text = st.session_state.raw_ocr
        st.session_state.auto_analyse = True
        st.session_state.analysis_done = False
        st.success("Sample prescription loaded and will be analysed automatically.")
        rerun_app()

    if st.button(t("view_last", target_lang), use_container_width=True):
        if st.session_state.last_prescription:
            st.session_state.processed_data = st.session_state.last_prescription
            st.session_state.step = 2
            st.success("Loaded last processed prescription from offline cache!")
        else:
            st.info("No prescription cached in this session yet.")

    st.markdown("---")

    # 🗄️ Reminders Section (SQLite)
    st.markdown("### 🗄️ Reminders")
    if st.button(t("refresh_db", target_lang), use_container_width=True):
        rerun_app()

    try:
        res = requests.get(f"{BACKEND_URL}/api/reminders")
        if res.status_code == 200:
            db_reminders = res.json()
            if db_reminders:
                for reminder in db_reminders[:5]:
                    st.markdown(f"""
                    **{reminder['medicine_name']}** ({reminder.get('dosage', 'N/A')})  
                    🕒 `Time: {reminder['time_of_day']}` | {reminder.get('relation_to_food', '')}  
                    """)
                    if st.button(f"🗑️ Clear ID {reminder['id']}", key=f"del_{reminder['id']}"):
                        requests.delete(f"{BACKEND_URL}/api/reminders/{reminder['id']}")
                        st.success("Reminder cleared!")
                        rerun_app()
            else:
                st.info("No reminders in SQLite database.")
        else:
            st.error("Error connecting to database reminders.")
    except Exception:
        st.warning("Database offline.")

    st.markdown("---")

    # ℹ️ About Section
    st.markdown("### ℹ️ About")
    st.info("MedClarity AI helps rural citizens understand English prescriptions in local languages.")


# PERMANENT MEDICAL DISCLAIMER BANNER
st.markdown("""
<div style="background-color: #FEF2F2; border: 2px solid #EF4444; border-radius: 12px; padding: 12px 18px; margin-bottom: 22px; text-align: center; color: #991B1B; font-weight: 700;">
    🚨 Medical Disclaimer: This is for understanding only. Always follow your doctor's advice. Do not make medical decisions based on this assistant.
</div>
""", unsafe_allow_html=True)

# FIRST TIME HERE? INSTRUCTIONS EXPANDER
with st.expander(f"❓ {t('first_time', current_lang)} ({t('instructions', current_lang)})", expanded=False):
    st.markdown("""
    ### English Instructions:
    1. **Upload or Select**: Upload a photo of a prescription in the sidebar, or click **⚡ Try Sample Prescription**.
    2. **OCR extraction**: Click **🔍 Step 1: Extract Text (OCR)** in the sidebar.
    3. **Correction & Edit**: Look at the text box on the screen. Edit any wrong drug names or text details.
    4. **Process**: Click the **⚙️ Step 2: Confirm & Process** button below the text box.
    5. **Multilingual Guide**: Read the simplified explanation, listen to it using the audio player, and view the visual schedule.
    6. **Voice Q&A**: Ask follow-up questions using your voice at the bottom of the page!
    
    ### தமிழ் வழிமுறைகள்:
    1. **பதிவேற்றம்**: பக்கவாட்டுப் பலகையில் படத்தைப் பதிவேற்றவும் அல்லது **⚡ மாதிரி மருந்துச்சீட்டு** பொத்தானை அழுத்தவும்.
    2. **உரையைப் பிரித்தல்**: பக்கவாட்டில் உள்ள **🔍 Step 1: Extract Text (OCR)** பொத்தானை அழுத்தவும்.
    3. **திருத்துதல்**: திரையில் தோன்றும் உரைப் பெட்டியில் உள்ள பிழைகளைத் திருத்தவும்.
    4. **செயலாக்கம்**: உரைப் பெட்டிக்கு கீழே உள்ள **⚙️ Step 2: Confirm & Process** பொத்தானை அழுத்தவும்.
    5. **விளக்கம்**: எளிய தமிழ் விளக்கத்தைப் பார்க்கவும், குரல் வழியைக் கேட்கவும், அட்டவணையைப் பார்க்கவும்.
    6. **குரல் கேள்வி**: பக்கத்தின் கீழே உங்கள் குரல் மூலம் ஏதேனும் சந்தேகங்களைக் கேட்கலாம்!
    """)


# MAIN PANEL STEP ROUTING
if st.session_state.step == 0:
    st.markdown("""
    <div class="card-general">
        <h3 style="color:#1D7068; margin-top:0;">💡 Welcome to MedClarity AI</h3>
        <p style="font-size:1.1rem;">Please upload a prescription image in the sidebar or click <strong>⚡ Try Sample Prescription</strong> to get started.</p>
    </div>
    """, unsafe_allow_html=True)

if st.session_state.get("auto_analyse") and st.session_state.prescription_text:
    st.session_state.auto_analyse = False
    run_full_pipeline(st.session_state.prescription_text, target_lang, lang_iso)
    rerun_app()

elif st.session_state.step == 1 and not st.session_state.get("analysis_done"):
    st.markdown("""
    <div class="card-general">
        <h3 style="color:#1D7068; margin-top:0;">📝 Verify and Correct Prescription Text</h3>
        <p style="color:#475569; font-size:1.05rem;">Sometimes AI can misread handwritten prescriptions. Please check the text below and correct any errors before processing.</p>
    </div>
    """, unsafe_allow_html=True)

    response_data = st.session_state.get("raw_ocr", "")
    parsed_text = response_data
    try:
        import json
        parsed_json = json.loads(response_data)
        if isinstance(parsed_json, dict) and "raw_transcription" in parsed_json:
            parsed_text = parsed_json.get("raw_transcription", response_data)
    except Exception:
        pass

    value_used_for_display = parsed_text if parsed_text else st.session_state.get("ocr_text", "")

    with st.form("verify_prescription_form"):
        corrected_text = st.text_area(
            "Prescription Text (Editable)",
            value=value_used_for_display,
            height=220,
            key="corrected_prescription"
        )
        submitted = st.form_submit_button(t("analyse_prescription", target_lang), type="primary", use_container_width=True)

        if submitted:
            st.session_state.prescription_text = corrected_text
            run_full_pipeline(st.session_state.prescription_text, target_lang, lang_iso)
            rerun_app()

elif st.session_state.step == 2:
    data = st.session_state.processed_data

    if st.button(t("analyze_another", target_lang), use_container_width=True):
        st.session_state.step = 0
        st.session_state.processed_data = None
        st.session_state.raw_ocr = ""
        st.session_state.prescription_text = ""
        st.session_state.analysis_done = False
        st.session_state.last_uploaded_file_key = None
        rerun_app()

    if data:
        # PRESCRIPTION SUMMARY CARD (PATIENT INFO)
        patient_name = data.get("patient_name", "Unknown Patient")
        doctor_name = data.get("doctor_name", "Unknown Doctor")
        date_val = data.get("date", "Not Available")
        symptoms = data.get("symptoms", [])
        medicines = data.get("simplified_en", {}).get("medicines", [])

        st.markdown(f"""
        <div class="card-general">
            <h3 style="margin-top:0px; color:#1D7068;">📋 Patient & Prescription Info</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size:1.05rem;">
                <div>👤 <strong>Patient Name:</strong> {patient_name}</div>
                <div>🩺 <strong>Doctor:</strong> {doctor_name}</div>
                <div>📅 <strong>Date:</strong> {date_val}</div>
                <div>💊 <strong>Medicines Count:</strong> {len(medicines)}</div>
            </div>
            <div style="margin-top:12px; font-size:1.05rem;">
                🩺 <strong>Identified Symptoms:</strong> {"".join([f'<span class="badge-unclear" style="margin-right:6px;">{s}</span>' for s in symptoms]) if symptoms else 'General Symptoms'}
            </div>
        </div>
        """, unsafe_allow_html=True)

        # SUGGESTED REFERENCE DRUG MATCHES
        suggestions = data.get("drug_suggestions", [])
        if suggestions:
            st.markdown("### 🩺 Suggested Drug Name Matches")
            st.info("The OCR extracted some medicine names that are close matches to official essential medicines (WHO EML / NLEM 2022). Please verify the correct name:")
            for sug in suggestions:
                st.warning(f"🔍 OCR read: **`{sug['ocr_text']}`** ➔ Reference drug: **`{sug['suggested_match']}`** (Match Confidence: {int(sug['match_confidence']*100)}%)")

        # DYNAMIC DRUG-TO-DRUG INTERACTION ALERT
        interaction_warnings = check_drug_interactions(medicines)
        if interaction_warnings:
            for warn in interaction_warnings:
                st.error(warn)

        # TRUST UI: Low-confidence amber warning card
        active_lang = current_lang
        trans = DISCLAIMER_TRANSLATIONS.get(active_lang, DISCLAIMER_TRANSLATIONS["English"])
        rag_sources = data.get("rag_sources", [])

        if data.get("low_confidence", False):
            st.markdown(f"""
            <div class="warning-card">
                <span style="font-size:1.8rem;">⚠️</span>
                <span style="font-size:1.05rem; font-weight:600;">{trans['low_confidence_msg']}</span>
            </div>
            """, unsafe_allow_html=True)

        # Medicine Safety Advisory Section
        precautions = data.get("precautions_en", [])
        advisory_en = data.get("patient_advisory_en", "")
        emergency = data.get("emergency_alert", False)

        if advisory_en or precautions:
            st.markdown("### ⚠️ Safety Warnings & Precautions")
            if advisory_en:
                if emergency:
                    st.error(f"**Critical Interaction Alert:** {advisory_en}")
                else:
                    st.info(f"**Advisory:** {advisory_en}")
            if precautions:
                for p in precautions:
                    st.warning(f"• {p}")

        # TRANSLATED OUTPUT & GUIDES TABS
        tab_regional, tab_en = st.tabs([t("regional_guide", target_lang), "🇺🇸 English Guide"])

        with tab_regional:
            translated_guide = data.get("translated_guide", {})
            st.markdown(f"### {t('greeting', target_lang)} *{translated_guide.get('patient_greeting', '')}*")

            st.markdown(f"""
            <div class="card-general">
                <h4 style="color:#1D7068; margin-top:0;">📋 {t('summary', target_lang)}</h4>
                <p style="margin:0; font-size:1.1rem;">{translated_guide.get('simple_summary', '')}</p>
            </div>
            """, unsafe_allow_html=True)

            st.markdown(f"#### 💊 {t('prescribed_medications', target_lang)} ({target_lang}):")
            for med in translated_guide.get("medicines", []):
                render_medicine_card(med, lang_key=target_lang, is_regional=True)

            rag_context = data.get("rag_context")
            if not rag_context:
                rag_context = "Explanation unavailable"

            st.markdown("""
            <div class="card-general">
                <h4 style="color:#1D7068; margin-top:0;">🧠 What this means (Clinical Context)</h4>
            """, unsafe_allow_html=True)
            st.info(rag_context)
            st.markdown("</div>", unsafe_allow_html=True)

            if translated_guide.get("helpful_tips"):
                st.markdown(f"#### 💡 {t('care_tips', target_lang)}")
                for tip in translated_guide.get("helpful_tips", []):
                    st.markdown(f"- {tip}")

            st.markdown(
                f"<p style='color:#64748B; font-size:0.95rem; margin-top:18px;'>{trans['footer_badge']}</p>",
                unsafe_allow_html=True
            )
            render_sources_expander(rag_sources, active_lang)


        with tab_en:
            simple_en = data.get("simplified_en", {})
            st.markdown(f"### Greeting: *{simple_en.get('patient_greeting', 'Hello!')}*")

            st.markdown(f"""
            <div class="card-general">
                <h4 style="color:#1D7068; margin-top:0;">📋 Care Summary</h4>
                <p style="margin:0; font-size:1.1rem;">{simple_en.get('simple_summary', '')}</p>
            </div>
            """, unsafe_allow_html=True)

            st.markdown("#### 💊 Prescribed Medications (Plain English):")
            for med in simple_en.get("medicines", []):
                render_medicine_card(med, lang_key="English", is_regional=False)

            rag_context = data.get("rag_context")
            if not rag_context:
                rag_context = "Explanation unavailable"

            st.markdown("""
            <div class="card-general">
                <h4 style="color:#1D7068; margin-top:0;">🧠 What this means (Clinical Context)</h4>
            """, unsafe_allow_html=True)
            st.info(rag_context)
            st.markdown("</div>", unsafe_allow_html=True)

            if simple_en.get("helpful_tips"):
                st.markdown("#### 💡 Recovery & Care Tips:")
                for tip in simple_en.get("helpful_tips", []):
                    st.markdown(f"- {tip}")

            en_trans = DISCLAIMER_TRANSLATIONS["English"]
            st.markdown(
                f"<p style='color:#64748B; font-size:0.95rem; margin-top:18px;'>{en_trans['footer_badge']}</p>",
                unsafe_allow_html=True
            )
            render_sources_expander(rag_sources, "English")

        # VOICE AUDIO PLAYBACK SECTION
        st.markdown("### 🔊 Voice Audio Assistant")
        col_tts1, col_tts2 = st.columns(2)

        with col_tts1:
            st.markdown("##### 🔊 Listen in English:")
            audio_text_en = f"{simple_en.get('patient_greeting', '')}. {simple_en.get('simple_summary', '')}."
            for idx, med in enumerate(simple_en.get("medicines", [])):
                audio_text_en += f" Medicine {idx+1}: {med['name']}. {med['simple_dosage']}. {med['simple_timing']}. {med['simple_purpose']}."
            try:
                audio_url_en = f"{BACKEND_URL}/api/audio?text={requests.utils.quote(audio_text_en)}&lang=en"
                st.audio(audio_url_en, format="audio/mp3")
            except Exception:
                st.warning("English Audio synthesis is currently offline. Please refer to the written English guide above.")

        with col_tts2:
            st.markdown(f"##### 🔊 Listen in {target_lang}:")
            audio_text_reg = f"{translated_guide.get('patient_greeting', '')}. {translated_guide.get('simple_summary', '')}."
            for idx, med in enumerate(translated_guide.get("medicines", [])):
                audio_text_reg += f" Medicine {idx+1}: {med['name']}. {med['simple_dosage']}. {med['simple_timing']}. {med['simple_purpose']}."
            try:
                audio_url_reg = f"{BACKEND_URL}/api/audio?text={requests.utils.quote(audio_text_reg)}&lang={lang_iso}"
                audio_html = f"""
                <audio autoplay controls style="width:100%; margin-bottom:10px;">
                    <source src="{audio_url_reg}" type="audio/mpeg">
                    Your browser does not support audio playback.
                </audio>
                """
                st.markdown(audio_html, unsafe_allow_html=True)
            except Exception as _audio_exc:
                st.warning(
                    f"{target_lang} audio synthesis is currently offline "
                    f"({_audio_exc}). Please refer to the written {target_lang} Guide above."
                )

        st.markdown("---")
        if st.button(t("read_aloud", target_lang), use_container_width=True):
            full_text = f"Safety Advisory: {advisory_en}. Care Summary: {translated_guide.get('simple_summary', '')}."
            for idx, med in enumerate(translated_guide.get("medicines", [])):
                full_text += f" Medicine {idx+1}: {med['name']}. dosage: {med['simple_dosage']}. timing: {med['simple_timing']}. purpose: {med['simple_purpose']}."
            try:
                full_audio_url = f"{BACKEND_URL}/api/audio?text={requests.utils.quote(full_text)}&lang={lang_iso}"
                st.audio(full_audio_url, format="audio/mp3", autoplay=True)
            except Exception:
                st.error("Failed to compile full voice guide. Please read the guides written in the tabs above.")

        st.markdown("---")

        with st.expander("📚 Clinical Reference Sources"):
            try:
                if rag_sources:
                    st.markdown(
                        "Answers above were cross-referenced against the following "
                        "**official medicine reference manuals**:"
                    )
                    for idx, src in enumerate(rag_sources):
                        doc_name = src.get("source", "Unknown Document")
                        page = src.get("page", "Unknown Page")
                        content = src.get("content", "").strip()
                        st.markdown(f"**{idx + 1}. {doc_name} — Page {page}**")
                        st.caption(content[:400] + "..." if len(content) > 400 else content)
                        st.markdown("---")
                else:
                    st.info("No specific sections from the official manuals matched this prescription.")
            except Exception:
                pass

        # MEDICATION DATABASE TIMELINE AND VISUAL SCHEDULER CARDS
        st.markdown("### 🕒 Auto-Generated Medication Timeline & Alarms")
        reminders = data.get("reminders", [])
        if reminders:
            df = pd.DataFrame(reminders)
            df.rename(columns={
                "medicine_name": t("medicine_name", target_lang),
                "dosage": t("dosage", target_lang),
                "time_of_day": t("alarm_time", target_lang),
                "relation_to_food": t("food_direction", target_lang),
                "duration": t("duration", target_lang),
                "frequency": "Frequency"
            }, inplace=True)
            st.dataframe(df[[t("medicine_name", target_lang), t("dosage", target_lang), t("alarm_time", target_lang), t("food_direction", target_lang), t("duration", target_lang)]], use_container_width=True)
            st.success("🎉 Medicine alarms have been successfully generated and saved to your local SQLite database reminder repository!")

            st.markdown("#### 📅 Visual Dosage Schedule Card")
            morning_meds, afternoon_meds, night_meds = generate_schedule_grid(reminders)

            col_m, col_a, col_n = st.columns(3)
            with col_m:
                st.markdown(f"""
                <div style="background-color: #FFFBEB; border: 1.5px solid #F59E0B; border-radius: 12px; padding: 16px; min-height: 180px;">
                    <h4 style="color: #B45309; margin-top:0px;">☀️ {t('morning', target_lang)}</h4>
                """, unsafe_allow_html=True)
                if morning_meds:
                    for m in morning_meds:
                        st.markdown(f"- {m}")
                else:
                    st.markdown("*No medications scheduled.*")
                st.markdown("</div>", unsafe_allow_html=True)

            with col_a:
                st.markdown(f"""
                <div style="background-color: #EFF6FF; border: 1.5px solid #3B82F6; border-radius: 12px; padding: 16px; min-height: 180px;">
                    <h4 style="color: #1D4ED8; margin-top:0px;">⛅ {t('afternoon', target_lang)}</h4>
                """, unsafe_allow_html=True)
                if afternoon_meds:
                    for m in afternoon_meds:
                        st.markdown(f"- {m}")
                else:
                    st.markdown("*No medications scheduled.*")
                st.markdown("</div>", unsafe_allow_html=True)

            with col_n:
                st.markdown(f"""
                <div style="background-color: #F3E8FF; border: 1.5px solid #8B5CF6; border-radius: 12px; padding: 16px; min-height: 180px;">
                    <h4 style="color: #6D28D9; margin-top:0px;">🌙 {t('night', target_lang)}</h4>
                """, unsafe_allow_html=True)
                if night_meds:
                    for m in night_meds:
                        st.markdown(f"- {m}")
                else:
                    st.markdown("*No medications scheduled.*")
                st.markdown("</div>", unsafe_allow_html=True)

            sched_txt = f"MedClarity AI Medication Schedule - Patient: {patient_name}\n"
            sched_txt += f"Language: {target_lang} | Date: {date_val}\n"
            sched_txt += "==================================================\n\n"
            sched_txt += "☀️ MORNING MEDS:\n" + ("\n".join([f"- {x}" for x in morning_meds]) if morning_meds else "None") + "\n\n"
            sched_txt += "⛅ AFTERNOON MEDS:\n" + ("\n".join([f"- {x}" for x in afternoon_meds]) if afternoon_meds else "None") + "\n\n"
            sched_txt += "🌙 NIGHT MEDS:\n" + ("\n".join([f"- {x}" for x in night_meds]) if night_meds else "None") + "\n\n"
            sched_txt += "==================================================\n"
            sched_txt += "Disclaimer: This is for understanding only. Always consult your prescribing doctor."

            st.download_button(
                label="📥 Download Schedule",
                data=sched_txt,
                file_name=f"{patient_name.replace(' ', '_')}_medication_schedule.txt",
                mime="text/plain",
                use_container_width=True
            )

        else:
            extracted_meds = data.get("simplified_en", {}).get("medicines", [])
            if extracted_meds:
                st.info("No recurring schedule needed — this prescription contains a one-time or as-directed dose. See the medicine list above for details.")
            else:
                st.warning("No medicines were detected for scheduling. Please verify the prescription text above.")

        # NEARBY SERVICE LOCATORS
        st.markdown("### 🏥 Find Nearby Medical Services")
        st.markdown("""
        <div style="display: flex; gap: 15px; margin-top: 10px; margin-bottom: 25px; flex-wrap: wrap;">
            <a href="https://www.google.com/maps/search/pharmacy+near+me" target="_blank" style="text-decoration: none; padding: 12px 24px; background-color: #2A9D8F; color: white; border-radius: 8px; font-weight: bold; font-size:16px;">🏥 Find Nearby Pharmacy</a>
            <a href="https://www.google.com/maps/search/hospital+near+me" target="_blank" style="text-decoration: none; padding: 12px 24px; background-color: #E76F51; color: white; border-radius: 8px; font-weight: bold; font-size:16px;">🏥 Find Nearby Hospital</a>
        </div>
        """, unsafe_allow_html=True)

        # WHATSAPP SHARING LINK
        st.markdown("### 📱 Share Patient Guide via WhatsApp")
        
        wa_greet = translated_guide.get("patient_greeting", "வணக்கம்")
        wa_sum = translated_guide.get("simple_summary", "")
        wa_meds = ""
        for idx, med in enumerate(translated_guide.get("medicines", [])):
            wa_meds += f"\n💊 *{med['name']}*:\n   - {med['simple_dosage']}\n   - {med['simple_timing']}\n   - {med['simple_purpose']}\n"
            
        wa_tips = ""
        if translated_guide.get("helpful_tips"):
            wa_tips = "\n💡 *Tips:*\n" + "\n".join([f"- {t}" for t in translated_guide["helpful_tips"]])
            
        wa_disclaimer = "\n\n⚠️ Disclaimer: For understanding only. Always consult your doctor."
        
        whatsapp_msg = f"🩺 *MedClarity AI Prescription Guide*\n\n{wa_greet}\n\n📝 *Summary:* {wa_sum}\n{wa_meds}{wa_tips}{wa_disclaimer}"
        encoded_msg = urllib.parse.quote(whatsapp_msg)
        whatsapp_url = f"https://wa.me/?text={encoded_msg}"
        
        st.markdown(f"""
        <div style="margin-top:10px;">
            <a href="{whatsapp_url}" target="_blank" style="text-decoration: none; padding: 12px 24px; background-color: #25d366; color: white; border-radius: 8px; font-weight: bold; font-size:16px; display:inline-block; text-align:center;">📱 Share via WhatsApp</a>
        </div>
        """, unsafe_allow_html=True)

        # --- NEW FEATURE: VOICE-ENABLED FOLLOW-UP QUESTION ANSWERING (VOICE Q&A) ---
        st.markdown("---")
        st.markdown("### 🗣️ Ask MedClarity AI (Voice & Text Q&A)")
        st.info("Record your voice question or type below to ask follow-up questions about this prescription.")
        
        # Audio recording widget
        voice_audio = st.audio_input("🎤 Record your question")
        typed_question = st.text_input("✍️ Or type your follow-up question here:")
        
        question_text = ""
        
        if voice_audio is not None:
            with st.spinner("🎧 Transcribing your voice query..."):
                import speech_recognition as sr
                import tempfile
                
                r = sr.Recognizer()
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as fp:
                    fp.write(voice_audio.read())
                    fp.flush()
                    temp_wav_path = fp.name
                
                try:
                    with sr.AudioFile(temp_wav_path) as source:
                        audio_data = r.record(source)
                        question_text = r.recognize_google(audio_data)
                        st.success(f"🗣️ Transcribed: \"{question_text}\"")
                except Exception as ex:
                    # Capture Google API failures gracefully
                    st.warning("Could not transcribe voice audio automatically. Please speak clearly or type your question below.")
                finally:
                    if os.path.exists(temp_wav_path):
                        os.remove(temp_wav_path)
                        
        if typed_question:
            question_text = typed_question
            
        if question_text:
            if st.button(t("get_answer", target_lang), width="stretch"):
                # Context block for the LLM
                context_string = f"Prescription Text: {st.session_state.prescription_text}\n"
                context_string += f"English Summary: {simple_en.get('simple_summary', '')}\n"
                context_string += f"Tamil/Regional Summary: {translated_guide.get('simple_summary', '')}\n"
                
                with st.spinner("🤔 Agent 9: Generating conversational response..."):
                    try:
                        import google.generativeai as genai
                        gemini_key = os.getenv("GEMINI_API_KEY")
                        if not gemini_key:
                            st.error("Unable to answer. GEMINI_API_KEY is not defined.")
                        else:
                            genai.configure(api_key=gemini_key)
                            system_prompt = f"""You are MedClarity AI, a friendly medical assistant helping rural users understand their care guides.
                            Answer the user's question clearly and conversationally. Translate your answer and write it strictly in {target_lang}.
                            Avoid complicated terms, explain like you are speaking to a relative. If safety is concerned, warn them to see a doctor immediately.
                            Rely on the provided context details. do not invent diagnostic details."""
                            
                            user_prompt = f"Prescription Context:\n{context_string}\n\nUser Question: {question_text}"
                            
                            chat_response = None
                            for attempt in range(2):
                                try:
                                    model = genai.GenerativeModel("gemini-3.1-flash-lite", system_instruction=system_prompt)
                                    response = model.generate_content(user_prompt)
                                    chat_response = response.text
                                    break
                                except Exception as ex:
                                    err_str = str(ex)
                                    if "429" in err_str or "quota" in err_str.lower():
                                        if attempt == 0:
                                            st.warning("Gemini rate limit hit. Retrying in 10 seconds...")
                                            import time
                                            time.sleep(10)
                                        else:
                                            raise ex
                                    else:
                                        raise ex
                            
                            if chat_response:
                                st.markdown(f"""
                                <div class="card-general" style="border-left: 5px solid #2ea043; margin-top:15px;">
                                    <h4>💬 MedClarity Answer ({target_lang}):</h4>
                                    <p>{chat_response}</p>
                                </div>
                                """, unsafe_allow_html=True)

                                # ── TRUST UI: Footer badge + source expander under Q&A answer ──
                                st.markdown(
                                    f"<p style='color:#8b949e; font-size:0.95rem; margin-top:8px;'>{trans['footer_badge']}</p>",
                                    unsafe_allow_html=True
                                )
                                render_sources_expander(rag_sources, active_lang)

                                # Synthesize and play audio guide
                                try:
                                    ans_audio_url = f"{BACKEND_URL}/api/audio?text={requests.utils.quote(chat_response)}&lang={lang_iso}"
                                    st.audio(ans_audio_url, format="audio/mp3", autoplay=True)
                                except Exception:
                                    pass
                    except Exception as e:
                        st.error(f"Conversational Agent error: {e}")
                            
                    except Exception as e:
                        st.error("Conversational Agent is currently offline. Please try typing your question again.")
