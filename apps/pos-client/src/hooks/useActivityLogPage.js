import { useState, useEffect } from 'react';
import { api } from '../api';

export function useActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getSystemLogs();
      setLogs(data || []);
    } catch (e) {
      console.error('Failed to load logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const getSeverity = (type) => {
    if (['ORDER_DELETE', 'PRICE_CHANGE'].includes(type)) return 'high';
    if (['LOGIN', 'LOGOUT'].includes(type)) return 'low';
    return 'medium';
  };

  const filtered = (Array.isArray(logs) ? logs : []).filter(log => {
    const matchSearch = log.user_name?.toLowerCase().includes(search.toLowerCase()) || 
                      log.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || log.activity_type === filter;
    return matchSearch && matchFilter;
  });

  return {
    logs,
    loading,
    search, setSearch,
    filter, setFilter,
    loadLogs,
    getSeverity,
    filtered
  };
}
