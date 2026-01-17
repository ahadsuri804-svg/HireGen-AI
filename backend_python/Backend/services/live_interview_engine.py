import uuid
from typing import Dict, List
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SESSIONS: Dict[str, dict] = {}

SYSTEM_PROMPT = """
You are HireGen-AI, a professional technical interviewer.
Ask one question at a time.
Use candidate resume and previous answers.
Never repeat questions.
Be concise and professional.
"""

def create_session(user_id: str, resume_text: str):
    session_id = str(uuid.uuid4())

    SESSIONS[session_id] = {
        "user_id": user_id,
        "resume": resume_text,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Candidate resume:\n{resume_text}\nStart the interview."}
        ],
        "answers": [],
        "finished": False
    }

    first_question = ask_llm(SESSIONS[session_id]["messages"])
    return session_id, first_question


def ask_llm(messages):
    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.6
    )
    return r.choices[0].message.content


def submit_answer(session_id: str, answer: str):
    session = SESSIONS[session_id]

    session["messages"].append({"role": "user", "content": answer})
    session["answers"].append(answer)

    # Stop after 10 answers
    if len(session["answers"]) >= 10:
        session["finished"] = True
        return None, generate_report(session)

    question = ask_llm(session["messages"])
    return question, None


def generate_report(session):
    messages = [
        {"role": "system", "content": "You are an HR evaluator."},
        {"role": "user", "content": f"Resume:\n{session['resume']}\nAnswers:\n{session['answers']}\nGenerate a hiring report."}
    ]
    return ask_llm(messages)
