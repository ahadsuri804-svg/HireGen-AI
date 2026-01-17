
/*
 Minimal Node/Express + WebSocket signaling server example.

 Run:
   cd server
   npm install
   npm start

 This server does NOT handle media; it only relays signaling messages between clients connected via WebSocket.
 For production, replace this with a full signaling + SFU architecture (mediasoup/Janus/LiveKit) and set up TURN/STUN.
*/
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get('/', (req, res) => {
  res.send('HireGen signaling server running. This is a minimal demo. Use WebSocket for signaling.');
});

// Very simple broadcaster map: roomId -> [ws,...]
const rooms = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    let data = null;
    try { data = JSON.parse(msg); } catch(e){ console.warn('Invalid JSON', e); return; }
    const { type, roomId, payload } = data;
    if (!roomId) return;
    if (type === 'join') {
      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId).add(ws);
      ws.roomId = roomId;
      console.log('Client joined room', roomId);
      return;
    }
    // forward 'offer', 'answer', 'ice-candidate' to other peers in same room
    const peers = rooms.get(roomId) || new Set();
    for (const peer of peers) {
      if (peer !== ws && peer.readyState === WebSocket.OPEN) {
        peer.send(JSON.stringify({ from: 'peer', type, payload }));
      }
    }
  });

  ws.on('close', () => {
    if (ws.roomId && rooms.has(ws.roomId)) {
      rooms.get(ws.roomId).delete(ws);
      if (rooms.get(ws.roomId).size === 0) rooms.delete(ws.roomId);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Signaling server listening on', PORT));
