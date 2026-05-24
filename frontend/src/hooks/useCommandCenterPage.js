import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from '../api';
import { Shield, Zap, Database, AlertTriangle } from 'lucide-react';

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

  useEffect(() => {
    fetchGlobalData();
    
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      console.log('ℹ️ [RealTime] WebSockets disabled in production Vercel environment.');
      return;
    }

    // Initialize Real-time Socket
    const socketUrl = 'http://localhost:3001';
    socketRef.current = io(socketUrl);

    socketRef.current.on('connect', () => {

    });

    socketRef.current.on('NEW_TRANSACTION', (tx) => {
      // Update Global Metrics Instantly
      setStats(prev => ({
        ...prev,
        globalRevenue: prev.globalRevenue + (tx.total || 0),
        onlineUsers: prev.onlineUsers + 1 // Simulate active session increase
      }));

      // Add to Live Feed
      const newFeedItem = {
        id: Date.now(),
        type: 'SALE',
        msg: `New Order: ${tx.order_number} - Rp ${tx.total?.toLocaleString('id-ID')}`,
        time: 'Just now',
        icon: Zap,
        color: 'text-amber-500'
      };
      setLiveFeed(prev => [newFeedItem, ...prev.slice(0, 15)]);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  return {
    stats,
    liveFeed,
    loading,
    fetchGlobalData
  };
}
