import os
from crewai import Agent, Task, LLM
from agents.detection_agent import detect_task
from agents.triage_agent import triage_task
from pydantic import BaseModel
from typing import List

gemini_llm = LLM(model="gemini/gemini-2.5-flash", api_key=os.environ.get("GEMINI_API_KEY", "dummy"))

class DispatchOutput(BaseModel):
    services_dispatched: List[str]
    ems_eta_minutes: int
    alert_message: str
    hospital_notified: bool
    hospital_message: str
    reroute_suggestion: str
    incident_id: str

dispatch_agent = Agent(
    role='Emergency Dispatch Coordinator',
    goal='Coordinate the full emergency response based on accident severity.',
    backstory='''You are a senior emergency dispatch coordinator.
Given a triage severity score and accident location, you:
1. Determine which services to dispatch (ambulance, police, fire, etc.)
2. Calculate a realistic estimated arrival time based on typical urban traffic conditions.
3. Generate a structured alert message with GPS, severity, and instructions.
4. Recommend a nearby theoretical hospital based on the GPS region, if score >= 7.
5. Suggest realistic traffic reroute for surrounding roads.
You are calm, decisive, and precise. Every response you generate
goes directly to emergency services — accuracy is critical.
Incident ID format: SENTINEL-[DATE]-[RANDOM_3_DIGITS]

Output: services_dispatched (list), ems_eta_minutes (int),
alert_message (str), hospital_notified (bool), hospital_message (str),
reroute_suggestion (str), incident_id (str)''',
    verbose=True,
    allow_delegation=False,
    llm=gemini_llm
)

dispatch_task = Task(
    description='Given triage data and detection output context, Dispatch emergency services. Generate full alert. Return all dispatch details.',
    agent=dispatch_agent,
    expected_output='JSON with all dispatch fields listed in backstory',
    context=[detect_task, triage_task],
    output_pydantic=DispatchOutput
)
