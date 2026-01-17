import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { supabase } from "../lib/supabase";

/*
  Interview.jsx
  - Robust auth / attempt fetch (with retry) so refresh/login still respects `attempted`.
  - Optimistic `markAttempted()` so button disables immediately when user clicks Start.
  - Controlled checkboxes (3) so "Start" only enabled when all checked.
  - Console logs added for easy debugging.
*/

export default function Interview({
  signalingUrl = null,
  roomId = "room-1",
  authToken = null,
  onFinish = () => {},
}) {
  // Refs / state
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const mediaRef = useRef(null);
  const recogRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const mouthRef = useRef(null);

  const [inInterview, setInInterview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [chat, setChat] = useState([]);
  const [listening, setListening] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(false);

  // Controlled checkboxes (recommended over querySelector)
  const [cb1, setCb1] = useState(false);
  const [cb2, setCb2] = useState(false);
  const [cb3, setCb3] = useState(false);

  /* -------------------
     Utility helpers
     ------------------- */
  function pushChat(who, text, meta = {}) {
    const msg = { who, text, time: new Date().toISOString(), ...meta };
    setChat((c) => [...c, msg]);
    try {
      if (typeof saveChatMessage === "function") saveChatMessage(msg);
    } catch (e) {}
  }

  // helper: try to get current user with retries (handles quick refresh race)
  async function getCurrentUserWithRetry(retries = 8, delayMs = 300) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await supabase.auth.getUser();
        const user = res?.data?.user;
        if (user) return user;
      } catch (e) {
        console.warn("getUser error (ignored) ->", e);
      }
      // small wait before retrying
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return null;
  }

  // fetch attempt for a given user id
  async function fetchAttemptForUserId(userId) {
    if (!userId) return false;
    try {
      const { data, error } = await supabase
        .from("interview_attempts")
        .select("attempted")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching attempt:", error);
        return false;
      }

      const isAttempted = !!data?.attempted;
      console.log("INTERVIEW: fetched attempt for", userId, "->", isAttempted);
      return isAttempted;
    } catch (e) {
      console.error("fetchAttemptForUserId failed:", e);
      return false;
    }
  }

  // Combined attempt loader: used on mount and on auth changes
  async function loadAttemptStatus() {
    setCheckingAttempt(true);
    try {
      const user = await getCurrentUserWithRetry();
      if (!user) {
        console.warn("INTERVIEW: no user found on load");
        setCheckingAttempt(false);
        return;
      }

      const isAttempted = await fetchAttemptForUserId(user.id);
      setAttempted(isAttempted);
    } finally {
      setCheckingAttempt(false);
    }
  }

  // mark attempted (optimistic update)
  async function markAttempted() {
    // optimistic lock immediately for UX
    setAttempted(true);

    const user = await getCurrentUserWithRetry();
    if (!user) {
      console.error("markAttempted: no user available to upsert attempt");
      return; // UI already locked optimistically
    }

    try {
      const { error } = await supabase
        .from("interview_attempts")
        .upsert(
          { user_id: user.id, attempted: true },
          { onConflict: "user_id", returning: "minimal" }
        );

      if (error) console.error("Failed to upsert attempt:", error);
      else console.log("INTERVIEW: attempt upserted for user", user.id);
    } catch (e) {
      console.error("markAttempted error:", e);
    }
  }

  /* -------------------
     Auth + attempt lifecycle
     ------------------- */
  useEffect(() => {
    // On mount: try to load attempt status 
    loadAttemptStatus();

    // auth state listener for session restore / login
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        console.log("INTERVIEW: auth event -> loading attempt for", session.user.id);
        fetchAttemptForUserId(session.user.id).then((isAttempted) => setAttempted(isAttempted));
      }
    });

    return () => {
      try {
        listener?.subscription?.unsubscribe();
      } catch (e) {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------
     Fullscreen / secure entry
     ------------------- */
  async function enterSecureMode() {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
    } catch (e) {}
    document.body.style.overflow = "hidden";
    window.history.pushState({ interview: true }, "", window.location.href);
    setInInterview(true);
  }
  async function exitSecureMode() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch (e) {}
    document.body.style.overflow = "auto";
    setInInterview(false);
  }

  /* -------------------
     Media helpers 
     ------------------- */
  async function startLocalMedia() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      mediaRef.current = s;
      if (localVideoRef.current) localVideoRef.current.srcObject = s;
      setMicEnabled(true);
      setCamEnabled(true);
      attachAudioAnalyser(s);
      pushChat("system", "Camera and microphone enabled");
      return s;
    } catch (err) {
      console.error("getUserMedia failed:", err);
      alert("Please allow camera and microphone to continue the interview.");
      throw err;
    }
  }

  function stopLocalMedia() {
    const s = mediaRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      mediaRef.current = null;
    }
    detachAudioAnalyser();
  }

  function attachAudioAnalyser(stream) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      audioAnalyserRef.current = { ctx, analyser };
      lipSyncLoop();
    } catch (e) {
      console.warn("Audio analyser not available", e);
    }
  }
  function detachAudioAnalyser() {
    if (audioAnalyserRef.current) {
      try {
        audioAnalyserRef.current.ctx.close();
      } catch (e) {}
      audioAnalyserRef.current = null;
      if (mouthRef.current) mouthRef.current.style.transform = "scaleY(1)";
    }
  }
  function lipSyncLoop() {
    if (!audioAnalyserRef.current) return;
    const { analyser } = audioAnalyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    let s = 0;
    for (let i = 0; i < data.length; i++) s += data[i];
    const avg = s / data.length;
    const scale = 1 + Math.min(1.4, (avg / 255) * 1.4);
    if (mouthRef.current) mouthRef.current.style.transform = `scaleY(${scale.toFixed(2)})`;
    requestAnimationFrame(lipSyncLoop);
  }

  /* -------------------
     Signaling + WebRTC publisher 
     ------------------- */
  async function connectSignaling() {
    if (!signalingUrl) throw new Error("signalingUrl prop required for real publish");
    setConnecting(true);
    const ws = new WebSocket(signalingUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      const joinMsg = { type: "join", roomId, meta: { token: authToken || null } };
      ws.send(JSON.stringify(joinMsg));
      pushChat("system", "Connected to signaling server");
    };
    ws.onmessage = async (ev) => {
      let data = null;
      try {
        data = JSON.parse(ev.data);
      } catch (e) {
        console.warn("Invalid WS message", ev.data);
        return;
      }
      const { type, payload } = data;
      if (type === "answer") {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription({ type: "answer", sdp: payload.sdp });
          pushChat("system", "Received answer from server");
        }
      } else if (type === "ice-candidate") {
        if (pcRef.current && payload && payload.candidate) {
          await pcRef.current.addIceCandidate(payload.candidate).catch(console.warn);
        }
      } else if (type === "error") {
        console.error("Signaling error:", payload);
        pushChat("system", `Signaling error: ${payload?.message || ""}`);
      }
    };

    ws.onerror = (e) => {
      console.warn("WebSocket error", e);
      pushChat("system", "Signaling connection error");
    };
    ws.onclose = () => {
      wsRef.current = null;
      pushChat("system", "Signaling disconnected");
    };
    setConnecting(false);
    return ws;
  }

  async function startPublishingToServer() {
    if (!mediaRef.current) {
      await startLocalMedia();
    }
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;
    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ice-candidate", roomId, payload: { candidate: e.candidate } }));
      }
    };
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };
    const s = mediaRef.current;
    s.getTracks().forEach((t) => pc.addTrack(t, s));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    if (!wsRef.current) await connectSignaling();
    wsRef.current.send(JSON.stringify({ type: "offer", roomId, payload: { sdp: offer.sdp } }));
    pushChat("system", "Published local tracks — offer sent to signaling");
    setIsPublishing(true);
  }

  async function stopPublishingToServer() {
    setIsPublishing(false);
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    pushChat("system", "Stopped publishing to server");
  }

  /* -------------------
     Speech-to-text (browser) for candidate voice
     ------------------- */
  function startTranscription() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      pushChat("system", "Speech recognition is not supported in this browser. Use server-side STT.");
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = true;
    recog.continuous = true;
    recog.onresult = (ev) => {
      let final = "";
      for (let i = ev.resultIndex; i < ev.results.length; ++i) {
        const r = ev.results[i];
        if (r.isFinal) final += r[0].transcript;
      }
      if (final.trim()) {
        pushChat("candidate", final.trim());
      }
    };
    recog.onerror = (e) => console.warn("STT error", e);
    recog.onend = () => setListening(false);
    recog.start();
    recogRef.current = recog;
    setListening(true);
    pushChat("system", "Transcription started");
  }
  function stopTranscription() {
    if (recogRef.current) try { recogRef.current.stop(); } catch (e) {}
    recogRef.current = null;
    setListening(false);
    pushChat("system", "Transcription stopped");
  }

  /* -------------------
     Simple mock AI speak (TTS) and push to chat
     ------------------- */
  function aiSpeak(text) {
    pushChat("interviewer", text);
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US";
    utt.onend = () => {};
    synth.speak(utt);
  }

  /* -------------------
     Lifecycle: Escape/back/unload handling
     ------------------- */
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        handleCancel();
      }
    }
    function onPop() {
      handleCancel();
    }
    function beforeUnload(e) {
      e.preventDefault();
      e.returnValue = "Interview in progress. Leaving will cancel the interview.";
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("beforeunload", beforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------
     Actions: start/publish/finish
     ------------------- */
  async function startInterview() {
    try {
      await enterSecureMode();
      await startLocalMedia();
      startTranscription();
      aiSpeak("Hello and welcome. Please introduce yourself in 1 minute.");  //mock - connect with backend later
    } catch (err) {
      console.error("startInterview failed", err);
      await exitSecureMode();
    }
  }

  async function handleCancel() {
    stopTranscription();
    stopPublishingToServer();
    stopLocalMedia();
    await exitSecureMode();
    pushChat("system", "Interview cancelled");

    // mark as attempted (ensure DB row locked)
    await markAttempted();

    onFinish({ cancelled: true });
  }

  async function handleFinish() {
    stopTranscription();
    await stopPublishingToServer();
    stopLocalMedia();
    await exitSecureMode();
    pushChat("system", "Interview finished");

    // mark as attempted
    await markAttempted();

    onFinish({ cancelled: false, chat });
  }

  /* -------------------
     Render
     ------------------- */
  const allChecked = cb1 && cb2 && cb3;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-white to-slate-50">
      {!inInterview && (
        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Interview Session</h1>
              <p className="text-slate-500 mt-1">Tick the checkboxes and click start to enter secure interview mode.</p>
            </div>
            <div className="text-right text-sm text-slate-400">
              <div>Room ID: <span className="font-medium text-slate-700">{roomId}</span></div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-3">
              <input checked={cb1} onChange={(e) => setCb1(e.target.checked)} type="checkbox" className="w-4 h-4" />
              <span className="text-sm">I confirm camera & microphone access and I will not leave the interview intentionally.</span>
            </label>
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-3">
              <input checked={cb2} onChange={(e) => setCb2(e.target.checked)} type="checkbox" className="w-4 h-4" />
              <span className="text-sm">My surroundings are quiet and my camera shows face, body and hands clearly.</span>
            </label>
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-3">
              <input checked={cb3} onChange={(e) => setCb3(e.target.checked)} type="checkbox" className="w-4 h-4" />
              <span className="text-sm">I closed all other applications. Esc/back will cancel the interview.</span>
            </label>
          </div>

          {/* Start button */}
<div className="flex justify-center mt-6">
  <button
    onClick={async () => {
      if (!allChecked) {
        alert("Please tick all checkboxes to proceed.");
        return;
      }

      if (attempted) return; // already locked

      try {
        await markAttempted(); // lock in DB + optimistic UI
      } catch (e) {
        console.error("markAttempted failed on start:", e);
      }

      await startInterview();
    }}
    disabled={attempted || checkingAttempt} 
    className={`px-6 py-2 rounded text-white font-medium ${
      attempted
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-red-600 hover:bg-red-500"
    }`}
  >
    {attempted
      ? "Interview Already Taken"
      : checkingAttempt
      ? "Checking..."
      : "Start Interview"}
  </button>
</div>

        </div>
      )}

      {inInterview && (
        <div className="grid grid-cols-2 gap-6 h-[90vh]">
          <div className="relative bg-black rounded-xl overflow-hidden shadow">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 flex gap-3">
              <button onClick={() => { if (mediaRef.current) { mediaRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled)); setMicEnabled((v) => !v); }}} className="p-2 rounded-full bg-white shadow">
                {micEnabled ? <i className="ri-mic-line text-green-600 text-xl"></i> : <i className="ri-mic-off-line text-red-600 text-xl"></i>}
              </button>
              <button onClick={() => { if (mediaRef.current) { mediaRef.current.getVideoTracks().forEach((t) => (t.enabled = !t.enabled)); setCamEnabled((v) => !v); }}} className="p-2 rounded-full bg-white shadow">
                {camEnabled ? <i className="ri-video-line text-green-600 text-xl"></i> : <i className="ri-video-off-line text-red-600 text-xl"></i>}
              </button>
            </div>
            <div className="absolute bottom-3 right-3">
              <button className="px-4 py-2 rounded bg-red-600 text-white flex items-center gap-2" onClick={() => { handleCancel(); }}>
                <i className="ri-close-circle-line text-white text-lg"></i>
                Cancel
              </button>
            </div>
          </div>

          <div className="relative bg-white rounded-xl shadow flex flex-col items-center justify-center">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-[70%] h-[80%] bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl flex items-center justify-center shadow-inner">
                <span className="text-slate-600 text-lg">[3D Professional Avatar Placeholder]</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 bg-white rounded-xl shadow p-4">
            <div className="font-medium mb-2">Live Conversation</div>
            <div className="h-20 flex items-center justify-center bg-slate-50 rounded">
              {chat.length === 0 ? (
                <span className="text-slate-400 text-sm">Conversation will appear here...</span>
              ) : (
                <span className="text-slate-700 text-base">{chat[chat.length - 1].who === "interviewer" ? `AI: ${chat[chat.length - 1].text}` : `You: ${chat[chat.length - 1].text}`}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Interview.propTypes = {
  signalingUrl: PropTypes.string,
  roomId: PropTypes.string,
  authToken: PropTypes.string,
  onFinish: PropTypes.func,
};
