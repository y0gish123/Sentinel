"""
Overpass API client for OpenStreetMap (OSM) data.
Fetches nearby emergency amenities (hospitals, police, fire stations).
Uses a 5km (5000m) radius by default.
"""
import httpx
from typing import List, Dict

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

async def fetch_nearby_amenities(lat: float, lng: float, radius: int = 5000) -> List[Dict]:
    """
    Fetch hospitals, police, and fire stations from OSM.
    Returns a unified list of elements with 'amenity', 'name', 'lat', 'lng'.
    """
    # Expand tags to be more inclusive
    query = f"""
    [out:json][timeout:25];
    (
      nwr["amenity"~"^(hospital|police|fire_station|ambulance_station)$"](around:{radius},{lat},{lng});
      nwr["healthcare"="hospital"](around:{radius},{lat},{lng});
      nwr["emergency"~"^(ambulance|fire_extinguisher|fire_water_inlet)$"](around:{radius},{lat},{lng});
    );
    out center;
    """
    
    try:
        # Increase timeout for complex radius queries
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(OVERPASS_URL, params={'data': query})
            if resp.status_code == 429:
                import asyncio
                print("[OVERPASS] Rate limited. Waiting...")
                await asyncio.sleep(2)
                resp = await client.get(OVERPASS_URL, params={'data': query})
            
            resp.raise_for_status()
            data = resp.json()
            
            elements = []
            seen_ids = set()
            
            for el in data.get("elements", []):
                elem_id = el.get("id")
                if not elem_id or elem_id in seen_ids:
                    continue
                    
                tags = el.get("tags", {})
                amenity = tags.get("amenity") or tags.get("healthcare") or tags.get("emergency") or "unknown"
                name = tags.get("name") or f"Unnamed {amenity}"
                
                # 'out center' provides 'center' for ways/relations, and 'lat'/'lon' for nodes
                e_lat = el.get("lat") or el.get("center", {}).get("lat")
                e_lng = el.get("lon") or el.get("center", {}).get("lon")
                
                if e_lat is None or e_lng is None:
                    continue
                
                # Map to standard categories
                cat = "hospital"
                if "police" in str(amenity).lower(): cat = "police"
                if "fire" in str(amenity).lower(): cat = "fire_station"
                if "hospital" in str(amenity).lower(): cat = "hospital"
                    
                elements.append({
                    "id": elem_id,
                    "name": name,
                    "amenity": cat,
                    "lat": e_lat,
                    "lng": e_lng,
                    "specialty": tags.get("speciality") or tags.get("healthcare:speciality") or "Emergency Care"
                })
                seen_ids.add(elem_id)
            
            print(f"[OVERPASS] Scouted {len(elements)} facilities within {radius}m.")
            return elements

            
    except Exception as e:
        print(f"[OVERPASS] Scout failed for {lat},{lng} at {radius}m: {e}")
        return []
