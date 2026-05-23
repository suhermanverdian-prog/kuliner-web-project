import { useState, useEffect } from 'react';
import { api } from '../api';

export function useGuestMenu({ user, tableFromQR }) {
  const [category, setCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutTotal, setCheckoutTotal] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [menu, setMenu] = useState([]);
  const [orderMode, setOrderMode] = useState(tableFromQR ? 'Dine-in' : null);
  const [tableNumber, setTableNumber] = useState(tableFromQR || '');
  const [activeShift, setActiveShift] = useState(null);
  const [loadingShift, setLoadingShift] = useState(true);

  useEffect(() => {
    const fetchMenu = () => api.getMenu().then(data => setMenu(data));
    const fetchShift = () => api.getActiveShift().then(data => {
      setActiveShift(data);
      setLoadingShift(false);
    }).catch(() => setLoadingShift(false));
    
    fetchMenu();
    fetchShift();
    const interval = setInterval(() => {
      fetchMenu();
      fetchShift();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.removeItem('lastOrderId');
      setActiveOrderId(null);
    } else {
      const saved = localStorage.getItem('lastOrderId');
      if (saved) setActiveOrderId(saved);
    }
  }, [user]);

  const handleOrderSuccess = (id) => {
    localStorage.setItem('lastOrderId', id);
    setActiveOrderId(id);
    setCart([]);
    setCheckoutTotal(null);
  };

  const filtered = menu.filter(m => {
    const matchCat = category === 'Semua' || m.category === category;
    const matchSearch = (m.name || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  };

  const getQty = (id) => cart.find(i => i.id === id)?.qty || 0;

  return {
    category, setCategory,
    search, setSearch,
    cart, setCart,
    showCart, setShowCart,
    checkoutTotal, setCheckoutTotal,
    activeOrderId, setActiveOrderId,
    menu, setMenu,
    orderMode, setOrderMode,
    tableNumber, setTableNumber,
    activeShift, setActiveShift,
    loadingShift, setLoadingShift,
    handleOrderSuccess,
    filtered,
    totalItems,
    addToCart,
    changeQty,
    getQty
  };
}
