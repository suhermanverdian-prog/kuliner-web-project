import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export const MARKETPLACE_SOURCES = [
  { id: 'gofood', name: 'GoFood', icon: '🛵', color: 'bg-green-500', status: 'connected', orders: 124, revenue: 5240000, margin: '18%' },
  { id: 'grabfood', name: 'GrabFood', icon: '🚴', color: 'bg-emerald-600', status: 'connected', orders: 89, revenue: 3120000, margin: '15%' },
  { id: 'shopeefood', name: 'ShopeeFood', icon: '🧡', color: 'bg-orange-500', status: 'connected', orders: 56, revenue: 1890000, margin: '20%' },
  { id: 'traveloka', name: 'Traveloka Eats', icon: '💙', color: 'bg-blue-400', status: 'disconnected', orders: 0, revenue: 0, margin: '-' },
];

export function useMarketplacePage() {
  const user = useAppStore(state => state.user);
  const [syncing, setSyncing] = useState(false);
  const [liveOrders, setLiveOrders] = useState([
    { id: 'GF-9921', source: 'GoFood', time: 'Just Now', status: 'preparing', total: 45000 },
    { id: 'GR-1102', source: 'GrabFood', time: '5m ago', status: 'new', total: 128000 },
  ]);
  const [recentSyncs, setRecentSyncs] = useState([
    { id: 1, source: 'GoFood', time: '2 menit lalu', status: 'success', items: 3 },
    { id: 2, source: 'GrabFood', time: '15 menit lalu', status: 'success', items: 1 },
    { id: 3, source: 'ShopeeFood', time: '1 jam lalu', status: 'success', items: 5 },
  ]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      const source = MARKETPLACE_SOURCES[Math.floor(Math.random() * 3)];
      setRecentSyncs(prev => [
        { id: Date.now(), source: source.name, time: 'Baru saja', status: 'success', items: 1 },
        ...prev.slice(0, 4)
      ]);
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      setSyncing(false);
    }
  };

  return {
    user,
    syncing,
    liveOrders,
    recentSyncs,
    handleSync
  };
}
