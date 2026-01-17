import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

SENDER_EMAIL = "ahadsuri804@gmail.com"
SENDER_PASSWORD = "uzzn celi mwcp zfuc"

def json_to_pdf_bytes(conversation_list):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>Interview Transcript</b>", styles["Title"]))
    story.append(Spacer(1, 20))

    for idx, qa in enumerate(conversation_list, 1):
        interviewer_text = f"<b>Interviewer:</b> {qa.get('interviewer', '')}"
        candidate_text = f"<b>Candidate:</b> {qa.get('candidate', '')}"

        story.append(Paragraph(f"{idx}. {interviewer_text}", styles["Normal"]))
        story.append(Spacer(1, 6))
        story.append(Paragraph(candidate_text, styles["Normal"]))
        story.append(Spacer(1, 12))

    doc.build(story)
    buffer.seek(0)
    return buffer

def send_email(subject, body, to_email, attachments=[]):
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, "plain"))

    for file_item in attachments:
        if isinstance(file_item, tuple):
            filename, filedata = file_item
            part = MIMEBase("application", "octet-stream")
            part.set_payload(filedata.read())
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename={filename}")
            msg.attach(part)
        else:
            raise ValueError("Attachments must be passed as (filename, BytesIO) tuples.")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())

def send_interview_emails(conversation_list, report_bytes, candidate_name, hr_name, hr_email, candidate_email):
    hr_subject = f"Interview Completed – Candidate {candidate_name}"
    hr_body = f"""Dear {hr_name},

The interview with {candidate_name} has been successfully completed.  
Please find the following documents attached for your review:

1. Interview conversation transcript (PDF)  
2. Interview evaluation report (PDF)

Kindly review these documents at your earliest convenience and update the recruitment system accordingly.  
Should you require additional information, please do not hesitate to contact me.

Best regards,  
Recruitment Automation System
"""
    transcript_buffer = json_to_pdf_bytes(conversation_list)

    if isinstance(report_bytes, io.BytesIO):
        report_buffer = report_bytes
    else:
        report_buffer = io.BytesIO
    send_email(
        subject=hr_subject,
        body=hr_body,
        to_email=hr_email,
        attachments=[
            ("Interview_Transcript.pdf", transcript_buffer),  
            ("Evaluation_Report.pdf", report_buffer)  
        ]
    )

    candidate_subject = f"Thank You for Attending Your Interview – {candidate_name}"
    candidate_body = f"""Dear {candidate_name},

Thank you for taking the time to attend your interview with us today.  
We appreciate the effort you put into preparing and sharing your experiences with our team.  

Our HR department will carefully review your interview and evaluation.  
You will be informed of the next steps in the hiring process shortly.  

We sincerely value your interest in joining our organization and wish you the best of luck.  

Warm regards,  
[DEV AI] Recruitment Team
"""

    send_email(
        subject=candidate_subject,
        body=candidate_body,
        to_email=candidate_email
    )