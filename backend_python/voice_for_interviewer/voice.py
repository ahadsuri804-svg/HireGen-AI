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