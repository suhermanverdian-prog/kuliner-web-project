import { useState, useEffect } from 'react';
import api from '../api';

export function useCustomerPortalPage(user) {
  const [view, setView] = useState('menu'); // 'menu' | 'profile'
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState(user?.points || 0);
  const [visits, setVisits] = useState(0);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchPortalData = async () => {
      setLoading(true);
      try {
        const identifier = user.phone || user.username || user.email;
        const res = await api.request(`${api.url}/loyalty/me?phone=${encodeURIComponent(identifier)}`, 'GET');
        if (res) {
          setPoints(res.points ?? user.points ?? 0);
          setVisits(res.total_visits ?? 0);
          setHistory(res.history ?? []);
        }
      } catch (err) {
        console.error('Failed to fetch loyalty data:', err);
        setError('Gagal memuat data loyalty. Menggunakan data lokal.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [user]);

  return {
    view,
    setView,
    loading,
    points,
    visits,
    history,
    error
  };
}
