import { useState, useEffect } from 'react';
import { api } from '../api';

const PERMISSIONS = [
  { key: 'akses_kasir', label: 'Akses Menu Kasir', icon: '💰' },
  { key: 'akses_gudang', label: 'Akses Menu Gudang', icon: '📦' },
  { key: 'akses_dapur', label: 'Akses Menu Dapur (KDS)', icon: '👨‍🍳' },
  { key: 'akses_keuangan', label: 'Akses Data Keuangan', icon: '📊' },
  { key: 'lihat_hpp', label: 'Lihat HPP & Modal', icon: '💹' },
  { key: 'lihat_laba', label: 'Lihat Laba Rugi', icon: '📈' },
  { key: 'hapus_transaksi', label: 'Hapus Transaksi', icon: '🗑️' },
  { key: 'atur_user', label: 'Atur Pengguna', icon: '👥' },
];

const ROLE_LABELS = { admin:'Admin', owner:'Owner', kasir:'Kasir', koki:'Koki/Barista', gudang:'Gudang', akuntan:'Akuntan' };
const ROLE_ICONS = { admin:'⚙️', owner:'👑', kasir:'💰', koki:'👨‍🍳', gudang:'📦', akuntan:'📊' };

function AddUserModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'kasir' });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:'400px'}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">👤 Tambah Pengguna Baru</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="cth: Ahmad Fauzi" />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-control" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="cth: ahmad_kasir" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Minimal 6 karakter" />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              {Object.keys(ROLE_LABELS).map(k => <option key={k} value={k}>{ROLE_LABELS[k]}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Batal</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={loading}>
            {loading ? '⏳ Memproses...' : '💾 Simpan Pengguna'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      background: type === 'success' ? 'var(--success)' : 'var(--danger)',
      color: '#fff', padding: '12px 20px',
      borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.875rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease'
    }}>
      {type === 'success' ? '✅' : '❌'} {msg}
    </div>
  );
}

