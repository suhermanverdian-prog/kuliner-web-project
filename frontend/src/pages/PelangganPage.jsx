import { useState } from 'react';
import { formatRupiah } from '../data';

const MOCK_CUSTOMERS = [
  { id: 1, name: 'Rina Marlina', phone: '081234567890', email: 'rina@email.com', points: 450, totalSpend: 1250000, visits: 18, lastVisit: '2026-05-01', status: 'member', joinDate: '2026-01-15' },
  { id: 2, name: 'Doni Pratama', phone: '082198765432', email: 'doni@email.com', points: 120, totalSpend: 380000, visits: 5, lastVisit: '2026-04-28', status: 'member', joinDate: '2026-03-10' },
  { id: 3, name: 'Sari Dewi', phone: '085311223344', email: 'sari@email.com', points: 890, totalSpend: 3200000, visits: 42, lastVisit: '2026-05-02', status: 'vip', joinDate: '2025-12-01' },
  { id: 4, name: 'Budi Cahyo', phone: '087765432100', email: '', points: 0, totalSpend: 95000, visits: 2, lastVisit: '2026-04-20', status: 'guest', joinDate: '2026-04-20' },
  { id: 5, name: 'Fitri Handayani', phone: '089900112233', email: 'fitri@email.com', points: 320, totalSpend: 890000, visits: 12, lastVisit: '2026-04-30', status: 'member', joinDate: '2026-02-14' },
];

const MOCK_HISTORY = [
  { id: 'TRX-042', date: '2026-05-01', items: 'Latte, Croissant', total: 57000, points: '+57', type: 'Dine-in' },
  { id: 'TRX-038', date: '2026-04-29', items: 'Americano x2', total: 56000, points: '+56', type: 'Take Away' },
  { id: 'TRX-031', date: '2026-04-25', items: 'Nasi Goreng, Latte', total: 70000, points: '+70', type: 'Dine-in' },
];

const STATUS_BADGE = {
  vip: { cls: 'badge-warning', label: '⭐ VIP' },
  member: { cls: 'badge-info', label: '👤 Member' },
  guest: { cls: 'badge-brown', label: '👣 Guest' },
};

