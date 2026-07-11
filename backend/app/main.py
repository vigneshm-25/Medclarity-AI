import io
import os
from typing import Dict, Any, List
import traceback
from fastapi import FastAPI, UploadFile, File, Depends, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db, init_db
from app.models import Reminder
from app.agents.coordinator import CoordinatorAgent
from app.utils.tts import TTSEngine

# Initialize FastAPI App
app = FastAPI(
    title="MedClarity AI - Multilingual AI Health Assistant",
    description="Backend API services for MedClarity AI, empowering rural Indian citizens with medical assistance.",
    version="1.0.0"
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:8501").split(",")
    if origin.strip()
]

# Enable CORS for the Streamlit frontend running on port 8501 (or other ports)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate orchestrators
coordinator = None
tts_engine = TTSEngine()


def get_or_create_coordinator():
    global coordinator
    if coordinator is None:
        try:
            coordinator = CoordinatorAgent()
        except Exception as exc:
            print(f"WARNING: CoordinatorAgent failed to initialize on demand: {exc}")
            coordinator = None
    return coordinator

@app.on_event("startup")
def startup_event():
    """Initializes the SQLite database and sets up agents on server startup."""
    global coordinator

    init_db()
    get_or_create_coordinator()

@app.get("/")
def read_root():
    return {"status": "running", "service": "MedClarity AI Backend API"}

@app.post("/api/upload-prescription", response_model=Dict[str, Any])
async def upload_prescription(
    file: UploadFile = File(...),
    target_lang: str = Query("Tamil", description="Target language for translation"),
    db: Session = Depends(get_db)
):
    """
    Accepts prescription image upload, executes vision multi-agent pipeline,
    caches audio guide tracks, registers database reminders, and returns a detailed payload.
    """
    global coordinator
    coordinator = get_or_create_coordinator()
    if not coordinator:
        raise HTTPException(
            status_code=503,
            detail="AI Multi-Agent coordinator is not initialized. Please verify GEMINI_API_KEY."
        )

    # Validate file type
    content_type = file.content_type
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload a valid image file (JPEG, PNG, WEBP)."
        )

    try:
        # Read raw image bytes
        image_bytes = await file.read()
        
        # Run vision multi-agent workflow coordinator
        master_payload = coordinator.process_prescription_image(
            image_bytes=image_bytes,
            mime_type=content_type,
            target_lang=target_lang
        )

        if "error" in master_payload:
            raise HTTPException(status_code=500, detail=master_payload["details"])

        # Auto-schedule Reminders in SQLite database
        for reminder_data in master_payload.get("reminders", []):
            db_reminder = Reminder(
                patient_name=master_payload.get("patient_name", "Patient"),
                medicine_name=reminder_data["medicine_name"],
                dosage=reminder_data["dosage"],
                time_of_day=reminder_data["time_of_day"],
                frequency=reminder_data["frequency"],
                relation_to_food=reminder_data["relation_to_food"],
                duration=reminder_data["duration"]
            )
            db.add(db_reminder)
        
        db.commit()
        return master_payload

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected server error during upload parsing: {str(e)}")

@app.post("/api/ocr")
async def run_ocr(file: UploadFile = File(...)):
    """Only extracts raw OCR text from the uploaded prescription image."""
    global coordinator
    coordinator = get_or_create_coordinator()
    if not coordinator:
        return {"raw_ocr": "[unclear] Unable to extract readable text from the prescription image.", "ocr_fallback": True}

    content_type = file.content_type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{content_type}'. Supported formats: JPEG, PNG, WEBP."
        )
        
    try:
        image_bytes = await file.read()
        print(f"[CP1] bytes received: {len(image_bytes)}, content_type: {file.content_type}, filename: {file.filename}")
        file_size = len(image_bytes)
        
        # Max size 10MB
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File is too large ({file_size} bytes). Max allowed size is 10MB."
            )
            
        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty."
            )
            
        print(f"[CP2] calling extract_text, mime_type={content_type}, bytes={len(image_bytes)}")
        raw_ocr, ocr_fallback = coordinator.ocr_agent.extract_text(
            image_bytes,
            mime_type=content_type
        )

        if not raw_ocr or not raw_ocr.strip():
            raw_ocr = "[unclear] Unable to extract readable text from the prescription image."
            ocr_fallback = True

        print("=" * 100)
        print("OCR RESULT RETURNED TO FRONTEND")
        print(raw_ocr)
        print("=" * 100)

        response_dict = {
            "raw_ocr": raw_ocr,
            "ocr_fallback": ocr_fallback
        }
        print(f"[CP6-backend] final payload: {response_dict}")
        return response_dict

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        print("=" * 80)
        print("=== OCR ERROR ===")
        print(f"Exception Type: {type(e).__name__}")
        print(f"Exception Message: {str(e)}")
        traceback.print_exc()
        print("=" * 80)
        
        return JSONResponse(
            status_code=500,
            content={"error": f"OCR processing failed: {str(e)}"}
        )

