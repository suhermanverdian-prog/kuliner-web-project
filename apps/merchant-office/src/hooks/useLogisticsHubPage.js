import { useState, useEffect } from 'react';
import { api } from '../api';

export function useLogisticsHubPage() {
  const [loading, setLoading] = useState(true);
  const [activeShipments, setActiveShipments] = useState([]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getInventoryLogistics();
      setActiveShipments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    loading,
    activeShipments
  };
}
