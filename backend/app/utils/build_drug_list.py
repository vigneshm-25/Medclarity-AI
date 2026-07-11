import re
import sys
from pathlib import Path
from pypdf import PdfReader

# Base Directory path
BASE_DIR = Path("c:/Users/8vign/Desktop/gen intel/gramcare-ai")
sys.path.append(str(BASE_DIR / "backend"))

from app.config import settings

# A curated set of common generic essential drug names in India and WHO
CURATED_DRUGS = {
    "paracetamol", "acetaminophen", "dolo", "crocin", "calpol",
    "amoxicillin", "ampicillin", "azithromycin", "cefixime", "ceftriaxone",
    "ciprofloxacin", "clarithromycin", "doxycycline", "erythromycin",
    "gentamicin", "metronidazole", "nitrofurantoin", "ofloxacin", "penicillin",
    "ibuprofen", "diclofenac", "aceclofenac", "aspirin", "mefenamic", "tramadol",
    "omeprazole", "pantoprazole", "rabeprazole", "ranitidine", "famotidine",
    "domperidone", "ondansetron", "metoclopramide", "loperamide",
    "amlodipine", "atenolol", "metoprolol", "propranolol", "losartan",
    "telmisartan", "enalapril", "ramipril", "atorvastatin", "rosuvastatin",
    "clopidogrel", "digoxin", "furosemide", "spironolactone",
    "metformin", "glibenclamide", "glimepiride", "gliclazide", "pioglitazone",
    "salbutamol", "albuterol", "levosalbutamol", "budesonide", "fluticasone",
    "montelukast", "ipratropium", "cetirizine", "levocetirizine", "loratadine",
    "fexofenadine", "chlorpheniramine", "pheniramine", "dexamethasone",
    "prednisolone", "methylprednisolone", "hydrocortisone", "betamethasone",
    "thyroxine", "levothyroxine", "folic", "iron", "calcium", "zinc",
    "albendazole", "fluconazole", "ketoconazole", "pantodac", "pantocid"
}

# English stop words and common medical abbreviations to filter out
STOP_WORDS = {
    "the", "and", "for", "with", "tablets", "tablet", "capsules", "capsule",
    "injection", "oral", "liquid", "solution", "suspension", "powder", "syrup",
    "mg/ml", "mcg/ml", "micrograms", "milligrams", "adult", "children", "child",
    "infant", "safety", "guidelines", "world", "health", "organization", "essential",
    "medicines", "list", "nlem", "national", "india", "ministry", "family", "welfare",
    "government", "page", "section", "annex", "table", "therapeutic", "category",
    "dose", "doses", "dosing", "administration", "daily", "every", "hours", "disease",
    "treatment", "clinical", "use", "uses", "used", "contraindications", "side",
    "effects", "interactions", "warnings", "precautions", "patient", "care", "medical",
    "doctor", "hospital", "date", "name", "sign", "symptoms", "diagnosis", "report"
}

# Drug name suffix pattern to find chemical/medical candidates in PDF text
DRUG_SUFFIXES = [
    "in", "ol", "am", "ne", "id", "de", "me", "ex", "ac", "ne", "il", "one", "ide", 
    "ate", "ine", "ole", "cin", "xim", "ril", "lol", "mab", "nib", "vir", "statin", "pine"
]

def extract_from_pdf(pdf_path: Path) -> set:
    if not pdf_path.exists():
        print(f"Warning: PDF file not found at {pdf_path}")
        return set()
    
    print(f"Reading PDF: {pdf_path.name}")
    reader = PdfReader(pdf_path)
    words = set()
    
    for page in reader.pages:
        text = page.extract_text()
        if not text:
            continue
        # Find all words (alphabetic only, length 4 to 15)
        matches = re.findall(r'\b[a-zA-Z]{4,15}\b', text)
        for w in matches:
            w_lower = w.lower()
            # Filter out stopwords
            if w_lower in STOP_WORDS:
                continue
            # Basic validation: check if the word ends with a common drug suffix
            if any(w_lower.endswith(suf) for suf in DRUG_SUFFIXES):
                words.add(w_lower)
                
    print(f"Extracted {len(words)} candidate drug terms from {pdf_path.name}")
    return words

def main():
    settings.create_directories()
    all_drugs = set(CURATED_DRUGS)
    
    # Extract from NLEM 2022 and WHO EML 2023
    nlem_path = settings.SOURCES_DIR / "nlem_2022.pdf"
    who_path = settings.SOURCES_DIR / "who_eml_2023.pdf"
    
    try:
        all_drugs.update(extract_from_pdf(nlem_path))
    except Exception as e:
        print(f"Error reading NLEM PDF: {e}")
        
    try:
        all_drugs.update(extract_from_pdf(who_path))
    except Exception as e:
        print(f"Error reading WHO EML PDF: {e}")
        
    # Write to text file
    output_path = settings.SOURCES_DIR / "extracted_drugs.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        for drug in sorted(all_drugs):
            f.write(f"{drug}\n")
            
    print(f"SUCCESS: Compiled list of {len(all_drugs)} unique drug names in {output_path}")

if __name__ == "__main__":
    main()
