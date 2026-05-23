import { useState, useEffect } from 'react';

export const pricingSuggestions = [
  { id: 1, item: 'Starbucks Reserve', current: 85000, suggested: 89000, reason: 'High Demand + 12% Cost Increase in Arabica Beans', impact: '+4.5% Margin', confidence: 92 },
  { id: 2, item: 'Croissant Butter', current: 28000, suggested: 25000, reason: 'Low Velocity, competitor price matching', impact: '+15% Volume', confidence: 85 },
  { id: 3, item: 'Caramel Macchiato', current: 55000, suggested: 58000, reason: 'Peak Hour demand (10 AM - 2 PM)', impact: '+Rp 2.4M/mo', confidence: 88 },
];

export function useRevenueIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [analysisMode, setAnalysisMode] = useState('optimization'); // optimization | forecasting
  
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return {
    loading,
    analysisMode, setAnalysisMode
  };
}
