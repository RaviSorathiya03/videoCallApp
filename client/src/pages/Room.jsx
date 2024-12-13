import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../providers/Socket';
import { usePeer } from '../providers/Peer';
import { useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

function Room() {
    const { roomId } = useParams();
    const { socket } = useSocket();
    const { peer, createOffer, createAnswer, setRemoteAnswer, sendStream, remoteStream } = usePeer();
    const [myStream, setMyStream] = useState(null);
    const [remoteEmailId, setRemoteEmailId] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const handleNewUserJoined = async (data) => {
        const { emailId } = data;
        console.log("New user joined:", emailId);
        setRemoteEmailId(emailId);
        const offer = await createOffer();
        socket.emit('call-user', { emailId, offer });
    };

    const handleIncomingCall = async (data) => {
        const { from, offer } = data;
        console.log("Incoming call from:", from);
        setRemoteEmailId(from);
        const answer = await createAnswer(offer);
        socket.emit('call-accepted', { to: from, answer });
        
        const newOffer = await createOffer();
        socket.emit('call-user', { emailId: from, offer: newOffer });
    };

    const handleCallAccepted = async (data) => {
        const { answer } = data;
        console.log("Call accepted, setting remote answer");
        await setRemoteAnswer(answer);
    };

    const handleICECandidate = async (data) => {
        const { candidate } = data;
        if (peer && candidate) {
            try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding received ice candidate", e);
            }
        }
    };

    const getUserMediaStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setMyStream(stream);
            if (myVideoRef.current) {
                myVideoRef.current.srcObject = stream;
            }
            sendStream(stream);
        } catch (error) {
            console.error("Error accessing media devices:", error);
        }
    };

    const toggleAudio = () => {
        if (myStream) {
            myStream.getAudioTracks().forEach(track => track.enabled = !isAudioMuted);
            setIsAudioMuted(!isAudioMuted);
        }
    };

    const toggleVideo = () => {
        if (myStream) {
            myStream.getVideoTracks().forEach(track => track.enabled = isVideoOff);
            setIsVideoOff(!isVideoOff);
        }
    };

    useEffect(() => {
        socket.on('user-joined', handleNewUserJoined);
        socket.on('incoming-call', handleIncomingCall);
        socket.on('call-accepted', handleCallAccepted);
        socket.on('ice-candidate', handleICECandidate);

        getUserMediaStream();

        socket.emit('join-room', { emailId: socket.id, roomId });

        return () => {
            socket.off('user-joined', handleNewUserJoined);
            socket.off('incoming-call', handleIncomingCall);
            socket.off('call-accepted', handleCallAccepted);
            socket.off('ice-candidate', handleICECandidate);
        };
    }, [socket, roomId]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            console.log("Setting remote stream to video element");
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    return (
        <div className="room-container">
            <h1 className="text-3xl font-bold text-center mb-6">Room: {roomId}</h1>
            <h4 className="text-xl text-center mb-8">
                {remoteEmailId ? `Connected to: ${remoteEmailId}` : 'Waiting for connection...'}
            </h4>

            <div className="video-container">
                <div className="video-wrapper">
                    <h3 className="text-lg font-semibold mb-2">Your Video</h3>
                    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                        <video
                            ref={myVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {isVideoOff && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                                <p className="text-white text-lg">Video Off</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="video-wrapper">
                    <h3 className="text-lg font-semibold mb-2">Remote Video</h3>
                    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>

            <div className="controls">
                <button 
                    onClick={toggleAudio} 
                    className={`btn ${isAudioMuted ? 'btn-danger' : 'btn-primary'}`}
                >
                    {isAudioMuted ? <MicOff className="inline-block mr-2" /> : <Mic className="inline-block mr-2" />}
                    {isAudioMuted ? 'Unmute' : 'Mute'}
                </button>
                <button 
                    onClick={toggleVideo} 
                    className={`btn ${isVideoOff ? 'btn-danger' : 'btn-primary'}`}
                >
                    {isVideoOff ? <VideoOff className="inline-block mr-2" /> : <Video className="inline-block mr-2" />}
                    {isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
                </button>
            </div>
        </div>
    );
}

export default Room
