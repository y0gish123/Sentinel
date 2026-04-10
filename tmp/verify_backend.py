import requests
import time

url = "http://localhost:8000/api/start"
payload = {"lat": 12.9716, "lng": 77.5946, "label": "TEST_MISSION"}

print(f"Triggering mission at {url}...")
resp = requests.post(url, json=payload)
print(f"Response: {resp.status_code} - {resp.json()}")

if resp.status_code == 200:
    print("Mission started. Waiting for snapshot...")
    # Wait for pipeline to run (it's in background task)
    for _ in range(30):
        time.sleep(1)
        import os
        uploads = os.listdir("c:/Users/saroj/OneDrive/Desktop/SENTINEL/backend/uploads")
        snapshots = [f for f in uploads if f.startswith("detection_snapshot_SENTINEL")]
        if snapshots:
            print(f"Found unique snapshots: {snapshots}")
            break
    else:
        print("Timeout: No unique snapshot found.")
