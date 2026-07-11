import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent))

from app.utils.drug_validator import validate_drug_name

print("=== Running Drug Validator Tests ===")
test_cases = [
    "Paracetmol",       # Typo
    "Amoxcilin",        # Typo
    "Metformin",        # Exact match
    "dolo",             # Lowercase exact match
    "UnknownDrugXYZ",   # No match
]

for tc in test_cases:
    res = validate_drug_name(tc)
    print(f"OCR Input: '{tc}' -> Match Result: {res}")
