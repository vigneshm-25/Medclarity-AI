import json
import os
import time
from typing import List, Optional
from pydantic import BaseModel, Field
import google.generativeai as genai
from app.config import settings

class TamilMedicineItem(BaseModel):
    name: str = Field(description="Medicine name in Tamil script alongside English brand name, e.g., பாராசிட்டமால் (Paracetamol)")
    simple_dosage: str = Field(description="Dosage strength/amount in Tamil, e.g., 1 மாத்திரை (1 Tablet) or 1 ஸ்பூன் சிரப் (1 spoon syrup)")
    simple_timing: str = Field(description="Timing instructions in Tamil, e.g., ஒரு நாளைக்கு 2 முறை - காலை உணவுக்கு பின் மற்றும் இரவு உணவுக்கு பின்")
    simple_purpose: str = Field(description="Friendly explanation of purpose in Tamil, e.g., காய்ச்சல் மற்றும் வலி நிவாரணி (fever and pain reliever)")
    simple_duration: str = Field(description="Course duration in Tamil, e.g., 5 நாட்களுக்கு (for 5 days)")

class TamilPrescription(BaseModel):
    patient_greeting: str = Field(description="A warm, respectful greeting in Tamil, e.g. அன்பான வணக்கம்...")
    simple_summary: str = Field(description="A friendly summary of care plan in Tamil")
    medicines: List[TamilMedicineItem] = Field(description="Tamil medicine guide")
    helpful_tips: List[str] = Field(description="Health recovery tips in Tamil")
    safety_advisory: Optional[str] = Field(description="Safety warnings and advisories in Tamil, e.g. அவசரநிலை ஏற்பட்டால் மருத்துவரை உடனே அணுக்கவும் (consult doctor immediately in case of emergency)")

SYSTEM_PROMPT = """You are an expert Medical Translator specializing in translating healthcare instructions from English into simple, clean, colloquial, and highly understandable {target_lang}.
Your target audience is rural and semi-urban citizens who speak {target_lang}.
Guidelines:
- Keep the brand names of drugs in BOTH {target_lang} script and English parenthetically so they can match the drug packaging easily, e.g., 'பாரசிட்டமால் (Paracetamol)' or 'पैरासिटामोल (Paracetamol)'.
- Use standard, simple, clear {target_lang} script. Avoid highly academic or formal vocabulary; use warm, conversational words that an average citizen understands.
- Translate timings and dosages accurately. For example, translate 'Tablet' to the target language word for pill/tablet, 'Syrup' to the local word, and 'Spoon' to the local word.
- Translate all greetings, summaries, tips, and safety alerts into warm, respectful {target_lang}."""

class TranslationAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
        else:
            print(f"Gemini translation client initialization failed: No API Key")

    def translate_to_tamil(self, english_guide_json: str, safety_advisory_text: str) -> TamilPrescription:
        """
        Backward compatibility: translates to Tamil by default.
        """
        return self.translate_to_language(english_guide_json, safety_advisory_text, target_lang="Tamil")

    def translate_to_language(self, english_guide_json: str, safety_advisory_text: str, target_lang: str = "Tamil") -> TamilPrescription:
        """
        Translates the structured English guide and safety advisor into a structured regional language guide using Groq.
        """
        schema_json = json.dumps(TamilPrescription.model_json_schema())
        system_instructions = (
            SYSTEM_PROMPT.format(target_lang=target_lang) + "\n\n"
            f"You must return a JSON object that adheres strictly to this JSON schema:\n{schema_json}"
        )
        
        user_prompt = f"Translate this simplified English prescription and safety alert into {target_lang}:\n\nEnglish Guide:\n{english_guide_json}\n\nSafety Advisory:\n{safety_advisory_text}"
        
        if not self.api_key:
            return TamilPrescription(
                patient_greeting=f"Hello {target_lang}!",
                simple_summary="The prescription summary is being shown in a simple local format because the live translator is unavailable.",
                medicines=[TamilMedicineItem(name="மருந்து", simple_dosage="அறிவுறுத்தப்பட்டபடி", simple_timing="அறிவுறுத்தியபடி", simple_purpose="மருந்து", simple_duration="அறிவுறுத்தியபடி")],
                helpful_tips=["மருந்துகளை சரியான நேரத்தில் எடுத்துக்கொள்ளவும்.", "நன்கு ஓய்வெடுக்கவும்."],
                safety_advisory="உங்கள் மருத்துவர் அல்லது மருந்தாளர் மூலம் உறுதிப்படுத்தவும்."
            )

        for attempt in range(2):
            start_time = time.time()
            try:
                model = genai.GenerativeModel(
                    "gemini-3.1-flash-lite",
                    system_instruction=system_instructions,
                    generation_config={"response_mime_type": "application/json", "temperature": 0.2}
                )
                response = model.generate_content(user_prompt)
                elapsed_time = time.time() - start_time
                content = response.text
                
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                    
                return TamilPrescription.model_validate_json(content)
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
                    f"Gemini Translation Agent attempt {attempt + 1}/2 failed. "
                    f"Timestamp: {time.time()}, Agent: Translation, SDK: google.generativeai, Model: gemini-3.1-flash-lite, "
                    f"API Key Source: Env, Retry Count: {attempt + 1}, Exception Type: {err_type}, "
                    f"HTTP Status: {http_status}, Response Time: {elapsed_time:.2f}s, Error: {e}"
                )

                if "429" in err_str or "quota" in err_str:
                    if attempt == 0:
                        print("Gemini rate limit hit. Retrying in 10 seconds...")
                        time.sleep(10)
                    else:
                        raise RuntimeError(f"Translation agent regional conversion failed: {err_type}") from e
                else:
                    raise RuntimeError(f"Translation agent regional conversion failed: {err_type}") from e
