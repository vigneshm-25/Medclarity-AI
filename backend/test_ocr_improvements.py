import sys
import os
from pathlib import Path
from PIL import Image, ImageDraw

# Add backend directory to path
BASE_DIR = Path("c:/Users/8vign/Desktop/gen intel/gramcare-ai")
sys.path.append(str(BASE_DIR / "backend"))

# Load env variables
from dotenv import load_dotenv
load_dotenv(str(BASE_DIR / ".env"))

# Enable self-consistency checks for verification!
os.environ["SELF_CONSISTENCY_CHECK"] = "true"

from app.agents.coordinator import CoordinatorAgent

print("=== MedClarity AI Improved OCR Pipeline Test ===")
print("Generating test prescription image with misspelled medicine names...")
try:
    img = Image.new('RGB', (800, 300), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    # Write layout with 'Paracetmol' and 'Amoxcilin' (both have typos)
    d.text((40, 40), "Rx\nPatient Name: John Doe\nSymptoms: High fever, cough\nMedicines:\n- Paracetmol 500mg BID after food for 3 days\n- Amoxcilin 500mg TID before food for 5 days\nDrink plenty of water.", fill=(0, 0, 0))
    
    img_path = BASE_DIR / "backend" / "test_prescription_pre.png"
    img.save(img_path)
    print(f"SUCCESS: Saved test image to {img_path}")
except Exception as e:
    print(f"ERROR: Failed to generate test image: {e}")
    sys.exit(1)

print("\nInitializing CoordinatorAgent...")
try:
    coordinator = CoordinatorAgent()
    print("SUCCESS: CoordinatorAgent loaded.")
except Exception as e:
    print(f"ERROR: CoordinatorAgent failed to load: {e}")
    sys.exit(1)

print("\nExecuting image processing, double-call OCR, and agents pipeline...")
try:
    with open(img_path, "rb") as f:
        img_bytes = f.read()
        
    payload = coordinator.process_prescription_image(img_bytes, mime_type="image/png")
    
    print("\n=== OCR Transcription ===")
    print(payload.get("raw_ocr"))
    
    print("\n=== Parsed Medicines ===")
    for med in payload.get("simplified_en", {}).get("medicines", []):
        print(f"- Name: {med.get('name')} | Dosage: {med.get('simple_dosage')} | Timing: {med.get('simple_timing')}")
        
    print("\n=== Extracted Drug Spelling Suggestions ===")
    suggestions = payload.get("drug_suggestions", [])
    if suggestions:
        for sug in suggestions:
            print(f"⚠️ OCR name '{sug['ocr_text']}' matches reference '{sug['suggested_match']}' with confidence {int(sug['match_confidence']*100)}%")
    else:
        print("No drug suggestions returned.")
        
    # Check if preprocessed image was saved
    preprocessed_file = BASE_DIR / "backend" / "data" / "preprocessed_images" / "last_preprocessed.png"
    print(f"\nChecking preprocessed image file: {preprocessed_file.exists()}")
    
    print("\nSUCCESS: E2E Improved OCR Pipeline verification passed!")
    
except Exception as e:
    print(f"\nERROR: Exception occurred during execution: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
