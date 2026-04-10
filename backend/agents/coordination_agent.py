"""
Multi-Agency Coordination Agent (V4)
Scouts real-world OSM data via Overpass API.
Orchestrates Hospital, Police, and Fire response via Gemini 2.5 Strategic Reasoning.
Uses OpenRouteService (ORS) for high-fidelity routing.
"""
import json
import os
import asyncio
import re
import random
import logging
from google import genai
from utils.ors_client import get_route as get_osrm_route
from utils.overpass_client import fetch_nearby_amenities

logger = logging.getLogger(__name__)

async def _calculate_medical_capability(name: str, specialty: str, severity: int) -> int:
    """
    Tactical scoring for medical facilities based on incident profile.
    10: Level 1 Trauma / Gov General
    8: Multi-specialty Hospital / Medical Center
    5: Standard Clinic / Nursing Home
    1: Inappropriate Specialty (Heart/Eye/Dental/etc) for Trauma
    """
    name_l = name.lower()
    spec_l = specialty.lower() if specialty else ""
    
    score = 5
    # Tier 1: Primary Trauma Assets
    if any(kw in name_l for kw in ["trauma", "tertiary", "level 1", "level i", "government", "victoria hospital", "nimhans"]):
        score = 10
    # Tier 2: General Hospitals
    elif any(kw in name_l for kw in ["hospital", "medical center", "multispeciality", "general hospital"]):
        score = 8
        
    # Penalty: Specialized non-trauma clinics
    mismatch_keywords = ["heart", "cardiac", "eye", "vision", "dental", "skin", "fertility", "ayurvedic", "nursing home", "clinic"]
    if any(kw in name_l or kw in spec_l for kw in mismatch_keywords):
        # Even if it calls itself a 'hospital', if it contains 'Heart' etc, penalize for trauma
        score = max(1, score - 7)
        
    return score

