import React, { useMemo } from 'react';

const peerContext = React.createContext(null);

export const usePeer = () => {
    return React.useContext(peerContext);
};

export const PeerProvider = (props)=>{
    const peer = useMemo(()=> new RTCPeerConnection(), [])
    const createOffer = async()=>{
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        return offer;
    }

    const createAnswer = async(offer)=>{
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        return answer;
    }

    const setRemoteAnswer = async(answer)=>{
        await peer.setRemoteDescription(answer);
    }

    const sendStream = async(stream)=>{
        const tracks = stream.getTracks();
        for (const track of tracks){
            peer.addTrack(track, stream);
        }
    }


    return(
        <peerContext.Provider value={{peer, createOffer, createAnswer, setRemoteAnswer, sendStream}}>
            {props.children}
        </peerContext.Provider>
    )
}