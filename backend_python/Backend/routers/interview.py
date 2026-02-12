from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio
import base64
import os
import numpy as np
import cv2
import io
from typing import Dict

from Backend.services.live_interview_engine import SESSIONS, submit_answer, ask_llm
from face_for_interviewer.main import InterviewCheatingDetector
from voice_for_interviewer.voice import VoiceEngine
from text_to_voice.audio_gen import transcribe_audio
from email_system.main import send_interview_emails # CRITICAL FIX: Add missing import

router = APIRouter()
REPORT_STATUS = {}

# Background task for report generation (non-blocking)
async def generate_report_async(session_data):
    """Generate interview report in background after termination"""
    try:
        print("📊 HireGen AI - Report Generation Started...")
        from report_genrater.main import create_interview_report
        
        # Run blocking PDF generation in a separate thread to avoid freezing the event loop
        loop = asyncio.get_running_loop()
        report_result = await loop.run_in_executor(
            None, 
            lambda: create_interview_report(
                session_data["history"],
                session_data["resume_data"],
                session_data["photo_path"],
                session_data["warnings"]
            )
        )
        
        # report_result is a dict: {"evaluation": "filename.pdf", "transcript": "filename.pdf"}
        # Files are in reports/ folder relative to report_genrater
        
        if session_data.get("session_id"):
            REPORT_STATUS[session_data["session_id"]] = report_result
            print(f"✅ Report Ready: {report_result}")

        # 📧 EMAIL SYSTEM INTEGRATION
        print("📧 Preparing to send emails...")
        try:
            resume_data = session_data.get("resume_data", {})
            # Normalized structure retrieval
            if not isinstance(resume_data, dict):
                 # Logic for legacy fallback or text-only resume
                 resume_data = {"raw_text": str(resume_data)}
            
            c_name = resume_data.get("name", "Candidate")
            contacts = resume_data.get("contacts", {})
            c_email = contacts.get("email") if isinstance(contacts, dict) else None
            
            if not c_email:
                print("⚠️ Candidate email not found in resume data. Skipping candidate email.")
                c_email = "unknown@example.com" # Fallback or handle appropriately

            # Construct paths
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # Root of backend_python
            report_dir = os.path.join(base_dir, "reports")
            
            # Read files into BytesIO
            eval_path = os.path.join(report_dir, report_result["evaluation"])
            conv_path = os.path.join(report_dir, report_result["transcript"])

            # Use report_genrater's logic to get bytes or read from disk
            # Since create_interview_report returns filenames, we read them.
            
            with open(eval_path, "rb") as f:
                eval_bytes = io.BytesIO(f.read())
            
            # send_interview_emails re-generates transcript from json, but we already have the PDF on disk.
            # To avoid re-generation complexity and potential inconsistency, let's modify the email sender OR just pass valid args.
            # actually send_interview_emails takes message list and generates pdf internally. 
            # AND it takes report_bytes.
            # But we generated both PDFs already. 
            # Looking at email_system/main.py:
            # It expects `conversation_list` to generate transcript PDF.
            # It expects `report_bytes` for the evaluation report.
            # We can pass `eval_bytes` as `report_bytes`.
            # We can pass `session_data["history"]` as `conversation_list`.
            
            # HR Email - USER REQUESTED THIS
            hr_email = "ahadsuri804@gmail.com" # Default/Admin email since no HR portal exists yet

            # Run in executor to avoid blocking
            await loop.run_in_executor(
                None,
                lambda: send_interview_emails(
                    session_data["history"],
                    eval_bytes,
                    c_name,
                    "Hiring Manager",
                    hr_email,
                    c_email
                )
            )
            print("✅ Emails dispatched successfully.")

        except Exception as email_err:
             print(f"❌ Email Sending Failed: {email_err}")
             import traceback
             traceback.print_exc()
            
        print("✅ Report Generation & Email Complete!")
    except Exception as e:
        print(f"❌ Report generation failed: {e}")
        import traceback
        traceback.print_exc()

from fastapi.responses import FileResponse

