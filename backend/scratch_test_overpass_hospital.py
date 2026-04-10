
import asyncio
import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

async def fetch_nearby_amenities(lat: float, lng: float, radius: int = 5000):
    query = f"""
    [out:json][timeout:25];
    (
      nwr["amenity"~"^(hospital|police|fire_station|ambulance_station)$"](around:{radius},{lat},{lng});
      nwr["healthcare"="hospital"](around:{radius},{lat},{lng});
    );
    out center;
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(OVERPASS_URL, params={'data': query})
        data = resp.json()
        elements = data.get("elements", [])
        return elements

async def main():
    # Central Bangalore
    # lat, lng = 12.9716, 77.5946
    
    # Hebbal Flyover Coords (more realistic)
    lat, lng = 13.0358, 77.5970
    
    print(f"Searching around Hebbal Flyover ({lat}, {lng})...")
    
    for r in [1000, 2000, 3000, 5000]:
        res = await fetch_nearby_amenities(lat, lng, r)
        hospitals = [e for e in res if e.get("tags", {}).get("amenity") == "hospital" or e.get("tags", {}).get("healthcare") == "hospital"]
        print(f"Radius {r}m: Found {len(res)} amenities, {len(hospitals)} hospitals.")
        for h in hospitals[:3]:
            name = h.get("tags", {}).get("name", "Unnamed")
            h_lat = h.get("lat") or h.get("center", {}).get("lat")
            h_lng = h.get("lon") or h.get("center", {}).get("lon")
            dist = ((h_lat - lat)**2 + (h_lng - lng)**2)**0.5 * 111
            print(f"  - {name} (~{dist:.2f}km)")

if __name__ == "__main__":
    asyncio.run(main())
