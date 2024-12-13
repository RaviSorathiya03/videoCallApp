import React, { useEffect, useState } from 'react'
import '../App.css'
import { useSocket } from '../providers/Socket'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const { socket } = useSocket();
  const [email, setEmail] = useState("")
  const [roomId, setRoomId] = useState("")
  const navigate = useNavigate();

  const handleJoinedRoom = ({ roomId }) => {
    navigate(`/room/${roomId}`)
  }

  useEffect(() => {
    socket.on('joined-room', handleJoinedRoom)
    return () => {
      socket.off('joined-room', handleJoinedRoom)
    }
  }, [socket, navigate])

  const handleJoinRoom = () => {
    if (email && roomId) {
      socket.emit('join-room', { emailId: email, roomId: roomId })
    } else {
      alert("Please enter both email and room ID")
    }
  }

  return (
    <div className='homepage-container'>
      <div>
        <input 
          type="email" 
          placeholder='Enter your email' 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />
        <input 
          type="text" 
          value={roomId} 
          placeholder='Enter your room code' 
          onChange={(e) => setRoomId(e.target.value)}
        />
        <br /><br />
        <button onClick={handleJoinRoom}>Enter the room</button>
      </div>
    </div>
  )
}

export default Home

