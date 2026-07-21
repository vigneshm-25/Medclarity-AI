import json
import os
import time
import re
import traceback
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from app.config import settings
from app.llm.openai_client import get_openai_client
import openai

class MedicineItem(BaseModel):
    raw_text: Optional[str] = Field(default=None, description="The exact original prescription text for this medicine.")
    name: str = Field(description="Name of the medicine/drug, preserving the full exact name from the text.")
    dosage: Optional[str] = Field(default=None, description="Dosage strength or form, e.g. 500mg, 1 tablet, 5ml syrup")
    route: Optional[str] = Field(default=None, description="Route of administration, e.g. IV, Oral, Topical")
    frequency: Optional[str] = Field(default=None, description="Frequencies, e.g. BID, TID, Once Daily, 2 times a day")
    timing: Optional[str] = Field(default=None, description="Timing, e.g. Morning, Night, STAT, Immediate")
    relation_to_food: Optional[str] = Field(default=None, description="Instruction regarding meals, e.g. After Food, Before Food, Empty Stomach")
    duration: Optional[str] = Field(default=None, description="Length of treatment course, e.g. 5 Days, 3 Weeks, Ongoing")
    purpose: Optional[str] = Field(default=None, description="Extremely simple medical explanation of what this drug treats")

class ExtractedPrescription(BaseModel):
    patient_name: Optional[str] = Field(default=None, description="Extracted patient name or 'Unknown'")
    symptoms: List[str] = Field(default_factory=list, description="Symptoms or complaints listed in prescription, e.g. High fever, dry cough")
    medicines: List[MedicineItem] = Field(default_factory=list, description="Structured list of all medicines prescribed")
    clinical_notes: Optional[str] = Field(default=None, description="Doctor's notes, general observations, or advice")
    warnings: List[str] = Field(default_factory=list, description="General warnings listed, e.g. Avoid driving, complete full course, drink water")

    @field_validator('symptoms', 'medicines', 'warnings', mode='before')
    @classmethod
    def coerce_none_to_list(cls, v):
        if v is None:
            return []
        return v


SYSTEM_PROMPT = """You are a highly detailed Clinical Data Parser.
Your role is to analyze the provided OCR text and extract structured clinical concepts.

CRITICAL INSTRUCTIONS FOR MEDICINE EXTRACTION:
- Extract ONLY true medicines into the 'medicines' array.
- NEVER extract non-medicines (such as Patient Name, Doctor Name, Age, Sex, Date, Chief Complaint, Symptoms, Diagnosis, Vitals, BP, PR, Temperature, Pulse, Advice, Notes, UHID, IP Number, Signature, Confidence labels) into the 'medicines' array.
- Never include advice as medicine (e.g. 'Adequate fluid intake', 'Drink water', 'ORS advice', 'Rest', 'Follow up', 'Review after 5 days').
IMPORTANT: Lines under an 'Adv:' or 'Advice' heading can contain BOTH real medicines and general advice. Check each line individually:
- A line naming a drug/substance with a dosage, route (iv/oral/im), or frequency (e.g. 'stat', 'daily') IS a medicine, even if it appears under an 'Adv:' heading. Example: '5% Dextrose (iv) stat' is a medicine.
- A line with no drug name — general instructions like 'drink more water', 'take rest', 'follow up in 5 days' — is NOT a medicine, even if it looks similar in format.
- 'ORS' (Oral Rehydration Salts/Solution) followed by a quantity (e.g. '2 sachets') IS a medicine, not general advice, since it is a specific administered substance with a dosage.

EXAMPLE — apply this exact pattern:
Input text:
'Adv:
1) 5% Dextrose (iv) stat.
-> Adequate fluid intake
-> ORS 2 sachets.'

Correct extraction:
medicines: [
  {"name": "5% Dextrose", "route": "IV", "frequency": "stat", "raw_text": "5% Dextrose (iv) stat."},
  {"name": "ORS", "dosage": "2 sachets", "raw_text": "ORS 2 sachets."}
]
warnings: ["Adequate fluid intake"]

Note: 'Adequate fluid intake' has no drug name, so it stays in warnings. The other two lines name a specific substance with a route/dosage, so they go in medicines — even though all three lines appear under the same 'Adv:' heading with similar bullet formatting.
- Never infer medicines.
- Never hallucinate medicines.
- If no medicine exists in the text, return an empty medicines list.
- Preserve the complete medicine name in the 'name' field exactly as it appears in the text without splitting it.
- Also populate the 'raw_text' field with the full original text of that medicine line.
- Extract route, dosage, frequency, timing, and duration into their respective fields.

Fill out the data structure completely. Extract patient_name, symptoms, and clinical_notes from the full text, but prioritize accurate medicine extraction from the medicines section."""

