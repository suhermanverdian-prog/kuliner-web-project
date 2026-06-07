import { useState } from 'react';

export function useReportBuilderPage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const toggleMetric = (m) => {
    if (selectedMetrics.includes(m)) {
      setSelectedMetrics(selectedMetrics.filter(x => x !== m));
    } else {
      setSelectedMetrics([...selectedMetrics, m]);
    }
  };

  const generateReport = () => {
    if (!selectedNode || selectedMetrics.length === 0) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 2000);
  };

  return {
    selectedNode, setSelectedNode,
    selectedMetrics, setSelectedMetrics,
    period, setPeriod,
    loading, setLoading,
    generated, setGenerated,
    toggleMetric,
    generateReport
  };
}
