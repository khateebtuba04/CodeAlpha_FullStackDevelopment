const express = require('express');
const http = require('http');
const socket = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = socket(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

const users = []; // Simple in-memory user store
const rooms = {}; // To keep track of users in rooms

// --- Auth Routes ---
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
        
        const existingUser = users.find(u => u.username === username);
        if (existingUser) return res.status(400).json({ error: 'User exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: Date.now().toString(), username, password: hashedPassword };
        users.push(newUser);

        const token = jwt.sign({ id: newUser.id, username: newUser.username }, process.env.JWT_SECRET);
        res.json({ token, user: { id: newUser.id, username: newUser.username } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = users.find(u => u.username === username);
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Socket.io Signaling ---
io.on('connection', socket => {
    console.log('New connection:', socket.id);

    socket.on('join-room', (roomID, username) => {
        if (rooms[roomID]) {
            rooms[roomID].push({ id: socket.id, username });
        } else {
            rooms[roomID] = [{ id: socket.id, username }];
        }
        
        const otherUsers = rooms[roomID].filter(user => user.id !== socket.id);
        socket.emit('all-users', otherUsers);
        
        // Broadcast to others that a new user joined
        socket.join(roomID);
    });

    socket.on('sending-signal', payload => {
        io.to(payload.userToSignal).emit('user-joined', {
            signal: payload.signal,
            callerID: payload.callerID,
            username: payload.username
        });
    });

    socket.on('returning-signal', payload => {
        io.to(payload.callerID).emit('receiving-returned-signal', {
            signal: payload.signal,
            id: socket.id
        });
    });

    // Whiteboard Sync
    socket.on('draw', (roomID, data) => {
        socket.to(roomID).emit('draw', data);
    });

    socket.on('clear-canvas', (roomID) => {
        socket.to(roomID).emit('clear-canvas');
    });

    // Real-time Chat
    socket.on('chat-message', ({ roomID, username, message, timestamp }) => {
        socket.to(roomID).emit('chat-message', { username, message, timestamp });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Find the room and remove the user
        for (const roomID in rooms) {
            rooms[roomID] = rooms[roomID].filter(user => user.id !== socket.id);
            if (rooms[roomID].length === 0) {
                delete rooms[roomID];
            } else {
                io.to(roomID).emit('user-disconnected', socket.id);
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
