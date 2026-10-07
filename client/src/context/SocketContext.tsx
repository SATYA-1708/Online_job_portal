import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { API_BASE } from '../config';

// Create a context for the socket
interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

// Custom hook to use the socket context
export const useSocket = () => {
    return useContext(SocketContext);
};

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (user && user._id) {
            // Reconstruct the base URL from API_BASE
            const baseUri = API_BASE.replace(/\/api$/, '');
            const baseUrl = baseUri.startsWith('http')
                ? baseUri
                : (window.location.origin + (baseUri || ''));

            // Connect to the Socket.io server
            const newSocket = io(baseUrl);

            const onConnect = () => {
                console.log('[Socket] Connected');
                setIsConnected(true);
                newSocket.emit('register_user', user._id);
            };

            const onDisconnect = () => {
                console.log('[Socket] Disconnected');
                setIsConnected(false);
            };

            newSocket.on('connect', onConnect);
            newSocket.on('disconnect', onDisconnect);

            // If already connected for some reason
            if (newSocket.connected) {
                onConnect();
            }

            setSocket(newSocket);

            // Cleanup on unmount or when user changes
            return () => {
                newSocket.off('connect', onConnect);
                newSocket.off('disconnect', onDisconnect);
                newSocket.disconnect();
            };
        } else {
            // If user logs out, disconnect socket
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [user?._id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
