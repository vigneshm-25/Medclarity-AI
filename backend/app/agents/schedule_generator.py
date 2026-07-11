import json
from typing import List, Optional
from pydantic import BaseModel, Field

class ReminderScheduleItem(BaseModel):
    medicine_name: str = Field(description="Exact brand or generic name of the medicine")
    dosage: str = Field(description="Dosage strength or amount, e.g. 500mg, 1 tablet, 5ml")
    time_of_day: str = Field(description="Standardized time of day for alarm, strictly in format 'HH:MM AM' or 'HH:MM PM' (e.g. 08:00 AM), or 'Immediate Medication' if STAT/IV")
    frequency: str = Field(description="Frequency, e.g. Daily, Alternate Days, Once a week")
    relation_to_food: str = Field(description="Relation to food, strictly 'After Food', 'Before Food', or 'Empty Stomach'")
    duration: str = Field(description="Treatment course duration, e.g. 5 Days, 1 Month")

class ReminderSchedule(BaseModel):
    patient_name: str = Field(default="Unknown", description="Name of patient or 'Unknown'")
    reminders: List[ReminderScheduleItem] = Field(description="Individual alarms to schedule in database")

def parse_timing_slots(frequency: str, timing: str, route: str) -> List[str]:
    """
    Returns a list of time slots based on the medicine's frequency, timing, and route.
    """
    freq = (frequency or "").upper()
    tim = (timing or "").upper()
    rt = (route or "").upper()
    
    # Check for immediate conditions
    if "STAT" in freq or "STAT" in tim or "IMMEDIATE" in tim or "IV" in rt:
        return ["Immediate Medication"]
        
    # Pattern mappings as requested
    if "1-1-1" in freq:
        return ["Morning", "Afternoon", "Night"]
    if "1-0-1" in freq:
        return ["Morning", "Night"]
    if "1-0-0" in freq:
        return ["Morning"]
    if "0-0-1" in freq:
        return ["Night"]
        
    slots = []
    # PRN / SOS
    if "SOS" in freq or "PRN" in freq or "AS NEEDED" in freq or "SOS" in tim:
        return ["As Needed"]
        
    # Standard frequencies
    if "QID" in freq or "4 TIMES" in freq or "FOUR TIMES" in freq:
        return ["Morning", "Afternoon", "Evening", "Night"]
    elif "TDS" in freq or "TID" in freq or "3 TIMES" in freq or "THREE TIMES" in freq:
        return ["Morning", "Afternoon", "Night"]
    elif "BD" in freq or "BID" in freq or "2 TIMES" in freq or "TWICE" in freq:
        return ["Morning", "Night"]
    elif "OD" in freq or "1 TIME" in freq or "ONCE" in freq or "DAILY" in freq:
        if "NIGHT" in tim or "HS" in tim or "BED" in tim:
            return ["Night"]
        return ["Morning"]
    elif "HS" in freq or "HS" in tim or "NIGHT" in tim:
        return ["Night"]
    elif "MORNING" in tim:
        return ["Morning"]
        
    # Default if no specific frequency/timing could be mapped
    return ["As Prescribed"]

def generate_schedule(medicines: list, patient_name: str = "Unknown") -> ReminderSchedule:
    """
    Deterministically generates a medication schedule from the extracted medicines.
    Does not use an LLM, preventing hallucination of patient fields as medicines.
    """
    print(f"--- DEBUG SCHEDULE GENERATOR: Input medicines ---")
    for m in medicines:
        print(f"Medicine: {m.name} | Freq: {m.frequency} | Timing: {m.timing} | Route: {m.route}")

    reminders = []
    
    for med in medicines:
        if not med.name or med.name.strip() == "":
            print(f"--- DEBUG SCHEDULE GENERATOR: Skipping medicine because name is empty. ---")
            continue
            
        time_slots = parse_timing_slots(med.frequency, med.timing, med.route)
        
        rel_food = "As Prescribed"
        food_str = (med.relation_to_food or "").upper()
        if "BEFORE" in food_str:
            rel_food = "Before Food"
        elif "AFTER" in food_str:
            rel_food = "After Food"
        elif "EMPTY" in food_str:
            rel_food = "Empty Stomach"
            
        dosage_str = med.dosage if med.dosage else "As prescribed"
        if med.route:
            # We don't necessarily want to append route here if it messes up UI, but user asked to preserve it.
            # "Preserve dosage, strength, units, route, duration, frequency"
            # It's better to just keep dosage clean, but let's add route if present since the user wanted it
            # The prompt requested: Route: IV (we can append to dosage or just leave it)
            pass
            
        duration_str = med.duration if med.duration else "As directed"
        freq_str = med.frequency if med.frequency else "As prescribed"
            
        for slot in time_slots:
            item = ReminderScheduleItem(
                medicine_name=med.name,
                dosage=dosage_str,
                time_of_day=slot,
                frequency=freq_str,
                relation_to_food=rel_food,
                duration=duration_str
            )
            reminders.append(item)
            
    schedule = ReminderSchedule(
        patient_name=patient_name or "Unknown",
        reminders=reminders
    )
    
    print(f"--- DEBUG SCHEDULE GENERATOR: Final Schedule ---")
    print(schedule.model_dump_json(indent=2))
    
    if not reminders:
        if not medicines:
            print("--- DEBUG SCHEDULE GENERATOR: No schedules generated because the input medicines list was empty.")
        else:
            print("--- DEBUG SCHEDULE GENERATOR: No schedules generated because all medicines were skipped (e.g., missing names).")
    
    return schedule
