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
    totalLogs: 0,
    failedSecurity: 0,
    aiVerifications: 0,
    serverUptime: '99.99%',
    latency: '45ms'
  });
  const [liveFeed, setLiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);

  const fetchGlobalData = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();
      const statsResponse = await api.getSystemStats();
      const logs = await api.getSystemLogs();
      const latencyMs = Date.now() - startTime;

      setStats({
        totalTenants: statsResponse.totalTenants || 0,
        activeTenants: statsResponse.activeTenants || 0,
        onlineUsers: statsResponse.onlineUsers || 0,
        globalRevenue: statsResponse.globalRevenue || 0,
        totalLogs: statsResponse.totalLogs || 0,
        failedSecurity: statsResponse.failedSecurity || 0,
        aiVerifications: statsResponse.aiVerifications || 0,
        serverUptime: '99.99%',
        latency: `${latencyMs}ms`
      });
      
      const formattedFeed = (logs || []).slice(0, 15).map((log, idx) => {
        let icon = Database;
        let color = 'text-amber-600';
        const typeStr = (log.activityType || log.activity_type || 'SYSTEM').toUpperCase();
        if (typeStr.includes('SEC') || typeStr.includes('AUTH') || typeStr.includes('GUARD')) {
          icon = Shield;
          color = 'text-emerald-500';
        } else if (typeStr.includes('WARN') || typeStr.includes('FAIL') || typeStr.includes('ERR') || typeStr.includes('ALERT')) {
          icon = AlertTriangle;
          color = 'text-rose-500';
        } else if (typeStr.includes('NAV') || typeStr.includes('CLIC') || typeStr.includes('SALE') || typeStr.includes('TX')) {
          icon = Zap;
          color = 'text-amber-500';
        }
        
        return {
          id: log.id || idx,
          type: typeStr,
          msg: `${log.userName || log.username || 'System'}: ${log.description || 'Performed action'}`,
          time: log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          icon,
          color
        };
      });
      setLiveFeed(formattedFeed);
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
