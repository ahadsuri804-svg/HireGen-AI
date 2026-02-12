import pyaudio
import wave
import numpy as np
import time
from pydub import AudioSegment
import io, json
import os
from vosk import Model, KaldiRecognizer

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
SILENCE_THRESHOLD = 600
SILENCE_DURATION = 5.0

def is_silent(data_chunk):
    audio_data = np.frombuffer(data_chunk, dtype=np.int16)
    rms = np.sqrt(np.mean(audio_data**2))
    return rms < SILENCE_THRESHOLD

def run_audio(stop_event=None):
    audio = pyaudio.PyAudio()
    stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE,
                        input=True, frames_per_buffer=CHUNK)

    frames = []
    silent_start = None

    while True:
        data = stream.read(CHUNK, exception_on_overflow=False)
        frames.append(data)

        if is_silent(data):
            if silent_start is None:
                silent_start = time.time()
            elif time.time() - silent_start >= SILENCE_DURATION:
                break
        else:
            silent_start = None

        if stop_event and stop_event.is_set():
            break

    stream.stop_stream()
    stream.close()
    audio.terminate()

    buffer = io.BytesIO()
    wf = wave.open(buffer, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(audio.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()
    buffer.seek(0)

    return buffer


# 🚀 REVERTED to Vosk (Offline & Fast)
import os
import json
from vosk import Model, KaldiRecognizer

# Load Model Once (Global)
MODEL_PATH = "vosk-model-small-en-us-0.15"
if not os.path.exists(MODEL_PATH):
    print(f"❌ Vosk Model not found at {MODEL_PATH}. Please download it.")
    model = None
else:
    print(f"✅ Loading Vosk Model from {MODEL_PATH}...")
    model = Model(MODEL_PATH)

# 🚀 DESKTOP-LIKE LEGACY LOGIC (Restored)
# 🚀 INDUSTRY LEVEL STT (Groq Whisper)
from groq import Groq
client = Groq()

def transcribe_audio(buffer):
    try:
        # Debug: Check Buffer
        buffer.seek(0, 2)
        size = buffer.tell()
        buffer.seek(0)
        print(f"🎤 Transcribing Audio Buffer: {size} bytes")
        
        # 1. Load Audio with Pydub (Robust to WebM/WAV)
        # We still use pydub to verify/convert if needed, but Groq handles files well.
        # Actually, Groq API expects a file-like object with a filename.
        
        # 1. Load Audio with Pydub
        try:
             audio = AudioSegment.from_file(buffer)
             print(f"📊 Audio Stats [RAW]: Duration={audio.duration_seconds:.2f}s, dBFS={audio.dBFS:.2f}, Channels={audio.channels}, Rate={audio.frame_rate}")
             
             # 🛡️ 4. AUDIO FORMAT FIX: 16-bit PCM, Mono, 16000 Hz
             audio = audio.set_channels(1).set_frame_rate(16000).set_sample_width(2)

             # 🔊 VOLUME BOOST: Normalize to -20dBFS
             target_dBFS = -20.0
             if audio.dBFS < -70:
                 print("⚠️ Audio is pure silence. Skipping.")
                 return "[NO SPEECH DETECTED]"
                 
             if audio.dBFS < target_dBFS:
                 change = target_dBFS - audio.dBFS
                 audio = audio.apply_gain(change)
                 print(f"🔊 Audio Boosted by {change:.2f}dB to -20dBFS")
             
             # Export to clean WAV
             buf = io.BytesIO()
             audio.export(buf, format="wav")
             buf.seek(0)
             buf.name = "audio.wav"
             
             print(f"📊 Audio Stats [PROCESSED]: Duration={audio.duration_seconds:.2f}s, dBFS={audio.dBFS:.2f}")

        except Exception as e:
             print(f"⚠️ Audio Pre-processing Error: {e}")
             return ""

        print("🚀 [STT] Sending to Groq Whisper (large-v3-turbo)...")
        start_t = time.time()
        
        try:
            transcription = client.audio.transcriptions.create(
                file=(buf.name, buf.read()),
                model="whisper-large-v3-turbo",
                prompt="Technical job interview context. Candidate speaking about software engineering.",
                language="en",
                temperature=0.0
            )
            
            text = transcription.text.strip()
            elapsed = time.time() - start_t
            print(f"✅ [STT] Transcription completed in {elapsed:.2f}s")
            print(f"📝 [STT] Result: '{text}'")
            
            if not text:
                print("⚠️ [STT] Empty transcription received")
                return "[NO SPEECH DETECTED]"
            
            # 🛡️ HALLUCINATION FILTER - Whisper hallucinates these on short/quiet audio
            hallucinations = [
                "thank you.", "thanks.", "you.", "the.", "bye.", "okay.", "ok.",
                "thank you for watching", "i'll talk to you soon", "what do you think",
                "see you next time", "subscribe", "like and subscribe", "talk to you soon",
                "thanks for watching", "thank you for listening"
            ]
            
            clean = text.lower().strip()
            if len(clean) < 5 or clean in hallucinations:
                print(f"⚠️ [STT] Rejected hallucination: '{text}'")
                return "[NO SPEECH DETECTED]"
                 
            return text
        except Exception as api_error:
            print(f"❌ [STT] Groq API Error: {api_error}")
            raise

    except Exception as e:
        print(f"❌ Groq STT Error: {e}")
        return ""