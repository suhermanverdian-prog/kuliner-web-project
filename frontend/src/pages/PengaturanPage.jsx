import { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Users, Settings, Palette, Shield, 
  Trash2, Plus, Save, Download, 
  RefreshCw, CheckCircle2, AlertCircle,
  User, ShieldCheck, Mail, Lock,
  Store, Percent, CreditCard, Layout,
  Image as ImageIcon, Upload, LogOut, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";

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
const ROLE_COLORS = { admin:'bg-blue-500', owner:'bg-purple-500', kasir:'bg-amber-500', koki:'bg-emerald-500', gudang:'bg-slate-500', akuntan:'bg-indigo-500' };

function AddUserModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'kasir', avatar_url: '' });
  const [uploading, setUploading] = useState(false);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 border-none">
        <CardHeader className="border-b pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Plus size={24} strokeWidth={3} />
              </div>
              <div>
                <CardTitle className="text-xl">Tambah Anggota Tim</CardTitle>
                <CardDescription>Daftarkan anggota tim baru untuk mengelola operasional.</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}><X size={20} /></Button>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Kolom Foto - 4 grid */}
            <div className="md:col-span-4 flex flex-col items-center gap-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-full text-center">Foto Profil</label>
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-muted border-4 border-background shadow-xl flex items-center justify-center overflow-hidden transition-all group-hover:scale-105">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-muted-foreground/40" />
                  )}
                </div>
                <button 
                  onClick={() => document.getElementById('avatar-upload').click()}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all border-4 border-background"
                >
                  <Upload size={16} />
                </button>
              </div>
              <p className="text-[9px] text-muted-foreground text-center px-4 leading-relaxed uppercase font-bold tracking-widest opacity-60">Format JPG/PNG, Maks 2MB. Foto akan tampil di struk dan dashboard.</p>
              <input 
                id="avatar-upload"
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setUploading(true);
                  const formData = new FormData();
                  formData.append('image', file);
                  try {
                    const res = await fetch(`${api.url}/upload`, { method: 'POST', body: formData }).then(r => r.json());
                    if (res.url) setForm({...form, avatar_url: res.url});
                  } catch (err) { console.error('Upload failed', err); }
                  finally { setUploading(false); }
                }} 
              />
            </div>

            {/* Kolom Form - 8 grid */}
            <div className="md:col-span-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Nama Lengkap</label>
                <Input 
                  className="h-12 bg-muted/20 border-none focus:ring-2 focus:ring-accent rounded-xl font-medium" 
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="Masukkan nama asli pegawai..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Username</label>
                  <Input 
                    className="h-12 bg-muted/20 border-none focus:ring-2 focus:ring-accent rounded-xl font-medium" 
                    value={form.username} onChange={e => setForm({...form, username: e.target.value})} 
                    placeholder="id_pegawai" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Role / Jabatan</label>
                  <select 
                    className="flex h-12 w-full rounded-xl border-none bg-muted/20 px-3 py-1 text-sm font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" 
                    value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  >
                    {Object.keys(ROLE_LABELS).map(k => <option key={k} value={k}>{ROLE_LABELS[k]}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Kata Sandi (Password)</label>
                <div className="relative">
                  <Input 
                    type="password" 
                    className="h-12 bg-muted/20 border-none focus:ring-2 focus:ring-accent rounded-xl font-medium pr-10" 
                    value={form.password} onChange={e => setForm({...form, password: e.target.value})} 
                    placeholder="Minimal 6 karakter" 
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30" size={18} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/5 p-6 gap-3">
          <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold" onClick={onClose} disabled={loading || uploading}>Batal</Button>
          <Button className="flex-[2] h-12 rounded-xl font-black bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20" onClick={() => onSave(form)} disabled={loading || uploading}>
            {loading ? <RefreshCw className="animate-spin mr-2" /> : null}
            {loading ? 'MENYIMPAN...' : 'DAFTARKAN ANGGOTA'}
          </Button>
        </CardFooter>
      </Card>
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
  const [savingSettings, setSavingSettings] = useState(false);
  const [loyaltyConfig, setLoyaltyConfig] = useState({ enabled: true, multiplier: 10000 });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    fetchUsers();
    api.getSettings().then(s => { if (s) setSettings(s); }).catch(() => {});
    api.getSettingsLoyalty().then(l => { if (l) setLoyaltyConfig(l); }).catch(() => {});
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
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
      await api.saveSettingsLoyalty(loyaltyConfig);
      showToast('Pengaturan sistem & loyalty berhasil disimpan!');
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
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h2>
        <p className="text-muted-foreground mt-1">Konfigurasi operasional, hak akses pengguna, dan personalisasi brand.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-2xl border w-fit">
        {[
          { key: 'users', label: 'Pengguna & Akses', icon: Users },
          { key: 'system', label: 'Pajak & Sistem', icon: Settings },
          { key: 'branding', label: 'Branding', icon: Palette },
        ].map(t => (
          <Button 
            key={t.key}
            variant={activeTab === t.key ? "secondary" : "ghost"} 
            className={cn("h-10 px-6 font-bold rounded-xl", activeTab === t.key && "bg-background shadow-sm")}
            onClick={() => setActiveTab(t.key)}
          >
            <t.icon size={16} className="mr-2" /> {t.label}
          </Button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User List */}
          <Card className="lg:col-span-1 border-none shadow-xl overflow-hidden bg-card">
            <CardHeader className="border-b bg-muted/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Daftar Pengguna</CardTitle>
                <Button size="sm" variant="outline" className="h-8 font-bold border-accent text-accent" onClick={() => setShowAddModal(true)}>
                  <Plus size={14} className="mr-1" /> Tambah
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {users.map(u => (
                  <button 
                    key={u.id} 
                    onClick={() => setSelected({...u})}
                    className={cn(
                      "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left group",
                      selected?.id === u.id ? "bg-accent/10 border-accent/20 border shadow-sm" : "hover:bg-muted/50 border border-transparent"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm overflow-hidden", !u.avatar_url && (ROLE_COLORS[u.role] || "bg-slate-400"))}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.avatar || u.name[0]
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{ROLE_LABELS[u.role]}</p>
                    </div>
                    <div className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground group-hover:bg-background transition-colors">
                      @{u.username}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permissions Editor */}
          <Card className="lg:col-span-2 border-none shadow-xl bg-card">
            {selected ? (
              <>
                <CardHeader className="border-b bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg overflow-hidden", !selected.avatar_url && (ROLE_COLORS[selected.role] || "bg-slate-400"))}>
                        {selected.avatar_url ? (
                          <img src={selected.avatar_url} alt={selected.name} className="w-full h-full object-cover" />
                        ) : (
                          selected.avatar || selected.name[0]
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{selected.name}</CardTitle>
                        <CardDescription>Hak Akses & Otoritas Sistem</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(selected.id)}>
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  {selected.permissions?.all && (
                    <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-8 text-blue-600">
                      <ShieldCheck className="shrink-0" />
                      <p className="text-sm font-bold leading-relaxed">
                        Administrator memiliki hak akses penuh ke seluruh fitur sistem tanpa pengecualian.
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PERMISSIONS.map(perm => (
                      <div 
                        key={perm.key} 
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all",
                          (selected.permissions?.all || !!selected.permissions?.[perm.key]) ? "bg-accent/5 border-accent/20 shadow-sm" : "bg-muted/20 opacity-60"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl grayscale-[0.5]">{perm.icon}</span>
                          <span className="text-sm font-bold">{perm.label}</span>
                        </div>
                        <input 
                          type="checkbox"
                          className="w-5 h-5 rounded-md border-muted text-accent focus:ring-accent accent-accent cursor-pointer"
                          checked={selected.permissions?.all || !!selected.permissions?.[perm.key]}
                          disabled={!!selected.permissions?.all}
                          onChange={() => togglePerm(selected.id, perm.key)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/5 p-6 gap-4">
                  <Button className="w-full h-12 font-black shadow-lg shadow-accent/20" onClick={handleSaveUser} disabled={loading}>
                    <Save size={18} className="mr-2" /> Simpan Hak Akses
                  </Button>
                </CardFooter>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-30">
                <Shield size={80} strokeWidth={1} />
                <div>
                  <p className="text-xl font-black">Pilih Pengguna</p>
                  <p className="text-sm">Klik pada daftar pengguna untuk mengelola hak akses mereka.</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-xl bg-card">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="flex items-center gap-2">
                <Store className="text-accent" /> Profil & Biaya Operasional
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Nama Bisnis</label>
                <Input value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} className="h-12 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-1"><Percent size={12}/> Pajak PPN (%)</label>
                  <Input type="number" value={settings.tax} onChange={e => setSettings({...settings, tax: Number(e.target.value)})} className="h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-1"><Percent size={12}/> Service Charge (%)</label>
                  <Input type="number" value={settings.serviceCharge} onChange={e => setSettings({...settings, serviceCharge: Number(e.target.value)})} className="h-12 font-bold" />
                </div>
              </div>

              <div className="pt-6 border-t space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">Program Loyalty Member</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Akumulasi poin belanja</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-10 h-5 accent-accent cursor-pointer" 
                    checked={loyaltyConfig.enabled} 
                    onChange={e => setLoyaltyConfig({...loyaltyConfig, enabled: e.target.checked})} 
                  />
                </div>
                {loyaltyConfig.enabled && (
                  <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Setiap Belanja (Rp)</label>
                      <Input 
                        type="number" 
                        value={loyaltyConfig.multiplier} 
                        onChange={e => setLoyaltyConfig({...loyaltyConfig, multiplier: Number(e.target.value)})} 
                        className="h-10 text-sm font-bold" 
                      />
                      <p className="text-[9px] text-muted-foreground italic">Dapat 1 Poin</p>
                    </div>
                    <div className="space-y-2 opacity-40">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Nilai 1 Poin (Rp)</label>
                      <Input type="number" value={100} disabled className="h-10 text-sm font-bold" />
                      <p className="text-[9px] text-muted-foreground italic">Potongan diskon (Segera)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={18} className="text-muted-foreground" />
                  <h4 className="font-bold">Integrasi Pembayaran</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Midtrans', 'Xendit', 'Doku'].map(gw => (
                    <div key={gw} className="p-4 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-not-allowed group">
                      <p className="text-xs font-black uppercase tracking-tighter">{gw}</p>
                      <span className="text-[8px] font-black bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full uppercase group-hover:bg-amber-500 group-hover:text-white transition-colors">Segera</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/5 p-6">
              <Button className="w-full h-12 font-black shadow-lg shadow-accent/20" onClick={handleSaveSettings} disabled={savingSettings}>
                {savingSettings ? 'Menyimpan...' : 'Simpan Konfigurasi'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-xl bg-card h-fit">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="flex items-center gap-2">
                <RefreshCw size={18} className="text-accent" /> Pemeliharaan & Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex gap-4 items-start p-4 bg-muted/40 rounded-2xl border border-dashed">
                <div className="h-10 w-10 bg-background rounded-xl flex items-center justify-center shrink-0 border">
                  <Download size={20} className="text-accent" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold">Ekspor Seluruh Data Bisnis</h4>
                  <p className="text-xs text-muted-foreground mt-1">Unduh semua master data dan riwayat transaksi dalam format JSON untuk cadangan keamanan.</p>
                  <Button variant="outline" className="mt-4 w-full h-10 font-bold border-accent text-accent hover:bg-accent hover:text-white" onClick={handleBackup}>
                    Unduh Backup Sekarang
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h4 className="text-sm font-bold text-destructive">Zona Bahaya</h4>
                <p className="text-xs text-muted-foreground mt-1">Tindakan di bawah ini tidak dapat dibatalkan. Mohon berhati-hati.</p>
                <Button variant="ghost" className="mt-4 w-full h-10 font-bold text-destructive hover:bg-destructive/10" onClick={() => {
                  if (window.confirm('PERINGATAN: Ini akan menghapus SEMUA data. Lanjutkan?'))
                    showToast('Reset tidak diimplementasikan di mode demo.', 'error');
                }}>
                  Hapus Seluruh Data & Reset Sistem
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-xl bg-card">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="flex items-center gap-2">
                <Palette size={18} className="text-accent" /> Identitas Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Warna Utama (Brand Color)</label>
                <div className="flex gap-4 items-center p-4 bg-muted/20 rounded-2xl border">
                  <input type="color" defaultValue="#D97706" className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none" />
                  <div>
                    <p className="text-sm font-bold">Aksen Amber (Default)</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">HSL(35 92% 43%)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Layout Menu Pelanggan (Self-Order)</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'grid', label: 'Grid Visual', desc: 'Kartu gambar besar' },
                    { id: 'list', label: 'List Minimal', desc: 'Daftar teks bersih' }
                  ].map(l => (
                    <button key={l.id} className="p-4 rounded-xl border-2 border-transparent bg-muted/30 hover:border-accent/40 text-left transition-all group active:scale-95">
                      <Layout size={24} className="text-muted-foreground group-hover:text-accent mb-3" />
                      <p className="text-sm font-black">{l.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">{l.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Teks Penutup Struk</label>
                <textarea className="w-full min-h-[100px] rounded-2xl border border-input bg-transparent px-4 py-3 text-sm shadow-sm focus:ring-accent" defaultValue={'Terima kasih sudah berkunjung!\nFollow IG: @brewmaster_coffee\nNikmati harimu!'} />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/5 p-6">
              <Button className="w-full h-12 font-black shadow-lg shadow-accent/20">
                Simpan Visual & Tema
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-xl bg-card">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon size={18} className="text-accent" /> Aset Media
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
               <div className="aspect-video rounded-3xl border-2 border-dashed border-muted flex flex-col items-center justify-center p-10 text-center hover:bg-muted/20 hover:border-accent/40 transition-all group cursor-pointer overflow-hidden relative">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground mb-4 group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="text-lg font-black">Upload Logo Bisnis</p>
                    <p className="text-xs text-muted-foreground mt-1">Rekomendasi format PNG transparan (maks 2MB)</p>
                  </div>
                  <Button variant="outline" className="mt-6 font-bold">Pilih File Logo</Button>
               </div>
               
               <div className="mt-8 p-6 bg-muted/20 rounded-2xl border border-dashed flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white text-xl font-black">B</div>
                    <div>
                      <p className="text-sm font-black">Kitchen Enterprise Nodes</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Logo Default Sistem</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Aktif</span>
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onSave={handleAddUser} loading={loading} />}
      
      {/* Toast Notification */}
      {toast.msg && (
        <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-bottom-10 duration-300">
          <Card className={cn(
            "border-none shadow-2xl px-6 py-4 flex items-center gap-3",
            toast.type === 'success' ? "bg-emerald-600 text-white" : "bg-destructive text-white"
          )}>
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="font-bold text-sm">{toast.msg}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
