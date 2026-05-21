import { io } from 'socket.io-client';
import Peer from 'simple-peer';

// ── Config ─────────────────────────────────────────────────────────────────
const API_URL = 'http://localhost:5000';

// ── State ──────────────────────────────────────────────────────────────────
let socket        = null;
let localStream   = null;
let screenStream  = null;
let peers         = [];      // [{ peerID, peer, username }]
let currentUser   = null;
let currentRoom   = null;
let micEnabled    = true;
let camEnabled    = true;
let isErasing     = false;
let isDrawing     = false;
let unreadChat    = 0;
let chatOpen      = false;

// ── DOM ────────────────────────────────────────────────────────────────────
const authView        = document.getElementById('auth-view');
const lobbyView       = document.getElementById('lobby-view');
const meetingView     = document.getElementById('meeting-view');
const authError       = document.getElementById('auth-error');
const userDisplay     = document.getElementById('user-display');
const roomDisplay     = document.getElementById('room-display');
const videoGrid       = document.getElementById('video-grid');
const localVideo      = document.getElementById('local-video');
const localCamOff     = document.getElementById('local-cam-off');
const whiteboardPanel = document.getElementById('whiteboard-panel');
const filePanel       = document.getElementById('file-panel');
const chatPanel       = document.getElementById('chat-panel');
const canvas          = document.getElementById('whiteboard');
const ctx             = canvas.getContext('2d');
const participantCount = document.getElementById('participant-count');
const chatMessages    = document.getElementById('chat-messages');
const chatBadge       = document.getElementById('chat-badge');
const toastContainer  = document.getElementById('toast-container');

// ── Helpers ────────────────────────────────────────────────────────────────
function showError(msg) {
    authError.textContent = msg;
    authError.classList.remove('hidden');
}
function clearError() { authError.classList.add('hidden'); }

function updateParticipantCount() {
    participantCount.textContent = `👥 ${peers.length + 1}`;
}

