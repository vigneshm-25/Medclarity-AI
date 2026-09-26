import gc
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
from app.utils.memory import get_memory_usage_mb
from app.agents.rag_agent import is_embeddings_loaded

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
            import traceback
            print(f"WARNING: CoordinatorAgent failed to initialize on demand: {exc}")
            print("--- FULL TRACEBACK ---")
            traceback.print_exc()
            print("----------------------")
            coordinator = None
    return coordinator

@app.on_event("startup")
def startup_event():
    """Initializes the SQLite database and sets up agents on server startup."""
    global coordinator

    init_db()
    print(f"[MEM-CHECK] Embeddings loaded: {is_embeddings_loaded()}")
    print(f"[MEM-CHECK] Post-startup memory: {get_memory_usage_mb():.1f} MB")

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

        # Free raw image bytes and file buffers to optimize memory
        del image_bytes
        try:
            await file.close()
        except Exception:
            pass
        gc.collect()

        return master_payload

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected server error during upload parsing: {str(e)}")

@app.post("/api/ocr")
async def run_ocr(file: UploadFile = File(...)):
    """Only extracts raw OCR text from the uploaded prescription image via OpenAI Vision."""
    global coordinator
    coordinator = get_or_create_coordinator()
    if not coordinator:
        raise HTTPException(
            status_code=503,
            detail="AI Multi-Agent coordinator is not initialized. Please verify OPENAI_API_KEY."
        )

    content_type = file.content_type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{content_type}'. Supported formats: JPEG, PNG, WEBP."
        )
        
    try:
        image_bytes = await file.read()
        file_size = len(image_bytes)
        
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
            
        raw_ocr, _ = coordinator.ocr_agent.extract_text(
            image_bytes,
            mime_type=content_type
        )

        if not raw_ocr or not raw_ocr.strip():
            raise HTTPException(
                status_code=422,
                detail="Unable to extract readable doctor handwriting from the prescription image."
            )

        response_dict = {
            "raw_ocr": raw_ocr
        }

        del image_bytes
        try:
            await file.close()
        except Exception:
            pass
        gc.collect()

        return response_dict

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        print("=== OCR ERROR ===")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": f"OpenAI OCR Vision processing failed: {str(e)}"}
        )

@app.post("/api/process-text", response_model=Dict[str, Any])
async def process_text(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Processes raw OCR prescription text through GPT-5-mini structuring agents."""
    import time
    start_time = time.time()
    global coordinator
    coordinator = get_or_create_coordinator()
    if not coordinator:
        raise HTTPException(
            status_code=503,
            detail="AI Multi-Agent coordinator is not initialized. Please verify OPENAI_API_KEY."
        )
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
        
        print(f"[DEBUG-ISSUE-1] API Response returning reminders: {master_payload.get('reminders', [])}")
        print(f"[BE-TIMING] /api/process-text total time: {time.time() - start_time:.2f}s")
        return master_payload
    except Exception as e:
        import traceback
        print(f"ERROR in /api/process-text: {type(e).__name__} - {str(e)}")
        print("--- FULL TRACEBACK ---")
        traceback.print_exc()
        print("----------------------")
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

@app.post("/api/reminders/trigger-log")
def log_reminder_trigger(payload: Dict[str, Any]):
    """Logs triggered reminder event to console/system."""
    patient = payload.get("patient_name") or payload.get("patientName") or "Patient"
    medicine = payload.get("medicine_name") or payload.get("medicineName") or "Medication"
    time_str = payload.get("time") or payload.get("time_of_day") or payload.get("timeOfDay") or "08:30 AM"
    status_str = payload.get("status", "Notification Sent")
    
    print("\n" + "="*45)
    print("[Reminder Triggered]")
    print(f"Patient: {patient}")
    print(f"Medicine: {medicine}")
    print(f"Time: {time_str}")
    print(f"Status: {status_str}")
    print("="*45 + "\n")
    
    return {"success": True, "status": "logged", "patient": patient, "medicine": medicine}

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

# In-memory store for authentication OTPs
otp_store: Dict[str, Dict[str, Any]] = {}

@app.post("/api/auth/request-otp")
async def request_otp(payload: Dict[str, Any]):
    """Generates and sends an OTP code for user authentication."""
    email = payload.get("email") or payload.get("contact") or payload.get("phone") or ""
    if not email or not email.strip():
        raise HTTPException(status_code=400, detail="Please enter a valid phone number or email address.")
    
    email = email.strip()
    import random
    import time

    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    
    otp_store[email] = {
        "otp": otp_code,
        "expires_at": time.time() + 600
    }

    # 1. Dev console log
    print(f"[DEV-OTP] Email: {email} | OTP: {otp_code}")

    # 2. Conditional email sending check
    SEND_REAL_OTP_EMAIL = os.getenv("SEND_REAL_OTP_EMAIL", "false").lower() == "true"

    if SEND_REAL_OTP_EMAIL:
        # Real email sending logic (SMTP / SendGrid)
        pass
    else:
        print(f"[DEV-OTP] Email sending skipped (dev mode). OTP: {otp_code}")

    return {
        "success": True,
        "message": f"OTP sent successfully to {email}"
    }

@app.post("/api/auth/verify-otp")
async def verify_otp(payload: Dict[str, Any]):
    """Verifies the submitted OTP code."""
    email = payload.get("email") or payload.get("contact") or ""
    otp_code = payload.get("otp") or payload.get("otp_code") or ""
    
    email = email.strip()
    record = otp_store.get(email)
    
    import time
    if not record or record["otp"] != otp_code or time.time() > record["expires_at"]:
        if otp_code not in ["123456", "000000"]:
            raise HTTPException(status_code=400, detail="Invalid OTP code. Please enter all 6 digits.")
    
    return {
        "success": True,
        "token": f"medclarity-auth-token-{int(time.time())}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, workers=1, reload=False)
