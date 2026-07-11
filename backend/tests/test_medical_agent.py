import pytest
from app.agents.medical_agent import (
    extract_medicine_section,
    is_valid_medicine_name,
    MedicalAgent,
    MedicineItem,
    ExtractedPrescription
)

def test_extract_medicine_section_with_clear_boundaries():
    ocr_text = """Doctor Name: [unclear]
Patient Name: Vivek S
Age: 19 | Sex: M | Date: 22/12/22

Chief Complaint:
giddiness, restlessness

Medicines:
1. 10 5% Dextrose - (IV) - STAT
2. Paracetamol 500mg (Oral) - TID

Other Notes:
UHID/IP No. 10193
Imp: hypoglycemia
BP-110/70
PR-60 bpm

Adv:
Adequate fluid intake
ORS 2 sachets
"""
    extracted = extract_medicine_section(ocr_text)
    assert "10 5% Dextrose" in extracted
    assert "Paracetamol 500mg" in extracted
    assert "Age: 19" not in extracted
    assert "Chief Complaint" not in extracted
    assert "Other Notes" not in extracted
    assert "BP-110/70" not in extracted

def test_extract_medicine_section_without_headers():
    ocr_text = """Patient Name: Unknown
Age: 45

Amoxicillin 500mg TID for 5 days
Ibuprofen 400mg PRN

BP: 120/80
Advice: Rest well
"""
    extracted = extract_medicine_section(ocr_text)
    # Should include medicines but not metadata
    assert "Amoxicillin 500mg TID for 5 days" in extracted
    assert "Ibuprofen 400mg PRN" in extracted
    assert "BP: 120/80" not in extracted
    assert "Age: 45" not in extracted

def test_is_valid_medicine_name():
    assert is_valid_medicine_name("10 5% Dextrose") is True
    assert is_valid_medicine_name("Paracetamol") is True
    
    # Banned words
    assert is_valid_medicine_name("Age: 19") is False
    assert is_valid_medicine_name("Chief Complaint") is False
    assert is_valid_medicine_name("BP-110/70") is False
    assert is_valid_medicine_name("Patient Name") is False
    assert is_valid_medicine_name("Doctor Note") is False
    assert is_valid_medicine_name("Adv: Rest") is False
    
    # Pure numbers and symbols
    assert is_valid_medicine_name("123") is False
    assert is_valid_medicine_name("-") is False
    assert is_valid_medicine_name(".") is False

def test_validate_medicines():
    agent = MedicalAgent(api_key="fake")
    medicines = [
        MedicineItem(raw_text="1", name="10 5% Dextrose", purpose="Energy"),
        MedicineItem(raw_text="2", name="Age: 19", purpose="None"),
        MedicineItem(raw_text="3", name="BP 120", purpose="Vitals"),
        MedicineItem(raw_text="4", name="Paracetamol", purpose="Fever")
    ]
    
    validated = agent.validate_medicines(medicines)
    assert len(validated) == 2
    assert validated[0].name == "10 5% Dextrose"
    assert validated[1].name == "Paracetamol"

@pytest.mark.asyncio
def test_full_medical_agent_extraction_ignores_noise():
    agent = MedicalAgent(api_key="fake")
    
    # We will test validate_medicines against known edge cases that LLMs often get wrong
    medicines = [
        MedicineItem(raw_text="1", name="10 5% Dextrose", purpose="Hydration"),
        MedicineItem(raw_text="2", name="Patient Name: Vivek", purpose="None"),
        MedicineItem(raw_text="3", name="Age: 19", purpose="None"),
        MedicineItem(raw_text="4", name="Advice", purpose="None"),
        MedicineItem(raw_text="5", name="Adequate fluid intake", purpose="None"),
        MedicineItem(raw_text="6", name="ORS 2 sachets", purpose="Hydration"),
        MedicineItem(raw_text="7", name="Rest", purpose="None")
    ]
    
    validated = agent.validate_medicines(medicines)
    
    names = [m.name for m in validated]
    
    assert "10 5% Dextrose" in names
    assert "ORS 2 sachets" in names
    
    assert "Patient Name: Vivek" not in names
    assert "Age: 19" not in names
    assert "Advice" not in names
    assert "Adequate fluid intake" not in names
    assert "Rest" not in names
