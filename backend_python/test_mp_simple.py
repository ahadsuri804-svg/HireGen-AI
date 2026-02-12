import mediapipe as mp
try:
    print(f"MediaPipe Version: {mp.__version__}")
    solutions = mp.solutions
    print("✅ mp.solutions exists")
    face_mesh = mp.solutions.face_mesh
    print("✅ mp.solutions.face_mesh exists")
except AttributeError:
    print("❌ mp.solutions DOES NOT exist")
except Exception as e:
    print(f"❌ Error: {e}")
