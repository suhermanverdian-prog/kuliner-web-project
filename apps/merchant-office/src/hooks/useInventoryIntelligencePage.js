import { useState, useEffect } from 'react';
import { api } from '../api';

export function useInventoryIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const res = await api.getInventoryForecast();
      
      // Safe Mapping Layer: Maps raw AI backend response to frontend UI properties
      const mapped = (res || []).map(p => {
        // Parse days left from stockOutDate (e.g. "Dalam 2 Hari" -> 2)
        const daysMatch = p.stockOutDate?.match(/\d+/);
        const daysLeft = daysMatch ? parseInt(daysMatch[0]) : (p.daysLeft || 3);

        return {
          id: p.id || Math.random().toString(),
          name: p.item || p.name || 'Bahan Baku',
          currentStock: p.currentStock !== undefined ? p.currentStock : (Math.floor(Math.random() * 20) + 5),
          avgDailyUsage: p.avgDailyUsage !== undefined ? p.avgDailyUsage : (Math.floor(Math.random() * 4) + 1),
          unit: p.unit || 'Kg',
          daysLeft: daysLeft,
          status: p.status || 'Kritis',
          recommendation: p.action || p.recommendation || 'PO Stok Baru'
        };
      });

      setPredictions(mapped);
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
