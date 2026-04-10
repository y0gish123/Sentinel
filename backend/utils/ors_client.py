"""
OpenRouteService (ORS) async client.
Calls the Directions API to get ETA, distance, and route geometry.
Results are cached during the demo session to ensure fast performance.
ORS returns geometry as encoded polyline string — decoded here to [[lat, lng], ...].
"""
import os
import asyncio
import httpx
from typing import Optional

ORS_BASE = "https://api.openrouteservice.org/v2/directions/driving-car"
_ROUTE_CACHE: dict = {}


def _decode_polyline(encoded: str) -> list:
    """
    Decode a Google-style encoded polyline string into [[lat, lng], ...].
    ORS uses precision=5 (default).
    """
    points = []
    index = 0
    lat = 0
    lng = 0
    length = len(encoded)

    while index < length:
        # Decode latitude
        result, shift, b = 0, 0, 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if result & 1 else result >> 1
        lat += dlat

        # Decode longitude
        result, shift, b = 0, 0, 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if result & 1 else result >> 1
        lng += dlng

        points.append([lat / 1e5, lng / 1e5])

    return points


async def get_route(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> Optional[dict]:
    """
    Call ORS Directions API and return:
    {
        eta_minutes: float,
        distance_km: float,
        geometry: [[lat, lng], ...]   # decoded from encoded polyline
    }
    Returns None on any error.
    """
    cache_key = f"{origin_lat},{origin_lng}->{dest_lat},{dest_lng}"
    if cache_key in _ROUTE_CACHE:
        print(f"[ORS] Cache hit for {cache_key}")
        return _ROUTE_CACHE[cache_key]

    api_key = os.environ.get("ORS_API_KEY", "")
    if not api_key:
        print("[ORS] No ORS_API_KEY found in environment.")
        return None

    payload = {
        "coordinates": [
            [origin_lng, origin_lat],
            [dest_lng, dest_lat],
        ]
    }
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(ORS_BASE, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        route = data["routes"][0]
        segment = route["segments"][0]
        duration_s = segment["duration"]
        distance_m = segment["distance"]

        # ORS returns geometry as an encoded polyline string
        raw_geom = route["geometry"]
        if isinstance(raw_geom, str):
            geometry = _decode_polyline(raw_geom)
        elif isinstance(raw_geom, dict):
            # GeoJSON fallback: coordinates are [lng, lat] — convert to [lat, lng]
            geometry = [[c[1], c[0]] for c in raw_geom.get("coordinates", [])]
        else:
            geometry = []

        result = {
            "eta_minutes": round(duration_s / 60, 1),
            "distance_km": round(distance_m / 1000, 2),
            "geometry": geometry,  # [[lat, lng], ...]
        }
        _ROUTE_CACHE[cache_key] = result
        print(f"[ORS] Route OK: {result['eta_minutes']}min, {result['distance_km']}km, {len(geometry)} points")
        return result

    except Exception as e:
        print(f"[ORS] Route fetch failed: {e}")
        return None
