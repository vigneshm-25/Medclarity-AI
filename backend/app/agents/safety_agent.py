import json
import os
import time
from typing import List, Optional
from pydantic import BaseModel, Field
import google.generativeai as genai
from app.config import settings

class SafetyReport(BaseModel):
    status: str = Field(description="Safety status of the user: 'SAFE', 'WARNING', or 'CRITICAL'")
    emergency_alert: bool = Field(description="True if patient displays red-flag clinical signs requiring immediate emergency room care")
    patient_advisory: str = Field(description="Clear, compassionate, and firm advice for the patient. Emphasize immediate doctor visit if critical.")
    red_flags_found: List[str] = Field(description="Specific emergency clinical signs identified (e.g., severe chest pain, extreme breathlessness)")
    precaution_details: List[str] = Field(description="Specific drug side effects, cautions, or allergy warnings")

SYSTEM_PROMPT = """You are a highly conservative Clinical Safety Inspector. Your primary role is to protect the patient from clinical harm.
Analyze the extracted medical details (symptoms, medicines, clinical notes, and warnings):
1. Scan for life-threatening Red Flag warning signs (e.g., severe chest pain, shortness of breath, sudden paralysis, slurred speech, high infant fever above 103F, vomiting blood).
2. Screen for common drug interactions or critical cautions (e.g., 'Take with food to avoid severe stomach bleed', 'Do not drive while using this').
3. Strict rule: AVOID giving a direct medical diagnosis. Do NOT tell the patient "You have Pneumonia" or "You have a heart attack". Instead, flag the symptoms.
If a warning/emergency is triggered:
- Set status to 'CRITICAL' or 'WARNING'
- Set emergency_alert to True if life-threatening
- Write a clear, urgent, yet reassuring advisory telling them exactly what action to take (e.g., 'Go to the nearest emergency center immediately').
If clean:
- Set status to 'SAFE' and provide standard safety precautions (e.g., 'Follow dosage strictly, do not share medicine')."""

class SafetyAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
        else:
            print(f"Gemini safety client initialization failed: No API Key")

    def evaluate_safety(self, clinical_json: str) -> SafetyReport:
        """
        Analyzes clinical extraction and issues safety warning clearance or emergency advisories using Groq.
        """
        schema_json = json.dumps(SafetyReport.model_json_schema())
        system_instructions = (
            f"{SYSTEM_PROMPT}\n\n"
            f"You must return a JSON object that adheres strictly to this JSON schema:\n{schema_json}"
        )
        
        if not self.api_key:
            return SafetyReport(
                status="WARNING",
                emergency_alert=False,
                patient_advisory="Please confirm the prescription with a doctor or pharmacist and follow the label carefully.",
                red_flags_found=[],
                precaution_details=["Follow the dose exactly as instructed.", "Do not share medicines with others."]
            )

        for attempt in range(2):
            start_time = time.time()
            try:
                model = genai.GenerativeModel(
                    "gemini-3.1-flash-lite",
                    system_instruction=system_instructions,
                    generation_config={"response_mime_type": "application/json", "temperature": 0.1}
                )
                response = model.generate_content(f"Evaluate safety for this clinical extraction:\n\n{clinical_json}")
                elapsed_time = time.time() - start_time
                content = response.text
                
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                    
                return SafetyReport.model_validate_json(content)
            except Exception as e:
                elapsed_time = time.time() - start_time
                err_str = str(e).lower()
                err_type = type(e).__name__
                
                http_status = "N/A"
                if "429" in err_str: http_status = "429"
                elif "503" in err_str: http_status = "503"
                elif "403" in err_str: http_status = "403"
                elif "400" in err_str: http_status = "400"

                import logging
                logging.warning(
                    f"Gemini Safety Agent attempt {attempt + 1}/2 failed. "
                    f"Timestamp: {time.time()}, Agent: Safety, SDK: google.generativeai, Model: gemini-3.1-flash-lite, "
                    f"API Key Source: Env, Retry Count: {attempt + 1}, Exception Type: {err_type}, "
                    f"HTTP Status: {http_status}, Response Time: {elapsed_time:.2f}s, Error: {e}"
                )

                if "429" in err_str or "quota" in err_str:
                    if attempt == 0:
                        print("Gemini rate limit hit. Retrying in 10 seconds...")
                        time.sleep(10)
                    else:
                        raise RuntimeError(f"Safety agent evaluation failed: {err_type}") from e
                else:
                    raise RuntimeError(f"Safety agent evaluation failed: {err_type}") from e
