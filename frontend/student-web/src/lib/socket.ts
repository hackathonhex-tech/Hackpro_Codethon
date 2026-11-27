'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socketInstance: Socket | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socketInstance;
};

export const useContestSocket = (contestId: string | null, attemptId: string | null) => {
  const { accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!contestId || !accessToken) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.auth = { token: accessToken };
    socket.connect();

    socket.on('connect', () => {
      socket.emit('join:contest', { contestId });
      if (attemptId) {
        socket.emit('join:attempt', { attemptId });
      }
    });

    return () => {
      socket.off('connect');
      socket.disconnect();
    };
  }, [contestId, attemptId, accessToken]);

  return socketRef.current;
};
