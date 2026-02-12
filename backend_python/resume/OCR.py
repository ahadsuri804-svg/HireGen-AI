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
try:
    import pytesseract
    from PIL import Image
    import io
    HAS_OCR = True
    # If tesseract is not in PATH, you might need to specify it:
    # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
except ImportError:
    HAS_OCR = False

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


def ocr_image_to_text(img_bytes: bytes) -> str:
    """Helper to run OCR on image bytes using pytesseract."""
    if not HAS_OCR:
        return ""
    try:
        image = Image.open(io.BytesIO(img_bytes))
        return pytesseract.image_to_string(image)
    except Exception as e:
        logger.warning(f"OCR failed: {e}")
        return ""

def extract_text_from_pdf(pdf_path: Path) -> str:
    doc = fitz.open(str(pdf_path))
    merged_text = []
    
    total_text_len = 0

    for i, page in enumerate(doc, start=1):
        # 1. Try standard text extraction
        blocks = page.get_text("blocks")
        blocks = sorted(blocks, key=lambda b: (round(b[1], 1), round(b[0], 1)))
        
        page_text = "\n".join(b[4].strip() for b in blocks if b[4].strip())
        
        # 2. If page text is very short, try OCR on page image
        if len(page_text) < 50 and HAS_OCR:
            print(f"⚠️ Page {i} seems to be an image. Attempting OCR...")
            pix = page.get_pixmap()
            img_bytes = pix.tobytes("png")
            ocr_text = ocr_image_to_text(img_bytes)
            if len(ocr_text) > len(page_text):
                page_text = ocr_text

        merged_text.append(f"\n\n--- PAGE {i} ---\n\n{page_text}")
        total_text_len += len(page_text)

    doc.close()
    
    if total_text_len < 50:
        print("⚠️ Warning: Extracted text is very short. Resume might be unreadable.")
        
    return "\n".join(merged_text)


def extract_first_face_bytes(pdf_path: Path):
    doc = fitz.open(str(pdf_path))
    # Limit to first 2 pages for face search to improve performance
    max_pages = min(len(doc), 2)
    
    for page_index in range(max_pages):
        page = doc[page_index]
        images = page.get_images(full=True)
        
        # Performance: If page has > 20 images, it's likely icons/logos. 
        # Skip checking all of them if there are too many.
        if len(images) > 20: 
             print(f"⚠️ Page {page_index} has {len(images)} images. Checking only largest ones...")
             # Maybe sort by size (width*height)? 
             # For now, we rely on the loop filter below.
        
        for img in images:
            xref = img[0]
            base_image = doc.extract_image(xref)
            img_bytes = base_image["image"]
            
            # --- OPTIMIZATION: Skip tiny images ---
            w, h = base_image.get("width", 0), base_image.get("height", 0)
            if w < 60 or h < 60:
                continue
                
            if contains_face_bytes(img_bytes):
                doc.close()
                return img_bytes
    doc.close()
    return None


def clean_json_response(raw: str) -> str:
    cleaned = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE).strip("` \n")
    match = re.search(r"\{[\s\S]*\}", cleaned, re.DOTALL) # Improved regex for multiline
    return match.group(0) if match else cleaned


def parse_resume_with_llm(text: str) -> dict:
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
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
      structured_resume (dict),
      raw_text (str)
    """
    text = extract_text_from_pdf(pdf_path)
    structured_data = parse_resume_with_llm(text)
    face_bytes = extract_first_face_bytes(pdf_path)
    return face_bytes, structured_data, text
