import { useState, useEffect } from 'react';
import { api } from '../api';

const STATUS_CONFIG = {
  new:     { label: 'Pesanan Baru', headerCls: 'new', btnLabel: '🔥 Mulai Masak', btnCls: 'start', next: 'cooking' },
  cooking: { label: 'Sedang Dimasak', headerCls: 'cooking', btnLabel: '✅ Tandai Siap', btnCls: 'ready', next: 'ready' },
  ready:   { label: 'Siap Disajikan', headerCls: 'ready', btnLabel: '🍽️ Sudah Disajikan', btnCls: 'done', next: 'served' },
};

function WaitTime({ since }) {
  const [mins, setMins] = useState(0);
  useEffect(() => {
    const calc = () => setMins(Math.floor((Date.now() - new Date(since).getTime()) / 60000));
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [since]);
  const color = mins < 5 ? 'var(--success)' : mins < 10 ? 'var(--warning)' : 'var(--danger)';
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: 700, color, background: `${color}18`, borderRadius: '4px', padding: '2px 6px' }}>
      ⏱ {mins}m
    </span>
  );
}

export default function KDSPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    const tx = await api.getTransactions();
    // Only show paid orders that are in KDS (not served), FIFO by paidAt
    const activeOrders = tx
      .filter(t => t.kdsStatus && t.kdsStatus !== 'served' && t.items && t.items.length > 0)
      .sort((a, b) => new Date(a.paidAt || a.createdAt) - new Date(b.paidAt || b.createdAt));
    setOrders(activeOrders);
    setLoading(false);
  };

  const advance = async (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const next = STATUS_CONFIG[order.kdsStatus]?.next;
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      if (next === 'served') return null;
      return { ...o, kdsStatus: next };
    }).filter(Boolean));
    await api.updateKdsStatus(id, next);
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.kdsStatus === filter);
  const counts = {
    new:     orders.filter(o => o.kdsStatus === 'new').length,
    cooking: orders.filter(o => o.kdsStatus === 'cooking').length,
    ready:   orders.filter(o => o.kdsStatus === 'ready').length
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title" style={{ color: 'var(--text-primary)' }}>👨‍🍳 Kitchen Display System</h1>
          <p className="page-subtitle">Monitor dan proses semua pesanan dapur · FIFO (pertama masuk pertama dilayani)</p>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {[
            { key: 'all',     label: `Semua (${orders.length})` },
            { key: 'new',     label: `🆕 Baru (${counts.new})` },
            { key: 'cooking', label: `🔥 Masak (${counts.cooking})` },
            { key: 'ready',   label: `✅ Siap (${counts.ready})` },
          ].map(f => (
            <button key={f.key} className={`cat-tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>⏳ Memuat pesanan...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Semua Pesanan Selesai!</h3>
          <p className="text-sm mt-1">Tidak ada pesanan yang perlu diproses saat ini.</p>
        </div>
      ) : (
        <div className="kds-grid">
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.kdsStatus];
            if (!cfg) return null;
            const timeStr = new Date(order.paidAt || order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const isMember = order.type !== 'Self Order' ? false : !!order.customerPhone;
            const customerTypeLabel = order.customerName && order.customerPhone ? 'Member' : 'Guest';
            const customerTypeBadge = customerTypeLabel === 'Member'
              ? { bg: 'var(--success-light)', color: '#166534', border: '#86EFAC' }
              : { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' };

            return (
              <div key={order.id} className="kds-card">
                <div className={`kds-card-header ${cfg.headerCls}`}>
                  <div>
                    <div className="kds-order-num">{order.id}</div>
                    <div className="kds-table">{order.tableType || 'Take Away'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${cfg.headerCls === 'new' ? 'info' : cfg.headerCls === 'cooking' ? 'warning' : 'success'}`}>
                      {cfg.label}
                    </span>
                    <div className="kds-time mt-1" style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <span>{timeStr}</span>
                      <WaitTime since={order.paidAt || order.createdAt} />
                    </div>
                  </div>
                </div>

                {/* Customer info row */}
                <div style={{ padding: '8px 14px', background: 'var(--bg)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {order.customerName || 'Pelanggan'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700, background: customerTypeBadge.bg, color: customerTypeBadge.color, border: `1px solid ${customerTypeBadge.border}` }}>
                      {customerTypeLabel === 'Member' ? '⭐ Member' : '👤 Guest'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{order.paymentMethod}</span>
                  </div>
                </div>

                <div className="kds-items">
                  {order.items.map((item, i) => (
                    <div key={i} className="kds-item">
                      <div className="flex items-center gap-2">
                        <span className="kds-item-qty">{item.qty}</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.name}</div>
                          {item.note && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '2px', fontStyle: 'italic' }}>
                              📝 {item.note}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Global order note */}
                  {order.note && (
                    <div style={{ padding: '8px 12px', background: 'var(--warning-light)', borderRadius: '6px', margin: '8px 0', fontSize: '0.78rem', color: '#92400E', border: '1px solid #FDE68A' }}>
                      📋 Catatan: {order.note}
                    </div>
                  )}
                </div>

                <div className="kds-card-footer">
                  {order.kdsStatus !== 'served' && (
                    <button className={`kds-action-btn ${cfg.btnCls}`} onClick={() => advance(order.id)}>
                      {cfg.btnLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