@app.post("/api/process-text", response_model=Dict[str, Any])
async def process_text(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Processes raw or corrected OCR prescription text through the remaining coordinator pipeline agents."""
    global coordinator
    coordinator = get_or_create_coordinator()
    if not coordinator:
        return {
            "raw_ocr": payload.get("text", "") or "[unclear] Unable to extract readable text from the prescription image.",
            "patient_name": "Unknown",
            "symptoms": [],
            "clinical_notes": "The workflow is running in fallback mode because the coordinator is unavailable.",
            "safety_status": "WARNING",
            "emergency_alert": False,
            "patient_advisory_en": "Please confirm the prescription with a doctor or pharmacist.",
            "red_flags": [],
            "precautions_en": ["Follow the dosing schedule carefully."],
            "simplified_en": {"patient_greeting": "Hello!", "simple_summary": "Fallback mode", "medicines": [], "helpful_tips": []},
            "tamil_guide": {"patient_greeting": "வணக்கம்!", "simple_summary": "பாதுகாப்பான உள்ளூர் மாற்று முறை", "medicines": [], "helpful_tips": [], "safety_advisory": "உறுதிப்படுத்தவும்."},
            "translated_guide": {"patient_greeting": "வணக்கம்!", "simple_summary": "பாதுகாப்பான உள்ளூர் மாற்று முறை", "medicines": [], "helpful_tips": [], "safety_advisory": "உறுதிப்படுத்தவும்."},
            "reminders": [],
            "rag_context": "Fallback mode",
            "rag_sources": [],
            "low_confidence": True,
            "ocr_fallback": True,
            "drug_suggestions": []
        }
    raw_ocr = payload.get("text", "")
    target_lang = payload.get("target_lang", "Tamil")
    print(f"[API LOG] /api/process-text received OCR text:\n{raw_ocr}")
    if not raw_ocr:
        raise HTTPException(status_code=400, detail="Missing text parameter.")
    try:
        master_payload = coordinator.process_prescription_text(raw_ocr, target_lang=target_lang)
        if "error" in master_payload:
            raise HTTPException(status_code=500, detail=master_payload["details"])
        # Auto-schedule Reminders in SQLite database
        for reminder_data in master_payload.get("reminders", []):
            db_reminder = Reminder(
                patient_name=master_payload.get("patient_name", "Patient"),
                medicine_name=reminder_data["medicine_name"],
                dosage=reminder_data["dosage"],
                time_of_day=reminder_data["time_of_day"],
                frequency=reminder_data["frequency"],
                relation_to_food=reminder_data["relation_to_food"],
                duration=reminder_data["duration"]
            )
            db.add(db_reminder)
        db.commit()
        return master_payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reminders", response_model=List[Dict[str, Any]])
def get_reminders(db: Session = Depends(get_db)):
    """Retrieves all registered medicine reminders sorted by scheduling hour."""
    reminders = db.query(Reminder).order_by(Reminder.time_of_day).all()
    return [r.to_dict() for r in reminders]

@app.post("/api/reminders", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_reminder(reminder_data: Dict[str, Any], db: Session = Depends(get_db)):
    """Allows manual creation of new medication reminders (e.g. customized by user)."""
    if "medicine_name" not in reminder_data or "time_of_day" not in reminder_data:
        raise HTTPException(status_code=400, detail="Missing required parameters: 'medicine_name' and 'time_of_day'.")
        
    db_reminder = Reminder(
        patient_name=reminder_data.get("patient_name", "Patient"),
        medicine_name=reminder_data["medicine_name"],
        dosage=reminder_data.get("dosage"),
        time_of_day=reminder_data["time_of_day"],
        frequency=reminder_data.get("frequency", "Daily"),
        relation_to_food=reminder_data.get("relation_to_food", "After Food"),
        duration=reminder_data.get("duration", "5 Days")
    )
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder.to_dict()

@app.delete("/api/reminders/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    """Removes a medication schedule reminder by its ID."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail=f"Reminder with ID {reminder_id} not found.")
    
    db.delete(reminder)
    db.commit()
    return

@app.get("/api/audio")
def stream_audio(
    text: str = Query(..., description="Text content to synthesize"),
    lang: str = Query("en", description="Language tag: 'en', 'ta', 'hi', 'te', 'kn', 'ml', 'bn', 'mr'")
):
    """
    Dynamically generates and streams an audio speech MP3 file of the translated prescription.
    """
    allowed_langs = ["en", "ta", "hi", "te", "kn", "ml", "bn", "mr"]
    if lang not in allowed_langs:
        raise HTTPException(status_code=400, detail=f"Unsupported language parameter. Supported: {allowed_langs}")

    try:
        audio_path = tts_engine.generate_speech(text=text, lang=lang)
        return FileResponse(
            path=str(audio_path),
            media_type="audio/mpeg",
            filename=audio_path.name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis service failed: {str(e)}")
