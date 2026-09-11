import { useEffect, useState } from 'react';
import { socket, connectSocket, disconnectSocket } from '../api/socket';
import { useUser } from './useUser';
import { getAuthToken } from '../api/base';

export const useSocket = () => {
    const { user } = useUser();
    const [isConnected, setIsConnected] = useState(socket.connected);
    const userId =
        (user as any)?.studentId ||
        (user as any)?.employeeId ||
        (user as any)?.adminId ||
        (user as any)?.emp_id ||
        null;

    useEffect(() => {
        const token = getAuthToken();
        console.log('🔌 [useSocket] Syncing connection. Token:', token ? 'EXISTS' : 'MISSING', 'User:', userId ? 'EXISTS' : 'MISSING');

        if (token && userId) {
            console.log('🔌 [useSocket] Attempting connection...');
            connectSocket(token);
        } else if (!token) {
            disconnectSocket();
        }

        function onConnect() {
            setIsConnected(true);
            console.log('✅ [useSocket] Connected! ID:', socket.id);

            if (userId) {
                const role = (user as any)?.studentId ? 'student' : 'staff';
                socket.emit('join', {
                    userId,
                    role,
                    classId: (user as any)?.class,
                    sectionId: (user as any)?.section,
                    studentNumber: (user as any)?.studentNumber || (user as any)?.stud_no,
                    stud_id: (user as any)?.studentId || (user as any)?.stud_id,
                    stud_no: (user as any)?.studentNumber || (user as any)?.stud_no,
                    mapId: (user as any)?.mapId || (user as any)?.map_id,
                });
                console.log(`📡 [useSocket] Sent join handshake for ${role} ID: ${userId}`);
            }
        }

        function onDisconnect(reason: string) {
            setIsConnected(false);
            console.log('❌ [useSocket] Disconnected. Reason:', reason);
        }

        function onConnectError(err: any) {
            console.log('⚠️ [useSocket] Connection error:', err.message || err);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);

        if (socket.connected) {
            setIsConnected(true);
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
        };
    }, [userId]);

    const emitMessage = (event: string, data: any) => {
        if (socket.connected) {
            console.log(`📡 [SOCKET EMIT] Event: ${event}`, JSON.stringify(data, null, 2));
            socket.emit(event, data);
        } else {
            console.warn('Socket not connected. Cannot emit:', event);
        }
    };

    return {
        socket,
        isConnected,
        emitMessage,
    };
};
