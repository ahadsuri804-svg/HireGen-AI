#  ----------------------------------------------------------------------
#  |   CODE FOR ONLY TERMINAL RUN - command ->  python controler.py     |
#  ----------------------------------------------------------------------

import random
import threading
from dotenv import load_dotenv
import os
from resume.OCR import process_resume
from text_to_voice.audio_gen import run_audio, transcribe_audio
from main_questions_interviewer.main import conversational_interviewer
from face_for_interviewer.main import run_vision_module
from voice_for_interviewer.voice import VoiceEngine
from report_genrater.main import create_interview_report
from email_system.main import send_interview_emails

load_dotenv()

def run_interview():
    voice = VoiceEngine()

    conversation_history = []
    turns = 0
    max_turns = random.randint(15, 18)

    pdf_path = r"D:\FYP-II\HIREGEN-AI\backend_python\resume\MyCV.pdf"
    
    _, structured_json = process_resume(pdf_path)

    stop_event = threading.Event()

    # 👁️ Vision module
    detector = run_vision_module(
        stop_event,
        max_suspicious_time=2.0,
        camera_index=2,
        alert_cooldown=30.0
    )

    vision_thread = threading.Thread(
        target=detector.run,
        args=(stop_event,),
        daemon=True
    )
    vision_thread.start()

    try:
        while turns < max_turns and not stop_event.is_set():
            interviewer_line = conversational_interviewer(
                structured_json,
                conversation_history,
                max_turns
            )

            if interviewer_line == "Bye":
                stop_event.set()
                break

            print(interviewer_line)
            voice.speak(interviewer_line)
            print("🎙️ Recording candidate reply...")
            final_audio = run_audio()

            print("✅ Audio recorded")

            candidate_reply = transcribe_audio(final_audio)
            print("Candidate:", candidate_reply)

            conversation_history.append({
                "interviewer": interviewer_line,
                "candidate": candidate_reply
            })

            turns += 1

        if stop_event.is_set():
            voice.speak(
                "The interview has been canceled due to your non serious behaviour."
            )

    finally:
        stop_event.set()
        vision_thread.join()

    voice.speak("Thanks for your time, see you again!")


    frame_bytes = getattr(detector, "latest_frame_bytes", None)
    warnings = getattr(detector, "warnings", [])

    print("Collected warnings:", warnings)

    report_path = create_interview_report(
        conversation_history,
        structured_json,
        frame_bytes,
        warnings
    )

    candidate_name = structured_json.get("name")
    candidate_email = structured_json.get("contacts", {}).get("email")
    hr_name = os.getenv("HR_NAME")
    hr_email = os.getenv("HR_EMAIL")

    send_interview_emails(
        conversation_list=conversation_history,
        report_bytes=report_path,
        candidate_name=candidate_name,
        hr_name=hr_name,
        hr_email=hr_email,
        candidate_email=candidate_email
    )


if __name__ == "__main__":
    print("🚀 Controller started")
    run_interview()
    print("🎯 Controller finished")

#  ---------------------------------------------------------------------------------------------------
#  |   TRY FOR CONNECTION WITH REACT FRONTENED - command ->  python -m uvicorn Backend.main:app      |
#  ---------------------------------------------------------------------------------------------------


# import sys
# import os
# import random
# import threading
# from dotenv import load_dotenv

# from resume.OCR import process_resume
# from text_to_voice.audio_gen import run_audio, transcribe_audio
# from main_questions_interviewer.main import conversational_interviewer
# from face_for_interviewer.main import run_vision_module
# from voice_for_interviewer.voice import VoiceEngine
# from report_genrater.main import create_interview_report
# from email_system.main import send_interview_emails

# load_dotenv()

# BASE = os.path.dirname(os.path.abspath(__file__))
# UPLOADS = os.path.join(BASE, "Backend", "uploads")

# def get_user_resume(user_id):
#     for f in os.listdir(UPLOADS):
#         if f.startswith(f"{user_id}_resume"):
#             return os.path.join(UPLOADS, f)
#     raise FileNotFoundError("Resume not found for user")

# def run_interview(user_id):
#     voice = VoiceEngine()

#     print("🎯 Interview for user:", user_id)

#     pdf_path = get_user_resume(user_id)
#     _, structured_json = process_resume(pdf_path)

#     conversation_history = []
#     stop_event = threading.Event()

#     detector = run_vision_module(
#         stop_event,
#         max_suspicious_time=2.0,
#         camera_index=0,
#         alert_cooldown=30.0
#     )

#     vision_thread = threading.Thread(target=detector.run, args=(stop_event,), daemon=True)
#     vision_thread.start()

#     turns = 0
#     max_turns = random.randint(12, 18)

#     try:
#         while turns < max_turns and not stop_event.is_set():
#             question = conversational_interviewer(structured_json, conversation_history, max_turns)

#             if question == "Bye":
#                 break

#             print("AI:", question)
#             voice.speak(question)

#             print("🎤 Recording answer…")
#             audio = run_audio()
#             answer = transcribe_audio(audio)

#             print("Candidate:", answer)

#             conversation_history.append({
#                 "interviewer": question,
#                 "candidate": answer
#             })

#             turns += 1

#         if stop_event.is_set():
#             voice.speak("The interview was canceled due to suspicious behavior.")

#     finally:
#         stop_event.set()
#         vision_thread.join()

#     voice.speak("Thank you. The interview is complete.")

#     frame = getattr(detector, "latest_frame_bytes", None)
#     warnings = getattr(detector, "warnings", [])

#     report = create_interview_report(conversation_history, structured_json, frame, warnings)

#     send_interview_emails(
#         conversation_list=conversation_history,
#         report_bytes=report,
#         candidate_name=structured_json.get("name"),
#         candidate_email=structured_json.get("contacts", {}).get("email"),
#         hr_name=os.getenv("HR_NAME"),
#         hr_email=os.getenv("HR_EMAIL")
#     )


# if __name__ == "__main__":
#     user_id = sys.argv[1]
#     print("🚀 HireGen AI Engine Starting")
#     run_interview(user_id)