import { useState, useEffect } from 'react';
import { formatRupiah } from '../data';
import { api } from '../api';

/* ── Komponen Grafik Bar SVG 7 hari ─────────────────────────────── */
function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const W = 520, H = 180, BAR_W = 36, GAP = (W - data.length * BAR_W) / (data.length + 1);

  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} style={{ width: '100%', height: 'auto' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i} x1={0} y1={H - H * f} x2={W} y2={H - H * f}
          stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {data.map((d, i) => {
        const x = GAP + i * (BAR_W + GAP);
        const barH = maxVal > 0 ? (d.value / maxVal) * (H - 10) : 4;
        const y = H - barH;
        const isToday = i === data.length - 1;
        return (
          <g key={i}>
            {/* Bar gradient background */}
            <defs>
              <linearGradient id={`bar${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isToday ? 'var(--accent)' : 'var(--primary)'} stopOpacity="1" />
                <stop offset="100%" stopColor={isToday ? 'var(--accent)' : 'var(--primary)'} stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <rect x={x} y={y} width={BAR_W} height={barH}
              rx="6" fill={`url(#bar${i})`}
              style={{ transition: 'height 0.5s ease, y 0.5s ease' }} />
            {/* Value label on top */}
            {d.value > 0 && (
              <text x={x + BAR_W / 2} y={y - 5}
                textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontWeight="600">
                {d.value >= 1000000 ? (d.value / 1000000).toFixed(1) + 'jt'
                  : d.value >= 1000 ? (d.value / 1000).toFixed(0) + 'k' : d.value}
              </text>
            )}
            {/* Day label */}
            <text x={x + BAR_W / 2} y={H + 20}
              textAnchor="middle" fontSize="10" fill={isToday ? 'var(--accent)' : 'var(--text-muted)'}
              fontWeight={isToday ? '700' : '500'}>
              {d.label}
            </text>
            {isToday && (
              <text x={x + BAR_W / 2} y={H + 32}
                textAnchor="middle" fontSize="9" fill="var(--accent)" fontWeight="700">
                Hari ini
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Komponen Donat Mini ─────────────────────────────────────────── */
function DonutMini({ pct, color }) {
  const R = 20, C = 2 * Math.PI * R;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={R} fill="none" stroke="var(--border)" strokeWidth="7" />
      <circle cx="26" cy="26" r={R} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${C * pct / 100} ${C}`}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '26px 26px', transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  );
}

/* ── Dashboard Utama ─────────────────────────────────────────────── */
export default function Dashboard({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // FASE 5: Analytics State
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [financialAnalytics, setFinancialAnalytics] = useState(null);
  const [inventoryAnalytics, setInventoryAnalytics] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getTransactions(), api.getMenu(), api.getTables(),
      api.getAnalyticsSales('month').catch(() => null),
      api.getAnalyticsFinancial('month').catch(() => null),
      api.getAnalyticsInventory('month').catch(() => null)
    ]).then(([txData, menuData, tblData, salesData, finData, invData]) => {
      setTransactions(txData);
      setMenu(menuData);
      setTables(tblData);
      if (salesData) setSalesAnalytics(salesData);
      if (finData) setFinancialAnalytics(finData);
      if (invData) setInventoryAnalytics(invData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  /* ── Kalkulasi Data ── */
  const today = new Date().toISOString().split('T')[0];
  const todayTx = transactions.filter(t => t.createdAt?.startsWith(today));
  const todayRevenue = todayTx.reduce((s, t) => s + (t.total || 0), 0);
  const totalTx = transactions.length;
  const totalMenuSold = transactions.reduce((s, t) => s + (t.items?.reduce((si, i) => si + i.qty, 0) || 0), 0);
  const activeTables = tables.filter(t => t.status === 'occupied').length;

  const stats = [
    { label: 'Pendapatan Hari Ini', value: formatRupiah(todayRevenue), icon: '💰', color: 'brown', badge: `${todayTx.length} transaksi`, up: true },
    { label: 'Total Transaksi', value: totalTx.toString(), icon: '🧾', color: 'gold', badge: 'All time', up: true },
    { label: 'Menu Terjual', value: totalMenuSold.toString(), icon: '☕', color: 'green', badge: 'Semua item', up: true },
    { label: 'Meja Aktif', value: `${activeTables} / ${tables.length}`, icon: '🪑', color: 'blue', badge: 'Sekarang', up: activeTables > 0 },
  ];

  /* ── Data Grafik 7 Hari ── */
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const rev = transactions
      .filter(t => t.createdAt?.startsWith(key))
      .reduce((s, t) => s + (t.total || 0), 0);
    const labels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return { label: labels[d.getDay()], value: rev };
  });

  /* ── Top Produk ── */
  const productSales = {};
  transactions.forEach(t => {
    t.items?.forEach(item => {
      if (!productSales[item.id]) productSales[item.id] = { qty: 0, rev: 0, name: item.name };
      productSales[item.id].qty += item.qty;
      productSales[item.id].rev += item.price * item.qty;
    });
  });
  const topProducts = Object.values(productSales)
    .map(p => {
      const m = menu.find(x => x.id === Number(Object.keys(productSales).find(k => productSales[k] === p)));
      return { ...p, name: m?.name || p.name };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const maxQty = Math.max(...topProducts.map(p => p.qty), 1);

  /* ── Aktivitas Terbaru ── */
  const recentTx = [...transactions].reverse().slice(0, 6);

  /* ── Status Meja ── */
  const tableStats = [
    { label: 'Kosong', count: tables.filter(t => t.status === 'available').length, color: 'var(--success)' },
    { label: 'Terisi', count: tables.filter(t => t.status === 'occupied').length, color: 'var(--danger)' },
    { label: 'Reservasi', count: tables.filter(t => t.status === 'reserved').length, color: 'var(--warning)' },
  ];
  const totalTables = tables.length || 1;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '2.5rem' }}>☕</div>
      <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Memuat data dashboard...</div>
    </div>
  );

  return (
    <div>
      <h1 className="page-title">Selamat Datang, {user.name.split(' ')[0]}! ☕</h1>
      <p className="page-subtitle">
        {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        &nbsp;· Ringkasan Bisnis Hari Ini
      </p>

      {/* ── Stats Cards ── */}
      <div className="stats-grid">
        {user.role === 'kasir' ? stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-card-top">
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <span className={`stat-badge ${s.up ? 'up' : 'down'}`}>{s.up ? '▲' : '▼'} {s.badge}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        )) : (
          <>
            <div className="stat-card">
              <div className="stat-card-top"><div className="stat-icon green">💸</div></div>
              <div className="stat-value">{formatRupiah(financialAnalytics?.pnl?.revenue || 0)}</div>
              <div className="stat-label">Total Revenue (Bulan Ini)</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top"><div className="stat-icon red">📉</div></div>
              <div className="stat-value">{formatRupiah(financialAnalytics?.pnl?.expense || 0)}</div>
              <div className="stat-label">Total Expense (COGS)</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top"><div className="stat-icon blue">🏦</div></div>
              <div className="stat-value">{formatRupiah(financialAnalytics?.pnl?.net_profit || 0)}</div>
              <div className="stat-label">Net Profit Estimation</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top"><div className="stat-icon brown">📦</div></div>
              <div className="stat-value">{inventoryAnalytics?.turnover_ratio || 0}x</div>
              <div className="stat-label">Stock Turnover Ratio</div>
            </div>
          </>
        )}
      </div>

      {user.role !== 'kasir' && salesAnalytics?.menu_engineering && (
        <div className="card mb-4" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>📊 Menu Engineering Matrix</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            {['Stars', 'Puzzles', 'Plow Horses', 'Dogs'].map(category => (
              <div key={category} style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', background: 'var(--bg-light)' }}>
                <h4 style={{ color: 'var(--primary-dark)', marginBottom: '12px' }}>{category}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                  {salesAnalytics.menu_engineering.filter(m => m.category === category).map((m, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>• {m.name}</li>
                  ))}
                  {salesAnalytics.menu_engineering.filter(m => m.category === category).length === 0 && (
                    <li style={{ color: 'var(--text-muted)' }}>Kosong</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Grafik + Top Produk ── */}
      <div className="grid-2 mb-4">
        {/* Bar Chart 7 Hari */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📈 Penjualan 7 Hari Terakhir</span>
            <span className="badge badge-brown">{formatRupiah(weekData.reduce((s, d) => s + d.value, 0))}</span>
          </div>
          <div className="card-body">
            {weekData.every(d => d.value === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
                <div>Belum ada data penjualan minggu ini</div>
              </div>
            ) : (
              <BarChart data={weekData} />
            )}
          </div>
        </div>

        {/* Top Produk */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🏆 Produk Terlaris</span>
            <span className="badge badge-success">{topProducts.length} item</span>
          </div>
          <div className="card-body">
            {topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>☕</div>
                <div>Belum ada produk terjual</div>
              </div>
            ) : (
              topProducts.map((p, i) => (
                <div key={i} style={{ marginBottom: '14px' }}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--border)',
                        color: i < 3 ? '#fff' : 'var(--text-muted)',
                        width: '20px', height: '20px', borderRadius: '50%',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 800
                      }}>{i + 1}</span>
                      {p.name}
                    </span>
                    <span className="text-muted">{p.qty}x · {formatRupiah(p.rev)}</span>
                  </div>
                  <div className="stock-bar">
                    <div className="stock-bar-fill ok" style={{ width: `${(p.qty / maxQty) * 100}%`, background: i === 0 ? 'var(--accent)' : 'var(--primary)' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Status Meja + Transaksi Terbaru ── */}
      <div className="grid-2 mb-4">
        {/* Status Meja Visual */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🪑 Status Meja</span>
            <span className="badge badge-info">{tables.length} meja</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {tableStats.map((ts, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <DonutMini pct={(ts.count / totalTables) * 100} color={ts.color} />
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: ts.color, marginTop: '4px' }}>{ts.count}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ts.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: '8px' }}>
              {tables.slice(0, 12).map(t => {
                const color = t.status === 'available' ? 'var(--success)' : t.status === 'occupied' ? 'var(--danger)' : 'var(--warning)';
                return (
                  <div key={t.id} style={{
                    background: t.status === 'available' ? '#EDFAF3' : t.status === 'occupied' ? '#FEF0EE' : '#FFF8ED',
                    border: `1.5px solid ${color}`, borderRadius: '8px',
                    padding: '6px 4px', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color
                  }}>
                    <div>{t.status === 'available' ? '🪑' : t.status === 'occupied' ? '👥' : '🔖'}</div>
                    <div>{t.name.replace('Meja ', 'M')}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚡ Aktivitas Terbaru</span>
            <span className="badge badge-brown">{recentTx.length} transaksi</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {recentTx.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Belum ada transaksi</div>
            ) : (
              recentTx.map((tx, i) => {
                const time = new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                const totalItems = tx.items?.reduce((s, x) => s + x.qty, 0) || 0;
                return (
                  <div key={tx.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 24px',
                    borderBottom: i < recentTx.length - 1 ? '1px solid var(--border-light)' : 'none',
                    transition: 'background 0.2s'
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', flexShrink: 0
                    }}>🧾</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', fontFamily: 'monospace' }}>{tx.id}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.tableType || 'Take Away'} · {totalItems} item · {tx.paymentMethod}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{formatRupiah(tx.total)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{time}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
