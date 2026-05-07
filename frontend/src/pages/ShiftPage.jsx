import { useState, useEffect } from 'react';
import { formatRupiah } from '../data';
import { api } from '../api';

export default function ShiftPage({ user }) {
  const [shifts, setShifts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kasInput, setKasInput] = useState('');
  const [showOpen, setShowOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [shiftData, txData] = await Promise.all([api.getShifts(), api.getTransactions()]);
    setShifts(shiftData.reverse());
    setTransactions(txData);
    setLoading(false);
  };

  const getShiftStats = (shift) => {
    const start = new Date(shift.startTime).getTime();
    const end = shift.endTime ? new Date(shift.endTime).getTime() : new Date().getTime();
    
    const shiftTxs = transactions.filter(t => {
      if (!t.createdAt) return false;
      const tTime = new Date(t.createdAt).getTime();
      return tTime >= start && tTime <= end && t.cashierName === shift.kasir;
    });

    let totalCash = 0, totalQRIS = 0, totalTransfer = 0, totalTrx = shiftTxs.length;
    shiftTxs.forEach(t => {
      if (t.paymentMethod === 'Tunai') totalCash += t.total;
      else if (t.paymentMethod === 'QRIS') totalQRIS += t.total;
      else if (t.paymentMethod === 'Transfer') totalTransfer += t.total;
    });

    return { totalTrx, totalCash, totalQRIS, totalTransfer, totalHutang: 0, void: 0, voidAmount: 0 };
  };

  const handleOpenShift = async () => {
    if (!kasInput) return alert('Masukkan kas awal!');
    await api.saveShift({ kasir: user.name, avatar: user.avatar, openCash: Number(kasInput) });
    setShowOpen(false);
    setKasInput('');
    fetchData();
  };

  const handleCloseShift = async (id) => {
    if (confirm('Tutup shift sekarang?')) {
      await api.saveShift({ id, status: 'closed' });
      fetchData();
    }
  };

  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>Memuat data shift...</div>;

  const totalRevenue = (stats) => stats.totalCash + stats.totalQRIS + stats.totalTransfer;
  const selisih = (stats, openCash) => (stats.totalCash - openCash);

  return (
    <div>
      <h1 className="page-title">🔄 Manajemen Shift Kasir</h1>
      <p className="page-subtitle">Buka tutup shift dan rekap per kasir</p>

      <div className="flex gap-3 mb-4">
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="stat-icon brown">💰</div>
          <div className="stat-value" style={{ fontSize: '1.4rem', marginTop: '12px' }}>{formatRupiah(shifts.reduce((sum, sh) => sum + totalRevenue(getShiftStats(sh)), 0))}</div>
          <div className="stat-label">Total Pendapatan Semua Shift</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="stat-icon gold">🧾</div>
          <div className="stat-value" style={{ fontSize: '1.4rem', marginTop: '12px' }}>{shifts.reduce((sum, sh) => sum + getShiftStats(sh).totalTrx, 0)}</div>
          <div className="stat-label">Total Transaksi</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="stat-icon green">👤</div>
          <div className="stat-value" style={{ fontSize: '1.4rem', marginTop: '12px' }}>{shifts.length}</div>
          <div className="stat-label">Shift Aktif Hari Ini</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button id="btn-buka-shift" className="btn btn-primary btn-lg" onClick={() => setShowOpen(true)}>
            ➕ Buka Shift Baru
          </button>
        </div>
      </div>

      <div className="grid-2">
        {shifts.map(s => {
          const stats = getShiftStats(s);
          const startStr = new Date(s.startTime).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
          const endStr = s.endTime ? new Date(s.endTime).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }) : null;
          return (
          <div key={s.id} className="card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="user-avatar">{s.avatar}</div>
                <div>
                  <div className="card-title">{s.kasir}</div>
                  <div className="text-xs text-muted">⏰ {startStr} – {endStr || 'Sekarang'}</div>
                </div>
              </div>
              <span className={`badge ${s.status === 'closed' ? 'badge-brown' : 'badge-success'}`}>
                {s.status === 'closed' ? 'Selesai' : '🟢 Aktif'}
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  ['🧾 Transaksi', stats.totalTrx],
                  ['💵 Tunai', formatRupiah(stats.totalCash)],
                  ['📱 QRIS', formatRupiah(stats.totalQRIS)],
                  ['🏦 Transfer', formatRupiah(stats.totalTransfer)],
                  ['📋 Hutang', formatRupiah(0)],
                  ['❌ Void', `0x (Rp 0)`],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: '8px' }}>
                    <div className="text-xs text-muted">{k}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '2px' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #FFF3EC, #FEECD8)', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>
                <div className="flex justify-between">
                  <span style={{ fontWeight: 600 }}>💰 Total Pendapatan</span>
                  <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{formatRupiah(totalRevenue(stats))}</strong>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-muted">Selisih Kas Tunai</span>
                  <span style={{ fontWeight: 700, color: selisih(stats, s.openCash) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {selisih(stats, s.openCash) >= 0 ? '+' : ''}{formatRupiah(selisih(stats, s.openCash))}
                  </span>
                </div>
              </div>
              {s.status === 'open' && (
                <button className="btn btn-danger w-full" style={{ justifyContent: 'center' }} onClick={() => handleCloseShift(s.id)}>
                  🔒 Tutup Shift
                </button>
              )}
              {s.status === 'closed' && (
                <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }}>
                  🖨️ Cetak Laporan Shift
                </button>
              )}
            </div>
          </div>
        )})}
      </div>

      {showOpen && (
        <div className="modal-overlay" onClick={() => setShowOpen(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">➕ Buka Shift Baru</span>
              <button className="modal-close" onClick={() => setShowOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Kasir Bertugas</label>
                <input type="text" className="form-control" value={user.name} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Uang Kas Awal (Rp)</label>
                <input type="number" className="form-control" value={kasInput} onChange={e => setKasInput(e.target.value)} placeholder="cth: 500000" />
              </div>
              <div className="form-group">
                <label className="form-label">Waktu Mulai</label>
                <input type="time" className="form-control" value={new Date().toTimeString().slice(0, 5)} disabled />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowOpen(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleOpenShift}>✅ Mulai Shift</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
