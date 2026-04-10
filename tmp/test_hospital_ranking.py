import asyncio
import os
import sys

# Add backend to path to import coordination_agent
sys.path.append('c:/Users/saroj/OneDrive/Desktop/SENTINEL/backend')

from agents.coordination_agent import _calculate_medical_capability

async def test_ranking():
    test_cases = [
        {"name": "Jayanagar heart Centre", "specialty": "Cardiology"},
        {"name": "Shanti Hospital", "specialty": "General"},
        {"name": "Victoria Hospital", "specialty": "Trauma"},
        {"name": "Eye Care Clinic", "specialty": "Ophthalmology"},
    ]
    
    print(f"{'Facility Name':<30} | {'Score'}")
    print("-" * 40)
    for tc in test_cases:
        score = await _calculate_medical_capability(tc['name'], tc['specialty'], 9)
        print(f"{tc['name']:<30} | {score}")

if __name__ == "__main__":
    asyncio.run(test_ranking())
