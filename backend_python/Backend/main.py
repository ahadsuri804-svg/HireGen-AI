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
from Backend.routers import interview as interview_router


# ---------------------------
# FastAPI app
# ---------------------------
app = FastAPI()

# Include WebSocket Router
app.include_router(interview_router.router)


# ---------------------------
# CORS for React (Vite)
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

        # 🚀 AUTOMATICALLY START SESSION ON UPLOAD
        print("⚙️ Processing resume & creating session...")
        resume_data = parse_resume(user_id)
        
        # Use RAW TEXT for interview context (Rich Detail)
        resume_text = resume_data.get("raw_text", str(resume_data))
        print(f"📄 Resume Text Extracted: {len(resume_text)} chars")
        
        # Pass FULL resume_data (dict) to preserve Name/Email
        session_id, first_question = create_session(user_id, resume_data)

        print(f"✅ Session created: {session_id}")

        return {
            "status": "success",
            "filename": filename,
            "path": save_path,
            "session_id": session_id  # <--- CRITICAL FIX
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        print("❌ Resume upload failed:", e)
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"error": str(e)})



@app.get("/download-resume/{user_id}")
async def download_resume(user_id: str):
    filename = f"{user_id}.pdf"
    file_path = os.path.join(UPLOAD_DIR, filename)

    if os.path.exists(file_path):
        from fastapi.responses import FileResponse
        return FileResponse(file_path, media_type="application/pdf", filename=f"Resume_{user_id}.pdf")

    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=404, content={"error": "Resume not found"})


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


# Health Check Endpoint
@app.get("/")
async def root():
    return {"message": "HireGen AI Backend - Running on Azure", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "hiregen-backend"}
