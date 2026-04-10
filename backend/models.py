from pydantic import BaseModel, Field
from typing import List, Optional

class IncidentResponse(BaseModel):
    status: str                          # NO_ACCIDENT | UNCERTAIN | MODERATE | CRITICAL
    incident_id: str = ""
    timestamp: str = ""
    gps_coordinates: str = ""

    # Detection
    crash_detected: bool = False
    confidence: float = 0.0
    vehicles_detected: int = 0
    frame_number: int = 0

    # Triage
    severity_score: int = 0
    severity_label: str = ""
    triage_reasoning: str = ""

    # Dispatch
    services_dispatched: List[str] = []
    ems_eta_minutes: int = 0
    hospital_notified: bool = False
    hospital_message: str = ""
    reroute_suggestion: str = ""
    alert_message: str = ""

    # Meta
    message: Optional[str] = None
