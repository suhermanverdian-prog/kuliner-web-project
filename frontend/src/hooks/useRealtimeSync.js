import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const isLocalNetwork = () => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.') ||
    hostname.endsWith('.local')
  );
};

const getSocketUrl = () => {
  const customApiUrl = import.meta.env.VITE_API_URL;
  if (customApiUrl) {
    // Extract base server domain (e.g., https://backend.com/api -> https://backend.com)
    return customApiUrl.replace(/\/api\/?$/, '');
  }
  return isLocalNetwork()
    ? `http://${window.location.hostname}:3001`
    : '/';
};

const SOCKET_URL = getSocketUrl();

export function useRealtimeSync(events) {
  const socketRef = useRef(null);

  useEffect(() => {
    const hasCustomBackend = !!import.meta.env.VITE_API_URL;
    if (!isLocalNetwork() && !hasCustomBackend) {
      console.log('ℹ️ [RealTime] WebSockets disabled in production Vercel environment.');
      return;
    }

    // Inisialisasi koneksi
    socketRef.current = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // Daftarkan semua event handler yang dilempar dari komponen
    if (events) {
      Object.entries(events).forEach(([eventName, handler]) => {
        socket.on(eventName, handler);
      });
    }

    socket.on('connect', () => {
      console.log('✅ [RealTime] Terhubung ke Server Engine.');
    });

    socket.on('disconnect', () => {
      console.warn('⚠️ [RealTime] Terputus dari Server Engine.');
    });

    // Graceful Cleanup (Anti-Memory Leak)
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [events]);

  return socketRef.current;
}
