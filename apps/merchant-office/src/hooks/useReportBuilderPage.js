import { useState, useCallback } from 'react';
import api from '../api';

const API = api.url;

export function useReportBuilderPage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [period, setPeriod] = useState('monthly consolidated');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [reportData, setReportData] = useState(null);

  const getHeaders = useCallback(() => {
    let token = null;
    let tenantId = null;

    const storageStr = localStorage.getItem('ken-enterprise-storage');
    if (storageStr) {
      try {
        const storage = JSON.parse(storageStr);
        const state = storage.state || storage;
        const user = state.user || state;
        if (user) {
          token = user.token;
          const innerUser = user.user || user;
          tenantId = innerUser.tenant_id || user.tenant_id;
        }
      } catch (e) {}
    }

    token = token || localStorage.getItem('token');
    tenantId = tenantId || localStorage.getItem('tenantId');

    const headers = { 'Content-Type': 'application/json' };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantId && tenantId !== 'null' && tenantId !== 'undefined') {
      headers['x-tenant-id'] = tenantId;
    }
    return headers;
  }, []);

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
      const res = await fetch(`${API}/laporan/flex-compile?node=${selectedNode}&metrics=${encodeURIComponent(metricsStr)}&period=${encodeURIComponent(period)}`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to compile report');
      const data = await res.json();
      setReportData(data.results || {});
      setGenerated(true);
    } catch (err) {
      alert(err.message);
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
