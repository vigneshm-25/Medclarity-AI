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

FALLBACK_OCR_MESSAGE = (
    "AI OCR Service Temporarily Unavailable\n\n"
    "Your prescription image has been uploaded successfully.\n\n"
    "Our cloud AI OCR service has temporarily reached its current usage limit.\n\n"
    "This is an external cloud service limitation and does not indicate any issue with your prescription image or the GramCare AI application.\n\n"
    "Please try again after a few minutes."
)

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
        self.client = None

        if self.api_key:
            try:
                self.client = get_openai_client(self.api_key)
            except Exception as exc:
                logging.warning(f"OpenAI OCR client initialization failed: {exc}")
                self.client = None

    def preprocess_image(self, image_bytes: bytes) -> bytes:
        """
        Preprocesses the input image bytes to enhance OCR legibility:
        1. Limits resolution to avoid timeouts.
        2. Deskew (correct rotation).
        3. Automatic border removal.
        4. Configurable Noise removal (fast median blur).
        5. Mild sharpening.
        6. Adaptive thresholding / Contrast Enhancement (only if beneficial).
        """
        import cv2
        import numpy as np
        import time
        
        start_time = time.time()
        operations_used = []
        
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return image_bytes
            
            orig_h, orig_w = img.shape[:2]
            logging.info(f"Original Image Resolution: {orig_w}x{orig_h}")
            
            # Limit maximum dimension to 2048 to prevent oversized images causing timeouts
            max_dim = 2048
            if orig_w > max_dim or orig_h > max_dim:
                scale = max_dim / max(orig_w, orig_h)
                img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
                operations_used.append("downscale")
            elif orig_w < 1000 or orig_h < 1000:
                scale = 2.0
                new_w, new_h = int(orig_w * scale), int(orig_h * scale)
                if max(new_w, new_h) > max_dim:
                    scale = max_dim / max(orig_w, orig_h)
                img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
                operations_used.append("upscale")
            
            # 1. Deskew
            try:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
                coords = np.column_stack(np.where(thresh > 0))
                if coords.shape[0] > 0:
                    rect = cv2.minAreaRect(coords)
                    angle = rect[-1]
                    if angle < -45:
                        angle = -(90 + angle)
                    else:
                        angle = -angle
                    if 0.5 < abs(angle) < 20:
                        (h, w) = img.shape[:2]
                        center = (w // 2, h // 2)
                        M = cv2.getRotationMatrix2D(center, angle, 1.0)
                        img = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                        operations_used.append("deskew")
            except Exception as e:
                logging.warning(f"Deskew failed: {e}")

            # 2. Border Removal
            try:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
                coords = cv2.findNonZero(thresh)
                if coords is not None:
                    x, y, w, h = cv2.boundingRect(coords)
                    padding = 10
                    x = max(0, x - padding)
                    y = max(0, y - padding)
                    w = min(img.shape[1] - x, w + 2*padding)
                    h = min(img.shape[0] - y, h + 2*padding)
                    img = img[y:y+h, x:x+w]
                    operations_used.append("border_removal")
            except Exception as e:
                logging.warning(f"Border removal failed: {e}")

            # 3. Configurable Noise Removal
            try:
                # Fast and effective noise removal preserving edges
                img = cv2.medianBlur(img, 3)
                operations_used.append("median_blur")
            except Exception as e:
                logging.warning(f"Noise removal failed: {e}")

            # 4. Mild Sharpening
            try:
                kernel = np.array([[-0.5,-0.5,-0.5], 
                                   [-0.5, 5.0,-0.5], 
                                   [-0.5,-0.5,-0.5]])
                img = cv2.filter2D(img, -1, kernel)
                operations_used.append("sharpening")
            except Exception as e:
                logging.warning(f"Sharpening failed: {e}")

            # 5. Adaptive Thresholding (only if beneficial/low contrast)
            try:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                mean, stddev = cv2.meanStdDev(gray)
                if stddev[0][0] < 55: # Low contrast image detection
                    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
                    l, a, b = cv2.split(lab)
                    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                    cl = clahe.apply(l)
                    limg = cv2.merge((cl, a, b))
                    img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
                    operations_used.append("adaptive_contrast")
            except Exception as e:
                logging.warning(f"Contrast enhancement failed: {e}")
                
            save_dir = settings.DATA_DIR / "preprocessed_images"
            save_dir.mkdir(parents=True, exist_ok=True)
            save_path = save_dir / "last_preprocessed.png"
            cv2.imwrite(str(save_path), img)
            
            success, encoded_img = cv2.imencode('.png', img)
            
            prep_duration = time.time() - start_time
            logging.info(f"Image Preprocessing complete in {prep_duration:.2f}s. Operations: {', '.join(operations_used)}")
            
            if success:
                return encoded_img.tobytes()
                
        except Exception as e:
            prep_duration = time.time() - start_time
            logging.error(f"Image preprocessing failed overall in {prep_duration:.2f}s: {e}")
            
        return image_bytes

    def format_ocr_json_to_text(self, ocr_json: dict) -> str:
        """Formats the structured OCR JSON object into a unified Markdown/text string. (Maintained for backward compat if needed)"""
        lines = []
        
        def extract_val(field):
            val = ocr_json.get(field)
            if isinstance(val, dict):
                return val.get("value")
            return val

        doctor_name = extract_val("doctor_name")
        if doctor_name:
            lines.append(f"Doctor Name: {doctor_name}")
            
        patient_name = extract_val("patient_name")
        if patient_name:
            lines.append(f"Patient Name: {patient_name}")
        
        meta = []
        age = extract_val("age")
        if age:
            meta.append(f"Age: {age}")
        sex = extract_val("sex")
        if sex:
            meta.append(f"Sex: {sex}")
        date = extract_val("date")
        if date:
            meta.append(f"Date: {date}")
        if meta:
            lines.append(" | ".join(meta))
            
        chief_complaint = extract_val("chief_complaint")
        if chief_complaint:
            lines.append(f"Chief Complaint: {chief_complaint}")
            
        if ocr_json.get("medicines"):
            lines.append("\nMedicines:")
            for idx, med in enumerate(ocr_json["medicines"], 1):
                name = med.get("name") or "[unclear]"
                dosage = med.get("dosage") or "N/A"
                freq = med.get("frequency") or "N/A"
                conf = med.get("confidence") or "medium"
                lines.append(f"{idx}. {name} - {dosage} - {freq} (Confidence: {conf})")
                
        other_notes = extract_val("other_notes")
        if other_notes:
            lines.append(f"\nOther Notes:\n{other_notes}")
            
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
                clean = re.sub(r',\s*}', '}', clean)
                clean = re.sub(r',\s*]', ']', clean)
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
        text_fields = ["patient_name", "age", "sex", "date", "doctor_name", "chief_complaint", "diagnosis", "other_notes"]
        for field in text_fields:
            val1_obj = json1.get(field) or {}
            val2_obj = json2.get(field) or {}
            
            val1 = val1_obj.get("value") if isinstance(val1_obj, dict) else val1_obj
            val2 = val2_obj.get("value") if isinstance(val2_obj, dict) else val2_obj
            
            val1_str = str(val1) if val1 else ""
            val2_str = str(val2) if val2 else ""
            
            if val1_str.lower() == val2_str.lower():
                merged[field] = {"value": val1_str, "confidence": val1_obj.get("confidence", "medium") if isinstance(val1_obj, dict) else "medium"}
            else:
                merged[field] = {"value": f"{val1_str} / {val2_str} (mismatch)", "confidence": "low"}
                    
        # 2. Medicines list comparison (Exact match only to avoid OCR agent fuzzy logic)
        meds1 = json1.get("medicines") or []
        meds2 = json2.get("medicines") or []
        
        merged_meds = []
        for m1 in meds1:
            name1 = (m1.get("name") or "").lower()
            best_match = next((m for m in meds2 if (m.get("name") or "").lower() == name1), None)
            
            if best_match:
                dosage1 = m1.get("dosage") or ""
                dosage2 = best_match.get("dosage") or ""
                freq1 = m1.get("frequency") or ""
                freq2 = best_match.get("frequency") or ""
                
                confidence = m1.get("confidence") or "medium"
                if dosage1.lower() != dosage2.lower() or freq1.lower() != freq2.lower():
                    confidence = "low"
                    dosage = f"{dosage1} / {dosage2}" if dosage1 != dosage2 else dosage1
                    freq = f"{freq1} / {freq2}" if freq1 != freq2 else freq1
                else:
                    dosage = dosage1
                    freq = freq1
                    
                merged_meds.append({
                    "name": m1.get("name"),
                    "dosage": dosage,
                    "frequency": freq,
                    "duration": m1.get("duration"),
                    "confidence": confidence
                })
            else:
                merged_meds.append({
                    "name": m1.get("name"),
                    "dosage": m1.get("dosage"),
                    "frequency": m1.get("frequency"),
                    "duration": m1.get("duration"),
                    "confidence": "low"
                })
                
        # Append remaining medicines from second list that had no exact match
        for m2 in meds2:
            name2 = (m2.get("name") or "").lower()
            if not any((m.get("name") or "").lower() == name2 for m in merged_meds):
                merged_meds.append({
                    "name": m2.get("name"),
                    "dosage": m2.get("dosage"),
                    "frequency": m2.get("frequency"),
                    "duration": m2.get("duration"),
                    "confidence": "low"
                })
                
        merged["medicines"] = merged_meds
        return merged

    def _run_openai_completion(self, messages, is_json=False) -> str:
        if not self.client:
            raise RuntimeError("OpenAI OCR is not configured.")

        backoffs = [1, 3, 6]
        last_error: Optional[Exception] = None
        for attempt, wait_time in enumerate(backoffs, start=1):
            start_time = time.time()
            try:
                kwargs = {
                    "model": "gpt-5",
                    "messages": messages,
                    "max_completion_tokens": 8192, # Changed from 1500 to 8192
                    "timeout": 90.0, # Increased significantly for base64 high-res image stability
                    "reasoning_effort": "low"
                }
                # Use JSON schema response_format if requested
                if is_json:
                    kwargs["response_format"] = {"type": "json_object"}
                
                print(f"[CP-OCR-CONFIG] model={kwargs['model']}, max_completion_tokens={kwargs['max_completion_tokens']}")
                
                response = self.client.chat.completions.create(**kwargs)
                print(f"[CP-OCR-USAGE] usage={response.usage}")
                print(f"[CP-OCR-COST-CHECK] reasoning_tokens={response.usage.completion_tokens_details.reasoning_tokens}, total_output={response.usage.completion_tokens}")
                
                elapsed_time = time.time() - start_time
                logging.info(f"OpenAI Response Time (Attempt {attempt}): {elapsed_time:.2f}s")
                
                finish_reason = response.choices[0].finish_reason
                if str(finish_reason).upper() == "LENGTH":
                    logging.warning("[WARNING] OpenAI response was truncated due to max_completion_tokens limit.")

                content = response.choices[0].message.content
                if isinstance(content, str) and content.strip():
                    return content
                raise ValueError("OpenAI returned an empty response.")
            except Exception as exc:
                elapsed_time = time.time() - start_time
                last_error = exc
                err_type = type(exc).__name__
                http_status = getattr(exc, "status_code", "N/A")

                logging.warning(
                    f"OpenAI attempt {attempt}/{len(backoffs)} failed. "
                    f"Exception Type: {err_type}, HTTP Status: {http_status}, Time: {elapsed_time:.2f}s, Error: {exc}"
                )

                is_retryable = isinstance(exc, (openai.RateLimitError, openai.APIConnectionError, openai.APITimeoutError, openai.InternalServerError))
                if attempt < len(backoffs) and is_retryable:
                    logging.info(f"Retryable error identified: {err_type}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    logging.error(f"Non-retryable error or exhausted retries: {err_type}.")
                break

        if last_error is not None:
            raise last_error
        raise RuntimeError("OpenAI call failed with no error context.")

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
                logging.info("Tesseract fallback successfully extracted text.")
                return cleaned
        except Exception as t_exc:
            logging.warning(f"Local Tesseract OCR fallback failed: {t_exc}")

        return FALLBACK_OCR_MESSAGE

    def extract_text(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Tuple[str, bool]:
        """
        Two-stage OCR pipeline:
        Stage 1: Literal transcription via Vision.
        Stage 2: Medical structuring to JSON.
        Returns a JSON string containing both 'raw_transcription' and 'structured_json'.
        """
        import time
        import logging
        import re

        total_start_time = time.time()
        
        preprocessed_bytes = self.preprocess_image(image_bytes)
        b64_image = encode_image_to_base64(preprocessed_bytes)

        def parse_json_robust(content: str) -> Tuple[Optional[dict], bool]:
            cleaned = content.strip()
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\s*```$", "", cleaned)
            cleaned = cleaned.strip()
            
            # Sanitize trailing commas
            cleaned = re.sub(r',\s*}', '}', cleaned)
            cleaned = re.sub(r',\s*]', ']', cleaned)

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
            # Combined OCR and Structuring
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
            
            self_consistency = os.getenv("SELF_CONSISTENCY_CHECK", "false").lower() == "true"
            
            if self_consistency:
                content1 = self._run_openai_completion(messages, is_json=True)
                content2 = self._run_openai_completion(messages, is_json=True)
                parsed_json1, success1 = parse_json_robust(content1)
                parsed_json2, success2 = parse_json_robust(content2)

                if success1 or success2:
                    struct1 = json.dumps(parsed_json1.get("structured_json", {})) if success1 and parsed_json1 else "{}"
                    struct2 = json.dumps(parsed_json2.get("structured_json", {})) if success2 and parsed_json2 else "{}"
                    merged_struct = self.check_self_consistency(struct1, struct2)
                    
                    best_parsed = parsed_json1 if success1 and parsed_json1 else parsed_json2
                    final_output = {
                        "raw_transcription": best_parsed.get("raw_transcription", "") if best_parsed else "",
                        "structured_json": merged_struct
                    }
                else:
                    final_output = {
                        "raw_transcription": "",
                        "structured_json": {}
                    }
            else:
                content = self._run_openai_completion(messages, is_json=True)
                parsed_json, success = parse_json_robust(content)
                
                if success and parsed_json:
                    final_output = {
                        "raw_transcription": parsed_json.get("raw_transcription", ""),
                        "structured_json": parsed_json.get("structured_json", {})
                    }
                else:
                    final_output = {
                        "raw_transcription": "",
                        "structured_json": {}
                    }

            logging.info(f"Raw Transcription Length: {len(final_output.get('raw_transcription', ''))} chars")

            # Use ensure_ascii=False so Unicode isn't escaped, reducing tokens/size and keeping readability
            combined_output = json.dumps(final_output, indent=2, ensure_ascii=False)
            
            total_duration = time.time() - total_start_time
            logging.info(f"Total OCR Pipeline completed in {total_duration:.2f}s")
            
            print("[CP-OCR-PATH] path=openai_primary_success")
            return combined_output, False

        except Exception as exc:
            logging.error(f"OpenAI OCR extraction failed: {exc}")
            logging.info("Falling back to local Tesseract OCR.")
            print("[CP-OCR-PATH] path=tesseract_fallback_used")
            fallback_text = self._local_ocr_fallback(preprocessed_bytes)
            if not fallback_text.strip():
                fallback_text = FALLBACK_OCR_MESSAGE
            
            fallback_output = {
                "raw_transcription": fallback_text,
                "structured_json": {},
                "ocr_engine": "tesseract_fallback_low_confidence",
                "warning": "We couldn't read this prescription clearly. Handwritten text often can't be extracted automatically — please retake the photo in better lighting, or type the medicine names manually."
            }
            return json.dumps(fallback_output, indent=2, ensure_ascii=False), True
