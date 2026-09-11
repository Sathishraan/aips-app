import { io } from 'socket.io-client';

const getSocketConfig = (rawUrl?: string) => {
    if (!rawUrl) return { url: '', path: '/socket.io' };
    try {
        const parsed = new URL(rawUrl);
        const cleanPath = parsed.pathname.replace(/\/+$/, '');
        const socketPath = cleanPath ? `${cleanPath}/socket.io` : '/socket.io';
        return {
            url: parsed.origin,
            path: socketPath
        };
    } catch {
        return {
            url: rawUrl,
            path: '/socket.io'
        };
    }
};

const { url: SOCKET_BASE_URL, path: SOCKET_PATH } = getSocketConfig(process.env.EXPO_PUBLIC_NODE_URL);

export const socket = io(SOCKET_BASE_URL, {
    path: SOCKET_PATH,
    autoConnect: false,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 10000,
});

let currentConnectedToken: string | null = null;

export const connectSocket = (token: string) => {
    if (!token) return;

    if (socket.connected && currentConnectedToken === token) {
        return;
    }

    if (socket.connected) {
        socket.disconnect();
    }

    currentConnectedToken = token;

    socket.auth = {
        token: token,
        auth: token
    };

    socket.io.opts.path = SOCKET_PATH;
    socket.io.opts.extraHeaders = {
        'Authorization': `Bearer ${token}`,
        'X-Authorization': `Bearer ${token}`,
        'auth': token
    };
    socket.io.opts.transports = ['websocket', 'polling'];

    socket.connect();
    console.log(`🔌 [Socket] Connecting to ${SOCKET_BASE_URL} (path: ${SOCKET_PATH}) with fresh token...`);
};

export const disconnectSocket = () => {
    currentConnectedToken = null;
    if (socket.connected) {
        socket.disconnect();
        console.log('🔌 [Socket] Disconnected');
    }
};
