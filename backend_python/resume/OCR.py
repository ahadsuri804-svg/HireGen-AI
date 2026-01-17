import os
import re
import json
import cv2
import fitz  # PyMuPDF
import numpy as np
import hashlib
import logging
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

# ------------------------------------------------------------------
# ENV SETUP (force load .env from resume folder)
# ------------------------------------------------------------------
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not found in environment")

client = Groq(api_key=GROQ_API_KEY)

# ------------------------------------------------------------------
# LOGGING
# ------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# FACE DETECTOR
# ------------------------------------------------------------------
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# ------------------------------------------------------------------
# LLM PROMPT
# ------------------------------------------------------------------
PROMPT_TEMPLATE = """
You are an expert resume parser.
I will give you raw extracted resume text. You must return only valid JSON,
following this schema:

{{ 
  "name": "string",
  "profession": "string",
  "contacts": {{
    "email": "string",
    "phone": "string",
    "linkedin": "string",
    "github": "string",
    "address": "string"
  }},
  "summary": "string",
  "skills": ["string"],
  "education": [
    {{
      "degree": "string",
      "institution": "string",
      "year": "string"
    }}
  ],
  "projects": [
    {{
      "title": "string",
      "description": "string",
      "technologies": ["string"]
    }}
  ],
  "experience": [
    {{
      "role": "string",
      "company": "string",
      "duration": "string",
      "achievements": ["string"]
    }}
  ]
}}

If some fields are missing in the resume, leave them as empty strings or empty arrays.
Make sure the JSON is valid and strictly follows the schema.

RESUME TEXT:
{text}
"""


# ------------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------------
def sha1_of_bytes(b: bytes) -> str:
    return hashlib.sha1(b).hexdigest()


def contains_face_bytes(img_bytes: bytes) -> bool:
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return False
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.2, minNeighbors=5, minSize=(30, 30)
    )
    return len(faces) > 0


def extract_text_from_pdf(pdf_path: Path) -> str:
    doc = fitz.open(str(pdf_path))
    merged_text = []

    for i, page in enumerate(doc, start=1):
        blocks = page.get_text("blocks")
        blocks = sorted(blocks, key=lambda b: (round(b[1], 1), round(b[0], 1)))
        text_content = "\n".join(b[4].strip() for b in blocks if b[4].strip())
        merged_text.append(f"\n\n--- PAGE {i} ---\n\n{text_content}")

    doc.close()
    return "\n".join(merged_text)


def extract_first_face_bytes(pdf_path: Path):
    doc = fitz.open(str(pdf_path))
    for page_index in range(len(doc)):
        page = doc[page_index]
        for img in page.get_images(full=True):
            xref = img[0]
            base_image = doc.extract_image(xref)
            img_bytes = base_image["image"]
            if contains_face_bytes(img_bytes):
                doc.close()
                return img_bytes
    doc.close()
    return None


def clean_json_response(raw: str) -> str:
    cleaned = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE).strip("` \n")
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    return match.group(0) if match else cleaned


def parse_resume_with_llm(text: str) -> dict:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are an expert resume parser. Output ONLY valid JSON."
            },
            {
                "role": "user",
                "content": PROMPT_TEMPLATE.format(text=text)
            }
        ],
        temperature=0
    )

    raw_output = response.choices[0].message.content.strip()
    cleaned_output = clean_json_response(raw_output)
    return json.loads(cleaned_output)


# ------------------------------------------------------------------
# MAIN PUBLIC FUNCTION (USED BY BACKEND)
# ------------------------------------------------------------------
def process_resume(pdf_path: Path):
    """
    Returns:
      face_bytes (bytes | None),
      structured_resume (dict)
    """
    text = extract_text_from_pdf(pdf_path)
    structured_data = parse_resume_with_llm(text)
    face_bytes = extract_first_face_bytes(pdf_path)
    return face_bytes, structured_data