export default function PengaturanPage() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [settings, setSettings] = useState({ storeName: 'BrewMaster Coffee', tax: 10, serviceCharge: 5, rewardEnabled: true });
  const [savingSettings, setSavingSettings] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    fetchUsers();
    api.getSettings().then(s => { if (s) setSettings(s); }).catch(() => {});
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setUsers(await api.getUsers());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const togglePerm = (userId, permKey) => {
    setUsers(prev => prev.map(u => u.id === userId
      ? { ...u, permissions: { ...u.permissions, [permKey]: !u.permissions?.[permKey] } }
      : u
    ));
    if (selected?.id === userId)
      setSelected(prev => ({ ...prev, permissions: { ...prev.permissions, [permKey]: !prev.permissions?.[permKey] } }));
  };

  const handleSaveUser = async () => {
    if (!selected) return;
    try {
      setLoading(true);
      await api.saveUser(selected);
      await fetchUsers();
      showToast('Pengaturan pengguna berhasil disimpan!');
    } catch { showToast('Gagal menyimpan perubahan.', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Yakin hapus pengguna ini?')) return;
    try {
      await api.deleteUser(userId);
      setSelected(null);
      await fetchUsers();
      showToast('Pengguna berhasil dihapus!');
    } catch { showToast('Gagal menghapus pengguna.', 'error'); }
  };

  const handleAddUser = async (formData) => {
    if (!formData.name || !formData.username || !formData.password)
      return showToast('Semua kolom wajib diisi!', 'error');
    try {
      setLoading(true);
      await api.saveUser({
        ...formData,
        avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        permissions: formData.role === 'admin' ? { all: true } : {}
      });
      await fetchUsers();
      setShowAddModal(false);
      showToast('Pengguna baru berhasil ditambahkan!');
    } catch { showToast('Gagal menambahkan pengguna.', 'error'); }
    finally { setLoading(false); }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await api.saveSettings(settings);
      showToast('Pengaturan sistem berhasil disimpan!');
    } catch { showToast('Gagal menyimpan pengaturan.', 'error'); }
    finally { setSavingSettings(false); }
  };

  const handleBackup = async () => {
    try {
      const [menu, bahan, transactions, tables, customers, suppliers, pos] = await Promise.all([
        api.getMenu(), api.getBahan(), api.getTransactions(),
        api.getTables(), api.getCustomers(), api.getSuppliers(), api.getPO()
      ]);
      const backup = { menu, bahan, transactions, tables, customers, suppliers, purchase_orders: pos, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `brewmaster-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast('Backup berhasil diunduh!');
    } catch { showToast('Gagal membuat backup.', 'error'); }
  };

  return (
    <div>
      <h1 className="page-title">⚙️ Pengaturan Sistem</h1>
      <p className="page-subtitle">Kelola pengguna, hak akses, dan konfigurasi aplikasi</p>

      <div className="category-tabs mb-4">
        {[
          { key: 'users',   label: '👥 Pengguna & Akses' },
          { key: 'system',  label: '🔧 Pajak & Sistem' },
          { key: 'branding',label: '🎨 Branding' },
        ].map(t => (
          <button key={t.key} className={`cat-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Pengguna ── */}
      {activeTab === 'users' && (
        <div className="flex gap-4" style={{alignItems:'flex-start', flexWrap:'wrap'}}>
          <div className="card" style={{flex:'1', minWidth:'280px'}}>
            <div className="card-header">
              <span className="card-title">👥 Daftar Pengguna ({users.length})</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Tambah</button>
            </div>
            <div className="card-body" style={{padding:'8px'}}>
              {loading ? <div style={{padding:'20px', textAlign:'center', color:'var(--text-muted)'}}>Memuat...</div> :
                users.map(u => (
                <div key={u.id} onClick={() => setSelected({...u})}
                  style={{
                    display:'flex', alignItems:'center', gap:'12px', padding:'12px',
                    borderRadius:'var(--radius-sm)', cursor:'pointer', transition:'var(--transition)',
                    background: selected?.id === u.id ? 'var(--bg)' : 'transparent',
                    border: selected?.id === u.id ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                  }}>
                  <div className="user-avatar">{u.avatar}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600, fontSize:'0.875rem'}}>{u.name}</div>
                    <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{ROLE_ICONS[u.role]} {ROLE_LABELS[u.role]}</div>
                  </div>
                  <span className="badge badge-brown">{u.username}</span>
                </div>
              ))}
            </div>
          </div>

          {selected && (
            <div className="card" style={{width:'320px', flexShrink:0}}>
              <div className="card-header">
                <span className="card-title">🔐 Akses: {selected.name.split(' ')[0]}</span>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(selected.id)}>🗑️ Hapus</button>
              </div>
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4"
                  style={{padding:'12px', background:'var(--bg)', borderRadius:'var(--radius-sm)'}}>
                  <div className="user-avatar">{selected.avatar}</div>
                  <div>
                    <div style={{fontWeight:700}}>{selected.name}</div>
                    <div className="text-xs text-muted">{ROLE_ICONS[selected.role]} {ROLE_LABELS[selected.role]} · @{selected.username}</div>
                  </div>
                </div>
                {selected.permissions?.all && (
                  <div style={{background:'var(--success-light)', border:'1px solid var(--success)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginBottom:'12px', fontSize:'0.8rem', color:'var(--success)', fontWeight:600}}>
                    ✅ Admin memiliki semua hak akses penuh
                  </div>
                )}
                {PERMISSIONS.map(perm => (
                  <div key={perm.key} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border-light)'}}>
                    <span style={{fontSize:'0.875rem'}}>{perm.icon} {perm.label}</span>
                    <input type="checkbox"
                      checked={selected.permissions?.all || !!selected.permissions?.[perm.key]}
                      disabled={!!selected.permissions?.all}
                      onChange={() => { if (!selected.permissions?.all) togglePerm(selected.id, perm.key); }}
                      style={{width:'18px', height:'18px', accentColor:'var(--primary)', cursor:'pointer'}}
                    />
                  </div>
                ))}
                <button className="btn btn-primary w-full mt-4" style={{justifyContent:'center'}}
                  onClick={handleSaveUser} disabled={loading}>
                  {loading ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Sistem ── */}
      {activeTab === 'system' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><span className="card-title">💰 Pajak & Konfigurasi</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Nama Toko</label>
                <input className="form-control" value={settings.storeName}
                  onChange={e => setSettings({...settings, storeName: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">PPN / Pajak (%)</label>
                  <input type="number" className="form-control" min="0" max="100"
                    value={settings.tax}
                    onChange={e => setSettings({...settings, tax: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Service Charge (%)</label>
                  <input type="number" className="form-control" min="0" max="100"
                    value={settings.serviceCharge}
                    onChange={e => setSettings({...settings, serviceCharge: Number(e.target.value)})} />
                </div>
              </div>

              {/* ── Loyalty / Reward ── */}
              <div style={{borderTop:'1px solid var(--border)', paddingTop:'16px', marginBottom:'16px'}}>
                <div style={{fontWeight:700, marginBottom:'12px'}}>⭐ Program Loyalty Member</div>
                <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', marginBottom:'12px'}}>
                  <input type="checkbox" checked={settings.rewardEnabled ?? true}
                    onChange={e => setSettings({...settings, rewardEnabled: e.target.checked})}
                    style={{width:'18px', height:'18px', accentColor:'var(--primary)'}} />
                  <span className="form-label" style={{margin:0}}>Aktifkan Program Loyalty / Reward Point</span>
                </label>
                {(settings.rewardEnabled ?? true) && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nilai Transaksi per 1 Poin (Rp)</label>
                      <input type="number" className="form-control" min="1000" step="1000"
                        value={settings.pointsPerRp || 10000}
                        onChange={e => setSettings({...settings, pointsPerRp: Number(e.target.value)})} />
                      <div style={{fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'4px'}}>
                        Contoh: 10.000 = setiap Rp 10.000 pembelian mendapat 1 poin
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nilai 1 Poin = Diskon (Rp)</label>
                      <input type="number" className="form-control" min="0" step="100"
                        value={settings.pointValue || 100}
                        onChange={e => setSettings({...settings, pointValue: Number(e.target.value)})} />
                      <div style={{fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'4px'}}>
                        Contoh: 100 = 1 poin senilai Rp 100 diskon
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Payment Gateway ── */}
              <div style={{borderTop:'1px solid var(--border)', paddingTop:'16px', marginBottom:'16px'}}>
                <div style={{fontWeight:700, marginBottom:'4px'}}>💳 Payment Gateway</div>
                <div style={{fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'12px'}}>
                  Integrasi otomatis untuk pembayaran QRIS / E-Wallet. Segera hadir.
                </div>
                <div style={{background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:'12px 16px', display:'flex', gap:'12px', flexWrap:'wrap'}}>
                  {['Midtrans', 'Xendit', 'Doku'].map(gw => (
                    <div key={gw} style={{padding:'8px 16px', borderRadius:'var(--radius-sm)', border:'1.5px dashed var(--border)', fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600}}>
                      {gw} <span style={{fontSize:'0.7rem', marginLeft:'4px', background:'var(--warning-light)', color:'#92400E', borderRadius:'4px', padding:'1px 6px'}}>Segera</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSaveSettings} disabled={savingSettings}>
                {savingSettings ? '⏳ Menyimpan...' : '💾 Simpan Pengaturan'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">🔧 Backup & Data</span></div>
            <div className="card-body">
              <p className="text-sm text-muted mb-4">
                Download backup seluruh data sistem dalam format JSON. Mencakup menu, bahan baku, transaksi, pelanggan, dan data lainnya.
              </p>
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                <button className="btn btn-accent" onClick={handleBackup}>⬇️ Download Backup JSON</button>
                <button className="btn btn-outline" onClick={() => showToast('Restore akan tersedia di versi berikutnya.', 'error')}>
                  ⬆️ Restore dari File
                </button>
                <div style={{borderTop:'1px solid var(--border)', paddingTop:'16px', marginTop:'4px'}}>
                  <p className="text-xs text-muted mb-3">
                    ⚠️ Reset akan menghapus <strong>semua data permanen</strong>. Backup terlebih dahulu!
                  </p>
                  <button className="btn btn-danger btn-sm" onClick={() => {
                    if (window.confirm('PERINGATAN: Ini akan menghapus SEMUA data. Lanjutkan?'))
                      showToast('Reset tidak diimplementasikan di mode demo.', 'error');
                  }}>
                    ⚠️ Reset Semua Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Branding ── */}
      {activeTab === 'branding' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><span className="card-title">🎨 Tema & Warna</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Warna Utama Tema</label>
                <div className="flex gap-3 items-center">
                  <input type="color" defaultValue="#6F4E37"
                    style={{width:'48px', height:'38px', border:'1px solid var(--border)', borderRadius:'8px', cursor:'pointer'}} />
                  <span className="text-sm text-muted">Default: Coklat Kopi (#6F4E37)</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Style Tampilan Menu Pelanggan</label>
                <select className="form-control">
                  <option>Style 1 - Grid Gambar Besar</option>
                  <option>Style 2 - Daftar Teks</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Teks Footer Struk</label>
                <textarea className="form-control" rows="3"
                  defaultValue={'Terima kasih sudah berkunjung!\nFollow IG: @brewmaster_coffee'} />
              </div>
              <button className="btn btn-primary">💾 Simpan Tampilan</button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">🖼️ Logo & Aset</span></div>
            <div className="card-body">
              <div style={{border:'2px dashed var(--border)', borderRadius:'var(--radius-md)', padding:'40px', textAlign:'center', marginBottom:'16px', cursor:'pointer'}}>
                <div style={{fontSize:'3rem', marginBottom:'8px'}}>☕</div>
                <div style={{fontWeight:600}}>Upload Logo Toko</div>
                <div className="text-sm text-muted mt-1">PNG, JPG, SVG (maks. 2MB)</div>
                <button className="btn btn-outline btn-sm mt-2">Pilih File</button>
              </div>
              <div style={{background:'var(--bg)', borderRadius:'var(--radius-md)', padding:'16px'}}>
                <div style={{fontWeight:700, fontSize:'0.875rem', marginBottom:'4px'}}>☕ BrewMaster Coffee</div>
                <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>Preview logo pada tampilan depan</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onSave={handleAddUser} loading={loading} />}
      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
