import { useState, useEffect, useCallback } from 'react';
import { printReport, downloadPDF, downloadCSV } from '../utils/reportPrinter';

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';
const fetch2 = (url) => fetch(url).then(r => r.json());

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}jt` : n >= 1000 ? `${(n/1000).toFixed(0)}rb` : String(n||0);

const PERIODS = [
  { key: 'today', label: '📅 Hari Ini' },
  { key: '7days', label: '📆 7 Hari' },
  { key: 'month', label: '🗓 Bulan Ini' },
  { key: 'year', label: '📊 Tahun Ini' },
  { key: 'custom', label: '🔧 Kustom' },
];

const COLORS_PAYMENT = ['var(--warning)', '#6366f1', 'var(--success)', 'var(--danger)', '#8b5cf6'];

function KPICard({ label, value, sub, icon, delta, color }) {
  const up = delta >= 0;
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{value}</div>
          {sub && <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>{sub}</div>}
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: color || '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{icon}</div>
      </div>
      {delta !== undefined && (
        <div style={{ marginTop: 10, fontSize: '0.78rem', color: up ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
          {up ? '▲' : '▼'} {Math.abs(delta)}% <span style={{ color: '#94a3b8', fontWeight: 400 }}>vs periode sebelumnya</span>
        </div>
      )}
    </div>
  );
}

function LineChart({ data, prev }) {
  const W = 600, H = 160, PAD = 30;
  const active = data.filter(d => d.value > 0);
  if (active.length === 0) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Belum ada data transaksi hari ini</div>;

  const allVals = [...data.map(d => d.value), ...prev.map(d => d.value)];
  const maxV = Math.max(...allVals, 1);
  const xScale = i => PAD + (i / 23) * (W - PAD * 2);
  const yScale = v => H - PAD - (v / maxV) * (H - PAD * 2);

  const toPath = (arr) => arr.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.hour)},${yScale(d.value)}`).join(' ');
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ position: 'relative' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {[0, maxV / 2, maxV].map((v, i) => (
          <g key={i}>
            <line x1={PAD} y1={yScale(v)} x2={W - PAD} y2={yScale(v)} stroke="#f1f5f9" strokeWidth="1" />
            <text x={PAD - 5} y={yScale(v) + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{fmtShort(v)}</text>
          </g>
        ))}
        {[6,9,12,15,18,21].map(h => (
          <text key={h} x={xScale(h)} y={H - 5} textAnchor="middle" fontSize="9" fill="#94a3b8">{h}:00</text>
        ))}
        <path d={toPath(prev)} fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4,3" />
        <path d={toPath(data)} fill="none" stroke="#6366f1" strokeWidth="2.5" />
        {data.map((d, i) => d.value > 0 && (
          <circle key={i} cx={xScale(d.hour)} cy={yScale(d.value)} r={hovered === i ? 5 : 3}
            fill={hovered === i ? '#6366f1' : '#fff'} stroke="#6366f1" strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
        ))}
        {hovered !== null && data[hovered]?.value > 0 && (
          <g>
            <rect x={xScale(hovered) - 55} y={yScale(data[hovered].value) - 42} width="110" height="36" rx="6" fill="#1e293b" />
            <text x={xScale(hovered)} y={yScale(data[hovered].value) - 26} textAnchor="middle" fontSize="9" fill="#94a3b8">{hovered}:00 - Hari ini</text>
            <text x={xScale(hovered)} y={yScale(data[hovered].value) - 14} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">{fmt(data[hovered].value)}</text>
          </g>
        )}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.75rem', color: '#64748b' }}>
        <span><svg width="20" height="3" style={{ verticalAlign: 'middle' }}><line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#6366f1" strokeWidth="2.5" /></svg> Periode Ini</span>
        <span><svg width="20" height="3" style={{ verticalAlign: 'middle' }}><line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4,3" /></svg> Sebelumnya</span>
      </div>
    </div>
  );
}

