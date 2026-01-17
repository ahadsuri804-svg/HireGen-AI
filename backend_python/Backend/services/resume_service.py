import os
from resume.OCR import process_resume

UPLOAD_DIR = "uploads/resumes"   # must match where frontend saves resumes

def parse_resume(user_id: str):
    """
    Finds user's uploaded resume and runs OCR on it
    """

    pdf_path = os.path.join(UPLOAD_DIR, f"{user_id}.pdf")

    if not os.path.exists(pdf_path):
        print("❌ Resume not found:", pdf_path)
        return {
            "name": "",
            "skills": [],
            "experience": "",
            "education": "",
            "raw_text": ""
        }

    print("📄 Parsing resume:", pdf_path)

    face_img, structured_data = process_resume(pdf_path)

    return structured_data
