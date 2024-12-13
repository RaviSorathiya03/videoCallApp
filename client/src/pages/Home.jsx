import React, { useEffect, useState } from 'react'
import '../App.css'
import {useSocket} from '../providers/Socket'
import {useNavigate} from 'react-router-dom'

const Home = () => {
  const {socket} = useSocket();
  const [email, setEmail] = useState("")
  const [RoomId, setRoomId] = useState("")
  const navigate = useNavigate();

  const handleJoinedRoom = ({roomId})=>{
    navigate(`/room/${roomId}`)
  }

  useEffect(()=>{
    socket.on('joined-room', handleJoinedRoom)
    return ()=>{
      socket.off('joined-room', handleJoinedRoom)
    }
  }, [socket])

  const handleJoinRoom = ()=>{
    socket.emit('join-room', {emailId: email, roomId: RoomId})
  }
  return (
    <div className='homepage-container'>
        <div>
            <input type="email" name="email" id="" placeholder='Enter your email' value={email} onChange={(e)=>{
              setEmail(e.target.value)
            }}/>
            <br /><br />
            <input type="text" value={RoomId} name="" id="" placeholder='Enter your room code' onChange={(e)=>{
              setRoomId(e.target.value)
            }}/>
            <br /><br />
            <button onClick={handleJoinRoom}>Enter the room</button>
        </div>
    </div>
  )
}

export default Home