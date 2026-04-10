"""
YOLO Runner — loads model ONCE globally, processes every 3rd frame.
Returns crash_detected, confidence, vehicles_detected, frame_number, status.
"""
import cv2
import os
import itertools
import logging

logger = logging.getLogger(__name__)

CLASS_NAMES = {2: "Car", 3: "Motorcycle", 5: "Bus", 7: "Truck"}

# ── Load model once at module import time ──────────────────────────────────
_model = None

def _get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO
        model_path = os.getenv('YOLO_MODEL_PATH', 'yolov8n.pt')
        _model = YOLO(model_path)
        print("[SENTINEL] YOLO model loaded globally.")
    return _model


def calculate_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    inter = max(0, xB - xA + 1) * max(0, yB - yA + 1)
    if inter == 0:
        return 0.0
    aA = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
    aB = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)
    return inter / float(aA + aB - inter)


def run_yolo_detection(video_path: str, incident_id: str = "default") -> dict:
    """
    Scan up to 150 frames (every 3rd frame) of the video.
    Returns a structured detection result.
    """
    fallback = {
        'crash_detected': False,
        'confidence': 0.0,
        'vehicles_detected': 0,
        'frame_number': 0,
        'status': 'NO_ACCIDENT'
    }

    if not os.path.exists(video_path):
        print(f"[YOLO] File not found: {video_path}")
        return fallback

    try:
        model = _get_model()
    except Exception as e:
        print(f"[YOLO] Model load error: {e}")
        return fallback

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"[YOLO] Cannot open video: {video_path}")
        return fallback

    frame_num = 0
    best_result = None
    best_conf = 0.0
    all_seen_types = set()
    flagged_frames_count = 0

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame_num += 1

            # Scant up to 300 frames (~10 seconds at 30fps) for better detection window
            if frame_num > 300:
                break

            # Skip 2 out of every 3 frames to save CPU
            if frame_num % 3 != 0:
                continue

            frame_resized = cv2.resize(frame, (640, 640))
            results = model(frame_resized, verbose=False)
            boxes = results[0].boxes

            # Vehicle classes: car=2, motorcycle=3, bus=5, truck=7
            vehicle_boxes = [b for b in boxes if int(b.cls) in [2, 3, 5, 7]]
            
            # Track all unique types seen during the entire scan
            for b in vehicle_boxes:
                all_seen_types.add(CLASS_NAMES.get(int(b.cls), "Unknown"))

            frame_has_crash = False
            if len(vehicle_boxes) >= 2:
                confidences = [float(b.conf) for b in vehicle_boxes]
                avg_conf = sum(confidences) / len(confidences)

                bboxes = [b.xyxy[0].tolist() for b in vehicle_boxes]
                for box1, box2 in itertools.combinations(bboxes, 2):
                    iou = calculate_iou(box1, box2)
                    # Lower IOU threshold (0.05) to catch proximity incidents
                    if iou > 0.05:
                        frame_has_crash = True
                        if avg_conf > best_conf:
                            best_conf = avg_conf
                            
                            tactical_boxes = []
                            # Draw boxes on a copy of the frame for the demo
                            annotated_frame = frame_resized.copy()
                            for bb in bboxes:
                                x1, y1, x2, y2 = map(int, bb)
                                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                                cv2.putText(annotated_frame, "VEHICLE", (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                                
                                tactical_boxes.append({
                                    "left": round((x1 / 640.0) * 100, 2),
                                    "top": round((y1 / 640.0) * 100, 2),
                                    "width": round(((x2 - x1) / 640.0) * 100, 2),
                                    "height": round(((y2 - y1) / 640.0) * 100, 2)
                                })
                            
                            # Save unique snapshot
                            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                            upload_dir = os.path.join(backend_dir, 'uploads')
                            os.makedirs(upload_dir, exist_ok=True)
                            
                            # Unique filename to prevent browser caching
                            snapshot_name = f'detection_snapshot_{incident_id}.jpg'
                            snapshot_path = os.path.join(upload_dir, snapshot_name)
                            cv2.imwrite(snapshot_path, annotated_frame)
                            
                            best_result = {
                                'crash_detected': True,
                                'confidence': round(avg_conf, 3),
                                'vehicles_detected': len(vehicle_boxes),
                                'vehicle_types': list(all_seen_types),
                                'frame_number': frame_num,
                                'snapshot_url': f'/uploads/{snapshot_name}',
                                'tactical_boxes': tactical_boxes,
                                'status': 'CRITICAL' if avg_conf >= 0.7 else 'UNCERTAIN'
                            }
            if frame_has_crash:
                flagged_frames_count += 1
    finally:
        cap.release()

    if best_result:
        best_result['flagged_frames'] = flagged_frames_count
        return best_result

    # No crash found — return best vehicle count we saw
    return {
        'crash_detected': False,
        'confidence': round(best_conf, 3),
        'vehicles_detected': 0,
        'vehicle_types': list(all_seen_types),
        'frame_number': frame_num,
        'status': 'NO_ACCIDENT'
    }

