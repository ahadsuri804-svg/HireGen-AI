import uuid
import os
import json
from typing import List, Dict, Any
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ================== ENV + PATHS ==================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SESSION_DIR = os.path.join(BASE_DIR, "sessions")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(SESSION_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ================== PROMPTS ==================

QUESTION_PROMPT = """
You are a professional job interviewer.

Here is the candidate resume (JSON):
{resume}

Generate {n} interview questions tailored to this candidate.

Return ONLY valid JSON in this format:
[
  {{
    "id": "q1",
    "text": "Question here"
  }}
]
"""

REPORT_PROMPT = """
You are an expert hiring manager.

Resume:
{resume}

Interview Q&A:
{qa}

Return ONLY valid JSON:
{{
  "summary": "short paragraph",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "verdict": "Hire / Maybe / Reject"
}}
"""

# ================== UTILS ==================

def _session_path(session_id):
    return os.path.join(SESSION_DIR, f"{session_id}.json")

def _save(session):
    with open(_session_path(session["session_id"]), "w", encoding="utf-8") as f:
        json.dump(session, f, indent=2)

def _load(session_id):
    path = _session_path(session_id)
    if not os.path.exists(path):
        raise FileNotFoundError("Session not found")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

# ================== CORE LOGIC ==================

def generate_questions(parsed_resume: dict, n=8):
    prompt = QUESTION_PROMPT.format(
        resume=json.dumps(parsed_resume, indent=2),
        n=n
    )

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You generate structured interview questions"},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )

    raw = res.choices[0].message.content.strip()

    import re
    m = re.search(r"\[.*\]", raw, re.DOTALL)
    return json.loads(m.group(0))

# ================== API FUNCTIONS ==================

def create_interview_session(user_id, parsed_resume, num_questions=8):
    questions = generate_questions(parsed_resume, num_questions)

    session = {
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "parsed_resume": parsed_resume,
        "questions": questions,
        "answers": [],
        "current_index": 0,
        "finished": False,
        "report": None
    }

    _save(session)
    return session


def load_session(session_id):
    return _load(session_id)


def save_answer(session_id, question_id, answer_text):
    session = _load(session_id)

    session["answers"].append({
        "question_id": question_id,
        "answer": answer_text
    })

    session["current_index"] += 1

    if session["current_index"] >= len(session["questions"]):
        session["finished"] = True
        session["report"] = generate_report_for_session(session)

    _save(session)
    return session


def generate_report_for_session(session):
    qa = []
    for i, q in enumerate(session["questions"]):
        ans = ""
        if i < len(session["answers"]):
            ans = session["answers"][i]["answer"]
        qa.append(f"{q['text']} -> {ans}")

    prompt = REPORT_PROMPT.format(
        resume=json.dumps(session["parsed_resume"], indent=2),
        qa="\n".join(qa)
    )

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are an expert hiring manager"},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )

    raw = res.choices[0].message.content.strip()

    import re
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    return json.loads(m.group(0))
