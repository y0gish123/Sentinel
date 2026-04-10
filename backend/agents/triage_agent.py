import os
from crewai import Agent, Task, LLM
from agents.detection_agent import detect_task
from pydantic import BaseModel

gemini_llm = LLM(model="gemini/gemini-2.5-flash", api_key=os.environ.get("GEMINI_API_KEY", "dummy"))

class TriageOutput(BaseModel):
    severity_score: int
    severity_label: str
    triage_reasoning: str
    recommended_response: str

triage_agent = Agent(
    role='Emergency Medical Triage Specialist',
    goal='Assess the severity of a detected accident and produce a severity score.',
    backstory='''You are a trained emergency medical dispatcher and triage expert.
When given accident detection data, you reason carefully about the likely
severity. You consider: number of vehicles involved, whether the road
is blocked, visible injuries, time of day, traffic density, and location.
You do NOT just classify — you reason step-by-step before scoring.

Your severity score is 1-10 where:
1-3 = Minor (fender bender, no injuries likely),
4-6 = Moderate (significant damage, possible injuries),
7-10 = Critical (major collision, injuries likely, road blocked).
Always provide your full reasoning, not just the score.
Output: severity_score (int), severity_label (str), reasoning (str),
recommended_response (str: ambulance/police/both/all)''',
    verbose=True,
    allow_delegation=False,
    llm=gemini_llm
)

triage_task = Task(
    description=(
        'Given structured accident data from the previous detection task, reason step-by-step about the severity. '
        'Evaluate the severity based on the number of vehicles involved, confidence, and context from the crash video data. '
        'Think analytically about the safety implications based on the GPS coordinates block. '
        'Return severity_score, severity_label, triage_reasoning, and recommended_response.'
    ),
    agent=triage_agent,
    expected_output='JSON: {severity_score, severity_label, reasoning, recommended_response}',
    context=[detect_task],
    output_pydantic=TriageOutput
)
