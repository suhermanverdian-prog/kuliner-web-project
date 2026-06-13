import { useState, useEffect } from 'react';
import { api } from '../api';

export function useRevenueIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [analysisMode, setAnalysisMode] = useState('optimization'); // optimization | forecasting
  const [pricingSuggestions, setPricingSuggestions] = useState([]);
  
  const fetchPricingModel = async () => {
    try {
      setLoading(true);
      const res = await api.getPricingSuggestions();
      setPricingSuggestions(res || []);
    } catch (error) {
      console.error('Failed to fetch AI pricing suggestions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingModel();
  }, []);

  const handleApplyChanges = async () => {
    try {
      setLoading(true);
      await api.bulkAdjustPrices(pricingSuggestions);
      alert('Saran kenaikan harga AI berhasil diterapkan pada menu!');
      await fetchPricingModel();
    } catch (error) {
      console.error('Failed to apply pricing suggestions', error);
      alert('Gagal menerapkan penyesuaian harga: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    analysisMode, setAnalysisMode,
    pricingSuggestions,
    handleApplyChanges,
    fetchPricingModel
  };
}
