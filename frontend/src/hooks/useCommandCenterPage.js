import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { Shield, Zap, Database, AlertTriangle } from 'lucide-react';
import { useRealtimeSync } from './useRealtimeSync';

export function useCommandCenterPage() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    onlineUsers: 0,
    globalRevenue: 0,
    serverUptime: '99.99%',
    latency: '45ms'
  });
  const [liveFeed, setLiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);

  const fetchGlobalData = async () => {
    try {
      setLoading(true);
      const tenants = await api.getTenants();
      // Simulasi agregasi data global
      setStats({
        totalTenants: tenants.length,
        activeTenants: tenants.filter(t => t.is_active).length,
        onlineUsers: Math.floor(tenants.length * 4.5),
        globalRevenue: 1254000000,
        serverUptime: '99.98%',
        latency: '38ms'
      });
      
      setLiveFeed([
        { id: 1, type: 'SALE', msg: 'New Order: Starbucks Reserve - Rp 85,000', time: 'Just now', icon: Zap, color: 'text-amber-500' },
        { id: 2, type: 'SECURITY', msg: 'AI Face Match: Verified - John Doe (Outlet 01)', time: '2m ago', icon: Shield, color: 'text-foreground' },
        { id: 3, type: 'SYSTEM', msg: 'Auto-Backup DB: Success (Node-04)', time: '5m ago', icon: Database, color: 'text-amber-600' },
        { id: 4, type: 'ALERT', msg: 'Low Stock: Biji Kopi Arabica at BrewHouse PIK', time: '8m ago', icon: AlertTriangle, color: 'text-destructive' },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Detect local dev environment
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Handler for NEW_TRANSACTION that can be used by both socket (local) and Supabase (prod)
  const handleNewTransaction = useCallback((tx) => {
    setStats(prev => ({
      ...prev,
      globalRevenue: prev.globalRevenue + (tx.total || 0),
      onlineUsers: prev.onlineUsers + 1
    }));

    const newFeedItem = {
      id: Date.now(),
      type: 'SALE',
      msg: `New Order: ${tx.order_number} - Rp ${tx.total?.toLocaleString('id-ID')}`,
      time: 'Just now',
      icon: Zap,
      color: 'text-amber-500'
    };

    setLiveFeed(prev => [newFeedItem, ...prev.slice(0, 15)]);
  }, []);

  // Use Supabase Realtime in non-local environments (long-term solution)
  useRealtimeSync(isLocal ? {} : { NEW_TRANSACTION: handleNewTransaction });

  useEffect(() => {
    fetchGlobalData();

    if (!isLocal) {
      console.log('ℹ️ [RealTime] Using Supabase Realtime in production. Socket.io disabled.');
      return;
    }

    // Initialize local Socket.io (development only)
    (async () => {
      try {
        const { io } = await import('socket.io-client');
        const socketUrl = 'http://localhost:3001';
        socketRef.current = io(socketUrl);

        socketRef.current.on('connect', () => {
          // connected
        });

        socketRef.current.on('NEW_TRANSACTION', (tx) => {
          handleNewTransaction(tx);
        });
      } catch (err) {
        console.warn('Socket initialization failed (dev only):', err);
      }
    })();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [handleNewTransaction, isLocal]);

  return {
    stats,
    liveFeed,
    loading,
    fetchGlobalData
  };
}
