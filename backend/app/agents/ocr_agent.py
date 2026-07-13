import base64
import logging
import os
import json
import difflib
import time
from typing import Optional, Tuple
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings

FALLBACK_OCR_MESSAGE = (
    "AI OCR Service Temporarily Unavailable\n\n"
    "Your prescription image has been uploaded successfully.\n\n"
    "Our cloud AI OCR service has temporarily reached its current usage limit.\n\n"
    "This is an external cloud service limitation and does not indicate any issue with your prescription image or the GramCare AI application.\n\n"
    "Please try again after a few minutes."
)

# OCR System Instruction matching JSON output format and strict rules
SYSTEM_PROMPT = """You are an expert Medical OCR Agent specializing in transcribing Indian handwritten prescriptions and medical reports.
Your response must be a valid JSON object matching the requested schema.

HANDWRITTEN STYLE GUIDE FOR INDIAN PRESCRIPTIONS:
- Prescriptions often begin with 'Rx' (meaning recipe/treatment).
- Medicines are usually listed in a numbered list (e.g., 1. Dolo 650mg ...).
- Dosage timings may be written as numbers separated by dashes (e.g., '1-0-1' means 1 pill in the morning, 0 in the afternoon, 1 at night; '0-0-1' means 1 pill at night).
- Relation to food is often abbreviated: 'AC' or 'A/C' (Before Food / Empty Stomach), 'PC' or 'P/C' (After Food).
- Dosages may have circles around them (e.g., a circled '1' or '2' indicating tablet count).

TRANSCRIPTION CONSTRAINTS:
1. ONLY transcribe text that is clearly visible and legible in the image. Do NOT guess, infer, extrapolate, or invent any medicine names, dosages, or details.
2. For any word, field, or line that is blurry, smudged, or not clearly legible, output exactly '[unclear]' for that specific value. Never speculate or list alternative guesses.
3. IGNORE all pre-printed form boilerplate (such as checkbox list of lab tests, hospital terms, etc.) UNLESS there is a handwritten circle, checkmark, tick, or custom text written next to it.
4. Keep the output proportional to the actual content written on the prescription. Do not generate hypothetical information or generic medical suggestions. Stop once all visible handwritten content has been transcribed.

JSON SCHEMA:
Return a JSON object with the following fields:
{
  "patient_name": "String or null if not found",
  "age": "String or null if not found",
  "sex": "String or null if not found",
  "date": "String or null if not found",
  "doctor_name": "String or null if not found",
  "chief_complaint": "String or null if not found",
  "medicines": [
    {
      "name": "Transcribed name of medicine (e.g., Dolo 650 or [unclear])",
      "dosage": "Transcribed dosage details (e.g., 650mg, 1 tab, or [unclear])",
      "frequency": "Transcribed frequency/timing (e.g., BID, 1-0-1, or [unclear])",
      "confidence": "Legibility confidence of this medicine entry: 'high', 'medium', or 'low'"
    }
  ],
  "other_notes": "Any other handwritten instructions or notes"
}
"""

def encode_image_to_base64(image_bytes: bytes) -> str:
    """Encodes raw image bytes into a base64 string."""
    return base64.b64encode(image_bytes).decode("utf-8")

class OCRAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.llm = None

        if self.api_key:
            try:
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-2.5-pro",
                    google_api_key=self.api_key,
                    temperature=0.1,
                    max_tokens=8192,
                    thinking_budget=512,
                    request_timeout=30.0,
                )
            except Exception as exc:
                logging.warning(f"Gemini OCR client initialization failed: {exc}")
                self.llm = None

    def preprocess_image(self, image_bytes: bytes) -> bytes:
        """
        Preprocesses the input image bytes to enhance OCR legibility:
        1. Deskew (correct rotation).
        2. Convert to grayscale and enhance contrast (CLAHE).
        3. Upscale if low resolution (< 1200px on any side).
        4. Save preprocessed image separately for comparison.
        """
        import cv2
        import numpy as np
        
        try:
            # Decode image bytes
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return image_bytes
                
            # 1. Deskew
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Find white-on-black text representation for minAreaRect
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
            coords = np.column_stack(np.where(thresh > 0))
            if coords.shape[0] > 0:
                rect = cv2.minAreaRect(coords)
                angle = rect[-1]
                # minAreaRect returns angle in range [-90, 0)
                if angle < -45:
                    angle = -(90 + angle)
                else:
                    angle = -angle
                
                # Apply rotation if it is within a reasonable correction window (0.5 to 20 degrees)
                if 0.5 < abs(angle) < 20:
                    (h, w) = img.shape[:2]
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, angle, 1.0)
                    img = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # 2. Contrast Enhancement (CLAHE)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            
            # 3. Upscale if resolution is low
            h, w = enhanced.shape[:2]
            if w < 1200 or h < 1200:
                scale = 2.0
                enhanced = cv2.resize(enhanced, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
                
            # 4. Save preprocessed image to a separate file
            save_dir = settings.DATA_DIR / "preprocessed_images"
            save_dir.mkdir(parents=True, exist_ok=True)
            save_path = save_dir / "last_preprocessed.png"
            cv2.imwrite(str(save_path), enhanced)
            
            # Encode back to PNG bytes
            success, encoded_img = cv2.imencode('.png', enhanced)
            if success:
                return encoded_img.tobytes()
                
        except Exception as e:
            import logging
            logging.error(f"Image preprocessing failed: {e}")
            
        return image_bytes

    def format_ocr_json_to_text(self, ocr_json: dict) -> str:
        """Formats the structured OCR JSON object into a unified Markdown/text string."""
        lines = []
        if ocr_json.get("doctor_name"):
            lines.append(f"Doctor Name: {ocr_json['doctor_name']}")
        if ocr_json.get("patient_name"):
            lines.append(f"Patient Name: {ocr_json['patient_name']}")
        
        meta = []
        if ocr_json.get("age"):
            meta.append(f"Age: {ocr_json['age']}")
        if ocr_json.get("sex"):
            meta.append(f"Sex: {ocr_json['sex']}")
        if ocr_json.get("date"):
            meta.append(f"Date: {ocr_json['date']}")
        if meta:
            lines.append(" | ".join(meta))
            
        if ocr_json.get("chief_complaint"):
            lines.append(f"Chief Complaint: {ocr_json['chief_complaint']}")
            
        if ocr_json.get("medicines"):
            lines.append("\nMedicines:")
            for idx, med in enumerate(ocr_json["medicines"], 1):
                name = med.get("name") or "[unclear]"
                dosage = med.get("dosage") or "N/A"
                freq = med.get("frequency") or "N/A"
                conf = med.get("confidence") or "medium"
                lines.append(f"{idx}. {name} - {dosage} - {freq} (Confidence: {conf})")
                
        if ocr_json.get("other_notes"):
            lines.append(f"\nOther Notes:\n{ocr_json['other_notes']}")
            
        return "\n".join(lines)

    def check_self_consistency(self, raw1: str, raw2: str) -> dict:
        """Parses two JSON transcriptions and performs a field-by-field self-consistency check."""
        def parse_json(raw: str) -> dict:
            try:
                clean = raw.strip()
                if clean.startswith("```json"):
                    clean = clean.replace("```json", "", 1)
                if clean.endswith("```"):
                    clean = clean[:-3]
                return json.loads(clean.strip())
            except Exception:
                return {}
                
        json1 = parse_json(raw1)
        json2 = parse_json(raw2)
        
        if not json1:
            return json2
        if not json2:
            return json1
            
        merged = {}
        # 1. Standard text fields comparison
        text_fields = ["patient_name", "age", "sex", "date", "doctor_name", "chief_complaint", "other_notes"]
        for field in text_fields:
            val1 = json1.get(field) or ""
            val2 = json2.get(field) or ""
            if val1 == val2:
                merged[field] = val1
            else:
                # Text similarity matching ratio
                ratio = difflib.SequenceMatcher(None, str(val1).lower(), str(val2).lower()).ratio()
                if ratio >= 0.8:
                    merged[field] = val1
                else:
                    merged[field] = f"{val1} / {val2} (mismatch)"
                    
        # 2. Medicines list comparison
        meds1 = json1.get("medicines") or []
        meds2 = json2.get("medicines") or []
        
        merged_meds = []
        matched_indices_2 = set()
        for m1 in meds1:
            name1 = m1.get("name") or ""
            best_match = None
            best_idx = -1
            best_ratio = 0.0
            
            for idx2, m2 in enumerate(meds2):
                if idx2 in matched_indices_2:
                    continue
                name2 = m2.get("name") or ""
                ratio = difflib.SequenceMatcher(None, name1.lower(), name2.lower()).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match = m2
                    best_idx = idx2
                    
            if best_match and best_ratio >= 0.75:
                # Matched drug entries. Check dosage and frequency
                matched_indices_2.add(best_idx)
                dosage1 = m1.get("dosage") or ""
                dosage2 = best_match.get("dosage") or ""
                freq1 = m1.get("frequency") or ""
                freq2 = best_match.get("frequency") or ""
                
                confidence = m1.get("confidence") or "medium"
                if dosage1.lower() != dosage2.lower() or freq1.lower() != freq2.lower():
                    # Values differ significantly - flag as low confidence and display both
                    confidence = "low"
                    dosage = f"{dosage1} / {dosage2}" if dosage1 != dosage2 else dosage1
                    freq = f"{freq1} / {freq2}" if freq1 != freq2 else freq1
                else:
                    dosage = dosage1
                    freq = freq1
                    
                merged_meds.append({
                    "name": name1,
                    "dosage": dosage,
                    "frequency": freq,
                    "confidence": confidence
                })
            else:
                # No matching entry in double call - downgrade confidence
                merged_meds.append({
                    "name": name1,
                    "dosage": m1.get("dosage"),
                    "frequency": m1.get("frequency"),
                    "confidence": "low"
                })
                
        # Append remaining medicines from second list
        for idx2, m2 in enumerate(meds2):
            if idx2 not in matched_indices_2:
                merged_meds.append({
                    "name": m2.get("name"),
                    "dosage": m2.get("dosage"),
                    "frequency": m2.get("frequency"),
                    "confidence": "low"
                })
                
        merged["medicines"] = merged_meds
        return merged

    def _run_gemini_ocr(self, messages) -> str:
        if not self.llm:
            raise RuntimeError("Gemini OCR is not configured.")

        backoffs = [1, 3, 6]
        last_error: Optional[Exception] = None
        for attempt, wait_time in enumerate(backoffs, start=1):
            start_time = time.time()
            try:
                response = self.llm.invoke(messages)
                elapsed_time = time.time() - start_time
                print(f"[CP4] raw gemini response: {response}")
                
                finish_reason = getattr(response, "response_metadata", {}).get("finish_reason")
                print(f"Gemini finish_reason: {finish_reason}")
                if str(finish_reason).upper() == "MAX_TOKENS":
                    logging.warning("[WARNING] Gemini response was truncated — max_tokens may still be insufficient for this image")

                content = getattr(response, "content", None)
                if isinstance(content, str) and content.strip():
                    return content
                raise ValueError("Gemini returned an empty OCR response.")
            except Exception as exc:
                elapsed_time = time.time() - start_time
                print(f"[CP4] exception during gemini response: {exc}")
                last_error = exc
                err_str = str(exc).lower()
                err_type = type(exc).__name__
                
                http_status = "N/A"
                if "429" in err_str: http_status = "429"
                elif "503" in err_str: http_status = "503"
                elif "403" in err_str: http_status = "403"
                elif "400" in err_str: http_status = "400"

                logging.warning(
                    f"Gemini OCR attempt {attempt}/{len(backoffs)} failed. "
                    f"Timestamp: {time.time()}, Agent: OCR, SDK: LangChain, Model: gemini-2.5-pro, "
                    f"API Key Source: Env, Retry Count: {attempt}, Exception Type: {err_type}, "
                    f"HTTP Status: {http_status}, Response Time: {elapsed_time:.2f}s, Error: {exc}"
                )

                is_retryable = any(
                    keyword in err_str
                    for keyword in (
                        "503", "unavailable", "429", "resource_exhausted", "resourceexhausted",
                        "quota", "timeout", "temporarily", "rate limit", "permission_denied", "forbidden"
                    )
                )
                if attempt < len(backoffs) and is_retryable:
                    time.sleep(wait_time)
                    continue
                break

        if last_error is not None:
            raise last_error
        raise RuntimeError("Gemini OCR failed with no error context.")

    def _local_ocr_fallback(self, preprocessed_bytes: bytes) -> str:
        try:
            from PIL import Image
            import io
            import pytesseract

            tesseract_win_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
            if os.path.exists(tesseract_win_path):
                pytesseract.pytesseract.tesseract_cmd = tesseract_win_path

            image = Image.open(io.BytesIO(preprocessed_bytes))
            extracted_text = pytesseract.image_to_string(image, lang="eng+tam")
            cleaned = "\n".join(part.strip() for part in extracted_text.splitlines() if part.strip())
            if cleaned:
                return cleaned
        except Exception as t_exc:
            logging.warning(f"Local Tesseract OCR fallback failed: {t_exc}")

        return FALLBACK_OCR_MESSAGE

    def extract_text(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Tuple[str, bool]:
        """
        Uses Gemini Multimodal LLM to read prescription images and perform highly robust OCR.
        Falls back to Tesseract and then to a neutral placeholder if needed.
        """
        import time
        import logging
        import traceback
        import re

        print(f"[CP3] payload type: {type(image_bytes)}, len: {len(image_bytes)}")
        print(f"[CP3] first 16 bytes: {image_bytes[:16]}")
        preprocessed_bytes = self.preprocess_image(image_bytes)
        b64_image = encode_image_to_base64(preprocessed_bytes)

        def parse_json_robust(content: str) -> Tuple[Optional[dict], bool]:
            cleaned = content.strip()
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\s*```$", "", cleaned)
            cleaned = cleaned.strip()

            try:
                try:
                    parsed = json.loads(cleaned)
                except json.JSONDecodeError:
                    start = cleaned.find("{")
                    end = cleaned.rfind("}")
                    if start != -1 and end != -1:
                        cleaned = cleaned[start:end + 1]
                        parsed = json.loads(cleaned)
                    else:
                        raise
                if isinstance(parsed, dict):
                    return parsed, True
                return None, False
            except (json.JSONDecodeError, TypeError, ValueError) as jde:
                logging.error(f"Failed to parse OCR response as JSON. Error: {jde}")
                return None, False

        try:
            system_msg = SystemMessage(content=SYSTEM_PROMPT)
            human_msg = HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": "Please extract the text and all medical details from this prescription report image."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{b64_image}"
                        }
                    }
                ]
            )

            self_consistency = os.getenv("SELF_CONSISTENCY_CHECK", "false").lower() == "true"

            if self_consistency:
                content1 = self._run_gemini_ocr([system_msg, human_msg])
                content2 = self._run_gemini_ocr([system_msg, human_msg])
                ocr_json1, success1 = parse_json_robust(content1)
                ocr_json2, success2 = parse_json_robust(content2)

                if success1 or success2:
                    merged_json = self.check_self_consistency(content1, content2)
                    raw_ocr, ocr_fallback = self.format_ocr_json_to_text(merged_json), False
                else:
                    raw_ocr, ocr_fallback = content1.strip() or content2.strip() or FALLBACK_OCR_MESSAGE, False
                print(f"[CP5] returning raw_ocr={raw_ocr!r}, fallback_used={ocr_fallback}")
                return raw_ocr, ocr_fallback

            content = self._run_gemini_ocr([system_msg, human_msg])
            ocr_json, success = parse_json_robust(content)
            if success and ocr_json is not None:
                raw_ocr, ocr_fallback = self.format_ocr_json_to_text(ocr_json), False
                print(f"[CP5] returning raw_ocr={raw_ocr!r}, fallback_used={ocr_fallback}")
                return raw_ocr, ocr_fallback

            cleaned_text = content.strip()
            if cleaned_text:
                raw_ocr, ocr_fallback = cleaned_text, False
                print(f"[CP5] returning raw_ocr={raw_ocr!r}, fallback_used={ocr_fallback}")
                return raw_ocr, ocr_fallback

            raise RuntimeError("Gemini returned an empty OCR payload.")

        except Exception as exc:
            logging.error(f"Gemini OCR extraction failed: {exc}")
            fallback_text = self._local_ocr_fallback(preprocessed_bytes)
            if not fallback_text.strip():
                fallback_text = FALLBACK_OCR_MESSAGE
            raw_ocr, ocr_fallback = fallback_text, True
            print(f"[CP5] returning raw_ocr={raw_ocr!r}, fallback_used={ocr_fallback}")
            return raw_ocr, ocr_fallback
