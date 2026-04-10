from crewai.tools import tool
from utils.yolo_runner import run_yolo_detection

@tool("YOLO_Crash_Detection")
def yolo_detection_tool(video_path: str) -> dict:
    """Runs YOLOv8 model on the video path to detect crash events."""
    import os
    from datetime import datetime
    
    # Run the underlying function
    res = run_yolo_detection(video_path)
    
    # Add dummy gps and timestamp
    res['timestamp'] = datetime.now().isoformat()
    res['gps_coordinates'] = f"{os.getenv('MOCK_GPS_LAT', '12.9716')} N, {os.getenv('MOCK_GPS_LNG', '77.5946')} E"
    return res
