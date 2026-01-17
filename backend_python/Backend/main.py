from fastapi import UploadFile, File, Form
import os
import shutil

from dotenv import load_dotenv
load_dotenv()   # 🔐 This makes OPENAI_API_KEY visible inside venv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from Backend.services.live_interview_engine import create_session, submit_answer
from Backend.services.resume_service import parse_resume


# ---------------------------
# FastAPI app
# ---------------------------
app = FastAPI()


# ---------------------------
# CORS for React (Vite)
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    try:
        filename = f"{user_id}.pdf"
        save_path = os.path.join(UPLOAD_DIR, filename)

        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print("✅ Resume saved:", save_path)

        return {
            "status": "success",
            "filename": filename,
            "path": save_path
        }

    except Exception as e:
        print("❌ Resume upload failed:", e)
        return {"error": str(e)}


# ---------------------------
# Request Models
# ---------------------------
class StartReq(BaseModel):
    user_id: str


class AnswerReq(BaseModel):
    session_id: str
    answer: str


# ---------------------------
# Start Interview
# ---------------------------
@app.post("/start-live-interview")
def start_live(req: StartReq):
    print("🚀 HireGen AI Engine Starting")
    print("🎯 Interview for user:", req.user_id)

    # 1️⃣ Parse resume
    resume_data = parse_resume(req.user_id)

    # 2️⃣ Create AI interview session
    session_id, first_question = create_session(req.user_id, resume_data)

    return {
        "session_id": session_id,
        "question": first_question
    }


# ---------------------------
# Submit Answer
# ---------------------------
@app.post("/submit-live-answer")
def submit_live(req: AnswerReq):
    next_question, report = submit_answer(req.session_id, req.answer)

    # Interview finished
    if report:
        return {
            "finished": True,
            "report": report
        }

    # Next question
    return {
        "finished": False,
        "question": next_question
    }
