"""
SENTINEL AI — Advanced Agentic Pipeline (v2)
4 Agents: Detection → Triage → Resource Intelligence → Dispatch
Streams all logs via WebSocket. NEVER raises — always returns a valid dict.
"""
import os
import asyncio
import uuid
import time
import re
from datetime import datetime
from utils.yolo_runner import run_yolo_detection
from agents.coordination_agent import run_coordination
import json

# Demo fallbacks
DEFAULT_LAT = 12.9716
DEFAULT_LNG = 77.5946


async def _log(manager, msg: str, category: str = "SYSTEM"):
    if manager:
        await manager.broadcast({"type": "log", "message": msg, "category": category})


def _rule_based_triage(detection: dict) -> dict:
    vehicles = detection.get("vehicles_detected", 0)
    confidence = detection.get("confidence", 0)
    if vehicles >= 2 and confidence >= 0.7:
        return {
            "severity_score": 8,
            "severity_label": "CRITICAL",
            "triage_reasoning": (
                f"Rule-based: {vehicles} vehicles, {confidence:.0%} confidence. "
                "High-speed collision likely. Immediate response required."
            ),
            "mechanism_of_injury": "High kinetic energy transfer.",
            "priority_level": "EMERGENT",
            "fire_rescue_needed": True,
            "entrapment_probability": 0.65,
            "head_trauma_risk": 0.85,
            "thoracic_trauma_risk": 0.75,
            "spinal_trauma_risk": 0.60
        }
    return {
        "severity_score": 4,
        "severity_label": "MODERATE",
        "triage_reasoning": (
            f"Rule-based: {vehicles} vehicles, {confidence:.0%} confidence. "
            "Moderate impact. Police response recommended."
        ),
        "mechanism_of_injury": "Medium kinetic energy transfer.",
        "priority_level": "URGENT",
        "fire_rescue_needed": False,
        "entrapment_probability": 0.1,
        "head_trauma_risk": 0.4,
        "thoracic_trauma_risk": 0.3,
        "spinal_trauma_risk": 0.2
    }


def _llm_triage(detection: dict, gps_str: str) -> dict | None:
    try:
        from google import genai
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            return None
        client = genai.Client(api_key=api_key)
        
        vehicle_info = ", ".join(detection.get('vehicle_types', [])) or "Unknown"
        
        prompt = f"""You are a SENTINEL Emergency Trauma Specialist.
Analyze this high-fidelity traffic anomaly detection:
- Vehicles Impacted: {detection.get('vehicles_detected', '?')}
- Vehicle Types: {vehicle_info}
- Collision Dynamics (Conf): {detection.get('confidence', 0):.0%}
- Sector Coordinates: {gps_str}

Your mission is rapid-response trauma profiling using Mechanism of Injury (MOI) analysis. 
Analyze the physical forces involved to predict patient outcomes and resource needs:

1. **Kinetic Energy & Deceleration**: Based on vehicle types and impact confidence, evaluate the likely G-forces. (e.g., Car vs Car = High; Truck vs Car = Critical).
2. **Passenger Compartment Intrusion**: Predict the likelihood of cabin collapse or dashboard displacement based on impact dynamics.
3. **Trauma Profiling**: Estimate the anatomical risk factors:
   - **Head Trauma**: Acceleration/deceleration injury risk.
   - **Thoracic**: Blunt force chest impact risk against steering/dashboard.
   - **Spinal**: Whiplash or axial loading risk.

Respond with ONLY this exact JSON (no markdown):
{{
  "severity_score": <1-10 integer based on impact energy>,
  "severity_label": "<MINOR|MODERATE|CRITICAL>",
  "triage_reasoning": "<highly clinical analysis including predicted victim count and specific trauma predictions>",
  "mechanism_of_injury": "<detailed analysis of impact vectors and kinetic energy transfer>",
  "priority_level": "<EMERGENT|URGENT|ROUTINE>",
  "fire_rescue_needed": <true/false>,
  "entrapment_probability": <float 0.0 to 1.0>,
  "head_trauma_risk": <float 0.0 to 1.0>,
  "thoracic_trauma_risk": <float 0.0 to 1.0>,
  "spinal_trauma_risk": <float 0.0 to 1.0>
}}"""
        resp = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        text = re.sub(r"^```[a-z]*\n?", "", resp.text.strip())
        text = re.sub(r"\n?```$", "", text)
        return json.loads(text)
    except Exception as e:
        print(f"[SENTINEL] LLM triage failed: {e}")
        return None