// ── Toast Notifications ────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight .3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ── Auth ───────────────────────────────────────────────────────────────────
async function authRequest(endpoint, body) {
    const res = await fetch(`${API_URL}/${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
}

document.getElementById('register-btn').onclick = async () => {
    clearError();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) return showError('Please fill in all fields.');
    try {
        const data = await authRequest('register', { username, password });
        enterLobby(data);
    } catch (err) { showError(err.message); }
};

document.getElementById('login-btn').onclick = async () => {
    clearError();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) return showError('Please fill in all fields.');
    try {
        const data = await authRequest('login', { username, password });
        enterLobby(data);
    } catch (err) { showError(err.message); }
};

function enterLobby(data) {
    currentUser = data.user;
    localStorage.setItem('nexlink_token', data.token);
    userDisplay.textContent = currentUser.username;
    authView.classList.add('hidden');
    lobbyView.classList.remove('hidden');
    initSocket();
}

document.getElementById('logout-btn').onclick = () => {
    if (socket) socket.disconnect();
    currentUser = null;
    localStorage.removeItem('nexlink_token');
    lobbyView.classList.add('hidden');
    authView.classList.remove('hidden');
};

// ── Socket (Signaling) ─────────────────────────────────────────────────────
function initSocket() {
    socket = io(API_URL, { transports: ['websocket'] });

    // When we join, server sends us a list of people already in the room
    socket.on('all-users', (users) => {
        users.forEach(user => {
            const peer = createPeer(user.id, user.username);
            peers.push({ peerID: user.id, peer, username: user.username });
        });
        updateParticipantCount();
    });

    // Someone new joined — they initiate, we respond
    socket.on('user-joined', (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, payload.username);
        peers.push({ peerID: payload.callerID, peer, username: payload.username });
        updateParticipantCount();
        showToast(`👋 ${payload.username} joined the meeting`, 'join');
        appendSystemMsg(`${payload.username} joined`);
    });

    // Our signal was accepted — complete the handshake
    socket.on('receiving-returned-signal', (payload) => {
        const item = peers.find(p => p.peerID === payload.id);
        if (item) item.peer.signal(payload.signal);
    });

    // A peer left
    socket.on('user-disconnected', (id) => {
        const peerObj = peers.find(p => p.peerID === id);
        if (peerObj) {
            showToast(`${peerObj.username} left the meeting`, 'leave');
            appendSystemMsg(`${peerObj.username} left`);
            peerObj.peer.destroy();
        }
        peers = peers.filter(p => p.peerID !== id);
        const tile = document.getElementById(`tile-${id}`);
        if (tile) tile.remove();
        updateParticipantCount();
    });

    // Whiteboard sync from server
    socket.on('draw', (data) => remoteDraw(data));
    socket.on('clear-canvas', () => ctx.clearRect(0, 0, canvas.width, canvas.height));

    // Chat messages from others
    socket.on('chat-message', ({ username, message, timestamp }) => {
        appendChatMsg(username, message, timestamp, false);
        if (!chatOpen) {
            unreadChat++;
            chatBadge.textContent = unreadChat > 99 ? '99+' : unreadChat;
            chatBadge.classList.remove('hidden');
        }
    });
}

// ── Join Meeting ───────────────────────────────────────────────────────────
document.getElementById('join-btn').onclick = async () => {
    currentRoom = document.getElementById('room-id').value.trim();
    if (!currentRoom) return alert('Please enter a Room ID.');

    const joinBtn = document.getElementById('join-btn');
    joinBtn.textContent = 'Joining…';
    joinBtn.disabled = true;

    try {
        // Try to get camera + mic; fall back to audio-only; then no media
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true,
            });
        } catch (mediaErr) {
            console.warn('Full media failed, trying audio-only:', mediaErr.message);
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            } catch (audioErr) {
                console.warn('Audio also failed, joining without media:', audioErr.message);
                localStream = null;
            }
        }

        if (localStream) {
            localVideo.srcObject = localStream;
        } else {
            localCamOff.classList.add('visible');
        }

        lobbyView.classList.add('hidden');
        meetingView.classList.remove('hidden');
        meetingView.style.display = 'flex';
        roomDisplay.textContent = currentRoom;

        socket.emit('join-room', currentRoom, currentUser.username);
        initWhiteboard();
        initChat();
        showToast(`✅ Joined room: ${currentRoom}`, 'info');
    } catch (err) {
        console.error('Join error:', err);
        alert('Could not join room: ' + err.message);
        joinBtn.textContent = '▶ Join Meeting';
        joinBtn.disabled = false;
    }
};

document.getElementById('leave-btn').onclick = () => {
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (screenStream) screenStream.getTracks().forEach(t => t.stop());
    peers.forEach(p => p.peer.destroy());
    if (socket) socket.disconnect();
    location.reload();
};

// ── WebRTC Peer (initiator) ────────────────────────────────────────────────
function createPeer(userToSignal, username) {
    const peer = new Peer({ initiator: true, trickle: false, stream: localStream });

    peer.on('signal', signal => {
        socket.emit('sending-signal', {
            userToSignal,
            callerID: socket.id,
            signal,
            username: currentUser.username,
        });
    });

    attachPeerHandlers(peer, userToSignal, username);
    return peer;
}

// ── WebRTC Peer (receiver) ─────────────────────────────────────────────────
function addPeer(incomingSignal, callerID, username) {
    const peer = new Peer({ initiator: false, trickle: false, stream: localStream });

    peer.on('signal', signal => {
        socket.emit('returning-signal', { signal, callerID });
    });

    peer.signal(incomingSignal);
    attachPeerHandlers(peer, callerID, username);
    return peer;
}

function attachPeerHandlers(peer, peerID, username) {
    peer.on('stream', stream => addVideoTile(peerID, stream, username));
    peer.on('data',   data   => handleDataChannel(data));
    peer.on('error',  err    => console.warn('Peer error:', err));
}

function addVideoTile(id, stream, username) {
    if (document.getElementById(`tile-${id}`)) return;

    const tile  = document.createElement('div');
    tile.id     = `tile-${id}`;
    tile.className = 'video-tile glass fade-in';

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay  = true;
    video.playsInline = true;

    const label = document.createElement('div');
    label.className  = 'video-label';
    label.textContent = username;

    tile.appendChild(video);
    tile.appendChild(label);
    videoGrid.appendChild(tile);
}

// ── Controls ───────────────────────────────────────────────────────────────
// Mic toggle
document.getElementById('toggle-mic').onclick = (e) => {
    if (!localStream) return;
    micEnabled = !micEnabled;
    localStream.getAudioTracks().forEach(t => t.enabled = micEnabled);
    e.currentTarget.classList.toggle('active', !micEnabled);
    const icon = e.currentTarget.querySelector('.ctrl-icon');
    icon.innerHTML = micEnabled
        ? '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>'
        : '<line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>';
};

// Camera toggle
document.getElementById('toggle-cam').onclick = (e) => {
    if (!localStream) return;
    camEnabled = !camEnabled;
    localStream.getVideoTracks().forEach(t => t.enabled = camEnabled);
    e.currentTarget.classList.toggle('active', !camEnabled);
    localCamOff.classList.toggle('visible', !camEnabled);
};

// Screen share
document.getElementById('share-screen').onclick = async (e) => {
    if (screenStream) { stopScreenShare(e.currentTarget); return; }
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        peers.forEach(p => {
            const sender = p.peer._pc?.getSenders?.().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(videoTrack);
        });
        localVideo.srcObject = screenStream;
        e.currentTarget.classList.add('on-air');
        videoTrack.onended = () => stopScreenShare(e.currentTarget);
    } catch (err) { console.error('Screen share error:', err); }
};

function stopScreenShare(btn) {
    if (!screenStream) return;
    const camTrack = localStream?.getVideoTracks()[0];
    peers.forEach(p => {
        const sender = p.peer._pc?.getSenders?.().find(s => s.track?.kind === 'video');
        if (sender && camTrack) sender.replaceTrack(camTrack);
    });
    screenStream.getTracks().forEach(t => t.stop());
    screenStream = null;
    localVideo.srcObject = localStream;
    if (btn) btn.classList.remove('on-air');
}

// Whiteboard toggle
document.getElementById('toggle-whiteboard').onclick = (e) => {
    const wasHidden = whiteboardPanel.classList.contains('hidden');
    whiteboardPanel.classList.toggle('hidden');
    e.currentTarget.classList.toggle('on-air', wasHidden);
    if (wasHidden) setTimeout(resizeCanvas, 50);
};

// Files toggle
document.getElementById('toggle-files').onclick = (e) => {
    filePanel.classList.toggle('hidden');
    e.currentTarget.classList.toggle('on-air', !filePanel.classList.contains('hidden'));
};

// Chat toggle
document.getElementById('toggle-chat').onclick = (e) => {
    chatPanel.classList.toggle('hidden');
    chatOpen = !chatPanel.classList.contains('hidden');
    e.currentTarget.classList.toggle('on-air', chatOpen);
    if (chatOpen) {
        unreadChat = 0;
        chatBadge.classList.add('hidden');
        chatMessages.scrollTop = chatMessages.scrollHeight;
        document.getElementById('chat-input').focus();
    }
};

// ── Whiteboard ─────────────────────────────────────────────────────────────
let wbColor = '#7c3aed';
let wbSize  = 3;

function initWhiteboard() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    canvas.addEventListener('mousedown', e => { isDrawing = true; ctx.beginPath(); moveTo(e); });
    canvas.addEventListener('mouseup',   ()=> isDrawing = false);
    canvas.addEventListener('mouseleave',()=> isDrawing = false);
    canvas.addEventListener('mousemove', e => {
        if (!isDrawing) return;
        const { x, y } = getPos(e);
        drawLine(x, y);
        socket?.emit('draw', currentRoom, { x, y, color: isErasing ? '#ffffff' : wbColor, size: isErasing ? wbSize * 4 : wbSize });
    });

    // Touch support
    canvas.addEventListener('touchstart', e => { e.preventDefault(); isDrawing = true; ctx.beginPath(); moveTo(e.touches[0]); }, { passive: false });
    canvas.addEventListener('touchend',   ()=> isDrawing = false);
    canvas.addEventListener('touchmove',  e => {
        e.preventDefault();
        if (!isDrawing) return;
        const { x, y } = getPos(e.touches[0]);
        drawLine(x, y);
        socket?.emit('draw', currentRoom, { x, y, color: isErasing ? '#ffffff' : wbColor, size: isErasing ? wbSize * 4 : wbSize });
    }, { passive: false });

    document.getElementById('wb-color').oninput = e => { wbColor = e.target.value; isErasing = false; };
    document.getElementById('wb-size').oninput  = e => { wbSize = parseInt(e.target.value); };
    document.getElementById('wb-eraser').onclick = () => { isErasing = !isErasing; };
    document.getElementById('wb-clear').onclick  = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        socket?.emit('clear-canvas', currentRoom);
    };
}

function resizeCanvas() {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width  = canvas.parentElement?.offsetWidth  || canvas.width;
    canvas.height = (canvas.parentElement?.offsetHeight || canvas.height) - 42;
    ctx.putImageData(data, 0, 0);
}

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function moveTo(e) {
    const { x, y } = getPos(e);
    ctx.moveTo(x, y);
}

function drawLine(x, y) {
    ctx.strokeStyle = isErasing ? '#ffffff' : wbColor;
    ctx.lineWidth   = isErasing ? wbSize * 4 : wbSize;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function remoteDraw(data) {
    ctx.strokeStyle = data.color;
    ctx.lineWidth   = data.size;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
}

// ── Chat ───────────────────────────────────────────────────────────────────
function initChat() {
    const form  = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');

    form.onsubmit = (e) => {
        e.preventDefault();
        const message = input.value.trim();
        if (!message || !socket) return;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        socket.emit('chat-message', { roomID: currentRoom, username: currentUser.username, message, timestamp });
        appendChatMsg(currentUser.username, message, timestamp, true);
        input.value = '';
    };
}

function appendChatMsg(username, message, timestamp, isOwn) {
    const div = document.createElement('div');
    div.className = `chat-msg ${isOwn ? 'own' : 'other'}`;
    div.innerHTML = `
        ${!isOwn ? `<span class="chat-msg-author">${escapeHtml(username)}</span>` : ''}
        <div class="chat-msg-bubble">${escapeHtml(message)}</div>
        <span class="chat-msg-time">${timestamp}</span>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendSystemMsg(text) {
    const div = document.createElement('div');
    div.className = 'chat-system-msg';
    div.textContent = `— ${text} —`;
    chatMessages.appendChild(div);
    if (chatOpen) chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── File Sharing (via DataChannel) ────────────────────────────────────────
document.getElementById('share-file-btn').onclick = () => document.getElementById('file-input').click();

document.getElementById('file-input').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const meta = JSON.stringify({ type: 'file-meta', name: file.name, size: file.size, mime: file.type });
        peers.forEach(p => {
            try {
                p.peer.send(meta);
                p.peer.send(reader.result);
            } catch (err) { console.warn('File send error:', err); }
        });
        addFileItem(file.name, null, true);
        showToast(`📎 Sent: ${file.name}`, 'info');
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
};

let pendingFileMeta = null;

function handleDataChannel(raw) {
    let text;
    try { text = new TextDecoder().decode(raw instanceof ArrayBuffer ? raw : raw.buffer || raw); } catch { text = null; }

    if (text) {
        try {
            const parsed = JSON.parse(text);
            if (parsed.type === 'file-meta') { pendingFileMeta = parsed; return; }
        } catch { /* not JSON — it's binary */ }
    }

    if (pendingFileMeta) {
        const blob = new Blob([raw instanceof ArrayBuffer ? raw : raw.buffer], { type: pendingFileMeta.mime });
        const url  = URL.createObjectURL(blob);
        addFileItem(pendingFileMeta.name, url, false);
        showToast(`📎 Received: ${pendingFileMeta.name}`, 'info');
        pendingFileMeta = null;
    }
}

function addFileItem(name, downloadUrl, isSent) {
    const list = document.getElementById('file-list');
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
        <span title="${name}">${name}</span>
        ${downloadUrl
            ? `<a href="${downloadUrl}" download="${name}">↓ Save</a>`
            : `<span style="font-size:.72rem;color:var(--success);">✓ Sent</span>`}
    `;
    list.prepend(item);
}
