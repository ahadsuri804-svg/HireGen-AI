import sys
print(f"Python: {sys.version}")
try:
    import mediapipe as mp
    print(f"MediaPipe path: {mp.__file__}")
    print(f"Dir(mp): {dir(mp)}")
    
    try:
        print("Attempting: import mediapipe.python.solutions")
        import mediapipe.python.solutions
        print("Success: import mediapipe.python.solutions")
    except ImportError as e:
        print(f"Failed: import mediapipe.python.solutions - {e}")

    if hasattr(mp, 'solutions'):
        print("mp.solutions exists")
        print(f"Dir(mp.solutions): {dir(mp.solutions)}")
    else:
        print("mp.solutions DOES NOT exist")

except ImportError as e:
    print(f"Failed to import mediapipe: {e}")