def _build_dispatch(severity_score: int, severity_label: str, resource: dict, incident_id: str, gps_str: str, fire_needed: bool = False) -> dict:
    hospital = resource.get("selected_hospital", "Nearest Hospital")
    eta = resource.get("eta_minutes", 5)

    # Core required services
    services = ["Ambulance", "Police"]
    
    # Unified Dispatch Logic: Only add Fire if specifically requested by Triage/Coordination
    if fire_needed:
        services.append("Fire Department")

    if severity_score >= 7:
        hospital_notified = True
        hospital_message = (
            f"TRAUMA ALERT → {hospital}. Specialty: {resource.get('hospital_specialty', 'N/A')}. "
            f"Incoming critical patient. ETA: {eta} min. GPS: {gps_str}."
        )
        reroute = "Traffic rerouted via alternate corridors. Expect 15-min delay on affected roads."
    elif severity_score >= 4:
        hospital_notified = True
        hospital_message = (
            f"Alert → {hospital}. Moderate incident. Patient en route. ETA: {eta} min."
        )
        reroute = "Minor congestion expected. Drive cautiously."
    else:
        # For minor incidents, we might only need Police for traffic control
        if severity_score < 3 and not fire_needed:
            services = ["Police"]
        hospital_notified = False
        hospital_message = "Hospital not notified — minor incident."
        reroute = "No significant traffic disruption."

    return {
        "services_dispatched": services,
        "ems_eta_minutes": int(eta),
        "hospital_notified": hospital_notified,
        "hospital_message": hospital_message,
        "reroute_suggestion": reroute,
        "incident_id": incident_id,
        "alert_message": (
            f"SENTINEL ALERT [{incident_id}] — "
            f"{', '.join(services)} dispatched to {gps_str}. "
            f"Hospital: {hospital}. ETA: {int(eta)} min."
        ),
    }


