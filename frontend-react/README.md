HireGen React conversion starter.

# HireGen Interview Demo

This package contains a client-side React component `InterviewSession.jsx` with:
- Fullscreen "secure" interview UI.
- Candidate live camera + mic using getUserMedia.
- Client-side WebRTC *mock peer* demo (creates a local peer-to-peer connection in the browser to simulate publishing to a peer).
- Speech-to-text via Web Speech API (if available).
- AI interviewer using SpeechSynthesis and a richer avatar with lip-sync placeholders (mouth animation driven by microphone audio level).
- Chat log and transcript copy/export features.

Also included:
- `server/` folder with a minimal Node/Express + WebSocket example and notes on integrating mediasoup/PeerJS for production.

## How to use (client demo)
1. This component expects to be used inside a React project. Copy `src/components/InterviewSession.jsx` to your project (e.g., `src/components/InterviewSession.jsx`).
2. Ensure you have Tailwind (optional). The component uses Tailwind classes for quick styling. You can replace classes with your own CSS if you don't use Tailwind.
3. For the mock WebRTC demo: open the component and press **Start Interview** then click **Start Mock Publish** in the Interview Controls. It creates an internal RTCPeerConnection pair (pcLocal -> pcRemote) to simulate a published stream and displays SDP exchange steps in the console.
4. For production, replace the mock publish with a real WebRTC signaling server and STUN/TURN configuration. See `server/README_SERVER.md` for guidance.

## Server (example)
The `server/` directory contains a minimal Node/Express + WebSocket example (`server/server.js`) showing how to accept simple WebSocket messages for signaling. It is *not* a complete production WebRTC/mediasoup server. See notes in the same directory for using mediasoup, Janus, or PeerJS for real-time media routing and scaling.

## Files included
- `src/components/InterviewSession.jsx` - Main React component (client demo + mock WebRTC + lip-sync avatar).
- `server/server.js` - Minimal Node/Express + WebSocket signaling example.
- `server/package.json` - Example server package.json.
- `server/README_SERVER.md` - Notes on production WebRTC routing: mediasoup, Janus, PeerJS hints.

---
If you want, I can also:
- Add a full Create React App / Vite skeleton with this component already wired to run locally.
- Implement a simple signaling server that exchanges offers/answers between two browser clients (instead of mock-local peer).
- Implement file upload of recorded interview to the server.

Tell me which next and I'll add it to the zip.

What I converted for you in this package:
1. Vite + React starter (src/)
2. Tailwind setup files (tailwind.config.cjs, postcss.config.cjs)
3. Firebase initialized in src/firebase.js (copied from your site)
4. A converted Register component (src/pages/Register.jsx) that uses firebase auth (createUserWithEmailAndPassword + updateProfile)

How to run locally:
1. cd hiregen-react
2. npm install
3. npx tailwindcss -i ./src/index.css -o ./src/tailwind-output.css --watch
   (or configure the tailwind build step; in dev with Vite the index.css will be processed by PostCSS)
4. npm run dev

Notes & next steps I can do next (pick any, I'll implement immediately):
- Convert other pages (dashboard, interview, user-profile) into React components.
- Migrate register.js's client-side behavior (file preview, dynamic education/experience blocks) into React stateful components.
- Add routing (React Router) to preserve navigation structure.
- Add authentication guard and login page.
- Integrate storage uploads (resume/profile image) via firebase/storage with progress UI.
- Make UI pixel-perfect using Tailwind based on your CSS files and images from the original zip.
