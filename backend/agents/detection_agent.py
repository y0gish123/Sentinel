import os
from crewai import Agent, Task, LLM
from agents.tools import yolo_detection_tool
from pydantic import BaseModel

gemini_llm = LLM(model="gemini/gemini-2.5-flash", api_key=os.environ.get("GEMINI_API_KEY", "dummy"))

class DetectOutput(BaseModel):
    crash_detected: bool
    frame_number: int
    timestamp: str
    gps_coordinates: str

detection_agent = Agent(
    role='Traffic Accident Detection Specialist',
    goal='Analyze video footage and detect if a traffic accident has occurred.',
    backstory='''You are an expert in computer vision and traffic safety.
You use YOLOv8 to scan every frame of a video feed and identify
accident events: sudden stops, vehicle collisions, debris on road,
vehicles overturned or off-road. You are precise and never miss
a genuine accident. Your output must include: crash_detected (bool),
frame_number (int), timestamp (str), gps_coordinates (str).
If no accident is found, return crash_detected: false.''',
    tools=[yolo_detection_tool],
    verbose=True,
    allow_delegation=False,
    llm=gemini_llm
)

detect_task = Task(
    description='Process the video at {video_path}. Run YOLOv8 detection using the provided tool. Return: crash_detected, frame_number, timestamp, gps_coordinates.',
    agent=detection_agent,
    expected_output='JSON: {crash_detected, frame_number, timestamp, gps_coordinates}',
    output_pydantic=DetectOutput
)
