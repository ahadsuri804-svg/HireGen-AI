import pyttsx3
import threading

class VoiceEngine:
    def __init__(self):
        self.lock = threading.Lock()

    def speak(self, text: str):
        if not text or not text.strip():
            return

        with self.lock:
            engine = pyttsx3.init()
            engine.setProperty("rate", 170)
            engine.setProperty("volume", 1.0)

            engine.say(text)
            engine.runAndWait()

            engine.stop()

    def stop(self):
        pass

    def generate_audio(self, text: str):
        if not text or not text.strip():
            return None

        import uuid
        import os
        import base64

        filename = f"temp_{uuid.uuid4()}.wav"
        
        with self.lock:
            engine = pyttsx3.init()
            engine.setProperty("rate", 175) # Faster for snappy response
            engine.setProperty("volume", 1.0)
            engine.save_to_file(text, filename)
            engine.runAndWait()
            engine.stop() # Ensure clean

        try:
            with open(filename, "rb") as f:
                audio_bytes = f.read()
            os.remove(filename)
            return base64.b64encode(audio_bytes).decode('utf-8')
        except Exception as e:
            print(f"Error generating audio: {e}")
            return None
# import pyttsx3
# import threading

# class VoiceEngine:
#     def __init__(self):
#         self.lock = threading.Lock()
#         self.engine = pyttsx3.init()
#         self.engine.setProperty("rate", 170)
#         self.engine.setProperty("volume", 1.0)

#     def speak(self, text: str):
#         if not text or not text.strip():
#             return

#         with self.lock:
#             self.engine.say(text)
#             self.engine.runAndWait()

#     def stop(self):
#         with self.lock:
#             self.engine.stop()


# # create one global engine instance
# _voice = VoiceEngine()

# # this is what controler.py imports
# def speak(text: str):
#     _voice.speak(text)

# def stop():
#     _voice.stop()