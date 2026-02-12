import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../AuthProvider";
import { supabase } from "../lib/supabase";

const WS_URL = "ws://20.98.82.167/ws/interview";

export default function Interview({
  onFinish = () => { },
}) {
  const { sessionId: sessionIdParam } = useParams();
  const navigate = useNavigate();
  // Get session ID from URL param OR localStorage
  const sessionId = sessionIdParam || localStorage.getItem("resumeSessionId");

  // Refs
  const localVideoRef = useRef(null);
  const mediaRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const wsRef = useRef(null);

  // State
  const [inInterview, setInInterview] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [chat, setChat] = useState([]);
  const [attempted, setAttempted] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(false);
  const [status, setStatus] = useState("idle");
  const [warnings, setWarnings] = useState([]);
  const [reportPath, setReportPath] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [activeVideo, setActiveVideo] = useState(1);
  const audioRef = useRef(null); // Track active audio instance
  const videoIntervalRef = useRef(null); // Track video streaming interval

  // 🔄 Poll for Report Status
  useEffect(() => {
    let interval;
    if (isGeneratingReport && sessionId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`http://20.98.82.167/report_status/${sessionId}`);
          const data = await res.json();
          if (data.status === "ready") {
            console.log("✅ Report Ready:", data.filename);
            setReportPath(data.filename);
            setIsGeneratingReport(false);
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isGeneratingReport, sessionId]);
  const videoRefs = useRef([]); // Track video elements for preloading

  // Disqualification modal
  const [showDisqualifiedModal, setShowDisqualifiedModal] = useState(false);
  const [disqualificationReason, setDisqualificationReason] = useState("");

  // Sync Video Playback with Status
  useEffect(() => {
    // 1. Pause ALL videos first (Reset state)
    videoRefs.current.forEach(v => {
      if (v) {
        v.pause();
        v.currentTime = 0; // Reset to start
      }
    });

    // 2. Play ONLY if speaking
    if (status === 'speaking') {
      const vid = videoRefs.current[activeVideo];
      if (vid) {
        // console.log(`🎥 Playing Video: rec${activeVideo}.mp4`);
        vid.play()
          .then(() => {
            // console.log("✅ Video playing successfully");
          })
          .catch(e => {
            console.error("❌ Video play failed", e);
            // If autoplay blocked, maybe force muted again?
            vid.muted = true;
            vid.play().catch(e2 => console.error("❌ Retry failed", e2));
          });
      }
    }
  }, [status, activeVideo]);

  // Checkboxes
  const [cb1, setCb1] = useState(false);
  const [cb2, setCb2] = useState(false);
  const [cb3, setCb3] = useState(false);
  const allChecked = cb1 && cb2 && cb3;

  useEffect(() => {
    if (!sessionId || sessionId === "undefined" || sessionId === "null") {
      alert("⚠️ Invalid Session. Please upload your resume first.");
      navigate("/dashboard");
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    // Cleanup
    return () => {
      stopLocalMedia();
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // 🛠️ FIX: Attach video stream when the video element enters the DOM
  useEffect(() => {
    if (inInterview && localVideoRef.current && mediaRef.current) {
      console.log("🎥 Attaching media stream to video element");
      localVideoRef.current.srcObject = mediaRef.current;
      localVideoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [inInterview]);

  /* -------------------
     Media helpers 
     ------------------- */
  async function startLocalMedia() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaRef.current = s;
      if (localVideoRef.current) localVideoRef.current.srcObject = s;
      setMicEnabled(true);
      setCamEnabled(true);

      attachAudioAnalyser(s);
      startVideoStreaming(); // Start sending frames

      pushChat("system", "Camera and microphone enabled");
      return s;
    } catch (err) {
      console.error("getUserMedia failed:", err);
      alert("Please allow camera and microphone to continue the interview.");
      throw err;
    }
  }

  function stopLocalMedia() {
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    const s = mediaRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      mediaRef.current = null;
    }
    detachAudioAnalyser();
  }

  /* -------------------
     Audio Analysis & Streaming
     ------------------- */
  function attachAudioAnalyser(stream) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    audioAnalyserRef.current = { ctx, analyser };

    detectVoiceloop();
    setupRecorder(stream);
  }

  function detachAudioAnalyser() {
    if (audioAnalyserRef.current) {
      try { audioAnalyserRef.current.ctx.close(); } catch (e) { }
      audioAnalyserRef.current = null;
    }
  }

  function setupRecorder(stream) {
    try {
      // Test multiple MIME types for compatibility
      let mimeType = '';
      const types = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        ''  // Let browser decide
      ];

      for (const type of types) {
        if (!type || MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }


      const recorder = new MediaRecorder(stream); // NO options - browser auto-selects

      console.log(`🎙️ [SETUP] MediaRecorder created with MIME: ${recorder.mimeType}`);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log(`📦 [RECORDER] Chunk received: ${e.data.size} bytes`);
          chunksRef.current.push(e.data);
        }
      };

      recorder.onerror = (e) => {
        console.error(`❌ [RECORDER] Error: ${e.error}`);
      };

      recorderRef.current = recorder;
    } catch (err) {
      console.error(`❌ [SETUP] Failed to create MediaRecorder: ${err.message}`);
    }
  }

  function detectVoiceloop() {
    if (!audioAnalyserRef.current) return;

    // 🔒 STRICT TURN-TAKING: Block mic completely during AI speech or processing
    if (status === "speaking" || status === "processing") {
      requestAnimationFrame(detectVoiceloop);
      return;
    }

    const { analyser } = audioAnalyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const avg = sum / data.length;

    // DEBUG: Occasional volume check
    if (Math.random() < 0.1) {
      console.log(`🎤 Volume: ${avg.toFixed(1)} Status: ${status}`);
    }

    // 🛑 STRICT TURN-TAKING REMOVED: Always listen (User Request for "Exact Flow Before")
    // if (status === 'speaking' || status === 'processing') { ... }

    // ⏱️ CRITICAL: Extended silence window for natural thinking pauses
    // Candidate may pause 4-5 seconds while formulating complex technical answers
    // 6 seconds ensures we capture complete thoughts without premature cutoff
    const SPEECH_THRESHOLD = 10;
    const SILENCE_DURATION = 6000; // 6 seconds - allows deep thinking pauses

    if (avg > SPEECH_THRESHOLD) {
      // 🗣️ SPEECH DETECTED - Reset silence countdown immediately
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
        // Don't log every time, just when transitioning from silence
      }

      if (!isSpeakingRef.current) {
        console.log(`🗣️ [VAD] Speech STARTED (Volume: ${avg.toFixed(1)} > Threshold: ${SPEECH_THRESHOLD})`);
        isSpeakingRef.current = true;
        chunksRef.current = [];

        // Start MediaRecorder with error handling
        if (recorderRef.current && recorderRef.current.state === "inactive") {
          try {
            recorderRef.current.start();
            console.log("🎙️ Recording STARTED");
          } catch (err) {
            console.error("❌ MediaRecorder.start() failed:", err);
            alert("Your browser cannot record audio. Please use Chrome or Firefox.");
            isSpeakingRef.current = false;
            return;
          }
        }
        setStatus("listening");
      }
    } else {
      // 🤫 SILENCE DETECTED
      if (isSpeakingRef.current) {
        // Only start timer if not already running
        if (!silenceTimerRef.current) {
          console.log(`🤫 [VAD] Silence detected, starting ${SILENCE_DURATION}ms timer...`);
          silenceTimerRef.current = setTimeout(() => {
            console.log(`✅ [VAD] ${SILENCE_DURATION}ms silence confirmed. Stopping recording...`);
            isSpeakingRef.current = false;
            stopRecordingAndSend();
          }, SILENCE_DURATION);
        }
      }
    }
    requestAnimationFrame(detectVoiceloop);
  }

  // ❌ DISABLED: Silence watchdog removed - backend state machine handles silence timing
  // The 10s timer was causing false "I can't hear you" messages while candidate speaks
  // Backend now controls all silence detection via state transitions
  /*
  const silenceWatchdogRef = useRef(null);
  const lastAudioSentRef = useRef(Date.now());

  useEffect(() => {
    if (status === 'speaking' || status === 'processing') {
      if (silenceWatchdogRef.current) {
        clearTimeout(silenceWatchdogRef.current);
        silenceWatchdogRef.current = null;
      }
      return;
    }

    if (inInterview && status === 'idle') {
      if (silenceWatchdogRef.current) clearTimeout(silenceWatchdogRef.current);
      
      silenceWatchdogRef.current = setTimeout(() => {
        console.log("⏳ Silence Timeout (10s). No audio captured. Triggering Warning...");
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "silence_timeout" }));
        }
      }, 10000);
    }

    return () => {
      if (silenceWatchdogRef.current) clearTimeout(silenceWatchdogRef.current);
    };
  }, [inInterview, status]);
  */

  // 📡 NETWORK AWARENESS
  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      const updateConnectionStatus = () => {
        if (connection.rtt > 300 || connection.downlink < 1.5) {
          // Show Toast/Alert (Non-blocking)
          setWarnings(prev => {
            if (prev.includes("⚠️ Unstable Network")) return prev;
            return [...prev, "⚠️ Unstable Network"];
          });
        }
      };
      connection.addEventListener('change', updateConnectionStatus);
      return () => connection.removeEventListener('change', updateConnectionStatus);
    }

    // WS Error Listener is already in connectWebSocket
  }, []);

  // 🕒 STRICT SILENCE TIMER REMOVED (User Request: "AI must NEVER interrupt")

  function stopRecordingAndSend() {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
      setTimeout(() => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });

        console.log(`📤 Sending audio: ${blob.size} bytes`);

        // ✅ Send all audio - backend will validate duration and filter hallucinations

        setStatus("processing");
        sendAudio(blob);

        chunksRef.current = [];
      }, 100);
    }
  }

  /* -------------------
     WebSocket
     ------------------- */
  function connectWebSocket() {
    if (!sessionId) return alert("No Session ID!");

    const ws = new WebSocket(`${WS_URL}/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WS Connected");
      pushChat("system", "Connected to Interview Server");
      ws.send(JSON.stringify({ type: "init" }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 WS Message:", data.type);

      if (data.type === "ai_response") {
        console.log("🤖 AI Response:", data.text.substring(0, 30) + "...");
        // 🛑 STRICT SYNC: Only set "speaking" when audio actually starts playing
        // setStatus("speaking"); <-- REMOVED from here.
        pushChat("interviewer", data.text);
        if (data.audio) playAudio(data.audio);
        else {
          console.log("⚠️ No audio in response");
          setStatus("idle");
        }
      } else if (data.type === "warning") {
        playBeep(); // 🔊 Beep on warning
        setWarnings(prev => [...prev.slice(-4), data.message]);
      } else if (data.type === "detections") {
        // setDetections(data.items);
      } else if (data.type === "resume_listening") {
        console.log("🔄 Audio rejected (silence/noise), resuming listener...");
        setStatus("idle");
      } else if (data.type === "interview_end") {
        console.log("🏁 Interview Ended. Waiting for Report...");
        stopLocalMedia();
        setInInterview(false);
        exitSecureMode();
        setIsGeneratingReport(true); // Start Polling
      } else if (data.type === "report") {
        localStorage.setItem("latestReportObj", JSON.stringify(data.report));
        alert("Your interview reports are ready.");
        handleFinishInternal(data.report);
      } else if (data.type === "stop") {
        // 🚨 DISQUALIFIED
        playBeep();

        if (data.report) {
          localStorage.setItem("latestReportObj", JSON.stringify(data.report));
        }

        // Show warning in chat
        setWarnings(prev => [...prev, "❌ " + data.reason]);
        pushChat("system", "❌ DISQUALIFIED: " + data.reason);

        // Stop media immediately
        stopLocalMedia();
        stopAudio();

        // Show disqualification modal (user must click to go to dashboard)
        setDisqualificationReason(data.reason || "Interview terminated due to violations");
        setShowDisqualifiedModal(true);
      }
    };

    ws.onclose = () => console.log("WS Closed");
  }

  function playBeep() {
    console.log("🔊 Playing Warning Beep");
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const audioCtx = new AudioCtx();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 800; // Hz
    gainNode.gain.value = 0.5;

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioCtx.close();
    }, 300);
  }

  // --- Audio Cleanup ---
  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  async function sendAudio(blob) {
    if (!wsRef.current) {
      console.error("❌ [WS] Cannot send audio - WebSocket not connected");
      return;
    }
    console.log(`📡 [WS] Preparing to send ${blob.size} bytes via WebSocket...`);
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;
      console.log(`📡 [WS] Sending base64 audio (${base64data.length} chars) to backend`);
      wsRef.current.send(JSON.stringify({
        type: "submit_audio",
        payload: base64data
      }));
      console.log("✅ [WS] Audio sent successfully");
    };
  }

  function startVideoStreaming() {
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    videoIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && mediaRef.current) {
        captureAndSendFrame();
      }
    }, 500); // 2 FPS
  }

  function captureAndSendFrame() {
    const video = localVideoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth / 4;
    canvas.height = video.videoHeight / 4;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.5);

    wsRef.current.send(JSON.stringify({
      type: "video_frame",
      payload: base64
    }));
  }

  function playAudio(base64Audio) {
    // 1. Stop any existing audio
    stopAudio();

    // 2. Select a new random video for this turn (1-3)
    const nextVid = Math.floor(Math.random() * 3) + 1;
    setActiveVideo(nextVid);

    // 3. Create new audio
    const audioSrc = base64Audio.startsWith("data:") ? base64Audio : `data:audio/wav;base64,${base64Audio}`;
    const audio = new Audio(audioSrc);
    audio.crossOrigin = "anonymous";
    audioRef.current = audio; // Track it

    // 🟢 UNIVERSAL SYNC LISTENERS
    audio.onplay = () => {
      console.log("🔊 Audio started playing. Syncing video status...");
      setStatus("speaking");
      // Reset silence timer on AI speech
      if (silenceWatchdogRef.current) clearTimeout(silenceWatchdogRef.current);

      // 🛡️ SAFETY VALVE: Force unlock if audio gets stuck
      // MUST be shorter than SILENCE_DURATION (12s) to prevent false termination!
      setTimeout(() => {
        if (audioRef.current === audio && status === "speaking") {
          console.warn("⚠️ Audio stuck in 'speaking' for 4s. Force unlocking...");
          setStatus("listening"); // Set to LISTENING (not idle) to ensure mic is active
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "ai_speech_ended" }));
          }
        }
      }, 4000); // 4 Seconds Max Wait
    };

    audio.onended = () => {
      console.log("✅ Audio playback ended. Notifying Backend...");

      // 🔓 UNLOCK BACKEND
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ai_speech_ended" }));
      }

      setTimeout(() => {
        if (audioRef.current === audio) {
          console.log("🔄 Cooldown over. Resetting status to idle.");
          setStatus("idle");
          setAudioVolume(0);
          audioRef.current = null;
        }
      }, 500); // Small buffer
    };

    // ... Visualizer code ...

    // 4. Audio Reactive Logic (Visualizer Only)
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32;
      source.connect(analyser);
      analyser.connect(ctx.destination);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!audioRef.current || audio.paused) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioVolume(avg);
        requestAnimationFrame(updateVolume);
      };

      // Hook volume update to play
      const originalOnPlay = audio.onplay;
      audio.onplay = () => {
        originalOnPlay();
        if (ctx.state === 'suspended') ctx.resume();
        updateVolume();
      };
    }

    // 5. Start Playback
    audio.play().catch(e => {
      console.error("Audio playback failed", e);
      setStatus("idle");
    });
  }

  /* -------------------
     Actions
     ------------------- */
  async function enterSecureMode() {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
    } catch (e) { }
    document.body.style.overflow = "hidden";
    // setInInterview(true); // done in startInterview
  }

  async function exitSecureMode() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch (e) { }
    document.body.style.overflow = "auto";
    setInInterview(false);
  }

  async function startInterview() {
    try {
      if (!sessionId) {
        alert("Invalid session. Go back to dashboard.");
        navigate("/dashboard");
        return;
      }

      // 🔄 RESET SESSION FOR FRESH START
      console.log("🔄 Resetting session...", sessionId);
      try {
        await fetch(`http://20.98.82.167/reset-session/${sessionId}`, { method: "POST" });
      } catch (e) {
        console.error("Session reset failed", e);
      }

      await enterSecureMode();
      await startLocalMedia();
      connectWebSocket();
      setInInterview(true);
    } catch (err) {
      console.error("startInterview failed", err);
      await exitSecureMode();
    }
  }

  function handleCancel() {
    // 🔴 Send terminate signal to backend
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "terminate" }));
    }
    // Don't navigate immediately. Wait for report message or timeout.
    // Set a timeout fallback
    setTimeout(() => {
      stopLocalMedia();
      stopAudio();
      exitSecureMode();
      onFinish({ cancelled: true });
      navigate("/dashboard");
    }, 2000); // Wait 2s for backend response
  }

  function handleFinishInternal(report) {
    setInInterview(false);
    stopLocalMedia();
    setReportPath(report);
    exitSecureMode();
    // onFinish({ cancelled: false, chat });
  }

  function pushChat(who, text) {
    setChat((c) => [...c, { who, text, time: new Date().toISOString() }]);
  }

  /* -------------------
     Render
     ------------------- */
  // --- Premium Interview UI ---
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">

      {/* HEADER (Simplified for Focus) */}
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 flex items-center justify-center">
            <img src="/logo.png" alt="HireGen-AI Logo" className="h-full w-full object-contain" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100">Live Interview Session</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {inInterview && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 animate-pulse">
              <div className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-500"></div>
              <span className="font-semibold tracking-wide text-xs uppercase">Recording</span>
            </div>
          )}
          <div className="text-slate-500 dark:text-slate-400 font-mono text-xs border border-slate-300 dark:border-slate-700 px-2 py-1 rounded">
            ID: {sessionId?.slice(0, 8)}...
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col relative overflow-hidden">

        {/* LOBBY / SETUP SCREEN */}
        {!inInterview && !reportPath && !isGeneratingReport && (
          <div className="flex-grow flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-300 transition-colors">
              <div className="p-8 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">System Check & Compliance</h1>
                <p className="text-slate-500 dark:text-slate-400">Please verify your environment before entering the secure secure room.</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${cb1 ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/50" : "bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                    <div className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors ${cb1 ? "bg-indigo-600 border-indigo-600" : "border-slate-400 dark:border-slate-500 bg-white dark:bg-transparent"}`}>
                      {cb1 && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input checked={cb1} onChange={(e) => setCb1(e.target.checked)} type="checkbox" className="hidden" />
                    <div>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-slate-200">Hardware Access</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">I grant permission to access my camera and microphone.</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${cb2 ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/50" : "bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                    <div className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors ${cb2 ? "bg-indigo-600 border-indigo-600" : "border-slate-400 dark:border-slate-500 bg-white dark:bg-transparent"}`}>
                      {cb2 && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input checked={cb2} onChange={(e) => setCb2(e.target.checked)} type="checkbox" className="hidden" />
                    <div>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-slate-200">Environment Check</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">I am in a quiet room with good lighting. My face and hands are visible.</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${cb3 ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/50" : "bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                    <div className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors ${cb3 ? "bg-indigo-600 border-indigo-600" : "border-slate-400 dark:border-slate-500 bg-white dark:bg-transparent"}`}>
                      {cb3 && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input checked={cb3} onChange={(e) => setCb3(e.target.checked)} type="checkbox" className="hidden" />
                    <div>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-slate-200">Anti-Cheating Protocol</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">I understand that looking away, using phones, or leaving the frame may disqualify me.</span>
                    </div>
                  </label>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={startInterview}
                    disabled={!allChecked}
                    className={`px-8 py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg transform active:scale-95 ${!allChecked
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40"
                      }`}
                  >
                    INITIALIZE INTERVIEW SESSION
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {isGeneratingReport && (
          <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 transition-colors">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-white dark:bg-slate-800"></div>
              </div>
            </div>
            <h2 className="mt-8 text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Finalizing Analysis</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Processing behavioral and technical metrics...</p>
          </div>
        )}

        {/* REPORT READY STATE */}
        {reportPath && (
          <div className="flex-grow flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-700 p-10 text-center animate-in fade-in zoom-in duration-300 transition-colors">
              <div className="h-20 w-20 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/30">
                <svg className="h-10 w-10 text-green-600 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Session Complete</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-8">Your interview performance has been successfully analyzed.</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={`http://20.98.82.167/download_report_file/${reportPath}`}
                  download
                  target="_blank"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download Report
                </a>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE INTERVIEW LAYOUT */}
        {inInterview && (
          <div className="flex-grow p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 h-full max-h-[calc(100vh-80px)] animate-in fade-in duration-500">

            {/* LEFT: USER CAMERA */}
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-slate-800 ring-1 ring-white/10 group transition-colors">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />

              {/* Status Badge */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md border shadow-sm transition-all duration-300 ${status === 'listening' ? 'bg-green-500/90 border-green-400 text-white' : 'bg-black/60 border-white/10 text-slate-300'}`}>
                  {status === 'listening' ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      <span className="text-xs font-bold tracking-wide">LISTENING</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                      <span className="text-xs font-medium">Standby</span>
                    </>
                  )}
                </div>
              </div>

              {/* Warnings Container */}
              <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end pointer-events-none">
                {warnings.slice(-3).map((w, i) => (
                  <div key={i} className="bg-red-500/90 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right fade-in duration-300 backdrop-blur-sm">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {w}
                  </div>
                ))}
              </div>

              {/* Chat Overlay (Subtle) */}
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <div className="bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/5 max-h-32 overflow-y-auto custom-scrollbar mask-image-linear-gradient">
                  {chat.length === 0 ? (
                    <p className="text-white/30 text-xs italic text-center">Conversation started...</p>
                  ) : (
                    <div className="text-sm space-y-1">
                      {chat.slice(-2).map((msg, i) => (
                        <div key={i} className="flex gap-2 text-white/90">
                          <span className={`font-bold text-xs uppercase ${msg.who === 'interviewer' ? 'text-indigo-400' : 'text-green-400'}`}>{msg.who === 'interviewer' ? 'AI' : 'You'}:</span>
                          <span className="line-clamp-2">{msg.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cancel Button */}
              <div className="absolute bottom-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-2 transition-transform active:scale-95"
                  onClick={handleCancel}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  Stop
                </button>
              </div>
            </div>

            {/* RIGHT: AI AVATAR */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-slate-700 ring-1 ring-white/5 transition-colors">

              <div className="absolute inset-0 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 transition-colors">
                {/* Avatar Container */}
                <div className="relative w-full h-full max-w-lg aspect-square">
                  {/* Static Base (Hidden strictly when speaking) */}
                  <img
                    src="/avatar_real_male.png"
                    alt="AI Interviewer"
                    className={`absolute inset-0 w-full h-full object-contain pointer-events-none z-10 filter drop-shadow-2xl transition-opacity duration-200 ${status === 'speaking' ? 'opacity-0' : 'opacity-100'}`}
                  />

                  {/* Video Overlays (Visible only when speaking) */}
                  {[1, 2, 3].map((id) => (
                    <video
                      key={id}
                      ref={(el) => (videoRefs.current[id] = el)}
                      src={`/rec${id}.mp4`}
                      muted
                      playsInline
                      loop={true}
                      onEnded={(e) => {
                        console.log(`🔄 Video ${id} loop (Force Replay)`);
                        e.target.play().catch(err => console.error("Loop error:", err));
                      }}
                      className={`absolute inset-0 w-full h-full object-contain pointer-events-none z-20 transition-opacity duration-200 ${status === 'speaking' && activeVideo === id ? 'opacity-100' : 'opacity-0'}`}
                    />
                  ))}
                </div>
              </div>

              {/* AI Status Indicator */}
              <div className="absolute bottom-6 left-6 right-6 z-30">
                <div className={`mx-auto max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-4 border border-slate-200 dark:border-white/10 transition-all duration-500 ${status === 'speaking' ? 'ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20 translate-y-0 opacity-100' : 'translate-y-4 opacity-50 grayscale'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${status === 'speaking' ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{status === 'speaking' ? 'Interviewer is speaking...' : 'Interviewer is listening'}</p>

                      {/* Audio Waveform Visualization (Fake) */}
                      <div className="flex gap-1 mt-1.5 h-3 items-end">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-100 ${status === 'speaking' ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-slate-300 dark:bg-slate-600'}`}
                            style={{
                              height: status === 'speaking' ? `${Math.max(20, Math.random() * 100)}%` : '20%'
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* DISQUALIFICATION MODAL (Premium Style) */}
      {showDisqualifiedModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-red-500/20 p-8 max-w-md w-full mx-4 transform transition-all scale-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-500/10 mb-6 ring-1 ring-red-500/30">
                <svg className="h-10 w-10 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Session Terminated</h3>

              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 mb-6">
                <p className="text-red-600 dark:text-red-400 font-medium text-sm">
                  {disqualificationReason}
                </p>
              </div>

              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                Our anti-cheating protocols have detected a violation. This session has been flagged and ended.
              </p>

              <button
                onClick={() => {
                  exitSecureMode();
                  onFinish({ cancelled: true });
                  localStorage.setItem("reportPending", "true");
                  navigate("/dashboard");
                }}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-red-500/20"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

Interview.propTypes = {
  onFinish: PropTypes.func,
};
