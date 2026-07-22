# MedClarity AI

MedClarity AI is a multilingual prescription assistance platform. It accepts prescription or clinical report images, extracts the text with OCR, structures the medical information, checks for safety concerns, simplifies medical instructions, translates guidance into Tamil, retrieves supporting safety context, generates medication reminders, and produces text-to-speech output for the final guide.

## Overview

The application is split into two parts:

1. A FastAPI backend under backend/app that runs the prescription-processing pipeline.
2. A Streamlit frontend under frontend that provides the user interface for uploads and results.

The backend orchestrates several specialized components, including OCR, medical parsing, safety checks, text simplification, translation, retrieval, scheduling, and audio generation.

## Features

1. Image upload for prescription and report processing.
2. OCR extraction for handwritten or printed medical text.
3. Structured parsing of medicines, dosages, symptoms, and warnings.
4. Safety checks for high-risk symptoms and drug combinations.
5. Plain-language summaries for easier patient understanding.
6. Tamil translation for local-language guidance.
7. Retrieval from a local FAISS index seeded with medical safety references.
8. Medication reminder generation backed by SQLite.
9. Text-to-speech output for spoken guidance.

## Project Structure

```
gramcare-ai/
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── agents/
│   │   └── utils/
│   ├── data/
│   ├── ingest_sources.py
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── app.py
│   └── requirements.txt
├── main.py
├── pyproject.toml
└── README.md
```

## Setup

### Prerequisites

1. Python 3.9, 3.10, or 3.11.
2. An OpenAI API key.

### Environment Variables

Create a `.env` file in the project root with the required values:

```bash
OPENAI_API_KEY=YOUR_ACTUAL_OPENAI_API_KEY_HERE
DATABASE_URL=sqlite:///./backend/data/local_db.db
BACKEND_URL=http://localhost:8000
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# Production launch (single worker, no reload to save memory on 512MB RAM):
uvicorn app.main:app --port 8000 --workers 1
```

### Frontend

Open a new terminal and run:

```bash
cd frontend
..\backend\venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py --server.port 8501
```

## API Endpoints

1. `GET /` returns the backend status.
2. `POST /api/upload-prescription` uploads an image and runs the full pipeline.
3. `POST /api/ocr` extracts raw OCR text only.
4. `POST /api/process-text` processes already extracted text through the remaining pipeline.

## Data And Storage

The backend stores generated reminders in SQLite and uses local data folders for medical documents, extracted sources, audio output, and vector search files.

## Testing

Backend tests are available under backend/tests and the project root test files. Run the relevant test command for the area you are working on.
