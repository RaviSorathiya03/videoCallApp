import React, { useMemo } from "react";
import { io } from "socket.io-client";

const socketContext = React.createContext(null);

export const useSocket = () => {
    return React.useContext(socketContext);
};

export const SocketProvider = (props) => {
    // Ensure `io` is returned from useMemo
    const socket = useMemo(() => io('http://localhost:8001'), []); // Add dependency array

    return (
        <socketContext.Provider value={{ socket }}>
            {props.children}
        </socketContext.Provider>
    );
};
