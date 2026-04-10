import asyncio, sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv('../.env')
from utils.ors_client import get_route

async def test():
    r = await get_route(12.9716, 77.5946, 12.9602, 77.6449)
    if r:
        print(f'SUCCESS: ETA={r["eta_minutes"]}min, dist={r["distance_km"]}km, pts={len(r["geometry"])}')
        print(f'First point: {r["geometry"][0]}')
    else:
        print('FAILED: returned None')

asyncio.run(test())
