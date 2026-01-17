import pyaudio
import wave
import numpy as np
import time
from pydub import AudioSegment
import io, json
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

def transcribe_audio(buffer):
    model = Model("vosk-model-small-en-us-0.15")
    recognizer = KaldiRecognizer(model, 16000)

    audio = AudioSegment.from_file(buffer)
    audio = audio.set_channels(1).set_frame_rate(16000).set_sample_width(2)

    buf = io.BytesIO()
    audio.export(buf, format="wav")
    buf.seek(0)

    wf = wave.open(buf, "rb")
    final_text = []

    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if recognizer.AcceptWaveform(data):
            result = json.loads(recognizer.Result())
            if result.get("text"):
                final_text.append(result["text"])

    result = json.loads(recognizer.FinalResult())
    if result.get("text"):
        final_text.append(result["text"])

    text_out = " ".join(final_text).strip()
    return text_out if text_out else "[NO SPEECH DETECTED]"