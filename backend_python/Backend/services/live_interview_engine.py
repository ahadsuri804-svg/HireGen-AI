import uuid
from typing import Dict, List
from groq import Groq
import os

# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SESSIONS: Dict[str, dict] = {}


def conversational_interviewer(resume_text: str, conversation_history: list, max_turns: int):
    """
    Hybrid conversational interviewer:
    - Warm welcome
    - Uses resume + history to keep continuity
    - Mixes structured + free-flow bonding style
    - Friendly style
    - Counter questions
    - Generates next interviewer line only
    """
    # Convert history list to string for the prompt
    history_text = ""
    if not conversation_history:
        history_text = "No conversation yet. (Start of Interview)"
    else:
        for msg in conversation_history:
            role = "AI Interviewer" if msg["role"] == "assistant" else "Candidate"
            history_text += f"{role}: {msg['content']}\n"

    # Calculate current turn
    current_turn = len([m for m in conversation_history if m["role"] == "assistant"]) + 1
    turns_left = max_turns - current_turn
    
    # Dynamic Instruction based on turn count (HIDDEN SYSTEM CONTEXT)
    stage_instruction = ""
    if current_turn == max_turns:
        stage_instruction = """
        [INTERVIEWER: FINAL TURN - INTERVIEW END]
        Action: Say exactly: "It was great speaking with you today. You will receive your feedback report in few minutes. Thanks for your time!"
        CONSTRAINTS: Do NOT ask any new questions. This is the Goodbye.
        """
    elif current_turn == max_turns - 1:
        stage_instruction = """
        [INTERVIEWER: PENULTIMATE TURN]
        Action: Ask a reflective question about future goals, learning mindset, or next challenges.
        """
    else:
        stage_instruction = "[INTERVIEWER: INTERVIEW PHASE] Continue the interview naturally based on the resume and last answer."

    prompt = f"""
You are *HireGen AI*, a professional, intelligent, and confident AI interviewer yet *very strict AI interviewer capable of raising your tone when necessary.
Your goal is to conduct a *realistic and adaptive hybrid-style interview* with the candidate — maintaining authority, discipline, and professionalism at all times.
You conduct interviews in a human-like tone — similar to top-tier job interviews (e.g., technical panels or CSS-style interviews in Pakistan).

GOAL:
Conduct a complete hybrid interview of around {max_turns} turns, using the candidate’s resume and conversation history.
Ask domain-based, logical, and reasoning-oriented questions — not just superficial or resume-reading ones.
Detect any AI text or vioce (Chatgpt, Gemini, voice versions etc.) patterns and warn the candidate to stop using AI and answer honestly.
    
    Current State:
    - Turn: {current_turn} of {max_turns}
    - {stage_instruction}

    ────────────────────────────────────────
    INTERVIEW FLOW
    ────────────────────────────────────────
    - Total turns: {max_turns}
    - Naturally cover all major areas mentioned in the resume throughout the interview:
      1. Greeting & Introduction
      2. Background & Experience
      3. Domain Expertise: Identify key skills or roles from the resume (like “React Developer”, “Python Engineer”, “Machine Learning Specialist”, or whatever the skills of candidate in resume, etc.).
      - Ask deep, reasoning-oriented questions around those topics.
      - Example: If the resume mentions React → ask about React hooks, state management, optimization, or debugging logic.
      - Example: If Python → ask about OOP concepts, algorithm logic, or real-world code reasoning.
      4. Technical Concepts & Understanding: 
      - Ask progressively tougher and more analytical questions.
      - Include logical reasoning and conceptual depth.
      - Avoid repeating resume facts; focus on problem-solving thinking.
      5. Projects & Problem-Solving
      - Ask them to explain or defend choices they made in projects — why, how, tradeoffs.
      6. Coding / Logical Thinking
      7. Scenario-Based & Behavioral Questions: 
      - Give small scenarios — “Suppose you are leading a team and face X issue…” and ask how they’d respond.
      8. Personality & Soft Skills
      9. Reflection / closing round:
      - Ask about future goals, learning mindset, or challenges.
      10. Wrap-Up (closing remarks)
    ────────────────────────────────────────
    STRICT BEHAVIOR PROTOCOL (NON-NEGOTIABLE)
    ────────────────────────────────────────
    1. **ONE QUESTION ONLY**:
       - You must ask EXACTLY ONE clear question per turn.
       - NEVER ask multiple questions at once.

    2. **STRICT MISBEHAVIOR HANDLING**:
       - If the candidate shows: Mocking, Role Confusion (thinking they are the interviewer), Fake Identity, AI PLAGIARISM, Intentional Derailment, or Refusal to answer seriously.
       - ACTION: STOP IMMEDIATELY.
       - OUTPUT ONLY: `[TERMINATE]`
       - DO NOT give warnings. DO NOT argue. Just terminate.

    3. **LISTENER-FIRST MENTALITY**:
       - Acknowledge the previous answer briefly only if relevant (e.g., "I see.", "Understood.").
       - Do not be overly verbose. Keep it professional.
       - Do not "hallucinate" or invent candidate responses.

    4. **NO META-COMMENTARY**:
       - Do not include (instructions), [notes], or prefix text like "Interviewer:".
       - Speak potential direct dialogue ONLY.

    5. **STYLE & BEHAVIOR**:
       - Always begin with:
         "Welcome candidate with complete name mentioned in his/her resume to the HireGen AI Interview, how are you? Can you please introduce yourself?”
       - Maintain a realistic, human-like tone — professional yet natural.
       - Be adaptive and emotionally intelligent:
         * Sometimes curious or reflective.
         * Sometimes firm and commanding.
       - Combine *structured assessment* with *free-flow conversation*.
       - If the candidate is using AI, you can ask them to stop using AI and answer honestly.
       - Dont use commands like "Let's continue the interview. Here's my next question:"
       - Use brief rapport-building phrases occasionally, such as:
         “I see.”, “That’s interesting.”, “Go on.”, “That’s impressive.”
       - Keep each interviewer line concise (1–2 sentences max).
       - Avoid robotic lists or numbering during the interview — sound like a real human interviewer.
       - Ensure smooth topic transitions across turns for a natural flow.
       - Maintain authority: if the candidate gives a slightly non-serious or inappropriate response,
         Don't ask more questions issue *one clear warning* only. If it happens again, immediately end the interview by saying *"Due to your Non-Serious Behavior, We are ending this interview. Bye"* — no further dialogue.
       - When approaching the final turn:
         * Thank the candidate courteously.
         * End gracefully:** thank the candidate and close the session politely, like:
           “It was great speaking with you today. You will receive your feedback report in few minutes. Thanks for your time!”

    CONTEXT:
    Candidate Resume:
    {resume_text}

    Conversation History:
    {history_text}
    
    ACTION:
    Generate the *next interviewer line only* — short, realistic, context-aware, and aligned with your personality.
    """

    try:
        print(f"🔹 Sending request to Groq (llama-3.1-8b-instant)...")
        
        # Retry logic for rate limits
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.6,
                    max_tokens=150
                )
                content = response.choices[0].message.content.strip()
                
                # Safety cleanup
                if content.startswith("Interviewer:"):
                    content = content.replace("Interviewer:", "").strip()
                
                return content
            except Exception as e:
                if "rate_limit" in str(e).lower() or "429" in str(e):
                    if attempt < max_retries - 1:
                        wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                        print(f"⚠️ Rate limit hit. Retrying in {wait_time}s... (Attempt {attempt + 1}/{max_retries})")
                        import time
                        time.sleep(wait_time)
                        continue
                    else:
                        print(f"❌ Rate limit exceeded after {max_retries} retries")
                        return "I apologize, we're experiencing technical difficulties. Let's continue in a moment."
                else:
                    raise  # Re-raise if not a rate limit error
                    
    except Exception as e:
        print(f"❌ LLM Error in conversational_interviewer: {e}")
        import traceback
        traceback.print_exc()
        return f"Could you please clarify that?"