@router.get("/report_status/{session_id}")
def get_report_status(session_id: str):
    if session_id in REPORT_STATUS:
        report_data = REPORT_STATUS[session_id]
        
        # Handle Dictionary (Evaluation + Transcript)
        if isinstance(report_data, dict):
            state = {"status": "ready"}
            if "evaluation" in report_data:
                state["evaluation"] = os.path.basename(report_data["evaluation"])
            if "transcript" in report_data:
                state["transcript"] = os.path.basename(report_data["transcript"])
            return state
            
        # Handle Single File (Legacy)
        full_path = report_data
        filename = os.path.basename(full_path)
        return {"status": "ready", "filename": filename}
    return {"status": "pending"}

@router.get("/download_report_file/{filename}")
def download_report_file(filename: str):
    if ".." in filename or "/" in filename or "\\" in filename:
        return {"error": "Invalid filename"}
        
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    reports_dir = os.path.join(base_dir, "reports")
    file_path = os.path.join(reports_dir, filename)
    
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/pdf", filename=filename)
    return {"error": "File not found"}

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def send_json(self, session_id: str, data: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(data)

manager = ConnectionManager()

# Initialize engines
voice_engine = VoiceEngine()
# We will create a new detector instance for each session to keep state separate
# or simpler: create it inside the websocket endpoint

# ---------------------------
# Reset Session (Force Fresh Start)
# ---------------------------
@router.post("/reset-session/{session_id}")
async def reset_session(session_id: str):
    if session_id in SESSIONS:
        print(f"🔄 Resetting Session: {session_id}")
        session = SESSIONS[session_id]
        
        # Clear History & State
        session["messages"] = []
        session["answers"] = []
        session["finished"] = False
        session["warnings"] = []
        
        # Regenerate First Question (Greeting)
        try:
            resume_text = session.get("resume", "")
            first_question = ask_llm(resume_text, [])
            session["messages"].append({"role": "assistant", "content": first_question})
        except Exception as e:
            print(f"❌ Error resetting session: {e}")
            first_question = "Welcome back. Let's continue."

        return {"status": "reset", "message": "Session fresh start.", "first_question": first_question}
    
    return {"status": "error", "message": "Session not found."}

@router.websocket("/ws/interview/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    if session_id == "undefined":
        print("❌ Rejected connection with session_id='undefined'")
        await websocket.close(code=1008)
        return

    print(f"🔌 WebSocket Connection Request: {session_id}")
    
    # 1. Accept Connection IMMEDIATELY to avoid 403
    try:
        await websocket.accept()
        print("✅ WebSocket Accepted")
    except Exception as e:
        print(f"❌ WebSocket Accept Failed: {e}")
        return

    # 2. Add to Manager Manually (since we already accepted)
    manager.active_connections[session_id] = websocket

    # 3. Validate Session Exists (FAIL-OPEN STRATEGY)
    if session_id not in SESSIONS:
        print(f"⚠️ Session {session_id} not found in SESSIONS registry. Auto-creating (Fail-Open).")
        # Initialize empty session to allow connection
        SESSIONS[session_id] = {
            "history": [],
            "resume_data": {"raw_text": "Session restored after restart."},
            "warnings": []
        }
        # Do not close! Proceed.
    
    # Initialize session-specific state
    # We use a try-except block for loading the detector to prevent crashes if something is wrong with CV
    detector = None
    try:
        # ⚡ FAST ALERT: 2.0s threshold for warnings (Production Strict Mode)
        detector = InterviewCheatingDetector(camera_index=0, max_suspicious_time=2.0) 
        print("✅ Vision Detector Initialized Successfully!")

    except Exception as e:
        import traceback
        print(f"⚠️ Warning: Vision module failed to load: {e}")
        traceback.print_exc()

    # Initialize warnings list in session if not present
    if session_id in SESSIONS:
        if "warnings" not in SESSIONS[session_id]:
            SESSIONS[session_id]["warnings"] = []

    print(f"✅ Client connected to session {session_id}")

    # 🗣️ SEND INITIAL GREETING (Immediate Start)
    if session_id in SESSIONS:
        session = SESSIONS[session_id]
        # Check if we have an initial greeting prepared
        if "messages" in session:
            last_msg = session["messages"][-1]
            if last_msg["role"] == "assistant":
                greeting = last_msg["content"]
                print(f"👋 Sending Initial Greeting: {greeting[:50]}...")
                
                try:
                    audio_b64 = voice_engine.generate_audio(greeting)
                    SESSIONS[session_id]["state"] = "AI_SPEAKING"
                    await manager.send_json(session_id, {
                        "type": "ai_response",
                        "text": greeting,
                        "audio": audio_b64
                    })
                except Exception as e:
                    print(f"❌ Failed to send initial greeting: {e}")

    terminated = False  # Flag to break loop on disqualification
    try:
        while True and not terminated:
            # ... (keep existing loop structure until video_frame handling) ...
            try:
                message = await websocket.receive()
            except (WebSocketDisconnect, RuntimeError):
                print(f"⚠️ WebSocket disconnected for session {session_id}")
                break
            
            # Message router
            if "text" in message:
                try:
                    data = json.loads(message["text"])
                    msg_type = data.get("type")

                    # ... (skip to video_frame handling) ...

                    # 🔄 RE-INSTATE STATE MACHINE
                    if msg_type == "ai_speech_ended":
                        print(f"✅ AI Finished Speaking. State: WAITING_FOR_RESPONSE")
                        SESSIONS[session_id]["state"] = "WAITING_FOR_RESPONSE"
                        continue

                    if msg_type == "silence_timeout":
                        # Frontend detected silence for > Threshold
                         current_state = SESSIONS[session_id].get("state", "WAITING_FOR_RESPONSE") # Default to WAITING if missing
                         # Allow IDLE or WAITING. strict check only blocks PROCESSING/AI_SPEAKING
                         if current_state in ["AI_SPEAKING", "PROCESSING"]:
                             print(f"⚠️ Silence timeout ignored in state: {current_state}")
                             continue

                         if "silence_count" not in SESSIONS[session_id]:
                            SESSIONS[session_id]["silence_count"] = 0
                         
                         SESSIONS[session_id]["silence_count"] += 1
                         count = SESSIONS[session_id]["silence_count"]
                         print(f"⏳ Silence Reported (Timeout). Count: {count}/3")

                         msg = ""
                         if count == 1:
                             msg = "I’m not receiving your response clearly. Could you please continue?"
                         elif count == 2:
                             msg = "I still can’t hear you. Please confirm if you’re available to continue."
                         elif count == 3:
                             msg = "The Interview has been cancelled due to your poor internet connection. You can leave now, bye."
                         
                         if msg:
                             SESSIONS[session_id]["state"] = "AI_SPEAKING"
                             audio_b64 = voice_engine.generate_audio(msg)
                             await manager.send_json(session_id, {
                                 "type": "ai_response",
                                 "text": msg,
                                 "audio": audio_b64
                             })
                         continue

                    if msg_type == "text":
                        # Legacy text handling or specialized triggers
                        pass 

                    elif msg_type == "submit_audio":
                         # Simple state check (keep existing logic)
                         current_state = SESSIONS[session_id].get("state", "IDLE")

                         # 🎤 HANDLE AUDIO (JSON Base64)
                         b64_audio = data.get("payload")
                         if b64_audio:
                             print("=" * 80)
                             print("🎤 [BACKEND] Audio received from WebSocket")
                             print(f"📊 [BACKEND] Base64 length: {len(b64_audio)} chars")
                             
                             # LOCK STATE to PROCESSING
                             SESSIONS[session_id]["state"] = "PROCESSING"
                             print(f"🔄 [STATE] Changed to PROCESSING")
                             
                             try:
                                 # Remove header if present
                                 if "," in b64_audio:
                                     b64_audio = b64_audio.split(",")[1]
                                 
                                 audio_bytes = base64.b64decode(b64_audio)
                                 print(f"📦 [BACKEND] Decoded audio: {len(audio_bytes)} bytes")
                                 buf = io.BytesIO(audio_bytes)
                                 
                                 # Transcribe
                                 print("🚀 [BACKEND] Calling transcribe_audio()...")
                                 user_text = transcribe_audio(buf)
                                 print(f"📝 [BACKEND] Transcription result: '{user_text}'")
                                 print("=" * 80)
                                 
                                 # 🛑 HALLUCINATION FILTER
                                 hallucinations = ["thank you.", "thanks.", "you.", "the.", "a.", "i.", "bye.", "you", "okay.", "ok."]
                                 is_hallucination = False
                                 if user_text:
                                    clean_text = user_text.strip().lower()
                                    if len(clean_text) < 2: is_hallucination = True
                                    if clean_text in hallucinations: is_hallucination = True
                                 
                                 if user_text and "[NO SPEECH" not in user_text and not is_hallucination:
                                     # Valid Speech -> Reset Silence Count
                                     SESSIONS[session_id]["silence_count"] = 0
                                     
                                     next_q, finished = submit_answer(session_id, user_text)
                                     
                                     if finished:
                                          print("✅ Interview Finished (Audio). sending End Signal.")
                                          SESSIONS[session_id]["state"] = "INTERVIEW_ENDED"
                                          await manager.send_json(session_id, {"type": "interview_end", "message": "Interview Completed"})
                                          
                                          # 📊 Trigger Background Report
                                          if session_id in SESSIONS:
                                              session = SESSIONS[session_id]
                                              data_snapshot = {
                                                  "session_id": session_id,
                                                  "user_id": session.get("user_id"),
                                                  "history": session["messages"],
                                                  "resume_data": session.get("resume_data", {"text": session["resume"]}),
                                                  "photo_path": session.get("photo_path"),
                                                  "warnings": session.get("warnings", [])
                                              }
                                              asyncio.create_task(generate_report_async(data_snapshot))
                                          
                                          await websocket.close(code=1000)
                                          terminated = True

                                     elif next_q:
                                          SESSIONS[session_id]["state"] = "AI_SPEAKING"
                                          audio_b64 = voice_engine.generate_audio(next_q)
                                          await manager.send_json(session_id, {
                                              "type": "ai_response",
                                              "text": next_q,
                                              "audio": audio_b64
                                          })
                                 else:
                                     print("⚠️ Silence/Hallucination detected. Reverting to WAITING.")
                                     SESSIONS[session_id]["state"] = "WAITING_FOR_RESPONSE"
                                     await manager.send_json(session_id, {"type": "resume_listening"})

                             except Exception as e:
                                 print(f"❌ Audio Decode/Process Error: {e}")
                                 SESSIONS[session_id]["state"] = "WAITING_FOR_RESPONSE" # Release lock on error
                                 await manager.send_json(session_id, {"type": "resume_listening"})

                    elif msg_type == "video_frame":
                         # 👁️ PROCESS VIDEO
                         if detector:
                             b64_frame = data.get('payload')
                             if b64_frame:
                                 try:
                                     # ... (decoding logic same as original) ...
                                     if "," in b64_frame: b64_frame = b64_frame.split(',')[1]
                                     img_data = base64.b64decode(b64_frame)
                                     
                                     if len(img_data) == 0:
                                         continue
                                     
                                     print(".", end="", flush=True) # Heartbeat log

                                     np_arr = np.frombuffer(img_data, np.uint8)
                                     frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                                     
                                     if frame is not None:
                                        _, warnings = detector.process_frame(frame)
                                        
                                        if warnings:
                                            # Send warning to frontend
                                            warning_msg = warnings[-1]
                                            print(f"⚠️ VIOLATION SENT: {warning_msg}")
                                            await manager.send_json(session_id, {
                                                "type": "warning",
                                                "message": warning_msg
                                            })

                                            # 💾 SAVE WARNING TO SESSION FOR REPORT
                                            if session_id not in SESSIONS:
                                                SESSIONS[session_id] = {
                                                    "state": "IDLE",
                                                    "conversation": [],
                                                    "violations": {},
                                                    "warnings": []
                                                }
                                            if "warnings" not in SESSIONS[session_id]:
                                                SESSIONS[session_id]["warnings"] = []
                                                
                                                from datetime import datetime
                                                ts = datetime.now().strftime("%I:%M:%S %p")
                                                SESSIONS[session_id]["warnings"].append(f"[{ts}] {warning_msg}")
                                        
                                        # 📸 CHECK & SAVE BEST PHOTO (Continuous Update)
                                        # This ensures we have a photo even if interview ends naturally
                                        face_bytes = getattr(detector, 'best_face_frame_bytes', None) or getattr(detector, 'latest_frame_bytes', None)
                                        if face_bytes and session_id in SESSIONS:
                                            # We only save if we haven't saved one, or if we found a better one (higher confidence)
                                            # For simplicity, we can overwrite periodically or just check if 'photo_path' is missing
                                            session = SESSIONS[session_id]
                                            
                                            # If we have a new best face that hasn't been saved OR we don't have a path yet
                                            # getattr(detector, 'best_face_confidence', 0.0) could be checked but let's just save if we have bytes
                                            # and maybe limit write frequency to avoid disk IO spam.
                                            
                                            # Let's simple-check: IF detector has a NEW best face (we can't easily track "new" without state in detector)
                                            # BUT detector.best_face_frame_bytes is strictly the best so far.
                                            # So let's just save it if it exists. To avoid IO spam, maybe every 30 frames or so?
                                            # Or just check if session doesn't have it yet.
                                            
                                            # Better strategy: Save it once when quality > X, or update sparingly.
                                            # detector already prints "Candidate photo captured!" when it updates best_face_frame_bytes.
                                            
                                            # Let's check if we need to update the file
                                            current_photo_path = session.get("photo_path")
                                            
                                            # If no photo yet, OR detector has a high quality face waiting
                                            if not current_photo_path or (detector.best_face_frame_bytes and detector.best_face_confidence > 0.6):
                                                import uuid
                                                # Use a fixed filename for the session to avoid accumulating files? 
                                                # No, unique is safer for caching issues, but we can overwrite.
                                                # Let's use session_id in filename
                                                frame_filename = f"candidate_{session_id}.jpg"
                                                
                                                # Go up to 'reports' dir (backend_python/reports)
                                                # Current file is in Backend/routers/interview.py -> ../../../reports ??
                                                # No, Backend/routers/.. -> Backend/.. -> backend_python/reports
                                                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                                                reports_dir = os.path.join(base_dir, "reports")
                                                os.makedirs(reports_dir, exist_ok=True)
                                                
                                                save_path = os.path.join(reports_dir, frame_filename)
                                                
                                                # Save
                                                with open(save_path, "wb") as f:
                                                    f.write(face_bytes)
                                                
                                                # Update Session
                                                session["photo_path"] = save_path
                                                # print(f"📸 Session Photo Updated: {save_path}")
                                        
                                        # 🚨 ALWAYS CHECK FOR TERMINATION after every frame
                                        # This ensures immediate termination when any counter hits 3
                                        termination_reason = None
                                        for violation, count in detector.counts.items():
                                            if count >= 3:
                                                termination_reason = f"DISQUALIFIED: {violation.upper()} violation limit reached (3/3)"
                                                break
                                        
                                        if termination_reason:
                                            print(f"🚫 {termination_reason}")
                                            
                                            # SET FLAG TO STOP LOOP
                                            terminated = True
                                            
                                            # Save session data for background report generation
                                            session_data_for_report = None
                                            if session_id in SESSIONS:
                                                session = SESSIONS[session_id]
                                                
                                                from datetime import datetime
                                                ts_term = datetime.now().strftime("%I:%M:%S %p")
                                                session["warnings"].append(f"[{ts_term}] {termination_reason}")
                                                
                                                # 📸 CAPTURE PHOTO for Report
                                                last_frame_path = None
                                                face_bytes = getattr(detector, 'best_face_frame_bytes', None) or getattr(detector, 'latest_frame_bytes', None)
                                                
                                                if face_bytes:
                                                     import uuid
                                                     frame_filename = f"candidate_{uuid.uuid4()}.jpg"
                                                     reports_dir = os.path.join(os.path.dirname(__file__), "..", "..", "reports")
                                                     os.makedirs(reports_dir, exist_ok=True)
                                                     last_frame_path = os.path.join(reports_dir, frame_filename)
                                                     
                                                     with open(last_frame_path, "wb") as f:
                                                         f.write(face_bytes)
                                                     print(f"📸 Saved candidate photo: {frame_filename}")
                                                
                                                # Save data for background report generation
                                                session_data_for_report = {
                                                    "session_id": session_id,
                                                    "user_id": session.get("user_id"),  # Added user_id
                                                    "history": session.get("messages", session.get("history", [])),
                                                    "resume_data": {"text": session.get("resume", session.get("resume_data", {}).get("raw_text", ""))},
                                                    "photo_path": last_frame_path,
                                                    "warnings": session.get("warnings", [])
                                                }
                                                
                                                del SESSIONS[session_id]
                                            
                                            # Safe termination block
                                            try:
                                                # ⏳ WAIT so user can see "Warning 3/3" before Modal
                                                print(f"⏳ Waiting 2s before disqualification modal...")
                                                # Use asyncio.sleep to yield control but keep connection alive
                                                await asyncio.sleep(2.0)

                                                # 🚀 Send STOP message IMMEDIATELY
                                                print(f"🚀 Sending STOP message to frontend...")
                                                await manager.send_json(session_id, {
                                                    "type": "stop",
                                                    "reason": termination_reason,
                                                    "report": None  # Report will be generated in background
                                                })
                                                
                                                # Wait a moment for client to process before closing
                                                print(f"⏳ Waiting 1s for frontend to process STOP...")
                                                await asyncio.sleep(1.0)
                                                
                                                print("🔴 Closing WebSocket connection...")
                                                await websocket.close(code=1008)
                                                
                                                # 📊 Generate report in BACKGROUND (non-blocking)
                                                if session_data_for_report:
                                                    asyncio.create_task(generate_report_async(session_data_for_report))
                                            
                                            except Exception as term_err:
                                                print(f"❌ Error during termination sequence: {term_err}")
                                                import traceback
                                                traceback.print_exc()

                                            break  # Exit the while loop


                                 except Exception as e:
                                     # Log CV errors but don't kill the interview
                                     print(f"⚠️ Frame processing error: {e}")
                                     import traceback
                                     traceback.print_exc()

                    elif msg_type == "terminate":
                        print(f"🛑 Terminate signal received from session {session_id}")
                        # Generate Report Immediately
                        if session_id in SESSIONS:
                            session = SESSIONS[session_id]
                            data_snapshot = {
                                "session_id": session_id,
                                "user_id": session.get("user_id"),  # Added user_id
                                "history": session["messages"],
                                "resume_data": {"text": session["resume"]},
                                "photo_path": session.get("photo_path"),
                                "warnings": session.get("warnings", [])
                            }
                            asyncio.create_task(generate_report_async(data_snapshot))
                        
                        await websocket.close(code=1000)
                        terminated = True
                        break

                except Exception as e:
                    import traceback
                    print(f"Error processing message: {e}")
                    traceback.print_exc()

            elif "bytes" in message:
                try:
                    print("🎤 Received Audio Blob")
                    audio_data = message["bytes"]
                    buf = io.BytesIO(audio_data)
                    text = transcribe_audio(buf)
                    print(f"📝 Transcribed: {text}")

                    if text and "[NO SPEECH" not in text:
                        # 🛑 OPTIMIZATION: Ignore very short audio (likely noise/echo)
                        # This prevents wasting API calls on "the", "um", etc. which cause 429s.
                        if len(text.split()) < 2:
                            print(f"⚠️ Ignoring short audio ('{text}') to save API calls.")
                            await manager.send_json(session_id, {"type": "resume_listening"})
                            return # Skip processing

                        next_q, report = submit_answer(session_id, text)
                        
                        if report:
                             print("✅ Interview Finished (Report Generated)")
                             await manager.send_json(session_id, {"type": "report", "report": report})
                             await websocket.close(code=1000)
                             terminated = True
                        elif next_q:
                             # Generate Audio Response
                             audio_b64 = voice_engine.generate_audio(next_q)
                             await manager.send_json(session_id, {
                                "type": "ai_response", 
                                "text": next_q, 
                                "audio": audio_b64
                             })
                    else:
                        print("⚠️ Silence or unintelligible audio.")
                except Exception as e:
                    print(f"❌ Audio processing error: {e}")
                    import traceback
                    traceback.print_exc()

    except WebSocketDisconnect:
        print(f"🔌 Client disconnected from session {session_id}")
        # 📊 Trigger Report on Disconnect
        if session_id in SESSIONS:
             print(f"💾 Generating report for disconnected session {session_id}...")
             session = SESSIONS[session_id]
             data_snapshot = {
                 "session_id": session_id,
                 "user_id": session.get("user_id"),  # Added user_id
                 "history": session["messages"],
                 "resume_data": {"text": session["resume"]},
                 "photo_path": session.get("photo_path"),
                 "warnings": session.get("warnings", [])
             }
             asyncio.create_task(generate_report_async(data_snapshot))
             
             # Clean up
             del SESSIONS[session_id]
             
        manager.disconnect(session_id)
        
    except Exception as e:
        import traceback
        print(f"❌ Error in websocket: {e}")
        traceback.print_exc()
        manager.disconnect(session_id)
