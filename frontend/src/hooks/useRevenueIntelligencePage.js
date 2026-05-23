import { useState, useEffect } from 'react';
import { api } from '../api';

export function useRevenueIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [analysisMode, setAnalysisMode] = useState('optimization'); // optimization | forecasting
  const [pricingSuggestions, setPricingSuggestions] = useState([]);
  
  useEffect(() => {
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

    fetchPricingModel();
  }, []);

  return {
    loading,
    analysisMode, setAnalysisMode,
    pricingSuggestions
  };
}
