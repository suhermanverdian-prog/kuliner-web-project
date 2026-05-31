import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useRealtimeSync } from './useRealtimeSync';

export function useKasir() {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [category, setCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [selectedPendingTx, setSelectedPendingTx] = useState(null);
  const [isCartOpenMobile, setIsCartOpenMobile] = useState(false);

  // Online status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchMenuAndOrders = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [menuData, txData, shiftData] = await Promise.all([
        api.getMenu().catch(() => []),
        api.getTransactions().catch(() => []),
        api.getActiveShift().catch(() => null)
      ]);
      setMenus(menuData);
      setActiveShift(shiftData);
      setPendingOrders(Array.isArray(txData) ? txData.filter(t => t.paymentStatus === 'pending_payment' || t.paymentStatus === 'pending_acceptance') : []);
    } catch (error) {
      console.error("Failed to fetch kasir data:", error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuAndOrders(true);
  }, [fetchMenuAndOrders]);

  useRealtimeSync({
    'NEW_TRANSACTION': () => {
       console.log('🔔 [Kasir] Transaksi baru terdeteksi, memperbarui pesanan...');
       fetchMenuAndOrders(false);
    },
    'KDS_UPDATE': () => {
       fetchMenuAndOrders(false);
    }
  });

  const addToCart = useCallback((item, customization = null, finalPrice = null, customizationSummary = '') => {
    setCart(prev => {
      const itemPrice = finalPrice !== null ? finalPrice : item.price;
      const customKey = customization 
        ? `${item.id}-${JSON.stringify(customization)}` 
        : `${item.id}-default`;
      
      const existingIndex = prev.findIndex(i => i.customKey === customKey);
      if (existingIndex > -1) {
        return prev.map((i, idx) => idx === existingIndex ? { ...i, qty: i.qty + (item.qty || 1) } : i);
      }
      return [...prev, { 
        ...item, 
        price: itemPrice, 
        qty: item.qty || 1, 
        customKey, 
        customization,
        customizationSummary
      }];
    });
  }, []);

  const changeQty = useCallback((key, delta) => {
    setCart(prev => prev.map(i => (i.customKey === key || i.id === key) ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  }, []);

  const handleCheckoutSuccess = useCallback((tx) => {
    setLastTx(tx);
    setShowCheckout(false);
    setShowSuccess(true);
    setCart([]);
    fetchMenuAndOrders();
  }, [fetchMenuAndOrders]);

  const onNavigate = useCallback((path) => {
    if (path === 'shift') navigate('/shifts');
    else navigate(`/${path}`);
  }, [navigate]);

  const filteredMenus = useMemo(() => {
    return (Array.isArray(menus) ? menus : []).filter(m => 
      (category === 'Semua' || m.category === category) && 
      (m.name || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [menus, category, search]);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((a, b) => a + b.qty, 0), [cart]);

  return {
    // Data
    menus,
    loading,
    activeShift,
    pendingOrders,
    isOnline,
    
    // Filters & Search
    category,
    setCategory,
    search,
    setSearch,
    filteredMenus,
    
    // Cart
    cart,
    addToCart,
    changeQty,
    setCart,
    subtotal,
    cartItemCount,
    
    // Modals & UI State
    showCheckout,
    setShowCheckout,
    showSuccess,
    setShowSuccess,
    lastTx,
    setLastTx,
    selectedPendingTx,
    setSelectedPendingTx,
    isCartOpenMobile,
    setIsCartOpenMobile,
    
    // Actions
    fetchMenuAndOrders,
    handleCheckoutSuccess,
    onNavigate,
  };
}