# ------------------------------------------------------------------
#  API WRAPPERS (To maintain compatibility with controller/routers)
# ------------------------------------------------------------------

def ask_llm(resume_text: str, messages_history: list):
    """Wrapper to call conversational_interviewer"""
    return conversational_interviewer(resume_text, messages_history, max_turns=10)

def get_interviewer_prompt(resume_text: str, conversation_history: str, max_turns: int = 10):
    """Deprecated but kept for safety if needed internally"""
    return "" 

def create_session(user_id: str, resume_data):
    session_id = str(uuid.uuid4())

    # Handle both string (legacy) and dict (new) resume data
    if isinstance(resume_data, dict):
        resume_text = resume_data.get("raw_text", "")
        # Fallback if raw_text is empty but other fields exist
        if not resume_text:
            resume_text = str(resume_data)
    else:
        resume_text = str(resume_data)
        resume_data = {"raw_text": resume_text} # Normalize

    SESSIONS[session_id] = {
        "user_id": user_id,
        "resume": resume_text,        # For LLM context
        "resume_data": resume_data,   # For Email/Report (Name, Email)
        # We still keep 'messages' for internal history tracking & report generation
        "messages": [], 
        "answers": [],
        "finished": False
    }

    # Generate First Question (Greeting)
    # Empty history for start
    first_question = ask_llm(resume_text, [])
    
    # Add to internal messages so AI knows it asked
    # Add timestamp
    from datetime import datetime
    ts = datetime.now().strftime("%I:%M:%S %p")
    
    SESSIONS[session_id]["messages"].append({
        "role": "assistant", 
        "content": first_question,
        "timestamp": ts
    })
    
    return session_id, first_question

def submit_answer(session_id: str, answer: str):
    session = SESSIONS[session_id]

    # Store User Answer
    # Add timestamp
    from datetime import datetime
    ts_user = datetime.now().strftime("%I:%M:%S %p")
    
    session["messages"].append({
        "role": "user", 
        "content": answer,
        "timestamp": ts_user
    })
    session["answers"].append(answer)

    # Stop after 10 answers? 
    # LOGIC CHANGE: If we just received the 9th answer (len=9), we generate the 10th (Goodbye).
    # We return (Goodbye, TRUE) so the system speaks it and then ends immediately.
    
    if len(session["answers"]) >= 9:
        # Generate Final Question (Goodbye)
        question = ask_llm(session["resume"], session["messages"])
        
        # Store AI Question (Goodbye)
        ts_ai = datetime.now().strftime("%I:%M:%S %p")
        session["messages"].append({
            "role": "assistant", 
            "content": question,
            "timestamp": ts_ai
        })
        
        # Mark as finished immediately so we don't wait for user response
        session["finished"] = True
        return question, True  # <--- FINISHED = TRUE with a message

    # Normal Flow (Turns 1-8)
    question = ask_llm(session["resume"], session["messages"])
    
    # Store AI Question
    ts_ai = datetime.now().strftime("%I:%M:%S %p")
    session["messages"].append({
        "role": "assistant", 
        "content": question,
        "timestamp": ts_ai
    })
    
    return question, False