function DonutChart({ methods, total }) {
  if (!methods.length) return <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>Belum ada data</div>;
  let cumulative = 0;
  const R = 70, cx = 90, cy = 90, stroke = 40;
  const segments = methods.map((m, i) => {
    const pct = m.amount / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + R * Math.cos(startAngle), y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle), y2 = cy + R * Math.sin(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;
    return { ...m, path: `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: COLORS_PAYMENT[i % COLORS_PAYMENT.length] };
  });

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width="180" height="180">
        {segments.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
        <circle cx={cx} cy={cy} r={R - stroke} fill="#fff" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="9" fill="#64748b">Total</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="10" fill="#1e293b" fontWeight="bold">{fmtShort(total)}</text>
      </svg>
      <div style={{ flex: 1 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: '0.82rem', color: '#374151' }}>{s.name}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{fmt(s.amount)}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.pct}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LaporanPage() {
  const [period, setPeriod] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [trend, setTrend] = useState({ current: [], previous: [] });
  const [payment, setPayment] = useState({ methods: [], total: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [criticalStock, setCriticalStock] = useState([]);
  const [waste, setWaste] = useState({});
  const [insights, setInsights] = useState([]);

  const qs = () => {
    let q = `period=${period}`;
    if (period === 'custom') q += `&customStart=${customStart}&customEnd=${customEnd}`;
    return q;
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const q = qs();
      const [s, t, p, tp, cs, w, ins] = await Promise.all([
        fetch2(`${API_URL}/laporan/summary?${q}`),
        fetch2(`${API_URL}/laporan/trend?${q}`),
        fetch2(`${API_URL}/laporan/payment-methods?${q}`),
        fetch2(`${API_URL}/laporan/top-products?${q}`),
        fetch2(`${API_URL}/laporan/critical-stock`),
        fetch2(`${API_URL}/laporan/waste?${q}`),
        fetch2(`${API_URL}/laporan/insights?${q}`),
      ]);
      setSummary(s); setTrend(t); setPayment(p); setTopProducts(tp);
      setCriticalStock(cs); setWaste(w); setInsights(ins);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [period, customStart, customEnd]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const REPORT_TYPES = [
    { key: 'penjualan-harian', label: 'Laporan Penjualan Harian' },
    { key: 'penjualan-periode', label: 'Laporan Penjualan Periode' },
    { key: 'inventaris', label: 'Laporan Inventaris (Stok)' },
    { key: 'waste', label: 'Laporan Waste (Kerugian)' },
    { key: 'hpp', label: 'Laporan HPP (COGS)' },
    { key: 'laba-rugi', label: 'Laporan Laba Rugi' },
    { key: 'owner-dashboard', label: 'Dashboard Ringkasan Owner' },
    { key: 'stok-opname', label: 'Laporan Stok Opname' },
  ];

  const handlePrint = async (type) => {
    setExporting(true);
    try { await printReport(type, period, customStart, customEnd); }
    catch(e) { alert('Gagal membuat laporan: ' + e.message); }
    finally { setExporting(false); setShowExport(false); }
  };

  const handlePDF = async (type) => {
    setExporting(true);
    try { await downloadPDF(type, period, customStart, customEnd); }
    catch(e) { alert('Gagal download PDF: ' + e.message); }
    finally { setExporting(false); setShowExport(false); }
  };

  const handleCSV = async (type) => {
    setExporting(true);
    try { await downloadCSV(type, period, customStart, customEnd); }
    catch(e) { alert('Gagal export CSV: ' + e.message); }
    finally { setExporting(false); setShowExport(false); }
  };

  const handleExcel = async (type) => {
    setExporting(true);
    try {
      let q = `type=${type}&period=${period}`;
      if (period === 'custom') q += `&customStart=${customStart}&customEnd=${customEnd}`;
      const res = await fetch(`${API_URL}/report/excel?${q}`);
      if (!res.ok) throw new Error('Gagal generate Excel');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'all' 
        ? `laporan-semua-${new Date().toISOString().slice(0,10)}.xlsx` 
        : `laporan-${type}-${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch(e) {
      alert('Gagal download Excel: ' + e.message);
    } finally {
      setExporting(false);
      setShowExport(false);
    }
  };

  const insightStyle = { danger: { bg: '#fff1f2', border: 'var(--danger-light)', icon: '⚠️' }, warning: { bg: 'var(--warning-light)', border: '#fde68a', icon: '🟡' }, success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '✅' }, info: { bg: 'var(--info-light)', border: '#bae6fd', icon: 'ℹ️' } };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${period === p.key ? '#6366f1' : '#e2e8f0'}`, background: period === p.key ? '#6366f1' : '#fff', color: period === p.key ? '#fff' : '#374151', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
              {p.label}
            </button>
          ))}
          {period === 'custom' && (
            <>
              <input type="date" className="form-control" style={{ width: 145, fontSize: '0.82rem' }} value={customStart} onChange={e => setCustomStart(e.target.value)} />
              <input type="date" className="form-control" style={{ width: 145, fontSize: '0.82rem' }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowExport(!showExport)}
              style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              🖨️ Cetak / Unduh {showExport ? '▲' : '▼'}
            </button>
            {showExport && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 999, minWidth: 280, padding: 8 }}>
                <div style={{ padding: '6px 12px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Pilih Jenis Laporan</div>
                {REPORT_TYPES.map(rt => (
                  <div key={rt.key} style={{ display: 'flex', gap: 4, padding: '3px 4px', alignItems: 'center' }}>
                    <div style={{ flex: 1, fontSize: '0.78rem', fontWeight: 500, color: '#374151', padding: '0 4px' }}>{rt.label}</div>
                    <button onClick={() => handlePDF(rt.key)} disabled={exporting}
                      title="Download PDF"
                      style={{ padding: '6px 10px', background: 'var(--danger)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      ⬇ PDF
                    </button>
                    <button onClick={() => handlePrint(rt.key)} disabled={exporting}
                      title="Buka & Print"
                      style={{ padding: '6px 10px', background: '#6366f1', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', color: '#fff', fontWeight: 700 }}>
                      🖨️
                    </button>
                  </div>
                ))}
                
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                  <button onClick={() => handleExcel('all')} disabled={exporting}
                    style={{ width: '100%', padding: '8px 12px', background: '#15803d', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                    📊 Download Semua Laporan (Excel)
                  </button>
                </div>
                {exporting && <div style={{ padding: 10, textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>⏳ Memproses...</div>}
              </div>
            )}
          </div>
          <button onClick={loadAll} style={{ padding: '8px 12px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer' }}>🔄</button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>⏳ Memuat data laporan...</div>}

      {!loading && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
            <KPICard label="Total Penjualan" value={fmt(summary.totalRevenue)} sub={`${summary.totalTransactions || 0} transaksi`} icon="💰" delta={summary.vsYesterday?.revenue} color="var(--warning-light)" />
            <KPICard label="Estimasi HPP (COGS)" value={fmt(summary.totalHPP)} sub={`${summary.foodCostPct || 0}% dari penjualan`} icon="📦" delta={summary.vsYesterday?.hpp} color="var(--danger-light)" />
            <KPICard label="Laba Kotor" value={fmt(summary.grossProfit)} sub={`${summary.marginPct || 0}% margin`} icon="📈" delta={summary.vsYesterday?.grossProfit} color="#dcfce7" />
            <KPICard label="Rata-rata/Transaksi" value={fmt(summary.avgTransaction)} sub="Per transaksi" icon="⚡" delta={summary.vsYesterday?.avg} color="#e0e7ff" />
            <KPICard label="Total Transaksi" value={summary.totalTransactions || 0} sub="Transaksi" icon="🧾" delta={summary.vsYesterday?.transactions} color="#f3e8ff" />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: '#1e293b' }}>📉 Tren Penjualan (Per Jam)</div>
              <LineChart data={trend.current || []} prev={trend.previous || []} />
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: '#1e293b' }}>💳 Metode Pembayaran</div>
              <DonutChart methods={payment.methods || []} total={payment.total || 0} />
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Stok Kritis */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14, color: '#1e293b' }}>🚨 Stok Kritis</div>
              {criticalStock.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--success)', padding: 20, fontSize: '0.85rem' }}>✅ Semua stok aman</div>
              ) : criticalStock.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{b.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{b.stock} {b.unit} tersisa</div>
                  </div>
                  <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: b.status === 'kritis' || b.status === 'habis' ? 'var(--danger-light)' : '#fef9c3', color: b.status === 'kritis' || b.status === 'habis' ? 'var(--danger)' : '#b45309' }}>
                    {b.status === 'habis' ? 'Habis' : b.status === 'kritis' ? 'Kritis' : 'Rendah'}
                  </span>
                </div>
              ))}
            </div>

            {/* Produk Terlaris */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14, color: '#1e293b' }}>🏆 Produk Terlaris</div>
              {topProducts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20, fontSize: '0.85rem' }}>Belum ada data penjualan</div>
              ) : topProducts.slice(0, 6).map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 20, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{i + 1}</span>
                    <span style={{ fontSize: '1.1rem' }}>{p.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.83rem', fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{fmt(p.revenue)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.qty}</div>
                    {i === 0 && <span style={{ fontSize: '0.65rem', background: 'var(--warning-light)', color: '#b45309', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>⭐ Best</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Waste + Insight */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Waste */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, color: '#1e293b' }}>🗑️ Waste (Kerugian)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger)' }}>{fmt(waste.totalWaste)}</div>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: waste.wasteRatio > 3 ? 'var(--danger-light)' : '#dcfce7', color: waste.wasteRatio > 3 ? 'var(--danger)' : 'var(--success)' }}>
                    {waste.wasteRatio || 0}%
                  </span>
                </div>
                {(waste.categories || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginBottom: 4 }}>
                    <span>• {c.name}</span>
                    <span>{fmt(c.amount)} ({c.pct}%)</span>
                  </div>
                ))}
                {(!waste.categories || waste.categories.length === 0) && <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>✅ Tidak ada waste tercatat</div>}
                {waste.wasteRatio > 3 && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--danger-light)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
                    ⚠️ Waste melebihi 3%! Harap evaluasi operasional.
                  </div>
                )}
              </div>

              {/* Insights */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, color: '#1e293b' }}>💡 Insight & Rekomendasi</div>
                {insights.map((ins, i) => {
                  const st = insightStyle[ins.type] || insightStyle.info;
                  return (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: st.bg, border: `1px solid ${st.border}`, marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 3 }}>{ins.icon} {ins.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#374151' }}>{ins.body}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary Footer */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {[
              { label: 'Penjualan Kotor', value: fmt(summary.totalRevenue) },
              { label: 'Diskon', value: fmt(0) },
              { label: 'Penjualan Bersih', value: fmt(summary.totalRevenue) },
              { label: 'HPP (COGS)', value: fmt(summary.totalHPP) },
              { label: 'Laba Kotor', value: fmt(summary.grossProfit) },
              { label: 'Margin', value: `${summary.marginPct || 0}%` },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{item.value}</div>
              </div>
            ))}
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              * Data diperbarui terakhir {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </div>
          </div>
        </>
      )}
    </div>
  );
}
