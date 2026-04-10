from crewai import Crew
from agents.detection_agent import detection_agent, detect_task
from agents.triage_agent import triage_agent, triage_task
from agents.dispatch_agent import dispatch_agent, dispatch_task
import asyncio
import time

def run_sentinel_pipeline(video_path: str, manager=None, _retry=0) -> dict:
    crew = Crew(
        agents=[detection_agent, triage_agent, dispatch_agent],
        tasks=[detect_task, triage_task, dispatch_task],
        verbose=True,
        process='sequential',
        max_rpm=30
    )

    # Kickoff the pipeline
    try:
        result = crew.kickoff(inputs={'video_path': video_path})
    except Exception as e:
        err_str = str(e)
        # Handle 429 rate limit: wait the suggested retry delay then retry (max 3 times)
        if '429' in err_str and _retry < 3:
            import re
            delay_match = re.search(r'retry in (\d+)', err_str)
            wait = int(delay_match.group(1)) + 5 if delay_match else 65
            print(f"[SENTINEL] Rate limited. Waiting {wait}s before retry {_retry+1}/3...")
            time.sleep(wait)
            return run_sentinel_pipeline(video_path, manager=manager, _retry=_retry+1)
        raise e

    # Aggregate data from the three tasks into a single flat dict for IncidentResponse
    try:
        d_out = detect_task.output.pydantic.model_dump() if detect_task.output.pydantic else {}
        t_out = triage_task.output.pydantic.model_dump() if triage_task.output.pydantic else {}
        dis_out = dispatch_task.output.pydantic.model_dump() if dispatch_task.output.pydantic else {}

        # Merge all into one dictionary matching IncidentResponse model
        incident_data = {**d_out, **t_out, **dis_out}
        return incident_data

    except Exception as e:
        print(f"Failed to parse pydantic outputs from CrewAI: {e}")
        return {
            "incident_id": "ERR-001",
            "timestamp": "unknown",
            "gps_coordinates": "unknown",
            "crash_detected": True,
            "frame_number": 0,
            "severity_score": 0,
            "severity_label": "ERROR",
            "triage_reasoning": "Pipeline failed to output structured response.",
            "services_dispatched": [],
            "ems_eta_minutes": 0,
            "hospital_notified": False,
            "hospital_message": "Error",
            "reroute_suggestion": "Error",
            "alert_message": str(result)
        }
