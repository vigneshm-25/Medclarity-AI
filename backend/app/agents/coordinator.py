import json
import re
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, Dict, Any
from app.config import settings
from app.agents.ocr_agent import OCRAgent
from app.agents.medical_agent import MedicalAgent, ExtractedPrescription, MedicineItem
from app.agents.safety_agent import SafetyAgent, SafetyReport
from app.agents.simple_agent import SimplificationAgent, SimplifiedPrescription, SimplifiedMedicineItem
from app.agents.translation_agent import TranslationAgent, TamilPrescription, TamilMedicineItem
from app.agents.rag_agent import RAGAgent
from app.agents.schedule_generator import generate_schedule, ReminderSchedule, ReminderScheduleItem


class CoordinatorAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY

        self.ocr_agent = OCRAgent(api_key=self.api_key)
        self.medical_agent = MedicalAgent(api_key=self.api_key)
        self.safety_agent = SafetyAgent(api_key=self.api_key)
        self.simple_agent = SimplificationAgent(api_key=self.api_key)
        self.translation_agent = TranslationAgent(api_key=self.api_key)

        self.rag_agent = None
        try:
            self.rag_agent = RAGAgent(api_key=self.api_key)
        except Exception as exc:
            print(f"RAG agent initialization failed, running without it: {exc}")
            self.rag_agent = None

    def _build_fallback_clinical_extraction(self, raw_ocr: str) -> ExtractedPrescription:
        patient_match = re.search(r"patient(?:\s+name)?:\s*([^\n]+)", raw_ocr, re.IGNORECASE)
        patient_name = patient_match.group(1).strip() if patient_match else None

        symptoms = []
        if "fever" in raw_ocr.lower():
            symptoms.append("fever")
        if "cough" in raw_ocr.lower():
            symptoms.append("cough")
        if "pain" in raw_ocr.lower():
            symptoms.append("pain")

        medicine_names = []
        for line in raw_ocr.splitlines():
            cleaned = line.strip()
            if not cleaned:
                continue
            if cleaned.lower().startswith(("rx", "patient", "symptoms", "doctor", "date", "advice", "notes")):
                continue
            if re.match(r"^\d+[.)]", cleaned):
                cleaned = re.sub(r"^\d+[.)]\s*", "", cleaned)
            if len(cleaned.split()) <= 2:
                continue
            medicine_names.append(cleaned.split()[0])

        medicines = [
            MedicineItem(name=name if name else "Medicine", dosage="As prescribed", frequency="As prescribed", relation_to_food=None, duration=None, purpose=None)
            for name in medicine_names[:3]
        ]

        return ExtractedPrescription(
            patient_name=patient_name,
            symptoms=symptoms,
            medicines=medicines,
            clinical_notes="Prescription details were parsed locally because the external clinical agent was unavailable.",
        )

    def _build_fallback_safety_report(self) -> SafetyReport:
        return SafetyReport(
            status="WARNING",
            emergency_alert=False,
            patient_advisory="Please confirm the prescription with your doctor or pharmacist and take medicines exactly as directed.",
            red_flags_found=[],
            precaution_details=["Follow the dosing schedule carefully.", "Do not share medicines with others."]
        )

    def _build_fallback_simplified(self, patient_name: str, medicines: list, target_lang: str) -> SimplifiedPrescription:
        greeting = f"Hello {patient_name or 'there'}!"
        if target_lang.lower() == "tamil":
            greeting = f"வணக்கம் {patient_name or 'அன்புள்ளவரே'}!"
        elif target_lang.lower() == "hindi":
            greeting = f"नमस्ते {patient_name or 'आप'}!"

        medicine_items = []
        for med in medicines[:3]:
            medicine_items.append(
                SimplifiedMedicineItem(
                    name=med.name,
                    simple_dosage="Follow the prescription label",
                    simple_timing="Take as directed by your doctor",
                    simple_purpose="Medication prescribed for the stated condition",
                    simple_duration="Follow the prescribed course"
                )
            )

        return SimplifiedPrescription(
            patient_greeting=greeting,
            simple_summary="The prescription was processed using a safe local fallback because the live medical assistant was unavailable.",
            medicines=medicine_items or [SimplifiedMedicineItem(name="Medication", simple_dosage="As prescribed", simple_timing="As directed", simple_purpose="Medication", simple_duration="As directed")],
            helpful_tips=["Take medicines on time.", "Keep water nearby and rest if needed."]
        )

    def _build_fallback_translation(self, patient_name: str, target_lang: str, medicines: list) -> TamilPrescription:
        greeting = f"Hello {patient_name or 'there'}!"
        if target_lang.lower() == "tamil":
            greeting = f"வணக்கம் {patient_name or 'அன்புள்ளவரே'}!"
        elif target_lang.lower() == "hindi":
            greeting = f"नमस्ते {patient_name or 'आप'}!"

        medicine_items = []
        for med in medicines[:3]:
            medicine_items.append(
                TamilMedicineItem(
                    name=med.name,
                    simple_dosage="மருந்து லேபிளின்படி", 
                    simple_timing="டாக்டர் அறிவுறுத்தியபடி", 
                    simple_purpose="சிகிச்சைக்காக பரிந்துரைக்கப்பட்ட மருந்து",
                    simple_duration="அறிவுறுத்திய காலம்"
                )
            )

        return TamilPrescription(
            patient_greeting=greeting,
            simple_summary="இந்த மருந்துச்சீட்டு பாதுகாப்பான உள்ளூர் மாற்று முறையில் செயலாக்கப்பட்டது.",
            medicines=medicine_items or [TamilMedicineItem(name="மருந்து", simple_dosage="அறிவுறுத்தப்பட்டபடி", simple_timing="அறிவுறுத்தியபடி", simple_purpose="மருந்து", simple_duration="அறிவுறுத்தியபடி")],
            helpful_tips=["மருந்துகளை சரியான நேரத்தில் எடுத்துக்கொள்ளவும்.", "நன்கு ஓய்வெடுக்கவும்."],
            safety_advisory="உங்கள் மருத்துவர் அல்லது மருந்தாளர் மூலம் உறுதிப்படுத்தவும்."
        )

    def _build_fallback_schedule(self, medicines: list, patient_name: str = "Unknown") -> ReminderSchedule:
        reminders = []
        for med in medicines[:3]:
            reminders.append(
                ReminderScheduleItem(
                    medicine_name=med.name,
                    dosage="As prescribed",
                    time_of_day="08:00 AM",
                    frequency="Daily",
                    relation_to_food="After Food",
                    duration="As directed"
                )
            )
        return ReminderSchedule(patient_name=patient_name or "Unknown", reminders=reminders)

    def process_prescription_image(
        self, image_bytes: bytes, mime_type: str = "image/jpeg", target_lang: str = "Tamil"
    ) -> Dict[str, Any]:
        """
        Orchestrates the entire multi-agent pipeline for a new prescription image.
        """
        raw_ocr, ocr_fallback = self.ocr_agent.extract_text(image_bytes, mime_type=mime_type)
        if not raw_ocr or not raw_ocr.strip():
            raw_ocr = "[unclear] Unable to extract readable text from the prescription image."
        return self.process_prescription_text(raw_ocr, target_lang=target_lang, ocr_fallback=ocr_fallback)

    def process_prescription_text(self, raw_ocr: str, target_lang: str = "Tamil", ocr_fallback: bool = False) -> Dict[str, Any]:
        """
        Runs the agents pipeline starting from raw text.
        Independent agents (RAG, Safety, Reminder) are executed concurrently
        using a thread pool to minimise total wall-clock time.

        Pipeline order:
          1. MedicalAgent  (must complete first – others depend on its output)
          2. RAGAgent + SafetyAgent + ReminderAgent  (all parallel)
          3. SimplificationAgent  (depends on Safety result)
          4. TranslationAgent  (depends on Simplification result)
        """
        print("[CP-AGENT-EXECUTION-V2] mode=parallel_after_medical")
        try:
            import time
            print("[CP-AGENT-CONFIG] agent=Medical, model=gpt-5-mini, reasoning_effort=None")
            t0 = time.time()
            clinical_extracted = self.medical_agent.parse_prescription(ocr_text=raw_ocr)
            print(f"[CP-AGENT-TIMING] agent=Medical, duration={time.time()-t0:.2f}s")
        except Exception as exc:
            print(f"Medical agent fallback triggered: {exc}")
            clinical_extracted = self._build_fallback_clinical_extraction(raw_ocr)

        # Ensure we pass the correct structured list from OCR if it was lost in Medical Agent parsing
        try:
            ocr_parsed = json.loads(raw_ocr)
            if isinstance(ocr_parsed, dict) and "structured_json" in ocr_parsed:
                structured_json = ocr_parsed["structured_json"]
                if "medicines" in structured_json and isinstance(structured_json["medicines"], list):
                    ocr_meds = structured_json["medicines"]
                    valid_meds = []
                    for m in ocr_meds:
                        if isinstance(m, dict) and m.get("name"):
                            valid_meds.append(MedicineItem(
                                name=m.get("name", "Unknown"),
                                dosage=m.get("dosage"),
                                route=m.get("route"),
                                frequency=m.get("frequency"),
                                timing=m.get("timing"),
                                relation_to_food=m.get("relation_to_food"),
                                duration=m.get("duration"),
                                purpose=m.get("purpose")
                            ))
                    if valid_meds:
                        clinical_extracted.medicines = valid_meds
        except Exception as e:
            print(f"DEBUG: Could not parse OCR raw json: {e}")

        clinical_json = json.dumps(clinical_extracted.model_dump(), default=str)

        search_query = " ".join([med.name for med in clinical_extracted.medicines])
        if clinical_extracted.symptoms:
            search_query += " " + " ".join(clinical_extracted.symptoms)

        print(f"--- DEBUG COORDINATOR: OCR TEXT ---\n{raw_ocr}\n")
        print(f"--- DEBUG COORDINATOR: clinical_extracted.model_dump() ---\n{clinical_extracted.model_dump()}\n")
        print(f"--- DEBUG COORDINATOR: len(clinical_extracted.medicines) ---\n{len(clinical_extracted.medicines)}\n")
        print(f"--- DEBUG COORDINATOR: MedicineItems Received ---")
        for med in clinical_extracted.medicines:
            print(f"MedicineItem: {med.model_dump()}")
        print(f"-------------------------------------------------")
        print(f"--- DEBUG: CLINICAL JSON (Medicines Extracted) ---\n{clinical_json}\n")

        def _run_safety():
            import time
            print("[CP-AGENT-CONFIG] agent=Safety, model=gpt-5, reasoning_effort=None")
            t0 = time.time()
            res = self.safety_agent.evaluate_safety(clinical_json)
            print(f"[CP-AGENT-TIMING] agent=Safety, duration={time.time()-t0:.2f}s")
            return res

        def _run_simple():
            import time
            print("[CP-AGENT-CONFIG] agent=Simplification, model=gpt-5-mini, reasoning_effort=None")
            t0 = time.time()
            res = self.simple_agent.simplify(
                extracted_details=clinical_json,
                safety_details="{}"
            )
            print(f"[CP-AGENT-TIMING] agent=Simplification, duration={time.time()-t0:.2f}s")
            return res

        def _run_translation():
            import time
            print("[CP-AGENT-CONFIG] agent=Translation, model=gpt-5-mini, reasoning_effort=None")
            t0 = time.time()
            res = self.translation_agent.translate_to_language(
                english_guide_json=clinical_json,
                safety_advisory_text="",
                target_lang=target_lang
            )
            print(f"[CP-AGENT-TIMING] agent=Translation, duration={time.time()-t0:.2f}s")
            return res

        try:
            with ThreadPoolExecutor(max_workers=5) as executor:
                future_rag = executor.submit(self.rag_agent.retrieve_context, search_query) if self.rag_agent else None
                future_safety = executor.submit(_run_safety)
                future_simple = executor.submit(_run_simple)
                future_translation = executor.submit(_run_translation)
                
                print(f"[DEBUG-ISSUE-1] Coordinator passing to Reminder Agent: {[m.model_dump() for m in clinical_extracted.medicines]}")
                future_reminder = executor.submit(generate_schedule, clinical_extracted.medicines, clinical_extracted.patient_name)

                rag_result = future_rag.result() if future_rag is not None else {"context": "Clinical guidance was not available from the live index.", "sources": [], "low_confidence": True}
                safety_report = future_safety.result()
                simplified_en = future_simple.result()
                translated_guide = future_translation.result()
                reminder_schedule = future_reminder.result()
                
                print(f"[DEBUG-ISSUE-1] Coordinator received from Reminder Agent: {[r.model_dump() for r in reminder_schedule.reminders]}")
        except Exception as exc:
            print(f"Parallel agent fallback triggered: {exc}")
            rag_result = {"context": "Clinical guidance was not available from the live index.", "sources": [], "low_confidence": True}
            safety_report = self._build_fallback_safety_report()
            simplified_en = self._build_fallback_simplified(
                patient_name=clinical_extracted.patient_name or "Unknown",
                medicines=clinical_extracted.medicines,
                target_lang=target_lang,
            )
            translated_guide = self._build_fallback_translation(
                patient_name=clinical_extracted.patient_name or "Unknown",
                target_lang=target_lang,
                medicines=clinical_extracted.medicines,
            )
            reminder_schedule = self._build_fallback_schedule(clinical_extracted.medicines, clinical_extracted.patient_name)

        safety_json = json.dumps(safety_report.model_dump(), default=str)

        if isinstance(rag_result, dict):
            rag_context = rag_result.get("context", "")
            rag_sources = rag_result.get("sources", [])
            rag_low_confidence = rag_result.get("low_confidence", False)
        else:
            rag_context = str(rag_result)
            rag_sources = []
            rag_low_confidence = True

        low_confidence = bool(ocr_fallback or "[unclear]" in raw_ocr.lower() or rag_low_confidence)



        from app.utils.drug_validator import validate_drug_name
        drug_suggestions = []
        for med in clinical_extracted.medicines:
            try:
                val_res = validate_drug_name(med.name)
                if not val_res["match"] and val_res["suggestion"]:
                    drug_suggestions.append({
                        "ocr_text": med.name,
                        "suggested_match": val_res["suggestion"],
                        "match_confidence": val_res["score"]
                    })
            except Exception:
                continue

        master_payload = {
            "raw_ocr": raw_ocr,
            "patient_name": clinical_extracted.patient_name or "Unknown",
            "symptoms": clinical_extracted.symptoms,
            "clinical_notes": clinical_extracted.clinical_notes,
            "safety_status": safety_report.status,
            "emergency_alert": safety_report.emergency_alert,
            "patient_advisory_en": safety_report.patient_advisory,
            "red_flags": safety_report.red_flags_found,
            "precautions_en": safety_report.precaution_details,
            "simplified_en": simplified_en.model_dump(),
            "tamil_guide": translated_guide.model_dump(),
            "translated_guide": translated_guide.model_dump(),
            "reminders": [r.model_dump() for r in reminder_schedule.reminders],
            "rag_context": rag_context,
            "rag_sources": rag_sources,
            "low_confidence": low_confidence,
            "ocr_fallback": ocr_fallback,
            "drug_suggestions": drug_suggestions,
        }

        return master_payload
