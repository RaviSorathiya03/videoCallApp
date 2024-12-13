const express = require("express");
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Adjust this for production
    }
});

app.use(cors());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('join-room', (data) => {
        const { roomId, emailId } = data;
        if (!emailId || !roomId) return;

        console.log(`User ${emailId} joined room: ${roomId}`);
        socket.join(roomId);
        emailToSocketMapping.set(emailId, socket.id);
        socketToEmailMapping.set(socket.id, emailId);

        socket.emit('joined-room', { roomId });
        socket.broadcast.to(roomId).emit('user-joined', { emailId });
    });

    socket.on('call-user', (data) => {
        const { emailId, offer } = data;
        const fromEmail = socketToEmailMapping.get(socket.id);
        const socketId = emailToSocketMapping.get(emailId);

        if (!socketId) return;

        socket.to(socketId).emit('incoming-call', { from: fromEmail, offer });
    });

    socket.on('call-accepted', (data) => {
        const { to, answer } = data;
        const socketId = emailToSocketMapping.get(to);

        if (!socketId) return;

        socket.to(socketId).emit('call-accepted', { answer });
    });

    socket.on('ice-candidate', (data) => {
        const { to, candidate } = data;
        const socketId = emailToSocketMapping.get(to);

        if (!socketId) return;

        socket.to(socketId).emit('ice-candidate', { candidate });
    });

    socket.on('offer', (data) => {
        const { to, offer } = data;
        const fromEmail = socketToEmailMapping.get(socket.id);
        const socketId = emailToSocketMapping.get(to);

        if (!socketId) return;

        socket.to(socketId).emit('offer', { from: fromEmail, offer });
    });

    socket.on('answer', (data) => {
        const { to, answer } = data;
        const socketId = emailToSocketMapping.get(to);

        if (!socketId) return;

        socket.to(socketId).emit('answer', { answer });
    });

    socket.on('disconnect', () => {
        const emailId = socketToEmailMapping.get(socket.id);
        if (emailId) {
            emailToSocketMapping.delete(emailId);
        }
        socketToEmailMapping.delete(socket.id);
        console.log('User disconnected');
    });
});

const EXPRESS_PORT = 8000;
const SOCKET_PORT = 8001;

// Start the Express server
app.listen(EXPRESS_PORT, () => {
    console.log(`Express server is running on port ${EXPRESS_PORT}`);
});

// Start the Socket.IO server
server.listen(SOCKET_PORT, () => {
    console.log(`Socket.IO server is running on port ${SOCKET_PORT}`);
});

