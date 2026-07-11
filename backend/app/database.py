from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# In-memory database settings for SQLite fallback if path is empty
database_url = settings.DATABASE_URL
if not database_url:
    database_url = "sqlite:///./backend/data/local_db.db"

# Engine setup
# connect_args={"check_same_thread": False} is required only for SQLite!
engine = create_engine(
    database_url, connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency injection database session provider."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes the database schema and structures."""
    Base.metadata.create_all(bind=engine)