async def run_coordination(
    accident_lat: float,
    accident_lng: float,
    severity_score: int,
    vehicles_detected: int,
    incident_type: str,
    vehicle_types: list = None,
    fire_rescue_requested: bool = False,
    manager=None,
) -> dict:
    """
    1. Fetch nearby amenities from Overpass (auto-expanding radius).
    2. Group by type.
    3. Calculate real-time OSRM ETAs.
    4. Gemini Strategic Decision for all 3 agencies.
    """

    async def _log(msg: str, category: str = "COORDINATION"):
        if manager:
            await manager.broadcast({"type": "log", "message": msg, "category": category})

    await _log("Strategic Intelligence Engine engaged.", "COORDINATION")
    
    # --- TACTICAL SCOUTING LOGIC (Consolidated Tiered Search) ---
    accumulated_amenities = []
    seen_ids = set()
    
    # Progressively expand scouting radius: 5km -> 15km -> 35km
    for radius in [5000, 15000, 35000]:
        await _log(f"Scouting emergency footprint (Radius: {radius/1000}km)...", "COORDINATION")
        amenities = await fetch_nearby_amenities(accident_lat, accident_lng, radius=radius)
        
        # Merge unique new results
        for a in amenities:
            if a.get("id") not in seen_ids:
                accumulated_amenities.append(a)
                seen_ids.add(a.get("id"))
        
        # Check if we have a minimal viable response set: 5 Hospitals, 3 Police, 2 Fire
        hospital_excludes = ["eye", "dental", "ayurvedic", "skin", "fertility", "women", "maternity", "child", "pediatric", "paediatric", "veterinary", "heart", "cardiac"]
        hospitals = [a for a in accumulated_amenities if a["amenity"] == "hospital" and not any(kw in a.get("name", "").lower() for kw in hospital_excludes)]
        police = [a for a in accumulated_amenities if a["amenity"] == "police"]
        fire = [a for a in accumulated_amenities if a["amenity"] == "fire_station"]
        
        if len(hospitals) >= 5 and len(police) >= 3 and len(fire) >= 2:
            await _log(f"Sufficient tactical assets localized at {radius/1000}km.", "COORDINATION")
            break

    # Final filtering and fallback safety
    if not hospitals:
        # Emergency fallback for names if NO DATA exists in 35km - but still use incident location
        hospitals = [{"name": "Zone-Alpha Mobile Medical", "lat": accident_lat + 0.05, "lng": accident_lng + 0.05, "amenity": "hospital"}]
    
    if not police:
        police = [{"name": "Regional Precinct Support", "lat": accident_lat - 0.03, "lng": accident_lng - 0.02, "amenity": "police"}]
    
    if not fire:
        fire = [{"name": "Aerial Suppression Unit", "lat": accident_lat + 0.04, "lng": accident_lng - 0.04, "amenity": "fire_station"}]

    # --- GEOSPATIAL PRE-SORT (Euclidean Optimization) ---
    # Sort all candidates by rough distance to ensure we scout the NEAREST ones first
    def _euclidean_sort(facility):
        return ((facility["lat"] - accident_lat)**2 + (facility["lng"] - accident_lng)**2)**0.5

    hospitals.sort(key=_euclidean_sort)
    police.sort(key=_euclidean_sort)
    fire.sort(key=_euclidean_sort)

    await _log(f"Strategic assets localized: {len(hospitals)} Hospital | {len(police)} Police | {len(fire)} Fire. Optimized proximity sort active.", "COORDINATION")

    async def _scout_candidates(candidates: list, max_c: int = 5):
        await _log(f"Scouting {len(candidates)} candidates from origin {accident_lat}, {accident_lng}", "COORDINATION")
        tasks = [get_osrm_route(accident_lat, accident_lng, c["lat"], c["lng"]) for c in candidates[:max_c]]
        routes = await asyncio.gather(*tasks)
        results = []
        for c, r in zip(candidates, routes):
            if r:
                await _log(f"ORS Route localized for {c['name']}: {r['distance_km']}km, {r['eta_minutes']}min", "COORDINATION")
                results.append({**c, "eta_minutes": r["eta_minutes"], "distance_km": r["distance_km"], "geometry": r["geometry"]})
            else:
                # Euclidean fallback with high-fidelity KM conversion (Approx 111.32 km per degree at equator)
                # In Bangalore (13°N), 1 deg lat ~ 110.6 km, 1 deg lng ~ 108.5 km. 111 is a fair middle ground.
                dist = ((c["lat"]-accident_lat)**2 + (c["lng"]-accident_lng)**2)**0.5 * 111
                eta = round(dist * 2.5, 1) # Estimated at ~24km/h average city response
                await _log(f"Routing Service unreachable. Euclidean fallback for {c['name']} to {accident_lat},{accident_lng}: {dist:.2f}km", "COORDINATION")
                results.append({**c, "eta_minutes": eta, "distance_km": round(dist, 2), "geometry": [[accident_lat, accident_lng], [c["lat"], c["lng"]]]})
        return results

    await _log("Optimizing tactical trajectories via Primary Routing Engine (ORS)...", "COORDINATION")
    tasks = [
        _scout_candidates(hospitals, max_c=5),
        _scout_candidates(police, max_c=5),
        _scout_candidates(fire, max_c=3)
    ]
    scouted_hospitals, scouted_police, scouted_fire = await asyncio.gather(*tasks)

    # Sort
    scouted_hospitals.sort(key=lambda x: x["eta_minutes"])
    hospital_candidates = scouted_hospitals[:5]

    await _log("Unified Coordination Protocol initiated...", "COORDINATION")
    
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise Exception("Strategic Reasoning Engine (Gemini) API Key not configured.")

    try:
        client = genai.Client(api_key=api_key)
        
        # Enrich candidate data for better reasoning
        context = {
            "incident": {
                "severity": severity_score, 
                "vehicles": vehicles_detected, 
                "vehicle_types": vehicle_types or [],
                "fire_rescue_requested": fire_rescue_requested,
                "description": incident_type,
                "urgency": "EMERGENT" if severity_score >= 7 else "URGENT"
            },
            "options": {
                "hospitals": [
                    {
                        "name": h["name"], 
                        "eta": h["eta_minutes"], 
                        "distance": h["distance_km"],
                        "specialty": h.get("specialty", "General Emergency"),
                        "capability_rank": await _calculate_medical_capability(h["name"], h.get("specialty"), severity_score)
                    } for h in hospital_candidates
                ],
                "police": [{"name": p["name"], "eta": p["eta_minutes"]} for p in scouted_police[:5]],
                "fire": [{"name": f["name"], "eta": f["eta_minutes"]} for f in scouted_fire[:3]]
            }
        }

        prompt = f"""You are the SENTINEL Lead Dispatcher. 
Analyze telemetry for a {incident_type} (Severity {severity_score}/10).

MISSION CONTEXT:
HOSPITAL ASSETS: {json.dumps(context["options"]["hospitals"], indent=2)}
POLICE ASSETS: {json.dumps(context["options"]["police"], indent=2)}
FIRE ASSETS: {json.dumps(context["options"]["fire"], indent=2)}

STRATEGIC DIRECTIVES:
1. Hospital selection MUST prioritize high Capability Ranks for severe trauma.
2. AVOID specialized clinics (Heart, Eye, Dental) even if they are closer.
3. If Capability Rank is < 5, only select if no other options exist.
4. Police selection should be the nearest responder for scene securing.
5. Fire Response (fire_station) is SPECIALIZED support only. 
   - DO NOT allocate Fire solely based on severity score.
   - ALLOCATE FIRE ONLY IF fire_rescue_requested = true in context or incident profile suggests heavy asset involvement (Truck/Bus).
   - If not required, set "fire_station" to "" and exclude "fire" from "services".

RESPONSE FORMAT (JSON ONLY):
{{
  "hospital": "Exact name from list",
  "police_station": "Exact name from list",
  "fire_station": "Exact name from list or ''",
  "services": ["ambulance", "police", "fire"],
  "allocation_reasoning": "...",
  "risk_justification": "...",
  "confidence": 0.99
}}
"""

        resp = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        text = re.sub(r"^```[a-z]*\n?", "", resp.text.strip())
        text = re.sub(r"\n?```$", "", text)
        decision = json.loads(text)
        
        # Select assignments
        best_h = next((h for h in hospital_candidates if h["name"] == decision.get("hospital")), hospital_candidates[0] if hospital_candidates else None)
        best_p = next((p for p in scouted_police if p["name"] == decision.get("police_station")), scouted_police[0] if scouted_police else None)
        best_f = None
        fire_request = decision.get("fire_station")
        if fire_request and scouted_fire:
            best_f = next((f for f in scouted_fire if f["name"] == fire_request), scouted_fire[0])

        await _log(f"Mission Plan Finalized: {best_h['name']} targeted.", "COORDINATION")
        
        return {
            "selected_hospital": best_h["name"] if best_h else "N/A",
            "hospital_location": {"lat": best_h["lat"], "lng": best_h["lng"]} if best_h else None,
            "hospital_eta": best_h["eta_minutes"] if best_h else 0,
            "hospital_route": best_h.get("geometry", []) if best_h else [],
            "hospital_specialty": best_h.get("specialty", "Trauma Hub") if best_h else "N/A",
            
            "selected_police": best_p["name"] if best_p else "N/A",
            "police_location": {"lat": best_p["lat"], "lng": best_p["lng"]} if best_p else None,
            "police_eta": best_p.get("eta_minutes", 0) if best_p else 0,
            
            "selected_fire": best_f["name"] if best_f else "N/A",
            "fire_location": {"lat": best_f["lat"], "lng": best_f["lng"]} if best_f else None,
            "fire_eta": best_f.get("eta_minutes", 0) if best_f else 0,
            
            "services_dispatched": decision.get("services", ["ambulance", "police"]),
            "allocation_reasoning": decision.get("allocation_reasoning", "Strategic allocation complete."),
            "risk_justification": decision.get("risk_justification", "Triage-based risk mitigation."),
            "confidence_score": decision.get("confidence", 0.95),
            "hospital_candidates": [
                {
                    "name": h["name"],
                    "eta_minutes": h["eta_minutes"],
                    "distance_km": h["distance_km"],
                    "capability_rank": await _calculate_medical_capability(h["name"], h.get("specialty"), severity_score)
                } for h in hospital_candidates
            ],
            "alternatives": [
                {
                    "name": h["name"],
                    "eta_minutes": h["eta_minutes"],
                    "distance_km": h["distance_km"],
                    "rejection_reason": "Optimized based on specialty/ETA ratio."
                } for h in hospital_candidates if h["name"] != (best_h["name"] if best_h else "")
            ]
        }

    except Exception as e:
        logger.exception(f"[COORDINATION] Reasoning engine failed: {e}")
        best_h = hospital_candidates[0] if hospital_candidates else None
        
        return {
            "selected_hospital": best_h["name"] if best_h else "N/A",
            "hospital_location": {"lat": best_h["lat"], "lng": best_h["lng"]} if best_h else None,
            "hospital_eta": best_h["eta_minutes"] if best_h else 0,
            "hospital_route": best_h.get("geometry", []) if best_h else [],
            "hospital_specialty": "Emergency Response",
            "selected_police": scouted_police[0]["name"] if scouted_police else "City Police",
            "selected_fire": scouted_fire[0]["name"] if scouted_fire else "Fire Rescue",
            "services_dispatched": ["ambulance", "police"],
            "allocation_reasoning": "Fallback routing active. Intelligence engine unreachable.",
            "confidence_score": 0.4,
            "hospital_candidates": [
                {
                    "name": h["name"],
                    "eta_minutes": h["eta_minutes"],
                    "distance_km": h["distance_km"],
                    "capability_rank": 5
                } for h in hospital_candidates
            ],
            "alternatives": []
        }