BANNED_MEDICINE_SUBSTRINGS = {
    "age", "sex", "patient", "doctor", "chief", "complaint", "diagnosis", 
    "advice", "adv", "notes", "uhid", "ip number", "bp", "pr", "temperature", "pulse",
    "signature", "date", "impression", "imp",
    "adequate fluid intake", "fluid intake", "drink water", "rest", "follow up", "name"
}

def is_valid_medicine_name(name: str) -> bool:
    """
    Validates a medicine name to reject metadata, vitals, or noise.
    Uses substring matching against a blacklist.
    Also rejects pure numbers, single punctuation, etc.
    """
    if not name:
        return False
    
    clean_name = name.strip().lower()
    
    # Reject empty or very short strings like "-" or "."
    if len(clean_name) < 2 and not clean_name.isalnum():
        return False
        
    # Reject pure numbers
    if re.fullmatch(r'\d+', clean_name):
        return False
        
    # Check against banned substrings
    for banned in BANNED_MEDICINE_SUBSTRINGS:
        if banned in clean_name:
            return False
            
    return True

def extract_medicine_section(ocr_text: str) -> str:
    """
    Detects the Medicines section in the OCR text and extracts only medicine lines,
    stopping when another section begins.
    """
    if not ocr_text:
        return ""
        
    lines = ocr_text.split('\n')
    medicine_lines = []
    in_medicine_section = False
    
    # Regex to detect start of medicines section
    med_start_pattern = re.compile(r'^[\-\*\s]*(medicines?|rx|medication|advice|adv)(:|\s|$)', re.IGNORECASE)
    
    # Regex to detect stop sections
    stop_pattern = re.compile(r'^[\-\*\s]*(other notes|impression|imp\.?|diagnosis|bp|pr|rbs|o/e|pulse|temperature|signature|uhid|doctor name|patient name|chief complaint|c/o).*$', re.IGNORECASE)
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        if med_start_pattern.search(line_clean):
            in_medicine_section = True
            # if there's medicine on the same line we should append it.
            if len(line_clean.split()) > 1 and ":" in line_clean:
                med_part = line_clean.split(":", 1)[1].strip()
                if med_part:
                    medicine_lines.append(med_part)
            continue
            
        # Check for vitals formats like BP-110/70, PR-60 bpm
        if stop_pattern.search(line_clean) or re.match(r'^[\-\*\s]*(bp|pr|rbs)[\s\-\:]*\d+', line_clean, re.IGNORECASE):
            if in_medicine_section:
                break # We reached the end of the medicine section
                
        if in_medicine_section:
            medicine_lines.append(line_clean)
            
    # If no Medicines section exists, intelligently detect medicine-like lines
    if not medicine_lines:
        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue
            
            # Skip obvious metadata and sections
            if stop_pattern.search(line_clean) or re.match(r'^[\-\*\s]*(bp|pr|rbs)[\s\-\:]*\d+', line_clean, re.IGNORECASE):
                continue
            if re.search(r'(age|sex|date|uhid|patient|doctor|complaint)\s*:', line_clean, re.IGNORECASE):
                continue
                
            # If it passed filters, we'll tentatively include it
            medicine_lines.append(line_clean)

    return "\n".join(medicine_lines)

class MedicalAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.client = None
        if self.api_key:
            try:
                self.client = get_openai_client(self.api_key)
            except Exception as e:
                print(f"OpenAI client initialization failed: {e}")
        else:
            print(f"OpenAI client initialization failed: No API Key")
        print(f"[CP-MEDICAL-PROMPT-V2] {SYSTEM_PROMPT}")

    def build_prompt(self, medicine_text: str) -> str:
        schema_json = json.dumps(ExtractedPrescription.model_json_schema())
        system_instructions = (
            f"{SYSTEM_PROMPT}\n\n"
            f"You must return a JSON object that adheres strictly to this JSON schema:\n{schema_json}"
        )
        return system_instructions
        
    def call_llm(self, system_instructions: str, user_content: str) -> str:
        if not self.client:
            raise ValueError("OpenAI client not initialized")
            
        for attempt in range(2):
            start_time = time.time()
            try:
                print("[CP-AGENT-CONFIG-V2] agent=Medical, reasoning_effort=low")
                response = self.client.chat.completions.create(
                    model="gpt-5-mini",
                    reasoning_effort="low",
                    messages=[
                        {"role": "system", "content": system_instructions},
                        {"role": "user", "content": f"Analyze this medical transcript and extract details:\n\n{user_content}"}
                    ],
                    response_format={"type": "json_object"}
                )
                elapsed_time = time.time() - start_time
                content = response.choices[0].message.content
                
                # Try to clean up Markdown if returned
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                    
                print(f"[RAW OPENAI RESPONSE]\n{content}")
                return content
            except Exception as e:
                elapsed_time = time.time() - start_time
                err_str = str(e).lower()
                err_type = type(e).__name__
                
                http_status = getattr(e, "status_code", "N/A")

                import logging
                logging.warning(
                    f"OpenAI Medical Agent attempt {attempt + 1}/2 failed. "
                    f"Timestamp: {time.time()}, Agent: Medical, SDK: openai, Model: gpt-5-mini, "
                    f"API Key Source: Env, Retry Count: {attempt + 1}, Exception Type: {err_type}, "
                    f"HTTP Status: {http_status}, Response Time: {elapsed_time:.2f}s, Error: {e}"
                )

                is_retryable = isinstance(e, (openai.RateLimitError, openai.APIConnectionError, openai.APITimeoutError, openai.InternalServerError))
                if is_retryable or "429" in err_str or "quota" in err_str.lower():
                    if attempt == 0:
                        print("OpenAI rate limit hit or retryable error. Retrying in 10 seconds...")
                        time.sleep(10)
                    else:
                        raise e
                else:
                    raise e
                    
        return "{}"

    def validate_medicines(self, medicines: List[MedicineItem]) -> List[MedicineItem]:
        valid_medicines = []
        for m in medicines:
            if m.name and is_valid_medicine_name(m.name):
                valid_medicines.append(m)
            else:
                print(f"[FILTERED NON-MEDICINES] Invalid medicine name detected: '{m.name}'. Discarding.")
        print(f"[VALID MEDICINES] {len(valid_medicines)} medicines passed validation.")
        return valid_medicines

    def parse_prescription(self, ocr_text: str) -> ExtractedPrescription:
        """
        Parses OCR transcript into a clean Pydantic data structure using Gemini.
        """
        print(f"[OCR INPUT]\n{ocr_text}\n")
        
        if not self.api_key:
            return ExtractedPrescription(
                patient_name=None,
                symptoms=[],
                medicines=[],
                clinical_notes="Clinical parsing is unavailable because the external medical agent is not configured."
            )

        content = ""
        try:
            # Step 1: Preprocess OCR
            medicine_text = extract_medicine_section(ocr_text)
            print(f"[MEDICINE SECTION]\n{medicine_text}\n")
            
            # Step 2: Build Prompt
            system_instructions = self.build_prompt(medicine_text)
            print(f"[COMPLETE PROMPT TO GEMINI]\n{system_instructions}\n")
            
            # Step 3: Call LLM
            user_prompt = (
                f"--- FULL OCR TEXT ---\n{ocr_text}\n\n"
                f"--- MEDICINES SECTION ONLY ---\n{medicine_text}\n\n"
                "Extract patient_name, symptoms, and clinical_notes from the FULL OCR TEXT. "
                "Extract medicines ONLY from the MEDICINES SECTION ONLY."
            )
            content = self.call_llm(system_instructions, user_prompt)
            print(f"[CLEANED JSON]\n{content}\n")
            
            # Step 4 & 5: Parse and Validate
            parsed_json = json.loads(content)
            print(f"[PARSED JSON OBJECT]\n{json.dumps(parsed_json, indent=2)}\n")
            
            result = ExtractedPrescription.model_validate_json(content)
            print(f"[PYDANTIC VALIDATION RESULT] Success\n")
            
            validated_medicines = self.validate_medicines(result.medicines)
            result.medicines = validated_medicines
            
            print(f"[NUMBER OF MEDICINES EXTRACTED] {len(result.medicines)}\n")
            print(f"[FINAL EXTRACTED PRESCRIPTION OBJECT]\n{result.model_dump_json(indent=2)}\n")
            
            return result
            
        except Exception as e:
            print(f"=== OPENAI MEDICAL AGENT ERROR ===")
            print(f"Exception Type: {type(e).__name__}")
            print(f"Exception Message: {str(e)}")
            print(f"Raw OpenAI Response content (if any):\n{content}")
            print(f"Traceback:")
            traceback.print_exc()
            print("=" * 80)
            
            # Per Step 9: Return empty medicines instead of failing the request
            return ExtractedPrescription(
                patient_name=None,
                symptoms=[],
                medicines=[],
                clinical_notes="Unable to analyze prescription."
            )
