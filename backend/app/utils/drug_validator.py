import difflib
from pathlib import Path
from app.config import settings

# Path to the compiled drug list
DRUGS_FILE = settings.SOURCES_DIR / "extracted_drugs.txt"
KNOWN_DRUGS = set()

# Load compiled drug list on import
if DRUGS_FILE.exists():
    try:
        with open(DRUGS_FILE, "r", encoding="utf-8") as f:
            KNOWN_DRUGS = {line.strip().lower() for line in f if line.strip()}
    except Exception:
        pass

# Final safety fallback list
if not KNOWN_DRUGS:
    KNOWN_DRUGS = {
        "paracetamol", "amoxicillin", "metformin", "ibuprofen", "cetirizine",
        "levocetirizine", "dolo", "crocin", "calpol", "diclofenac", "aspirin",
        "pantoprazole", "omeprazole", "ranitidine", "cetrizine", "amox", "mox"
    }

def validate_drug_name(ocr_name: str) -> dict:
    """
    Validates a medicine name against the WHO EML and NLEM reference drug names.
    
    Returns a dictionary:
      - "match": True/False (True if exact match found)
      - "suggestion": Capitalized closest match string or None
      - "score": Float (0.0 to 1.0 similarity score)
    """
    if not ocr_name or not isinstance(ocr_name, str):
        return {"match": False, "suggestion": None, "score": 0.0}
        
    name_clean = ocr_name.strip().lower()
    
    # 1. Exact Match Check
    if name_clean in KNOWN_DRUGS:
        return {"match": True, "suggestion": None, "score": 1.0}
        
    # 2. Fuzzy Match Check (edit-distance/similarity ratio cutoff at 0.70)
    matches = difflib.get_close_matches(name_clean, KNOWN_DRUGS, n=1, cutoff=0.70)
    if matches:
        suggested = matches[0]
        # Compute exact similarity score ratio
        score = difflib.SequenceMatcher(None, name_clean, suggested).ratio()
        return {
            "match": False,
            "suggestion": suggested.capitalize(),
            "score": round(score, 2)
        }
        
    return {"match": False, "suggestion": None, "score": 0.0}