async def run_pipeline(video_path: str, lat: float = DEFAULT_LAT, lng: float = DEFAULT_LNG, label: str = "BGLR: MISSION_SECTOR", manager=None) -> dict:
    start_time = time.time()
    timestamp = datetime.now().isoformat()
    incident_id = f"SENTINEL-{uuid.uuid4().hex[:6].upper()}"
    lat_dir = "N" if lat >= 0 else "S"
    lng_dir = "E" if lng >= 0 else "W"
    gps_str = f"{abs(lat):.4f}° {lat_dir}, {abs(lng):.4f}° {lng_dir} | {label}"

    try:
        # ── STAGE 1: Detection ────────────────────────────────────────────────
        await _log(manager, "Initializing YOLOv8 Vision Engine...", "DETECTION")

        detection = await asyncio.to_thread(run_yolo_detection, video_path, incident_id=incident_id)

        crash = detection.get("crash_detected", False)
        conf = detection.get("confidence", 0.0)
        vehicles = detection.get("vehicles_detected", 0)
        snapshot = detection.get("snapshot_url")
        total_f = detection.get("frame_number", 0)
        flagged_f = detection.get("flagged_frames", 0)

        await _log(manager, f"Scan pulse complete: {total_f} frames processed.", "DETECTION")
        await _log(manager, "Analyzing spatial anomalies and vehicle dynamics...", "DETECTION")

        if not crash:
            await _log(manager, "No incident detected. Standby mode active.", "DETECTION")
            result = {
                "status": "NO_ACCIDENT", "crash_detected": False,
                "confidence": conf, "vehicles_detected": vehicles,
                "frame_number": total_f,
                "incident_id": incident_id, "timestamp": timestamp,
                "gps_coordinates": gps_str, "severity_score": 0,
                "severity_label": "NONE",
                "incident_type": None,
                "triage_reasoning": "No accident — triage not required.",
                "services_dispatched": [], "ems_eta_minutes": 0,
                "hospital_notified": False, "hospital_message": "",
                "reroute_suggestion": "", "alert_message": "No incident.",
                "selected_hospital": None, "route_geometry": [],
                "distance_km": 0, "hospital_lat": None, "hospital_lng": None,
                "lat": lat, "lng": lng,
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
            if manager:
                await manager.broadcast({"type": "result", "data": result})
            return result

        await _log(manager, f"DETECTION SUMMARY: {total_f} frames scanned | {flagged_f} flagged anomalies.", "DETECTION")
        await _log(manager, f"INCIDENT PACKAGE PREPARED. Dispatching visual evidence...", "DETECTION")
        
        if snapshot and manager:
            await manager.broadcast({
                "type": "event", 
                "message": "Critical incident evidence extracted.", 
                "image_url": snapshot, 
                "category": "DETECTION"
            })
            
        await _log(manager, "Passing to Triage Agent for clinical assessment...", "DETECTION")

        # ── STAGE 2: Triage ───────────────────────────────────────────────────
        await _log(manager, "Initiating Clinical Triage Protocol...", "TRIAGE")

        triage = _llm_triage(detection, gps_str)
        if triage is None:
            await _log(manager, "Primary Triage Engine offline — applying rule-based fallback.", "TRIAGE")
            triage = _rule_based_triage(detection)
        else:
            await _log(manager, "LLM Strategic Triage complete.", "TRIAGE")

        score = triage.get("severity_score", 4)
        label = "CRITICAL" if score >= 7 else ("MODERATE" if score >= 4 else "MINOR")
        reasoning = triage.get("triage_reasoning", "")
        mechanism = triage.get("mechanism_of_injury", "Mechanism unspecified.")
        priority = triage.get("priority_level", "NORMAL")
        fire_needed = triage.get("fire_rescue_needed", False)

        await _log(manager, f"Severity Assessment: {label} ({score}/10) [PRIORITY: {priority}]", "TRIAGE")
        await _log(manager, f"Rationale: {reasoning}", "TRIAGE")
        await _log(manager, f"Mechanism: {mechanism}", "TRIAGE")
        if fire_needed:
            await _log(manager, "SPECIALIZED TASKING REQUIRED: Fire/Rescue unit requested.", "TRIAGE")

        if manager:
            await manager.broadcast({
                'type': 'triage_complete',
                'data': {
                    'severity_score': score,
                    'severity_label': label,
                    'triage_reasoning': reasoning,
                    'mechanism_of_injury': mechanism,
                    'priority_level': priority,
                    'fire_rescue_needed': fire_needed,
                    'entrapment_probability': triage.get("entrapment_probability", 0.0),
                    'head_trauma_risk': triage.get("head_trauma_risk", 0.0),
                    'thoracic_trauma_risk': triage.get("thoracic_trauma_risk", 0.0),
                    'spinal_trauma_risk': triage.get("spinal_trauma_risk", 0.0)
                }
            })

        # ── STAGE 3: Multi-Agency Coordination ───────────────────────────────
        await _log(manager, "Calculating Multi-Agency Response Matrix...", "COORDINATION")
        incident_type = f"{vehicles}-vehicle accident" if vehicles > 1 else "Single-vehicle incident"
        
        coordination = await run_coordination(
            lat, lng, 
            severity_score=score, 
            vehicles_detected=vehicles, 
            incident_type=incident_type,
            vehicle_types=detection.get("vehicle_types", []),
            fire_rescue_requested=triage.get("fire_rescue_needed", False),
            manager=manager
        )

        # Map to unified schema immediately
        resource = {
            "selected_hospital": coordination.get("selected_hospital"),
            "eta_minutes": coordination.get("hospital_eta", 5),
            "hospital_specialty": coordination.get("hospital_specialty"),
            "hospital_lat": coordination.get("hospital_location", {}).get("lat"),
            "hospital_lng": coordination.get("hospital_location", {}).get("lng"),
            "route_geometry": coordination.get("hospital_route", []),
            "reasoning": coordination.get("allocation_reasoning") or "Strategic placement finalized.",
            "confidence_score": coordination.get("confidence_score", 0.9),
            "hospital_candidates": coordination.get("hospital_candidates", []),
            "alternatives": coordination.get("alternatives", []),
            
            # Map selected police/fire to flat keys for UI
            "selected_police": coordination.get("selected_police"),
            "police_lat": (coordination.get("police_location") or {}).get("lat"),
            "police_lng": (coordination.get("police_location") or {}).get("lng"),
            "selected_fire": coordination.get("selected_fire"),
            "fire_lat": (coordination.get("fire_location") or {}).get("lat"),
            "fire_lng": (coordination.get("fire_location") or {}).get("lng"),
        }

        # Broadcast coordination result immediately for UI responsiveness (Unified Schema)
        if manager:
            await manager.broadcast({"type": "coordination_complete", "data": resource})

        # ── STAGE 4: Dispatch ─────────────────────────────────────────────────
        await _log(manager, f"Mission Analysis Finalized. Dispatching units...", "DISPATCH")
        
        agent_services = coordination.get("services_dispatched", [])
        dispatch = _build_dispatch(score, label, resource, incident_id, gps_str, fire_needed=fire_needed)
        if agent_services:
            dispatch["services_dispatched"] = agent_services

        await _log(manager, f"Target Acquired: {resource['selected_hospital']}", "DISPATCH")
        await _log(manager, f"Agency Support: {resource['selected_police']} & {resource['selected_fire']}", "DISPATCH")

        status = "INCIDENT DETECTED"

        result = {
            "status": status,
            "incident_id": incident_id,
            "timestamp": timestamp,
            "gps_coordinates": gps_str,
            "crash_detected": True,
            "confidence": conf,
            "vehicles_detected": vehicles,
            "frame_number": detection.get("frame_number", 0),
            "snapshot_url": snapshot,
            "tactical_boxes": detection.get("tactical_boxes", []),
            "severity_score": score,
            "severity_label": label,
            "incident_type": incident_type,
            "triage_reasoning": reasoning or "No reasoning available.",
            "mechanism_of_injury": mechanism or "MOI unspecified.",
            "priority_level": priority or "URGENT",
            "entrapment_probability": triage.get("entrapment_probability", 0.0),
            "head_trauma_risk": triage.get("head_trauma_risk", 0.0),
            "thoracic_trauma_risk": triage.get("thoracic_trauma_risk", 0.0),
            "spinal_trauma_risk": triage.get("spinal_trauma_risk", 0.0),
            
            # Multi-Agency Coordination Results
            **resource,

            # Detail reasoning for the HUD
            "allocation_reasoning": coordination.get("allocation_reasoning"),
            "risk_justification": coordination.get("risk_justification"),

            # Dispatch
            **dispatch,
            "lat": lat,
            "lng": lng,
            "processing_time_ms": int((time.time() - start_time) * 1000)
        }

        await _log(manager, f"✅ MISSION PROFILED: {incident_id}", "DISPATCH")
        if manager:
            await manager.broadcast({"type": "result", "data": result})
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        error_result = {
            "status": "ERROR", "incident_id": incident_id, "timestamp": timestamp,
            "gps_coordinates": gps_str, "crash_detected": False,
            "confidence": 0.0, "vehicles_detected": 0, "frame_number": 0,
            "severity_score": 0, "severity_label": "ERROR",
            "triage_reasoning": f"Pipeline error: {str(e)}",
            "services_dispatched": [], "ems_eta_minutes": 0,
            "hospital_notified": False, "hospital_message": "",
            "reroute_suggestion": "", "alert_message": str(e),
            "selected_hospital": None, "route_geometry": [],
            "distance_km": 0, "hospital_lat": None, "hospital_lng": None,
            "processing_time_ms": int((time.time() - start_time) * 1000)
        }
        if manager:
            await manager.broadcast({"type": "error", "message": str(e)})
            await manager.broadcast({"type": "result", "data": error_result})
        return error_result
