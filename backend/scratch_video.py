import cv2
import numpy as np
import os

print("Testing vp80 webm")
out = cv2.VideoWriter('test.webm', cv2.VideoWriter_fourcc(*'vp80'), 30, (640, 640))
if not out.isOpened():
    print("FAILED to open test.webm")
else:
    for _ in range(10):
        frame = np.zeros((640, 640, 3), dtype=np.uint8)
        out.write(frame)
    out.release()
    print("SUCCESS test.webm")

print("Testing avc1 mp4")
out = cv2.VideoWriter('test.mp4', cv2.VideoWriter_fourcc(*'avc1'), 30, (640, 640))
if not out.isOpened():
    print("FAILED to open test.mp4")
else:
    for _ in range(10):
        frame = np.zeros((640, 640, 3), dtype=np.uint8)
        out.write(frame)
    out.release()
    print("SUCCESS test.mp4")
