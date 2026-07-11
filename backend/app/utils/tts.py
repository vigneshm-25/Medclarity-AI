import hashlib
import os
from pathlib import Path
from gtts import gTTS
from app.config import settings

class TTSEngine:
    def __init__(self):
        # Create audio storage directory
        settings.create_directories()
        self.audio_dir = settings.AUDIO_DIR

    def _get_text_hash(self, text: str, lang: str) -> str:
        """Generates a unique MD5 hash for a given text and language combination."""
        raw_str = f"{text}_{lang}"
        return hashlib.md5(raw_str.encode("utf-8")).hexdigest()

    def generate_speech(self, text: str, lang: str = "en") -> Path:
        """
        Synthesizes text into high-quality speech using gTTS and saves to local storage.
        Supported langs: 'en' for English, 'ta' for Tamil.
        Returns the absolute path to the generated MP3 file.
        """
        if not text:
            raise ValueError("Text input for speech synthesis cannot be empty.")

        text_hash = self._get_text_hash(text, lang)
        output_file_path = self.audio_dir / f"{text_hash}_{lang}.mp3"

        # Caching optimization: return file immediately if already generated
        if output_file_path.exists():
            return output_file_path

        try:
            # Initialize gTTS
            tts = gTTS(text=text, lang=lang, slow=False)
            
            # Save the synthesized audio file
            tts.save(str(output_file_path))
            return output_file_path

        except Exception as e:
            import traceback
            print("=" * 80)
            print("=== GTTS SPEECH SYNTHESIS ERROR ===")
            print(f"Exception Type: {type(e).__name__}")
            print(f"Exception Message: {str(e)}")
            traceback.print_exc()
            print("=" * 80)
            raise RuntimeError(f"Error during Text-to-Speech synthesis with gTTS: {str(e)}") from e
