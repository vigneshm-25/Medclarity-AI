# MedClarity AI (OpenAI Exclusive Architecture)

MedClarity AI is an AI-powered prescription literacy and medication reminder application for mobile (React Native Expo) and web. It processes doctor handwritten prescriptions using **OpenAI Vision** and **GPT-5-mini**, extracts structured medication data grounded in WHO Model List of Essential Medicines (23rd Ed, 2023) & CDSCO India NLEM 2022 guidelines, translates guidance into Tamil and English, and schedules local medication reminders.

---

## 🏗️ Architecture & Single AI Pipeline

MedClarity AI operates on a single, unified OpenAI processing pipeline:

```
Prescription Image
        ↓
OpenAI Vision (Handwriting OCR)
        ↓
Raw OCR Text
        ↓
GPT-5-mini Medical Structuring
        ↓
Structured Medicine JSON
        ↓
GPT-5-mini Translation (Tamil / English)
        ↓
Local Scheduled Reminders
```

---

## 🛠️ Tech Stack & Services

- **Mobile App:** React Native with Expo (Managed Workflow), React Navigation, Zustand state management, `i18next` (English & Tamil), `expo-notifications`, `expo-av`, `expo-camera`, `expo-image-picker`.
- **Backend Services:** FastAPI running on `http://localhost:8000`.
- **AI Engine:** OpenAI APIs exclusively (`OPENAI_API_KEY`).
  - **OpenAI Vision:** Prescription handwriting transcription.
  - **GPT-5-mini:** Medical structuring, WHO/NLEM grounding, JSON output generation, Tamil/English patient guide translation.

---

## ⚙️ Environment Setup

Environment configuration requires only:

```env
API_BASE_URL=http://10.0.2.2:8000
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 🚀 Running the Project

### 1. Backend Server
```bash
# Activate Python environment
.\venv\Scripts\Activate.ps1

# Launch FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. React Native Expo Mobile App
```bash
cd medclarity-app

# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Web preview
npx expo start --web
```

---

## 🛡️ Error Handling

- **Zero Silent Failures:** All API calls explicitly handle invalid keys (401), rate limits (429), timeouts, and JSON parsing errors.
- **User-Facing Error UI:** Surfaced through explicit `ErrorBanner` components with retry buttons.
