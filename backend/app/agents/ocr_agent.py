import base64
import logging
import os
import json
import time
import re
from typing import Optional, Tuple
from app.config import settings
from app.llm.openai_client import get_openai_client
import openai

COMBINED_PROMPT = """You are an expert Medical OCR and Structuring Agent specializing in Indian handwritten prescriptions and medical reports.
Your response must be a valid JSON object matching the requested schema.

INSTRUCTIONS:
Part 1: OCR Vision Transcription
1. Look at the provided medical prescription image and transcribe every visible word, number, and symbol EXACTLY as written.
2. Inspect the image line by line. Carefully read handwritten text, paying special attention to cursive or sloppy handwriting.
3. Mentally zoom into difficult or blurry regions to decipher the letters.
4. Preserve uncertain text exactly as it appears.
5. NEVER hallucinate or invent medicine names in the raw transcription.
6. Output [unclear] ONLY when the text is absolutely unreadable.
7. Preserve line breaks where appropriate. Store this literal transcription in the "raw_transcription" field.

Part 2: Medical Structuring
1. Based on your raw transcription, extract the patient name, age, sex, date, doctor name, and chief complaint if present.
2. Extract all medicines. For medicines:
   - If a medicine name is partially legible but highly probable, return the most likely medicine name instead of [unclear].
   - Assign a confidence score to each medicine: "high", "medium", or "low".
   - DO NOT hallucinate or invent information that has no visual evidence in the image.
   - Low confidence items MUST remain in the output (do not drop them).
3. Understand common handwritten abbreviations:
   - OD (once a day), BD/BID (twice a day), TDS/TID (three times a day), QID (four times a day), SOS (as needed), HS (at night), Stat (immediately).
   - Relation to food: AC (before food), PC (after food).
   - Dosage patterns like 1-0-1 (morning and night), 0-1-0 (afternoon only), 1-1-1 (morning, afternoon, night), 0-0-1 (night only).
4. Preserve the original meaning. Assign a confidence score to all major fields.
5. Place this structured data in the "structured_json" field.

JSON SCHEMA:
Return a JSON object exactly matching this structure:
{
  "raw_transcription": "Your complete literal line-by-line transcription",
  "structured_json": {
    "patient_name": {"value": "String or null if not found", "confidence": "high, medium, or low"},
    "age": {"value": "String or null if not found", "confidence": "high, medium, or low"},
    "sex": {"value": "String or null if not found", "confidence": "high, medium, or low"},
    "date": {"value": "String or null if not found", "confidence": "high, medium, or low"},
    "doctor_name": {"value": "String or null if not found", "confidence": "high, medium, or low"},
    "chief_complaint": {"value": "String or null if not found", "confidence": "high, medium, or low"},
    "diagnosis": {"value": "String or null if not found", "confidence": "high, medium, or low"},
    "medicines": [
      {
        "name": "Extracted or inferred name of medicine",
        "dosage": "Extracted dosage details",
        "frequency": "Extracted frequency/timing",
        "duration": "Extracted duration",
        "confidence": "high, medium, or low"
      }
    ],
    "other_notes": "Any other instructions or notes"
  }
}
"""

def encode_image_to_base64(image_bytes: bytes) -> str:
    """Encodes raw image bytes into a base64 string."""
    return base64.b64encode(image_bytes).decode("utf-8")

class OCRAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is missing. Please define OPENAI_API_KEY in your .env file.")
        self.client = get_openai_client(self.api_key)

    def preprocess_image(self, image_bytes: bytes) -> bytes:
        """Preprocesses the input image bytes to enhance OCR legibility."""
        import cv2
        import numpy as np
        
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return image_bytes
            
            orig_h, orig_w = img.shape[:2]
            max_dim = 2048
            if orig_w > max_dim or orig_h > max_dim:
                scale = max_dim / max(orig_w, orig_h)
                img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
            
            img = cv2.medianBlur(img, 3)
            kernel = np.array([[-0.5,-0.5,-0.5], [-0.5, 5.0,-0.5], [-0.5,-0.5,-0.5]])
            img = cv2.filter2D(img, -1, kernel)
            
            success, encoded_img = cv2.imencode('.png', img)
            if success:
                return encoded_img.tobytes()
        except Exception as e:
            logging.warning(f"Image preprocessing warning: {e}")
            
        return image_bytes

    def _run_openai_completion(self, messages, is_json=False) -> str:
        if not self.client:
            raise RuntimeError("OpenAI OCR client is not initialized. Check OPENAI_API_KEY.")

        backoffs = [1, 3, 5]
        last_error: Optional[Exception] = None
        for attempt, wait_time in enumerate(backoffs, start=1):
            try:
                kwargs = {
                    "model": "gpt-4o",
                    "messages": messages,
                    "max_tokens": 4000,
                    "temperature": 0.1,
                }
                if is_json:
                    kwargs["response_format"] = {"type": "json_object"}
                
                response = self.client.chat.completions.create(**kwargs)
                content = response.choices[0].message.content
                if isinstance(content, str) and content.strip():
                    return content
                raise ValueError("OpenAI returned an empty OCR response.")
            except Exception as exc:
                last_error = exc
                err_type = type(exc).__name__
                logging.warning(f"OpenAI OCR attempt {attempt}/{len(backoffs)} failed: {err_type} - {exc}")
                if attempt < len(backoffs):
                    time.sleep(wait_time)
                    continue
                break

        if last_error:
            raise last_error
        raise RuntimeError("OpenAI OCR failed to process image.")

    def extract_text(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Tuple[str, bool]:
        """
        Executes prescription OCR via OpenAI Vision exclusively.
        Returns a JSON string containing 'raw_transcription' and 'structured_json'.
        """
        preprocessed_bytes = self.preprocess_image(image_bytes)
        b64_image = encode_image_to_base64(preprocessed_bytes)

        messages = [
            {
                "role": "system",
                "content": COMBINED_PROMPT
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Please transcribe and structure the information in this medical prescription image."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{b64_image}"
                        }
                    }
                ]
            }
        ]

        content = self._run_openai_completion(messages, is_json=True)
        
        try:
            cleaned = content.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned.replace("```json", "", 1)
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            parsed_json = json.loads(cleaned)
            raw_text = parsed_json.get("raw_transcription", content)
            if not isinstance(raw_text, str):
                raw_text = str(raw_text)
        except Exception:
            raw_text = content

        return raw_text, False
