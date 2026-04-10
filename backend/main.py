from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from database import save_incident, get_incidents, get_analytics
from models import IncidentResponse
import json
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Base directory for for uploads
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

app = FastAPI(title='SENTINEL AI')

# Mount uploads for detection snapshots
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*']
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                self.disconnect(connection)


manager = ConnectionManager()


async def _run_and_broadcast(video_path: str, lat: float, lng: float, label: str):
    """Run pipeline in background thread, broadcast results."""
    from pipeline import run_pipeline
    try:
        result = await run_pipeline(video_path, lat=lat, lng=lng, label=label, manager=manager)
        # Persist to database (non-critical)
        try:
            save_incident(result)
        except Exception as e:
            print(f"[DB] Non-critical save error: {e}")
    except Exception as e:
        await manager.broadcast({'type': 'error', 'message': str(e)})


@app.post('/api/upload-video')
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    lat: float = Form(12.9716),
    lng: float = Form(77.5946),
    label: str = Form("BGLR: MISSION_SECTOR")
):
    """Accept any uploaded MP4 and run detection pipeline on it."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    # Sanitize filename
    safe_name = os.path.basename(file.filename or 'uploaded.mp4')
    path = os.path.join(UPLOAD_DIR, safe_name)
    contents = await file.read()
    with open(path, 'wb') as f:
        f.write(contents)
    
    # Save as latest for stream-video endpoint
    latest_path = os.path.join(UPLOAD_DIR, 'latest_video.mp4')
    with open(latest_path, 'wb') as f:
        f.write(contents)

    if background_tasks:
        background_tasks.add_task(_run_and_broadcast, path, lat, lng, label)
    return {'status': 'started', 'message': f'Processing {safe_name}. Listen on /ws/pipeline.'}


@app.get('/api/incidents')
async def fetch_incidents():
    return get_incidents()


@app.get('/api/analytics')
async def fetch_analytics():
    return get_analytics()


@app.get('/api/stream-video')
async def stream_video():
    """Serve latest uploaded video with proper Content-Type."""
    path = os.path.join(UPLOAD_DIR, 'latest_video.mp4')
    if not os.path.exists(path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail='Waiting for tactical uplink data...')
    
    return FileResponse(path, media_type='video/mp4', headers={"Accept-Ranges": "bytes"})


@app.get('/api/health')
async def health_check():
    return {'status': 'ok', 'model': 'gemini-2.5-flash', 'database': 'mongodb'}


@app.websocket('/ws/pipeline')
async def pipeline_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
