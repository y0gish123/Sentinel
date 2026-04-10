
import asyncio
from utils.overpass_client import fetch_nearby_amenities

async def test():
    lat, lng = 12.9716, 77.5946
    print(f"Testing Overpass for {lat}, {lng} with 35km radius...")
    results = await fetch_nearby_amenities(lat, lng, radius=35000)
    for r in results:
        if "Vijayalakshmi" in r['name']:
            print(f"FOUND: {r['name']} at {r['lat']}, {r['lng']}")
            # Calculate rough distance
            dist = ((r['lat']-lat)**2 + (r['lng']-lng)**2)**0.5 * 111
            print(f"Rough distance: {dist:.2f} KM")

if __name__ == "__main__":
    asyncio.run(test())
