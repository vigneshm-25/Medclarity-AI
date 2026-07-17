import json
import os
import time
from typing import List, Optional
from pydantic import BaseModel, Field
from app.config import settings
from app.llm.openai_client import get_openai_client
import openai

class SafetyReport(BaseModel):
    status: str = Field(description="Safety status of the user: 'SAFE', 'WARNING', or 'CRITICAL'")
    emergency_alert: bool = Field(description="True if patient displays red-flag clinical signs requiring immediate emergency room care")
    patient_advisory: str = Field(description="Clear, compassionate, and firm advice for the patient. Emphasize immediate doctor visit if critical.")
    red_flags_found: List[str] = Field(description="Specific emergency clinical signs identified (e.g., severe chest pain, extreme breathlessness)")
    precaution_details: List[str] = Field(description="Specific drug side effects, cautions, or allergy warnings")

SYSTEM_PROMPT = """You are a highly conservative Medication Safety Inspector. Your primary role is to protect the patient from clinical harm related specifically to medications.
Analyze the extracted medical details (medicines, clinical notes, and warnings):
1. Focus strictly on medication safety (e.g., severe drug interactions, dangerous allergies, contraindications to specific drugs).
2. Ignore general diagnostic/lab value alerts (e.g., high blood sugar, high blood pressure) unless they explicitly interact dangerously with the prescribed medications.
3. Screen for common drug interactions or critical cautions (e.g., 'Take with food to avoid severe stomach bleed', 'Do not drive while using this').
4. Strict rule: AVOID giving a direct medical diagnosis. Do NOT tell the patient "You have Pneumonia" or "You have a heart attack".
If a medication-related warning/emergency is triggered:
- Set status to 'CRITICAL' or 'WARNING'
- Set emergency_alert to True if life-threatening
- Write a clear, urgent, yet reassuring advisory telling them exactly what action to take (e.g., 'Go to the nearest emergency center immediately').
If clean:
- Set status to 'SAFE' and provide standard safety precautions (e.g., 'Follow dosage strictly, do not share medicine')."""

class SafetyAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.client = None
        if self.api_key:
            try:
                self.client = get_openai_client(self.api_key)
            except Exception as e:
                print(f"OpenAI safety client initialization failed: {e}")
        else:
            print(f"OpenAI safety client initialization failed: No API Key")

    def evaluate_safety(self, clinical_json: str) -> SafetyReport:
        """
        Analyzes clinical extraction and issues safety warning clearance or emergency advisories using Groq.
        """
        schema_json = json.dumps(SafetyReport.model_json_schema())
        system_instructions = (
            f"{SYSTEM_PROMPT}\n\n"
            f"You must return a JSON object that adheres strictly to this JSON schema:\n{schema_json}"
        )
        
        if not self.client:
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
                print("[CP-AGENT-CONFIG-V2] agent=Safety, reasoning_effort=low")
                response = self.client.chat.completions.create(
                    model="gpt-5",
                    reasoning_effort="low",
                    messages=[
                        {"role": "system", "content": system_instructions},
                        {"role": "user", "content": f"Evaluate safety for this clinical extraction:\n\n{clinical_json}"}
                    ],
                    response_format={"type": "json_object"}
                )
                elapsed_time = time.time() - start_time
                content = response.choices[0].message.content
                
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                    
                return SafetyReport.model_validate_json(content)
            except Exception as e:
                elapsed_time = time.time() - start_time
                err_str = str(e).lower()
                err_type = type(e).__name__
                
                http_status = getattr(e, "status_code", "N/A")

                import logging
                logging.warning(
                    f"OpenAI Safety Agent attempt {attempt + 1}/2 failed. "
                    f"Timestamp: {time.time()}, Agent: Safety, SDK: openai, Model: gpt-5, "
                    f"API Key Source: Env, Retry Count: {attempt + 1}, Exception Type: {err_type}, "
                    f"HTTP Status: {http_status}, Response Time: {elapsed_time:.2f}s, Error: {e}"
                )

                is_retryable = isinstance(e, (openai.RateLimitError, openai.APIConnectionError, openai.APITimeoutError, openai.InternalServerError))
                if is_retryable or "429" in err_str or "quota" in err_str.lower():
                    if attempt == 0:
                        print("OpenAI rate limit hit or retryable error. Retrying in 10 seconds...")
                        time.sleep(10)
                    else:
                        raise RuntimeError(f"Safety agent evaluation failed: {err_type}") from e
                else:
                    raise RuntimeError(f"Safety agent evaluation failed: {err_type}") from e
