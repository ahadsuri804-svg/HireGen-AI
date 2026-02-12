import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GROQ_API_KEY")
print(f"Key loaded: {key[:5]}...{key[-4:] if key else 'None'}")

try:
    client = Groq(api_key=key)
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": "Explain Quantum Computing in one sentence.",
            }
        ],
        model="llama-3.3-70b-versatile",
    )
    print("✅ Success!")
    print(chat_completion.choices[0].message.content)
except Exception as e:
    print(f"❌ Failed: {e}")
