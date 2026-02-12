from main_questions_interviewer.main import conversational_interviewer
import sys

# Dummy resume
resume = {'name': 'John Doe', 'skills': ['Python', 'React']}

print("🧪 Testing First Question Generation...")
try:
    q1 = conversational_interviewer(str(resume), [], 15)
    print(f"🤖 AI Output: {q1}")
    
    if "(" in q1 or ")" in q1 or "Note:" in q1:
        print("❌ FAIL: Output contains brackets or notes.")
    else:
        print("✅ PASS: Output is clean.")
        
except Exception as e:
    print(e)
