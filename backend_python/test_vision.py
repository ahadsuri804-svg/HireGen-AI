import sys
import os

print("🔍 Starting Vision Module Test...")
try:
    print("re: Importing InterviewCheatingDetector...")
    from face_for_interviewer.main import InterviewCheatingDetector
    print("✅ Import Successful.")
except Exception as e:
    print(f"❌ Import Failed: {e}")
    sys.exit(1)

try:
    print("re: Initializing Detector (Nano, Strict)...")
    detector = InterviewCheatingDetector(max_suspicious_time=1.0)
    print("✅ Init Successful.")
except Exception as e:
    print(f"❌ Init Failed: {e}")
    sys.exit(1)

try:
    print("re: Loading YOLO Model (yolov8n.pt)...")
    detector.load_model()
    print("✅ Model Load Successful.")
except Exception as e:
    print(f"❌ Model Load Failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("🎉 TEST COMPLETED: Vision Module is Healthy.")
