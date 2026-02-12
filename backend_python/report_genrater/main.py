"""
HireGen AI - Professional Interview Report Generator (Enhanced v2)
================================================================
Updates:
- Header: Added Time, Fixed Layout (Text Left, Photo Right), Interviewer: HireGen-AI.
- Executive Summary: Detailed paragraphs for Background, Expertise, First Impressions.
- Evaluation Matrix: Specific criteria (Technical, Problem Solving, Cultural, Professionalism) with Ratings.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.pdfgen import canvas
import os
import json
from datetime import datetime
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ============================================================
# HELPER: Footer with Page Numbers
# ============================================================
def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 9)
    page_num = canvas.getPageNumber()
    text = "HireGen AI Confidential | Page %s" % page_num
    canvas.drawRightString(A4[0] - 40, 30, text)
    canvas.line(40, 45, A4[0] - 40, 45) # Footer Line
    canvas.restoreState()

# ============================================================
# HELPER: Check for Meaningful Responses
# ============================================================
def has_meaningful_responses(history):
    if not history: return False
    # Handle flat list structure: [{"role": "user", "content": "..."}, ...]
    for turn in history:
        if turn.get('role') == 'user':
            resp = turn.get('content', '').strip()
            if resp and resp != '[NO SPEECH DETECTED]' and len(resp) > 10:
                return True
    return False

# ============================================================
# INCOMPLETE / DISQUALIFIED PAYLOAD
# ============================================================
def get_incomplete_evaluation(is_disqualified=False, reason=""):
    status = "DISQUALIFIED" if is_disqualified else "Interview Incomplete"
    desc = f"Candidate was disqualified due to: {reason}" if is_disqualified else "Interview cancelled or no meaningful responses."
    
    return {
        "candidate_info": {
            "name": "Candidate (Incomplete)",
            "position": "Unknown"
        },
        "candidate_summary": {
            "background": desc,
            "expertise": "Not Assessed",
            "first_impressions": "Not Assessed"
        },
        "position": "Unknown",
        "evaluation_matrix": [
            {"criteria": "Technical Skills", "rating": "Poor", "observation": "Not assessed due to incomplete session."},
            {"criteria": "Problem Solving Skills", "rating": "Poor", "observation": "Not assessed due to incomplete session."},
            {"criteria": "Cultural Fit", "rating": "Poor", "observation": "Not assessed due to incomplete session."},
            {"criteria": "Professionalism", "rating": "Poor", "observation": "Not assessed due to incomplete session."}
        ],
        "key_strengths": ["None - Session Terminated"],
        "areas_for_improvement": [desc],
        "recommendation": {
            "decision": status,
            "score": "0/100",
            "justification": desc
        },
        "cheating_analysis": reason if is_disqualified else "Session incomplete."
    }

# ============================================================
# LLM ANALYSIS
# ============================================================
def analyze_interview_with_llm(history, resume_data, warnings):
    # 0. SANITIZE WARNINGS (STRICT FILTER)
    # Only allow the 3 approved violation types. Discard "suspicious object" generics.
    allowed_patterns = ["Face not detected", "Both hands not visible", "Cell Phone Detected"]
    sanitized_warnings = [
        w for w in warnings 
        if any(p in w for p in allowed_patterns)
    ]
    
    # 1. Automatic Disqualification Check (STRICT: PER RULE 3/3)
    # Termination MUST be per-rule, not cumulative.
    counts = {p: 0 for p in allowed_patterns}
    for w in sanitized_warnings:
        # Check against patterns carefully (substring match)
        for p in allowed_patterns:
            if p in w:
                counts[p] += 1
                
    is_disqualified = False
    disqualify_reason = ""
    
    for p, count in counts.items():
        if count >= 3:
            is_disqualified = True
            disqualify_reason = f"Violated Rule: {p} (3/3 limit reached)"
            break
            
    if is_disqualified:
        print(f"  ⚠️ STRICT DISQUALIFICATION: {disqualify_reason}")


    # 2. Extract Resume Text safely
    resume_text = ""
    if isinstance(resume_data, dict):
        resume_text = resume_data.get("text", str(resume_data))
    else:
        resume_text = str(resume_data)

    # 3. Prepare Transcript
    history_text = ""
    for msg in history:
        ts = msg.get('timestamp', '')
        role = "AI" if msg.get('role') == "assistant" else "Candidate"
        content = msg.get('content', '')
        history_text += f"[{ts}] {role}: {content}\n"
        
    cheating_text = json.dumps(sanitized_warnings, indent=2)
    
    # Context Injection for LLM
    disqualification_context = ""
    if is_disqualified:
        disqualification_context = f"""
        🚨 CRITICAL STATUS: CANDIDATE WAS DISQUALIFIED.
        REASON: {disqualify_reason}
        INSTRUCTION: You MUST mention this in 'cheating_analysis' and 'recommendation'.
        HOWEVER: You MUST still evaluate the candidate's skills based on the answers they DID give.
        DO NOT return "Not Assessed" for skills if there is transcript evidence.
        """
    
    # ⚠️ CRITICAL ZERO-ANSWER CHECK
    transcript_valid = has_meaningful_responses(history)
    transcript_status_str = "VALID_DATA" if transcript_valid else "INSUFFICIENT_DATA"

    # 4. Generate Expert Evaluation (Rules: EVIDENCE BASED, NO ZERO SCORES if valid)
    prompt = f"""
    🎯 ROLE: Senior Expert Technical Interviewer (Fortune 500 Standard).
    
    ⚠️ CRITICAL RULES (ABSOLUTE INTEGRITY):
    1. **EVIDENCE SOURCE**: The "Evaluation Matrix" (Technical, Problem Solving, Cultural, Professionalism) MUST be based ONLY on the TRANSCRIPT.
    2. **RESUME USAGE**: Use Resume ONLY for "Candidate Summary" and "Background". DO NOT use it to rate skills if transcript is empty.
    3. **TRANSCRIPT STATUS CHECK**:
       - STATUS: {transcript_status_str}
       - IF STATUS is "INSUFFICIENT_DATA" (e.g. no answers, early exit, only greeting):
         - ALL Ratings in Evaluation Matrix MUST be "Not Assessed".
         - Observations MUST state: "Assessment could not be performed due to lack of interview interaction."
         - SCORE must be < 20 (Proportional to lack of data).
         - DECISION must be: "Interview Incomplete/Not Evaluated".
       - IF STATUS is "VALID_DATA":
         - Rate based on actual answers.
         - Cite specific evidence from transcript.
    4. **PROFESSIONALISM**:
       - Split into "Interview Conduct" (Transcript) and "Integrity" (Log).
       - A cheating violation alone MUST NOT fabricate technical weaknesses.
    5. **STRICT DISQUALIFICATION**: Only mark as DISQUALIFIED if the context below says so.
    
    {disqualification_context}
    
    INPUTS:
    - Resume: {resume_text}
    - Transcript: 
    {history_text}
    - Integrity Log (Filtered): {cheating_text}
    
    OUTPUT JSON (Strict Structure):
    {{
        "candidate_info": {{
            "name": "Extract from resume (or 'Candidate' if totally missing)",
            "position": "Extract from resume (or 'Applicant')",
        }},
        "candidate_summary": {{
            "background": "Detailed paragraph describing the candidate's professional background completely based on resume and intro.",
            "expertise": "Detailed paragraph assessing technical skills. CITE EXAMPLES from transcript where possible.",
            "first_impressions": "Detailed paragraph on communication & professionalism."
        }},
        "evaluation_matrix": [
            {{"criteria": "Technical Skills", "rating": "Poor/Average/Good/Excellent/Not Assessed", "observation": "Detailed justification based on TRANSCRIPT ONLY."}},
            {{"criteria": "Problem Solving Skills", "rating": "Poor/Average/Good/Excellent/Not Assessed", "observation": "Detailed justification based on TRANSCRIPT ONLY."}},
            {{"criteria": "Cultural Fit", "rating": "Poor/Average/Good/Excellent/Not Assessed", "observation": "Assessment of attitude based on TRANSCRIPT ONLY."}},
            {{"criteria": "Professionalism", "rating": "Poor/Average/Good/Excellent/Not Assessed", "observation": "Assessment of conduct and integrity."}}
        ],
        "key_strengths": ["Strength 1", "Strength 2"],
        "areas_for_improvement": ["Weakness 1", "Weakness 2"],
        "recommendation": {{
            "decision": "Selected / Not Selected / On Hold / Disqualified / Interview Incomplete",
            "score": "X/100",
            "justification": "Comprehensive reasoning. Be honest but fair. If Not Assessed, score low."
        }},
        "cheating_analysis": "Summarize integrity log. State 'Clean Session' if empty. If disqualified, explain why."
    }}
    """
    
    llm_response = {}
    try:
        # RETRY LOGIC (3 Attempts) for 429 Errors
        completion = None
        for attempt in range(3):
            try:
                completion = client.chat.completions.create(
                    model=os.getenv("GROQ_MODEL", "mixtral-8x7b-32768"),
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    response_format={"type": "json_object"}
                )
                break # Success
            except Exception as e:
                if "429" in str(e) or "rate_limit" in str(e).lower():
                    wait_time = (attempt + 1) * 2 # 2s, 4s, 6s
                    print(f"⚠️ Groq Rate Limit (429). Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise e # Re-raise real errors
                    
        if not completion:
             raise Exception("Max retries reached for Groq Analysis.")

        llm_response = json.loads(completion.choices[0].message.content)

        # 🛑 HARD SAFETY OVERRIDE (PYTHON SIDE)
        # If no meaningful responses, WE FORCE "Not Assessed" regardless of LLM output.
        if not transcript_valid:
            print("  ⚠️ STRICT ZERO-ANSWER RULE TRIGGERED: Overwriting LLM ratings.")
            
            # Force Matrix
            for item in llm_response.get("evaluation_matrix", []):
                item["rating"] = "Not Assessed"
                item["observation"] = "No interview responses were available to evaluate this criterion."
            
            # Force Recommendation
            rec = llm_response.get("recommendation", {})
            rec["decision"] = "Interview Incomplete"
            rec["score"] = "10/100" # Force low score
            rec["justification"] = "Candidate provided no meaningful responses during the session. Performance could not be evaluated."
            
            # Force Summary Partial Override (Keep background if parsed from resume, but kill expertise inference)
            summ = llm_response.get("candidate_summary", {})
            summ["expertise"] = "Not Assessed (No Interview Data)"
            summ["first_impressions"] = "Candidate did not participate meaningfully in the conversation."

        return llm_response

    except Exception as e:
        print(f"❌ LLM Error: {e}")
        return get_incomplete_evaluation()

# ============================================================
# PDF GENERATION
# ============================================================
def generate_evaluation_pdf(resume_data, warnings, photo_path, evaluation_data, output_path):
    doc = SimpleDocTemplate(output_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    story = []
    
    # Custom Styles
    styles.add(ParagraphStyle(name='MainTitle', parent=styles['Heading1'], fontSize=24, alignment=TA_CENTER, spaceAfter=20, textColor=colors.HexColor("#003366")))
    styles.add(ParagraphStyle(name='SectionHead', parent=styles['Heading2'], fontSize=14, spaceBefore=15, spaceAfter=8, textColor=colors.HexColor("#003366"), borderPadding=5, backColor=colors.HexColor("#f0f4f8")))
    styles.add(ParagraphStyle(name='NormalJustified', parent=styles['Normal'], alignment=TA_JUSTIFY, leading=14))
    styles.add(ParagraphStyle(name='ScoreBox', fontSize=16, alignment=TA_CENTER, textColor=colors.white, backColor=colors.HexColor("#003366"), borderPadding=10))

    # --- TITLE ---
    story.append(Paragraph("Candidate Evaluation Report", styles['MainTitle']))
    story.append(Spacer(1, 10))

    # --- HEADER INFO (UPDATED: Left Text, Right Photo) ---
    c_info = evaluation_data.get('candidate_info', {})
    
    # Name Logic
    name = c_info.get('name')
    if not name and isinstance(resume_data, dict):
        name = resume_data.get('name')
    if not name: name = "Candidate Name"

    # Position Logic
    position = c_info.get('position')
    if not position and isinstance(resume_data, dict):
        position = resume_data.get('position')
    if not position: position = evaluation_data.get('position', 'Developer')
    
    date_str = datetime.now().strftime('%B %d, %Y')
    time_str = datetime.now().strftime('%I:%M %p')
    
    # Left Column Content (All text on left)
    info_text = [
        Paragraph(f"<b>Candidate:</b> {name}", styles['Normal']),
        Paragraph(f"<b>Position:</b> {position}", styles['Normal']),
        Paragraph(f"<b>Interviewer:</b> HireGen-AI", styles['Normal']),
        Paragraph(f"<b>Date:</b> {date_str} | <b>Time:</b> {time_str}", styles['Normal']),
    ]
    
    # Right Column (Photo)
    img = None
    if photo_path and os.path.exists(photo_path):
        try:
            img = Image(photo_path, 1.5*inch, 1.5*inch)
            img.hAlign = 'RIGHT'
        except: pass
        
    # Table Structure: [Text Column] [Image Column]
    if img:
        header_table = Table([[info_text, img]], colWidths=[4*inch, 2*inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'), # Image align right
            ('ALIGN', (0,0), (0,0), 'LEFT'),  # Text align left
        ]))
    else:
        header_table = Table([[info_text, ""]], colWidths=[4*inch, 2*inch])
        
    story.append(header_table)
    story.append(Spacer(1, 20))

    # --- EXECUTIVE SUMMARY (Detailed Paragraphs) ---
    story.append(Paragraph("Executive Summary", styles['SectionHead']))
    summ = evaluation_data.get('candidate_summary', {})
    
    story.append(Paragraph("<b>Background</b>", styles['Heading4']))
    story.append(Paragraph(summ.get('background', 'N/A'), styles['NormalJustified']))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph("<b>Expertise</b>", styles['Heading4']))
    story.append(Paragraph(summ.get('expertise', 'N/A'), styles['NormalJustified']))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph("<b>First Impressions</b>", styles['Heading4']))
    story.append(Paragraph(summ.get('first_impressions', 'N/A'), styles['NormalJustified']))
    story.append(Spacer(1, 10))
    
    # --- EVALUATION MATRIX (Specific Criteria) ---
    story.append(Paragraph("Detailed Assessment", styles['SectionHead']))
    matrix = evaluation_data.get('evaluation_matrix', [])
    if matrix:
        t_data = [["Criteria", "Rating", "Observation"]]
        for m in matrix:
            # Color code rating
            rating = m.get('rating', 'N/A')
            rating_style = styles['Normal']
            if "Excellent" in rating or "Good" in rating:
                rating_p = Paragraph(f"<font color='green'><b>{rating}</b></font>", styles['Normal'])
            elif "Average" in rating:
                rating_p = Paragraph(f"<font color='orange'><b>{rating}</b></font>", styles['Normal'])
            else:
                rating_p = Paragraph(f"<font color='red'><b>{rating}</b></font>", styles['Normal'])

            t_data.append([
                Paragraph(f"<b>{m.get('criteria')}</b>", styles['Normal']), 
                rating_p,
                Paragraph(m.get('observation', ''), styles['NormalJustified'])
            ])
            
        mt = Table(t_data, colWidths=[1.8*inch, 1.2*inch, 3.8*inch])
        mt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#003366")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(mt)

    # --- DECISION & SCORE ---
    story.append(Spacer(1, 15))
    rec = evaluation_data.get('recommendation', {})
    decision = rec.get('decision', 'Pending')
    score = rec.get('score', '0')
    
    dec_color = colors.green
    if "Not" in decision or "DISQUALIFIED" in decision or "Rejected" in decision: dec_color = colors.red
    elif "Hold" in decision: dec_color = colors.orange
    
    summary_box_data = [
        [Paragraph("FINAL DECISION", styles['Heading4']), Paragraph(f"<font color='{dec_color.hexval()}'><b>{decision.upper()}</b></font>", styles['Heading3'])],
        [Paragraph("SCORE", styles['Heading4']), Paragraph(f"<b>{score}</b>", styles['Heading3'])]
    ]
    
    sb = Table(summary_box_data, colWidths=[2.5*inch, 4*inch])
    sb.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.grey),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fafafa")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(sb)

    # --- REST OF REPORT (Strengths, Weaknesses, Integrity) ---
    story.append(Spacer(1, 15))
    s_list = evaluation_data.get('key_strengths', [])
    w_list = evaluation_data.get('areas_for_improvement', [])
    
    col1 = [Paragraph("<b>Key Strengths</b>", styles['Heading4'])] + [Paragraph(f"✓ {s}", styles['Normal']) for s in s_list]
    col2 = [Paragraph("<b>Growth Areas</b>", styles['Heading4'])] + [Paragraph(f"⚠ {w}", styles['Normal']) for w in w_list]
    
    swt = Table([[col1, col2]], colWidths=[3.4*inch, 3.4*inch])
    swt.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(swt)
    
    story.append(Paragraph("Integrity Log", styles['SectionHead']))
    
    # Logic to show only allowed warnings in the table (double filtered just in case)
    allowed_patterns = ["Face not detected", "Both hands not visible", "Cell Phone Detected"]
    filtered_warnings = [w for w in warnings if any(p in w for p in allowed_patterns)]
    
    if filtered_warnings:
        w_data = [["Timestamp", "Violation"]]
        for i, w in enumerate(filtered_warnings):
            w_data.append([f"Event {i+1}", w])
        wt = Table(w_data, colWidths=[1.5*inch, 5*inch])
        wt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (1,0), colors.red),
            ('TEXTCOLOR', (0,0), (1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ]))
        story.append(wt)
        story.append(Spacer(1,5))
        story.append(Paragraph(f"<b>Analysis:</b> {evaluation_data.get('cheating_analysis','')}", styles['Normal']))
    else:
        story.append(Paragraph("✅ No integrity violations detected.", styles['Normal']))

    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    return output_path

# ============================================================
# TRANSCRIPT PDF
# ============================================================
def generate_conversation_pdf(structured_json, history, output_path):
    doc = SimpleDocTemplate(output_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    story = []
    
    story.append(Paragraph("Interview Transcript", styles['Heading1']))
    
    # Handle string resume_data
    c_name = "Candidate"
    if isinstance(structured_json, dict):
        c_name = structured_json.get('name', 'Candidate')
    elif isinstance(structured_json, str):
        # Try to guess or just use Generic if we can't parse
        c_name = "Candidate (See Evaluation for Details)"
        
    story.append(Paragraph(f"Candidate: {c_name}", styles['Normal']))
    
    # Date and Time for transcript too
    date_str = datetime.now().strftime('%B %d, %Y')
    time_str = datetime.now().strftime('%I:%M %p')
    story.append(Paragraph(f"Date: {date_str} | Time: {time_str}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    for i, turn in enumerate(history, 1):
        role = turn.get('role', 'unknown')
        content = turn.get('content', '')
        ts = turn.get('timestamp', '')
        
        if role == 'assistant':
            story.append(Paragraph(f"<b>AI ({ts}):</b> {content}", styles['Normal']))
        else:
            c_style = ParagraphStyle('C', parent=styles['Normal'], textColor=colors.HexColor("#003366"), leftIndent=10)
            story.append(Paragraph(f"<b>Candidate ({ts}):</b> {content}", c_style))
            
        story.append(Spacer(1, 4))
        
    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    return output_path

# ============================================================
# MAIN ENTRY
# ============================================================
def create_interview_report(history, resume_data, frame_path, warnings):
    print("\n📊 Generating Reports (Expert Mode)...")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    report_dir = os.path.join(base_dir, "reports")
    os.makedirs(report_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Safe Name Generation
    raw_name = "Candidate"
    if isinstance(resume_data, dict):
        raw_name = resume_data.get('name', 'Candidate')
    
    safe_name = str(raw_name).replace(" ", "_").replace("/", "").replace("\\", "")
    
    eval_f = f"Evaluation_{safe_name}_{timestamp}.pdf"
    conv_f = f"Conversation_{safe_name}_{timestamp}.pdf"
    
    eval_data = analyze_interview_with_llm(history, resume_data, warnings)
    
    generate_evaluation_pdf(resume_data, warnings, frame_path, eval_data, os.path.join(report_dir, eval_f))
    generate_conversation_pdf(resume_data, history, os.path.join(report_dir, conv_f))
    
    print(f"✅ Reports Ready: {eval_f}, {conv_f}\n")
    return {"evaluation": eval_f, "transcript": conv_f}
