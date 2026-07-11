from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_name = Column(String, nullable=True)
    medicine_name = Column(String, nullable=False)
    dosage = Column(String, nullable=True)               # e.g., "500mg" or "1 tablet"
    time_of_day = Column(String, nullable=False)          # e.g., "08:00 AM" or "08:00 PM"
    frequency = Column(String, nullable=True)             # e.g., "Daily"
    relation_to_food = Column(String, nullable=True)      # e.g., "After Food" or "Before Food"
    duration = Column(String, nullable=True)              # e.g., "5 Days"
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Converts SQLAlchemy model to clean JSON dict."""
        return {
            "id": self.id,
            "patient_name": self.patient_name,
            "medicine_name": self.medicine_name,
            "dosage": self.dosage,
            "time_of_day": self.time_of_day,
            "frequency": self.frequency,
            "relation_to_food": self.relation_to_food,
            "duration": self.duration,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
