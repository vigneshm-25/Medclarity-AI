import json
import os
import time
from typing import List, Optional
from pydantic import BaseModel, Field
import google.generativeai as genai
from app.config import settings

class SimplifiedMedicineItem(BaseModel):
    name: str = Field(description="Medical/Brand name of the medicine")
    simple_dosage: str = Field(description="Easy-to-understand dosage strength/amount, e.g. Take 1 tablet, or Take 1 spoon of syrup")
    simple_timing: str = Field(description="Simplified timing and relation to meals in plain English, e.g. Two times every day - once in the morning after eating breakfast, and once at night after dinner")
    simple_purpose: str = Field(description="Very basic, friendly explanation of why they are taking this, e.g. This is an antibiotic to kill throat germs")
    simple_duration: str = Field(description="Duration in plain terms, e.g. Take it for exactly 5 days. Complete the whole packet even if you feel better.")

class SimplifiedPrescription(BaseModel):
    patient_greeting: str = Field(description="A warm, reassuring greeting addressing the patient by name (if known) or general friendly greeting")
    simple_summary: str = Field(description="A simple, friendly 2-3 sentence overview of their overall care plan")
    medicines: List[SimplifiedMedicineItem] = Field(description="List of simplified medicine guides")
    helpful_tips: List[str] = Field(description="Friendly recovery advice, e.g. get plenty of sleep, avoid cold water, stay hydrated")

SYSTEM_PROMPT = """You are a Medical Simplification Expert.
Your job is to convert complex, technical clinical instructions and latin medical abbreviations (such as BID, TID, QD, PC, AC) into simple, extremely friendly, easy-to-understand instructions for a rural citizen with limited literacy.
Guidelines:
- Explain what each medicine does using basic household analogies where possible (e.g., 'anti-inflammatory' -> 'stops swelling and pain', 'antibiotic' -> 'germ killer').
- Clearly translate timing codes:
  * BID / b.i.d -> 2 times daily (once in the morning, once at night)
  * TID / t.i.d -> 3 times daily (morning, afternoon, night)
  * QD / q.d -> Once every day
  * AC / a.c -> Before food (empty stomach)
  * PC / p.c -> After food
- Address the patient with utmost respect, warmth, empathy, and encouragement.
- DO NOT invent new medicines. Rely strictly on the structured medical details provided."""

class SimplificationAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
        else:
            print(f"Gemini simplification client initialization failed: No API Key")

    def simplify(self, extracted_details: str, safety_details: str) -> SimplifiedPrescription:
        """
        Converts clinical structures into a warm, layman-simplified prescription guide using Groq.
        """
        schema_json = json.dumps(SimplifiedPrescription.model_json_schema())
        system_instructions = (
            f"{SYSTEM_PROMPT}\n\n"
            f"You must return a JSON object that adheres strictly to this JSON schema:\n{schema_json}"
        )
        
        if not self.api_key:
            return SimplifiedPrescription(
                patient_greeting="Hello!",
                simple_summary="The prescription is being shared in a simple local format because the live simplifier is unavailable.",
                medicines=[SimplifiedMedicineItem(name="Medication", simple_dosage="As prescribed", simple_timing="Take as directed", simple_purpose="Medication", simple_duration="As directed")],
                helpful_tips=["Take medicines on time.", "Drink water and rest."]
            )

        for attempt in range(2):
            start_time = time.time()
            try:
                model = genai.GenerativeModel(
                    "gemini-3.1-flash-lite",
                    system_instruction=system_instructions,
                    generation_config={"response_mime_type": "application/json", "temperature": 0.3}
                )
                response = model.generate_content(f"Simplify this extracted prescription details and safety alerts:\n\n{extracted_details}\n\nSafety Report:\n{safety_details}")
                elapsed_time = time.time() - start_time
                content = response.text
                
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                    
                return SimplifiedPrescription.model_validate_json(content)
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
                    f"Gemini Simplification Agent attempt {attempt + 1}/2 failed. "
                    f"Timestamp: {time.time()}, Agent: Simple, SDK: google.generativeai, Model: gemini-3.1-flash-lite, "
                    f"API Key Source: Env, Retry Count: {attempt + 1}, Exception Type: {err_type}, "
                    f"HTTP Status: {http_status}, Response Time: {elapsed_time:.2f}s, Error: {e}"
                )

                if "429" in err_str or "quota" in err_str:
                    if attempt == 0:
                        print("Gemini rate limit hit. Retrying in 10 seconds...")
                        time.sleep(10)
                    else:
                        raise RuntimeError(f"Simplification agent processing failed: {err_type}") from e
                else:
                    raise RuntimeError(f"Simplification agent processing failed: {err_type}") from e
