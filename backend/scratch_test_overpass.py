
import asyncio
import os
from utils.overpass_client import fetch_nearby_amenities

async def test():
    lat, lng = 12.9716, 77.5946
    print(f"Testing Overpass for {lat}, {lng}...")
    
    # Test 5km
    results = await fetch_nearby_amenities(lat, lng, radius=5000)
    print(f"Found {len(results)} amenities at 5km.")
    for r in results[:5]:
        print(f" - {r['name']} ({r['amenity']}) at {r['lat']}, {r['lng']}")
        
    # Test 10km if needed
    if len(results) < 5:
        results = await fetch_nearby_amenities(lat, lng, radius=10000)
        print(f"Found {len(results)} amenities at 10km.")

if __name__ == "__main__":
    asyncio.run(test())
