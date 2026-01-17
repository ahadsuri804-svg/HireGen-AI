import subprocess
import uuid
import os

# Absolute path to project root
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# This is where controler.py lives
CV_ROOT = BASE_DIR

RUNNING = {}

def start_interview(user_id):
    session_id = str(uuid.uuid4())

    print(">>> Launching controller in:", CV_ROOT)

    process = subprocess.Popen(
        ["python", "controler.py", user_id],
        cwd=CV_ROOT,
        shell=True
    )

    RUNNING[session_id] = process
    return session_id


def stop_interview(session_id):
    if session_id in RUNNING:
        RUNNING[session_id].terminate()
        del RUNNING[session_id]
