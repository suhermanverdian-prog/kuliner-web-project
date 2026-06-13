import { useState } from 'react';
import api from '../api';

export function useReportBuilderPage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [period, setPeriod] = useState('monthly consolidated');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [reportData, setReportData] = useState(null);

  const toggleMetric = (m) => {
    if (selectedMetrics.includes(m)) {
      setSelectedMetrics(selectedMetrics.filter(x => x !== m));
    } else {
      setSelectedMetrics([...selectedMetrics, m]);
    }
  };

  const generateReport = async () => {
    if (!selectedNode || selectedMetrics.length === 0) return;
    setLoading(true);
    try {
      const metricsStr = selectedMetrics.join(',');
      const data = await api.request(`${api.url}/laporan/flex-compile?node=${selectedNode}&metrics=${encodeURIComponent(metricsStr)}&period=${encodeURIComponent(period)}`, 'GET');
      setReportData(data.results || {});
      setGenerated(true);
    } catch (err) {
      alert(err.message || 'Gagal menyusun laporan');
      setGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    selectedNode, setSelectedNode,
    selectedMetrics, setSelectedMetrics,
    period, setPeriod,
    loading, setLoading,
    generated, setGenerated,
    toggleMetric,
    generateReport,
    reportData, setReportData
  };
}
