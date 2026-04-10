"""
OSRM (Open Source Routing Machine) async client.
Fetches real road routes using the public OSRM API.
Falling back to a straight line if the service is unavailable.
"""
import httpx
import asyncio
from typing import Optional, List

OSRM_BASE = "https://router.project-osrm.org/route/v1/driving"

async def get_osrm_route(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float
) -> Optional[dict]:
    """
    Fetch route using OSRM API.
    Returns:
    {
        "eta_minutes": float,
        "distance_km": float,
        "geometry": [[lat, lng], ...]
    }
    """
    url = f"{OSRM_BASE}/{origin_lng},{origin_lat};{dest_lng},{dest_lat}?overview=full&geometries=geojson"
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                print(f"[OSRM] API error: {resp.status_code}")
                return None
            
            data = resp.json()
            if not data.get("routes"):
                return None
            
            route = data["routes"][0]
            duration_s = route["duration"]
            distance_m = route["distance"]
            
            # OSRM returns GeoJSON coordinates as [lng, lat]
            # Convert to [lat, lng] for Leaflet
            geojson_coords = route["geometry"]["coordinates"]
            geometry = [[c[1], c[0]] for c in geojson_coords]
            
            return {
                "eta_minutes": round(duration_s / 60, 1),
                "distance_km": round(distance_m / 1000, 2),
                "geometry": geometry
            }
    except Exception as e:
        print(f"[OSRM] Route fetch failed: {e}")
        return None

def get_straight_line(lat1, lng1, lat2, lng2):
    """Fallback straight line geometry."""
    return [[lat1, lng1], [lat2, lng2]]
