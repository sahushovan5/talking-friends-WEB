import { io } from 'socket.io-client';

const SIGNALING_SERVER_URL =
  import.meta.env.VITE_SIGNALING_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:5000');

let socketInstance = null;

/**
 * Get or initialize the Socket.io client singleton
 */
export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SIGNALING_SERVER_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketInstance.on('connect', () => {
      console.log(`[Socket.io] Connected with ID: ${socketInstance.id}`);
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('[Socket.io] Connection error:', error.message);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`[Socket.io] Disconnected: ${reason}`);
    });
  }

  return socketInstance;
}

/**
 * Connect to socket server
 */
export function connectSocket() {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

/**
 * Disconnect socket server
 */
export function disconnectSocket() {
  if (socketInstance && socketInstance.connected) {
    socketInstance.disconnect();
  }
}
