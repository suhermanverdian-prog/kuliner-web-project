import { useState, useEffect } from 'react';
import { useRealtimeSync } from './useRealtimeSync';
import { api } from '../api';

const STATUS_CONFIG = {
  new:     { next: 'cooking' },
  cooking: { next: 'ready' },
  ready:   { next: 'served' },
};

// Premium Synthesizer Kitchen Chime Sound
const playPremiumChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    // Play elegant kitchen chime (E5 -> A5)
    playNote(659.25, ctx.currentTime, 0.3);
    playNote(880.00, ctx.currentTime + 0.12, 0.6);
  } catch (e) {
    console.warn('⚠️ Gagal memutar suara KDS:', e.message);
  }
};

const mapTransactionToOrder = (t) => {
  if (!t) return null;
  
  let itemsList = [];
  let kdsStatus = 'new';
  let tableType = 'Take Away';
  
  if (t.items) {
    if (Array.isArray(t.items)) {
      itemsList = t.items;
      kdsStatus = t.kds_status || 'new';
      tableType = t.table_type || 'Take Away';
    } else if (typeof t.items === 'object') {
      itemsList = t.items.items || [];
      kdsStatus = t.items.kds_status || t.kds_status || 'new';
      tableType = t.items.table_type || t.table_type || 'Take Away';
    }
  }
  
  return {
    ...t,
    kdsStatus: kdsStatus,
    items: itemsList,
    tableType: tableType,
    customerName: t.customer_name || 'Pelanggan',
    paymentStatus: t.payment_status || 'paid',
    createdAt: t.created_at || new Date().toISOString(),
    paidAt: t.paid_at || t.created_at || new Date().toISOString()
  };
};

export function useKDSPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const txData = await api.getTransactions().catch(() => []);
      const tx = Array.isArray(txData) ? txData : [];
      const activeOrders = tx
        .map(mapTransactionToOrder)
        .filter(t => t && t.kdsStatus && t.kdsStatus !== 'served' && t.items && t.items.length > 0 && t.paymentStatus === 'paid')
        .sort((a, b) => new Date(a.paidAt || a.createdAt) - new Date(b.paidAt || b.createdAt));
      setOrders(activeOrders);
    } finally {
      setLoading(false);
    }
  };

  useRealtimeSync({
    'NEW_TRANSACTION': (newOrder) => {
      console.log('🔔 [KDS] Pesanan Baru Diterima:', newOrder.order_number);
      playPremiumChime();
      
      const formatted = mapTransactionToOrder(newOrder);
      if (formatted && formatted.paymentStatus === 'paid' && formatted.items.length > 0) {
        setOrders(prev => {
          const list = Array.isArray(prev) ? prev : [];
          if (list.find(o => o.id === formatted.id)) return list;
          
          return [...list, formatted].sort((a, b) => 
            new Date(a.paidAt || a.createdAt) - new Date(b.paidAt || b.createdAt)
          );
        });
      }
    },
    'KDS_UPDATE': ({ id, status }) => {
      console.log(`🔔 [KDS] Pembaruan status pesanan ${id} menjadi ${status}`);
      if (status === 'served') {
         setOrders(prev => (Array.isArray(prev) ? prev : []).filter(o => o.id !== id));
      } else {
         setOrders(prev => (Array.isArray(prev) ? prev : []).map(o => o.id === id ? { ...o, kdsStatus: status } : o));
      }
    }
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const advance = async (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const next = STATUS_CONFIG[order.kdsStatus]?.next;
    
    // Optimistic UI
    setOrders(prev => (Array.isArray(prev) ? prev : []).map(o => {
      if (o?.id !== id) return o;
      if (next === 'served') return null;
      return { ...o, kdsStatus: next };
    }).filter(Boolean));
    
    await api.updateKdsStatus(id, next);
  };

  const safeOrders = Array.isArray(orders) ? orders : [];
  const filtered = filter === 'all' ? safeOrders : safeOrders.filter(o => o?.kdsStatus === filter);
  const counts = {
    new:     safeOrders.filter(o => o?.kdsStatus === 'new').length,
    cooking: safeOrders.filter(o => o?.kdsStatus === 'cooking').length,
    ready:   safeOrders.filter(o => o?.kdsStatus === 'ready').length
  };

  return {
    orders: safeOrders,
    filter, setFilter,
    loading,
    filtered,
    counts,
    advance
  };
}
