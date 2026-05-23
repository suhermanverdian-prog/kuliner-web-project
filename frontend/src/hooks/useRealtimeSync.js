import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? `http://${window.location.hostname}:3001`
  : '/'; // Asumsi production satu domain

export function useRealtimeSync(events) {
  const socketRef = useRef(null);

  useEffect(() => {
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
