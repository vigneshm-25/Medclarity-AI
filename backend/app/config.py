import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base Directory path
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # API Keys
    OPENAI_API_KEY: str = ""

    # Database
    DATABASE_URL: str = "sqlite:///./backend/data/local_db.db"

    # API Configuration
    BACKEND_URL: str = "http://localhost:8000"

    # Folders
    DATA_DIR: Path = BASE_DIR / "backend" / "data"
    DOCS_DIR: Path = BASE_DIR / "backend" / "data" / "medical_docs"
    VECTOR_STORE_DIR: Path = BASE_DIR / "backend" / "data" / "vector_store"
    AUDIO_DIR: Path = BASE_DIR / "backend" / "data" / "audio"
    SOURCES_DIR: Path = BASE_DIR / "backend" / "data" / "sources"

    def __init__(self, **values):
        super().__init__(**values)
        # Convert relative SQLite path to absolute path relative to BASE_DIR
        if self.DATABASE_URL.startswith("sqlite:///./"):
            rel_path = self.DATABASE_URL.replace("sqlite:///./", "")
            abs_path = (BASE_DIR / rel_path).resolve()
            # Ensure parent folder exists
            abs_path.parent.mkdir(parents=True, exist_ok=True)
            self.DATABASE_URL = f"sqlite:///{abs_path.as_posix()}"

    # Create directories if they do not exist
    def create_directories(self):
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.DOCS_DIR.mkdir(parents=True, exist_ok=True)
        self.VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)
        self.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        self.SOURCES_DIR.mkdir(parents=True, exist_ok=True)

    # Use env file
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Pre-validation for user-friendly error message
from dotenv import load_dotenv
load_dotenv(str(BASE_DIR / ".env"))

missing_keys = []
if not os.getenv("OPENAI_API_KEY"):
    missing_keys.append("OPENAI_API_KEY")
if missing_keys:
    err_msg = f"CRITICAL CONFIGURATION ERROR: Missing required environment variable(s): {', '.join(missing_keys)}. Please define them in your .env file."
    print("=" * 80)
    print(err_msg)
    print("=" * 80)
    raise ValueError(err_msg)

settings = Settings()
# Initialize directories on import
settings.create_directories()
print("=" * 60)
print("OPENAI_API_KEY Loaded:", bool(settings.OPENAI_API_KEY))
print("First 10 characters:", settings.OPENAI_API_KEY[:10] + "...")
print("=" * 60)



print("=" * 60)