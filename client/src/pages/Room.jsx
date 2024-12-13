import React, { useEffect, useState } from 'react'
import { useSocket } from '../providers/Socket'
import { usePeer } from '../providers/Peer';
import ReactPlayer from 'react-player'
function Room() {
    const {socket} = useSocket();
    const {peer, createOffer, createAnswer, setRemoteAnswer, sendStream} = usePeer();
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const handleNewUserJoined = async(data)=>{
        const {emailId} = data;
        console.log("New User Joined: ", emailId);
        const offer = await createOffer();
        socket.emit('call-user', {emailId, offer})
    }

    const handleIncomingCall = async(data)=>{
        const {emailId, offer} = data;
        const answer = await createAnswer(offer);
        socket.emit('call-accept', {emailId, answer})
    }

    const handleCallAccepted = async(data)=>{
        const {answer} = data;
        console.log("Call Accepted by: ", data.emailId);
        await setRemoteAnswer(answer);

    }
    const getUserMediaStream = async()=>{
        const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true})
        sendStream(stream);
        setStream(stream);
    }

    useEffect(()=>{
        socket.on('user-joined', handleNewUserJoined)
        socket.on('incoming-call', handleIncomingCall)
        socket.on('call-accept', handleCallAccepted)

        return ()=>{
            socket.off('user-joined', handleNewUserJoined)
            socket.off('incoming-call', handleIncomingCall)
            socket.off('call-accept', handleCallAccepted)
        }
    })

    useEffect(()=>{
        getUserMediaStream();
    }, [])


  return (
    <div className='room-container'>
        <h1>Room Page</h1>
        <ReactPlayer url={stream} playing muted />
    </div>
  )
}

export default Room