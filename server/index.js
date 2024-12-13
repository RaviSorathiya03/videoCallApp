const bodyParser = require("body-parser");
const express = require("express");
const {Server} = require('socket.io');
const cors = require('cors');

const io = new Server({
    cors: true
});
const app = express();

app.use(bodyParser.json());
app.use(cors());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on('connection', (socket)=>{
    console.log("User connected");
    socket.on('join-room', (data)=>{
        const {roomId, emailId} = data;
        socket.join(roomId);
        emailToSocketMapping.set(emailId, socket.id);
        socketToEmailMapping.set(socket.id, emailId);
        console.log("User Joined the room: ", roomId);
        socket.emit("joined-room", {roomId, emailId});
        socket.broadcast.to(roomId).emit("user-joined", { emailId });
    })

    socket.on('call-user', (data)=>{
        const {emailId, offer} = data;
        const fromEmail = socketToEmailMapping.get(socket.id);
        const socketId = emailToSocketMapping.get(emailId);
        socket.to(socketId).emit('incoming-call', {emailId:fromEmail, offer})
    })

    socket.on('call-accept', data=>{
        const {emailId, answer} = data;
        const socketId = emailToSocketMapping.get(emailId);
        socket.to(socketId).emit('call-accept', {emailId, answer})
    })
})

app.listen(8000, ()=>{
    console.log("server is running perfectly on to the port 8000")
})

io.listen(8001)