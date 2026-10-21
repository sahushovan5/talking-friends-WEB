import { io } from 'socket.io-client';

const SIGNALING_SERVER_URL =
  import.meta.env.VITE_SIGNALING_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:5000');

let socketInstance = null;

/**
 * Get or create persistent browser ID shared by all tabs in the same browser
 */
export function getBrowserId() {
  if (typeof window === 'undefined') return 'server_id';
  let id = localStorage.getItem('echomesh_browser_id');
  if (!id) {
    id = 'b_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      localStorage.setItem('echomesh_browser_id', id);
    } catch (e) {
      // ignore
    }
  }
  return id;
}

/**
 * Get or initialize the Socket.io client singleton
 */
export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SIGNALING_SERVER_URL, {
      autoConnect: false,
      auth: {
        browserId: getBrowserId()
      },
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
