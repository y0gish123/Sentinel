import asyncio
import os
from pipeline import run_pipeline
from dotenv import load_dotenv

load_dotenv()

class MockManager:
    async def broadcast(self, msg):
        print(f"WS BROADCAST: {msg}")

async def test():
    manager = MockManager()
    video_path = '../demo_videos/crash_sample.mp4'
    if not os.path.exists(video_path):
        print(f"Video not found: {video_path}")
        return
    print("Starting test pipeline...")
    result = await run_pipeline(video_path, manager=manager)
    print("RESULT:", result)

if __name__ == "__main__":
    asyncio.run(test())
