import { useState, useEffect } from 'react';
import { api } from '../api';

export function useGuestMenu({ user, tableFromQR, tenantId }) {
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
    // Ambil tenantId dari prop (URL param) atau fallback ke localStorage
    const tId = tenantId || localStorage.getItem('tenantId');

    const fetchMenu = () => {
      // Kirim tenantId sebagai query param agar authMiddleware dapat inject context yang benar
      const params = tId ? { tenantId: tId } : {};
      return api.getMenu(params).then(data => setMenu(Array.isArray(data) ? data : [])).catch(() => setMenu([]));
    };

    const fetchShift = () => {
      return api.getActiveShift(tId ? { tenantId: tId } : {}).then(data => {
        setActiveShift(data);
        setLoadingShift(false);
      }).catch(() => setLoadingShift(false));
    };
    
    fetchMenu();
    fetchShift();
    const interval = setInterval(() => {
      fetchMenu();
      fetchShift();
    }, 10000);
    return () => clearInterval(interval);
  }, [tenantId]);


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

  const addToCart = (item, customization = null, finalPrice = null, customizationSummary = '') => {
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
  };

  const changeQty = (key, delta) => {
    setCart(prev => prev.map(i => (i.customKey === key || i.id === key) ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  };

  const getQty = (key) => cart.find(i => i.customKey === key || i.id === key)?.qty || 0;

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
