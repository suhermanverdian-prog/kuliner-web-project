import { useState, useEffect } from 'react';
import { api } from '../api';

export function useLaporanAbsensiPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [outletInfo, setOutletInfo] = useState(null);

  useEffect(() => {
    fetchLogs();
    api.getOutletInfo().then(data => setOutletInfo(data)).catch(() => {});
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAttendanceLogs();
      setLogs(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredLogs = logs.filter(l => 
    l.employee_name?.toLowerCase().includes(search.toLowerCase())
  );

  return {
    logs,
    loading,
    search, setSearch,
    outletInfo,
    fetchLogs,
    filteredLogs
  };
}