export default function PelangganPage() {
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [rewardEnabled, setRewardEnabled] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', phone: '', email: '' });

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const totalPoints = customers.reduce((s, c) => s + c.points, 0);
  const totalMembers = customers.filter(c => c.status !== 'guest').length;
  const vipCount = customers.filter(c => c.status === 'vip').length;

  const handleAdd = () => {
    if (!newForm.name || !newForm.phone) return alert('Nama dan nomor HP wajib diisi!');
    setCustomers(prev => [...prev, {
      id: Date.now(), ...newForm, points: 0, totalSpend: 0, visits: 0,
      lastVisit: '-', status: 'member', joinDate: new Date().toISOString().split('T')[0]
    }]);
    setShowAddModal(false);
    setNewForm({ name: '', phone: '', email: '' });
  };

  return (
    <div>
      <h1 className="page-title">👥 Data Pelanggan</h1>
      <p className="page-subtitle">Kelola member, poin, dan loyalitas pelanggan</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Pelanggan', val: customers.length, icon: '👥', color: 'brown' },
          { label: 'Total Member', val: totalMembers, icon: '🎫', color: 'gold' },
          { label: 'Pelanggan VIP', val: vipCount, icon: '⭐', color: 'green' },
          { label: 'Total Poin Beredar', val: totalPoints.toLocaleString('id-ID'), icon: '🏆', color: 'blue' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: '12px' }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Reward Toggle */}
      <div className="card mb-4" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="flex justify-between items-center">
            <div>
              <strong>🎁 Program Poin & Reward</strong>
              <p className="text-sm text-muted mt-1">Aktifkan agar pelanggan bisa kumpulkan poin setiap transaksi (1 poin = Rp 1.000)</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <span className={`badge ${rewardEnabled ? 'badge-success' : 'badge-danger'}`}>
                {rewardEnabled ? 'Aktif' : 'Nonaktif'}
              </span>
              <div
                onClick={() => setRewardEnabled(!rewardEnabled)}
                style={{
                  width: '48px', height: '26px', borderRadius: '99px', cursor: 'pointer',
                  background: rewardEnabled ? 'var(--success)' : 'var(--border)',
                  position: 'relative', transition: 'var(--transition)'
                }}>
                <div style={{
                  position: 'absolute', top: '3px',
                  left: rewardEnabled ? '25px' : '3px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#fff', transition: 'var(--transition)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="category-tabs mb-4">
        {[{ k: 'list', l: '📋 Daftar Pelanggan' }, { k: 'qr', l: '📱 Mode Guest / QR' }].map(t => (
          <button key={t.k} className={`cat-tab ${activeTab === t.k ? 'active' : ''}`} onClick={() => setActiveTab(t.k)}>{t.l}</button>
        ))}
      </div>

      {activeTab === 'list' && (
        <div className="flex gap-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* List */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div className="flex justify-between items-center mb-3">
              <div style={{ position: 'relative', flex: 1, marginRight: '12px' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
                <input className="form-control" style={{ paddingLeft: '36px' }} placeholder="Cari nama atau nomor HP..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button id="btn-tambah-member" className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Tambah Member</button>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Pelanggan</th>
                      <th>No. HP</th>
                      <th>Status</th>
                      <th>Poin</th>
                      <th>Total Belanja</th>
                      <th>Kunjungan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}>
                              {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bergabung {c.joinDate}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-sm">{c.phone}</td>
                        <td><span className={`badge ${STATUS_BADGE[c.status].cls}`}>{STATUS_BADGE[c.status].label}</span></td>
                        <td>
                          {rewardEnabled
                            ? <span style={{ fontWeight: 700, color: 'var(--accent)' }}>🏆 {c.points}</span>
                            : <span className="text-muted text-xs">-</span>
                          }
                        </td>
                        <td><strong>{formatRupiah(c.totalSpend)}</strong></td>
                        <td>{c.visits}x</td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => setSelected(c)}>📋 Detail</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="card" style={{ width: '280px', flexShrink: 0 }}>
              <div className="card-header">
                <span className="card-title">📋 Profil Pelanggan</span>
                <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div className="card-body">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div className="user-avatar" style={{ width: '56px', height: '56px', fontSize: '1.2rem', margin: '0 auto 12px' }}>
                    {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selected.name}</div>
                  <span className={`badge ${STATUS_BADGE[selected.status].cls}`}>{STATUS_BADGE[selected.status].label}</span>
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: '2.2' }}>
                  {[
                    ['📱 HP', selected.phone],
                    ['📧 Email', selected.email || '-'],
                    ['📅 Bergabung', selected.joinDate],
                    ['🕐 Kunjungan Terakhir', selected.lastVisit],
                    ['🔢 Total Kunjungan', selected.visits + 'x'],
                    ['💰 Total Belanja', formatRupiah(selected.totalSpend)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted">{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                  {rewardEnabled && (
                    <div className="flex justify-between">
                      <span className="text-muted">🏆 Poin</span>
                      <strong style={{ color: 'var(--accent)' }}>{selected.points} poin</strong>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '10px' }}>📜 Riwayat Transaksi</div>
                  {MOCK_HISTORY.map(h => (
                    <div key={h.id} style={{ padding: '8px', background: 'var(--bg)', borderRadius: '8px', marginBottom: '6px', fontSize: '0.78rem' }}>
                      <div className="flex justify-between">
                        <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700 }}>{h.id}</span>
                        <span className="text-muted">{h.date}</span>
                      </div>
                      <div className="text-muted mt-1">{h.items}</div>
                      <div className="flex justify-between mt-1">
                        <strong>{formatRupiah(h.total)}</strong>
                        {rewardEnabled && <span style={{ color: 'var(--success)', fontWeight: 700 }}>{h.points} poin</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><span className="card-title">📱 QR Code Pemesanan Pelanggan</span></div>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{
                width: '180px', height: '180px', margin: '0 auto 20px',
                background: 'var(--bg)', border: '2px solid var(--border)',
                borderRadius: 'var(--radius-md)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '6rem'
              }}>
                🔲
              </div>
              <p style={{ fontWeight: 600, marginBottom: '8px' }}>Scan untuk Pesan Mandiri</p>
              <p className="text-sm text-muted mb-4">Pelanggan scan QR ini → Langsung ke halaman menu → Pesan tanpa daftar akun (Guest Mode)</p>
              <button className="btn btn-primary">⬇️ Download QR Code</button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">⚙️ Pengaturan Mode Pelanggan</span></div>
            <div className="card-body">
              {[
                { label: 'Tampilkan Harga di Menu Publik', desc: 'Sembunyikan jika tidak ingin harga terlihat oleh umum', default: true },
                { label: 'Wajib Isi Nama saat Checkout', desc: 'Pelanggan wajib isi nama sebelum pesan', default: true },
                { label: 'Wajib Isi Nomor WA', desc: 'Untuk notifikasi status pesanan via WhatsApp', default: true },
                { label: 'Tampilkan Catatan Pesanan', desc: 'Pelanggan bisa tambahkan catatan khusus', default: true },
              ].map((opt, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                  </div>
                  <input type="checkbox" defaultChecked={opt.default} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0, marginLeft: '16px' }} />
                </div>
              ))}
              <button className="btn btn-primary w-full mt-4" style={{ justifyContent: 'center' }}>💾 Simpan Pengaturan</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">➕ Daftarkan Member Baru</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Lengkap *</label>
                <input className="form-control" value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="cth: Rina Marlina" />
              </div>
              <div className="form-group">
                <label className="form-label">Nomor WhatsApp *</label>
                <input className="form-control" value={newForm.phone} onChange={e => setNewForm({ ...newForm, phone: e.target.value })} placeholder="cth: 081234567890" />
              </div>
              <div className="form-group">
                <label className="form-label">Email (opsional)</label>
                <input className="form-control" value={newForm.email} onChange={e => setNewForm({ ...newForm, email: e.target.value })} placeholder="cth: nama@email.com" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Batal</button>
              <button id="btn-simpan-member" className="btn btn-primary" onClick={handleAdd}>💾 Daftarkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
