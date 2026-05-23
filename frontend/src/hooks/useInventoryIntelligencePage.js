import { useState, useEffect } from 'react';
import { api } from '../api';

export function useInventoryIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const res = await api.getInventoryPredictions();
      setPredictions(res || []);
    } catch (err) {
      console.error("AI Insight Fail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  const criticalItems = predictions.filter(p => p.status === 'Kritis');
  const warningItems = predictions.filter(p => p.status === 'Peringatan');

  return {
    loading,
    predictions,
    criticalItems,
    warningItems,
    loadPredictions
  };
}
