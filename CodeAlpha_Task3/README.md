# NexLink – Real-Time Communication App

A full-stack video conferencing and collaboration platform built with **WebRTC**, **Socket.io**, and **Node.js**.

## Features

| Feature | Technology |
|---|---|
| Multi-user video/audio calling | WebRTC (simple-peer, mesh) |
| Screen sharing | `getDisplayMedia` API |
| Collaborative whiteboard | Canvas API + Socket.io |
| Peer-to-peer file sharing | WebRTC DataChannel |
| User authentication | JWT + bcrypt |
| Real-time signaling | Socket.io |
| Encrypted transport | TLS (HTTPS/WSS in production) |

## Project Structure

```
CodeAlpha_Task3/
├── server/          # Node.js + Express + Socket.io backend
│   ├── index.js     # Main server, auth routes, signaling
│   └── .env         # JWT_SECRET, PORT
└── client/          # Vite + Vanilla JS frontend
    ├── index.html   # App shell
    ├── style.css    # Premium dark-mode design
    └── main.js      # WebRTC, whiteboard, file sharing logic
```

## Running Locally

### 1. Start the Backend

```bash
cd server
npm install
node index.js
# → Server running on http://localhost:5000
```

### 2. Start the Frontend

```bash
cd client
npm install
npm run dev
# → App running on http://localhost:5173
```

### 3. Test Multi-User

Open **two separate browser tabs** (or two different browsers), register different users, and join the **same Room ID** to initiate a video call.

## Usage Guide

1. **Register / Login** — Create an account with a username and password.
2. **Join a Room** — Enter any Room ID (share it with others to join the same meeting).
3. **Video Controls** — Toggle your mic/camera using the bottom control bar.
4. **Screen Share** — Click the screen icon to share your display.
5. **Whiteboard** — Click the pencil icon to open a shared drawing board. Changes sync in real-time.
6. **File Sharing** — Click the file icon to open the panel and upload files to share with participants.

## Security Notes

- Passwords are hashed with **bcrypt** (10 salt rounds).
- Sessions use **JWT** tokens stored in `localStorage`.
- All media streams use **WebRTC's built-in DTLS-SRTP encryption**.
- For production: use HTTPS, a proper TURN server, and a persistent database.
