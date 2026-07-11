import sys
from pathlib import Path

import pytest

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))

from app.agents.ocr_agent import OCRAgent
from app.agents.coordinator import CoordinatorAgent


class FakeLLM:
    def __init__(self, content=None, error=None):
        self.content = content
        self.error = error

    def invoke(self, messages):
        if self.error is not None:
            raise self.error
        return type("Resp", (), {"content": self.content})()


class FakeMedicalAgent:
    def parse_prescription(self, ocr_text):
        raise RuntimeError("medical down")


class FakeSafetyAgent:
    def evaluate_safety(self, clinical_json):
        raise RuntimeError("safety down")


class FakeSimplificationAgent:
    def simplify(self, extracted_details, safety_details):
        raise RuntimeError("simplify down")


class FakeTranslationAgent:
    def translate_to_language(self, english_guide_json, safety_advisory_text, target_lang="Tamil"):
        raise RuntimeError("translate down")


class FakeRAGAgent:
    def retrieve_context(self, query):
        return {"context": "fallback", "sources": [], "low_confidence": True}


class FakeReminderAgent:
    def generate_schedule(self, clinical_json):
        raise RuntimeError("reminder down")


class FakeResponse:
    def __init__(self, content):
        self.content = content


def make_agent_with_fake_llm(error=None):
    agent = OCRAgent.__new__(OCRAgent)
    agent.api_key = "fake"
    agent.llm = FakeLLM(content=None, error=error)
    agent.preprocess_image = lambda image_bytes: image_bytes
    return agent


def test_ocr_returns_non_empty_text_when_all_ocr_paths_fail(monkeypatch):
    agent = make_agent_with_fake_llm(error=RuntimeError("quota exceeded"))

    monkeypatch.setattr("PIL.Image.open", lambda *args, **kwargs: None)
    monkeypatch.setattr("pytesseract.image_to_string", lambda *args, **kwargs: "")

    raw_text, fallback = agent.extract_text(b"fake-image", mime_type="image/png")

    assert raw_text
    assert fallback is True


def test_coordinator_returns_payload_when_agents_fail(monkeypatch):
    coordinator = CoordinatorAgent.__new__(CoordinatorAgent)
    coordinator.ocr_agent = make_agent_with_fake_llm(error=RuntimeError("quota exceeded"))
    coordinator.medical_agent = FakeMedicalAgent()
    coordinator.safety_agent = FakeSafetyAgent()
    coordinator.simple_agent = FakeSimplificationAgent()
    coordinator.translation_agent = FakeTranslationAgent()
    coordinator.rag_agent = FakeRAGAgent()
    coordinator.reminder_agent = FakeReminderAgent()

    monkeypatch.setattr("PIL.Image.open", lambda *args, **kwargs: None)
    monkeypatch.setattr("pytesseract.image_to_string", lambda *args, **kwargs: "Prescription text from image")

    payload = coordinator.process_prescription_text(
        "Prescription text from image",
        target_lang="Tamil",
        ocr_fallback=True,
    )

    assert payload["raw_ocr"]
    assert payload["low_confidence"] is True
    assert payload["translated_guide"]["medicines"]
