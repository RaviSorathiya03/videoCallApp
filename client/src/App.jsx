import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home';
import {SocketProvider}  from './providers/Socket';
import Room from './pages/Room';
import { PeerProvider } from './providers/Peer';


export default function App(){
  return (
    <BrowserRouter>
    <PeerProvider>
    <SocketProvider>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/room/:roomId' element={<Room />} />
      </Routes>
      </SocketProvider>
      </PeerProvider>
    </BrowserRouter>
  );
}