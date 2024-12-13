import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './Socket';

const PeerContext = React.createContext(null);

export const usePeer = () => React.useContext(PeerContext);

export const PeerProvider = ({ children }) => {
    const { socket } = useSocket();
    const [remoteStream, setRemoteStream] = useState(null);
    const peerRef = useRef(null);
    const localStreamRef = useRef(null);

    const createPeerConnection = useCallback(() => {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        });

        peer.ontrack = (event) => {
            console.log("Received remote track", event.streams[0]);
            setRemoteStream(event.streams[0]);
        };

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("New ICE candidate", event.candidate);
                socket.emit('ice-candidate', { to: peer.remoteEmailId, candidate: event.candidate });
            }
        };

        peer.onnegotiationneeded = async () => {
            console.log("Negotiation needed");
            try {
                await peer.setLocalDescription(await peer.createOffer());
                socket.emit('offer', { to: peer.remoteEmailId, offer: peer.localDescription });
            } catch (err) {
                console.error("Error during negotiation:", err);
            }
        };

        return peer;
    }, [socket]);

    useEffect(() => {
        peerRef.current = createPeerConnection();

        return () => {
            if (peerRef.current) {
                peerRef.current.close();
            }
        };
    }, [createPeerConnection]);

    const createOffer = async () => {
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        return offer;
    };

    const createAnswer = async (offer) => {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        return answer;
    };

    const setRemoteAnswer = async (answer) => {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIncomingOffer = async (offer) => {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        return answer;
    };

    const sendStream = (stream) => {
        localStreamRef.current = stream;
        stream.getTracks().forEach((track) => {
            peerRef.current.addTrack(track, stream);
        });
    };

    const restartIce = async () => {
        const offer = await peerRef.current.createOffer({ iceRestart: true });
        await peerRef.current.setLocalDescription(offer);
        socket.emit('offer', { to: peerRef.current.remoteEmailId, offer });
    };

    return (
        <PeerContext.Provider
            value={{
                peer: peerRef.current,
                createOffer,
                createAnswer,
                setRemoteAnswer,
                handleIncomingOffer,
                sendStream,
                remoteStream,
                restartIce,
            }}
        >
            {children}
        </PeerContext.Provider>
    );
};
