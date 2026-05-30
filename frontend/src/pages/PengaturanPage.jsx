import { useState, useRef } from 'react';
import { usePengaturan } from '../hooks/usePengaturan';
import { api } from '../api';
import { 
  Users, Settings, Palette, Shield, 
  Trash2, Plus, Save, Download, 
  RefreshCw, CheckCircle2, AlertCircle,
  User, ShieldCheck, Mail, Lock,
  Store, Percent, CreditCard, Layout,
  Image as ImageIcon, Upload, LogOut, X, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { BrainCircuit, KeyRound, Server, Sparkles, Zap, PackageOpen, MapPin, Globe } from 'lucide-react';
import { FEATURE_CATALOG, TIER_DEFAULTS, resolveFeatures } from '../lib/featureFlags';
import { useAppStore } from '../store/useAppStore';

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
const ROLE_COLORS = { admin:'bg-amber-500', owner:'bg-primary', kasir:'bg-amber-500', koki:'bg-zinc-700', gudang:'bg-zinc-600', akuntan:'bg-zinc-900' };

function AddUserModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'kasir', avatar_url: '' });
  const [uploading, setUploading] = useState(false);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300 font-mono tabular-nums">
      <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 border-none">
        <CardHeader className="border-b pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Plus size={24} strokeWidth={3} />
              </div>
              <div>
                <CardTitle className="text-xl">Tambah Anggota Tim</CardTitle>
                <CardDescription>Daftarkan anggota tim baru untuk mengelola operasional.</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-lg" onClick={onClose}><X size={20} /></Button>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Kolom Foto - 4 grid */}
            <div className="md:col-span-4 flex flex-col items-center gap-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 w-full text-center">Foto Profil</label>
              <div className="relative group">
                <div className="w-32 h-32 rounded-lg bg-background border-4 border-background shadow-xl flex items-center justify-center overflow-hidden transition-all group-hover:scale-105">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-zinc-500 dark:text-zinc-100/40" />
                  )}
                </div>
                <button 
                  onClick={() => document.getElementById('avatar-upload').click()}
                  className="absolute bottom-0 right-0 w-10 h-10 "
                >
                  <Upload size={16} />
                </button>
              </div>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-100 text-center px-4 leading-relaxed uppercase font-bold tracking-widest ">Format JPG/PNG, Maks 2MB. Foto akan tampil di struk dan dashboard.</p>
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
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 px-1">Nama Lengkap</label>
                <Input 
                  className="h-12 bg-background border-none focus:ring-2 focus:ring-amber-500/20 rounded-lg font-medium" 
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="Masukkan nama asli pegawai..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 px-1">Username</label>
                  <Input 
                    className="h-12 bg-background border-none focus:ring-2 focus:ring-amber-500/20 rounded-lg font-medium" 
                    value={form.username} onChange={e => setForm({...form, username: e.target.value})} 
                    placeholder="id_pegawai" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 px-1">Role / Jabatan</label>
                  <select 
                    className="flex h-12 w-full rounded-lg border-none bg-background px-4 py-1 text-sm font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20" 
                    value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  >
                    {Object.keys(ROLE_LABELS).map(k => <option key={k} value={k}>{ROLE_LABELS[k]}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 px-1">Kata Sandi (Password)</label>
                <div className="relative">
                  <Input 
                    type="password" 
                    className="h-12 bg-background border-none focus:ring-2 focus:ring-amber-500/20 rounded-lg font-medium pr-10" 
                    value={form.password} onChange={e => setForm({...form, password: e.target.value})} 
                    placeholder="Minimal 6 karakter" 
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-100/30" size={18} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-background p-6 gap-4">
          <Button variant="ghost" className="flex-1 h-12 rounded-lg font-bold" onClick={onClose} disabled={loading || uploading}>Batal</Button>
          <Button variant="primary" className="flex-[2] h-12 rounded-lg font-black" onClick={() => onSave(form)} disabled={loading || uploading}>
            {loading ? <RefreshCw className="animate-spin mr-2" /> : null}
            {loading ? 'MENYIMPAN...' : 'DAFTARKAN ANGGOTA'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


export default function PengaturanPage() {
  const fileInputRef = useRef(null);
  const {
    user, globalUser, tenant,
    users, setUsers,
    selected, setSelected,
    activeTab, setActiveTab,
    settings, setSettings,
    aiConfig, setAiConfig,
    userSubTab, setUserSubTab,
    userSearchQuery, setUserSearchQuery,
    rolePermissions, setRolePermissions,
    selectedRole, setSelectedRole,
    featureOverrides, setFeatureOverrides,
    loading, setLoading,
    showAddModal, setShowAddModal,
    toast, setToast,
    savingSettings, setSavingSettings,
    logoFile, setLogoFile,
    logoPreview, setLogoPreview,
    loyaltyConfig, setLoyaltyConfig,
    geofence, setGeofence,
    paymentMethods, setPaymentMethods,
    showAddPayment, setShowAddPayment,
    newPayment, setNewPayment,
    editingPayment, setEditingPayment,
    showToast,
    toggleRolePerm,
    handleSaveUser,
    handleSaveRolePermissions,
    handleDeleteUser,
    handleAddUser,
    handleLogoUpload,
    handleSaveBranding,
    handleSaveSettings,
    handleBackup
  } = usePengaturan();

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h2>
        <p className="text-zinc-500 dark:text-zinc-100 mt-1">Konfigurasi operasional, hak akses pengguna, dan personalisasi brand.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-background p-1 rounded-lg border w-fit">
        {[
          { key: 'users', label: 'Pengguna & Akses', icon: Users },
          { key: 'system', label: 'Pajak & Sistem', icon: Settings },
          { key: 'payment', label: 'Pembayaran', icon: CreditCard },
          { key: 'branding', label: 'Branding', icon: Palette },
          { key: 'marketplace', label: 'Marketplace', icon: Store },
          { key: 'subscription', label: 'Modul & Paket', icon: PackageOpen },
          { key: 'ai', label: 'Integrasi AI', icon: BrainCircuit },
        ].map(t => (
          <button 
            key={t.key} 
            className={cn(
              "h-8 px-4 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2", 
              activeTab === t.key ? "active-state shadow-sm" : "text-text-tertiary hover:text-text-secondary"
            )}
            onClick={() => setActiveTab(t.key)}
          >
            <t.icon size={14} /> {t.label}
            {t.key === 'marketplace' && (!user?.tier || user?.tier === 'lite') && (
               <span className="text-white ">PRO</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 bg-background p-1 rounded-lg w-fit">
            <button className={cn("px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all", userSubTab === 'profil' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-zinc-500 dark:text-zinc-100 hover:bg-background')} onClick={() => setUserSubTab('profil')}>Profil Individu</button>
            <button className={cn("px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all", userSubTab === 'roles' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-zinc-500 dark:text-zinc-100 hover:bg-background')} onClick={() => setUserSubTab('roles')}>Manajemen Hak Akses (Role)</button>
          </div>

          {userSubTab === 'profil' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* User List */}
              <Card className="lg:col-span-1 border-none shadow-xl overflow-hidden bg-card">
                <CardHeader className="border-b bg-background">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Daftar Pengguna</CardTitle>
                    <Button size="sm" className="h-10 font-black text-[10px] uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 shadow-lg shadow-primary/20 transition-all active:scale-95" onClick={() => setShowAddModal(true)}>
                      <Plus size={16} className="mr-2 stroke-[3]" /> Tambah Anggota
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-2 flex flex-col h-[500px]">
                  <div className="px-2 pb-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-100 w-4 h-4" />
                      <Input 
                        placeholder="Cari nama, username, atau role..." 
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full pl-9 h-12 bg-background border border-muted/20 focus:ring-2 focus:ring-amber-500/20 focus:bg-background rounded-lg text-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-1">
                    {users.filter(u => 
                      u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                      u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                      u.role?.toLowerCase().includes(userSearchQuery.toLowerCase())
                    ).map(u => (
                      <button 
                        key={u.id} 
                        onClick={() => setSelected({...u})}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-lg transition-all text-left group",
                          selected?.id === u.id ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500/20 border shadow-sm" : "hover:bg-background border border-transparent"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold shrink-0 shadow-sm overflow-hidden", !u.avatar_url && (ROLE_COLORS[u.role] || "bg-amber-500"))}>
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.avatar || u.name[0]
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate group-hover:text-amber-600 dark:text-amber-400 transition-colors">{u.name}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-100 uppercase tracking-widest font-black">{ROLE_LABELS[u.role] || u.role}</p>
                        </div>
                        <div className="text-[10px] font-bold bg-background px-2 py-0.5 rounded text-zinc-500 dark:text-zinc-100 group-hover:bg-background transition-colors">
                          @{u.username}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Profile Editor */}
              <Card className="lg:col-span-2 border-none shadow-xl bg-card">
                {selected ? (
                  <>
                    <CardHeader className="border-b bg-background">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 text-xl font-black shadow-lg overflow-hidden", !selected.avatar_url && (ROLE_COLORS[selected.role] || "bg-amber-500"))}>
                            {selected.avatar_url ? (
                              <img src={selected.avatar_url} alt={selected.name} className="w-full h-full object-cover" />
                            ) : (
                              selected.avatar || selected.name[0]
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-xl">Edit Profil: {selected.name}</CardTitle>
                            <CardDescription>Ubah detail informasi anggota tim</CardDescription>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(selected.id)}>
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        <div className="md:col-span-4 flex flex-col items-center gap-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 w-full text-center">Foto Profil</label>
                          <div className="relative group">
                            <div className="w-32 h-32 rounded-lg bg-background border-4 border-background shadow-xl flex items-center justify-center overflow-hidden transition-all group-hover:scale-105">
                              {selected.avatar_url ? (
                                <img src={selected.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <User size={48} className="text-zinc-500 dark:text-zinc-100/40" />
                              )}
                            </div>
                            <button 
                              onClick={() => document.getElementById('edit-avatar-upload').click()}
                              className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-all border-4 border-background"
                            >
                              <Upload size={16} />
                            </button>
                          </div>
                          <input 
                            id="edit-avatar-upload"
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              setLoading(true);
                              const formData = new FormData();
                              formData.append('image', file);
                              try {
                                const res = await fetch(`${api.url}/upload`, { method: 'POST', body: formData }).then(r => r.json());
                                if (res.url) setSelected({...selected, avatar_url: res.url});
                              } catch (err) { console.error('Upload failed', err); }
                              finally { setLoading(false); }
                            }} 
                          />
                        </div>

                        <div className="md:col-span-8 space-y-5">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 px-1">Nama Lengkap</label>
                            <Input className="h-12 bg-background border-none focus:ring-2 focus:ring-amber-500/20 rounded-lg font-medium" value={selected.name} onChange={e => setSelected({...selected, name: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 px-1">Username</label>
                              <Input className="h-12 bg-background border-none focus:ring-2 focus:ring-amber-500/20 rounded-lg font-medium" value={selected.username} onChange={e => setSelected({...selected, username: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 px-1">Role / Jabatan</label>
                              <select className="flex h-12 w-full rounded-lg border-none bg-background px-4 py-1 text-sm font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20" value={selected.role} onChange={e => setSelected({...selected, role: e.target.value})}>
                                {Object.keys(ROLE_LABELS).map(k => <option key={k} value={k}>{ROLE_LABELS[k]}</option>)}
                                <option value="superadmin">SuperAdmin</option>
                                <option value="manager">Manager</option>
                                <option value="chef">Chef</option>
                                <option value="hrd">HRD</option>
                              </select>
                            </div>
                          </div>
                          <div className="space-y-2 pt-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 px-1">Ubah Password (Opsional)</label>
                            <Input type="password" placeholder="Biarkan kosong jika tidak ingin mengubah" className="h-12 bg-background border-none focus:ring-2 focus:ring-amber-500/20 rounded-lg font-medium" value={selected.password || ''} onChange={e => setSelected({...selected, password: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-background p-6 gap-4">
                      <Button variant="primary" className="w-full h-12 font-black" onClick={handleSaveUser} disabled={loading}>
                        <Save size={18} className="mr-2" /> Simpan Profil
                      </Button>
                    </CardFooter>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6 ">
                    <User size={80} strokeWidth={1} />
                    <div>
                      <p className="text-xl font-black">Pilih Profil Pengguna</p>
                      <p className="text-sm">Klik pada daftar pengguna untuk mengubah profil, role, atau foto mereka.</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {userSubTab === 'roles' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Role List */}
              <Card className="lg:col-span-1 border-none shadow-xl overflow-hidden bg-card">
                <CardHeader className="border-b bg-background">
                  <CardTitle className="text-lg">Daftar Jabatan (Role)</CardTitle>
                </CardHeader>
                <CardContent className="p-2 h-[500px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-1">
                    {['superadmin', 'manager', 'owner', 'accounting', 'chef', 'kasir', 'staff', 'hrd'].map(roleKey => (
                      <button 
                        key={roleKey} 
                        onClick={() => setSelectedRole(roleKey)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-lg transition-all text-left group",
                          selectedRole === roleKey ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500/20 border shadow-sm" : "hover:bg-background border border-transparent"
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold shrink-0 shadow-sm overflow-hidden ">
                           {roleKey[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate group-hover:text-amber-600 dark:text-amber-400 transition-colors">{ROLE_LABELS[roleKey] || roleKey.toUpperCase()}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-100 uppercase tracking-widest font-black">Pengaturan Global</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Permissions Editor */}
              <Card className="lg:col-span-2 border-none shadow-xl bg-card">
                {selectedRole ? (
                  <>
                    <CardHeader className="border-b bg-background">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 text-white font-black shadow-lg overflow-hidden ">
                          {selectedRole[0].toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-xl">Otoritas Jabatan: {ROLE_LABELS[selectedRole] || selectedRole.toUpperCase()}</CardTitle>
                          <CardDescription>Atur hak akses default untuk semua pengguna dengan jabatan ini.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      {selectedRole === 'superadmin' && (
                        <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded-lg mb-8 text-amber-600 dark:text-amber-400">
                          <ShieldCheck className="shrink-0" />
                          <p className="text-sm font-bold leading-relaxed">
                            Superadmin adalah dewa dari sistem ini. Memiliki akses penuh ke seluruh modul tanpa bisa dibatasi.
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PERMISSIONS.map(perm => {
                          const revKeyMap = {
                            'akses_kasir': 'pos',
                            'akses_gudang': 'inventory',
                            'akses_dapur': 'kds',
                            'akses_keuangan': 'accounting',
                            'lihat_hpp': 'laporan',
                            'lihat_laba': 'dashboard',
                            'hapus_transaksi': 'transactions',
                            'atur_user': 'system'
                          };
                          const featureKey = revKeyMap[perm.key] || perm.key;
                          const hasPerm = selectedRole === 'superadmin' || rolePermissions.some(p => p.role === selectedRole && p.feature_key === featureKey);
                          
                          return (
                            <div 
                              key={perm.key} 
                              className={cn(
                                "flex items-center justify-between p-4 rounded-lg border transition-all",
                                hasPerm ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500/20 shadow-sm" : "bg-background "
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-xl grayscale-[0.5]">{perm.icon}</span>
                                <span className="text-sm font-bold">{perm.label}</span>
                              </div>
                              <input 
                                type="checkbox"
                                className="w-6 h-6 rounded-lg border-muted text-amber-600 dark:text-amber-400 focus:ring-amber-500/20 accent-amber-500 cursor-pointer"
                                checked={hasPerm}
                                disabled={selectedRole === 'superadmin'}
                                onChange={() => toggleRolePerm(selectedRole, perm.key)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-background p-6 gap-4">
                      <Button variant="primary" className="w-full h-12 font-black" onClick={handleSaveRolePermissions} disabled={loading || selectedRole === 'superadmin'}>
                        <Save size={18} className="mr-2" /> Simpan Hak Akses Jabatan
                      </Button>
                    </CardFooter>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6 ">
                    <Shield size={80} strokeWidth={1} />
                    <div>
                      <p className="text-xl font-black">Pilih Jabatan (Role)</p>
                      <p className="text-sm">Klik pada daftar jabatan untuk mengatur standar otoritas secara massal.</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center justify-between">
              <div>
                 <h3 className="text-xl font-bold">Metode Pembayaran Cashless</h3>
                 <p className="text-sm text-zinc-500 dark:text-zinc-100">Atur rekening bank dan QRIS perusahaan untuk menerima pembayaran non-tunai.</p>
              </div>
              <Button variant="primary" className="font-black" onClick={() => setShowAddPayment(true)}>
                 <Plus size={18} className="mr-2" /> Tambah Rekening
              </Button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paymentMethods.map((m, i) => (
                <Card key={i} className={cn("border-none shadow-xl bg-card overflow-hidden transition-all hover:scale-[1.02]", !m.is_active && " grayscale")}>
                   <CardHeader className="bg-background pb-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                               {m.type === 'qris' ? <CreditCard className="text-amber-600 dark:text-amber-400" /> : <Store className="text-amber-600 dark:text-amber-400" />}
                            </div>
                            <div>
                               <CardTitle className="text-sm font-black">{m.name}</CardTitle>
                               <CardDescription className="text-[10px] font-bold uppercase">{m.type === 'qris' ? 'QR Code' : 'Bank Transfer'}</CardDescription>
                            </div>
                         </div>
                         <input 
                           type="checkbox" 
                           checked={m.is_active} 
                           className="w-8 h-4 accent-amber-500 cursor-pointer"
                           onChange={async () => {
                              const updated = { ...m, is_active: !m.is_active };
                              await api.updatePaymentMethods(updated);
                              setPaymentMethods(prev => prev.map(p => p.id === m.id ? updated : p));
                           }}
                         />
                      </div>
                   </CardHeader>
                   <CardContent className="p-6 space-y-4">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Nomor Rekening / ID</p>
                         <p className="text-lg font-black font-mono tabular-nums text-primary">{m.account_number || '-'}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Nama Pemilik</p>
                         <p className="text-xs font-bold text-zinc-500 dark:text-zinc-100">{m.account_name || '-'}</p>
                      </div>
                      {m.instructions && (
                        <div className="p-4 rounded-lg ">
                           <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Instruksi Pembayaran</p>
                           <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-100 font-medium italic">"{m.instructions}"</p>
                        </div>
                      )}
                      {m.image_url && (
                        <div className="aspect-square w-24 mx-auto border rounded-lg overflow-hidden bg-background shadow-sm mt-2">
                           <img src={m.image_url} alt="QRIS" className="w-full h-full object-contain p-1" />
                        </div>
                      )}
                   </CardContent>
                   <CardFooter className="border-t p-4 bg-background flex gap-2">
                      <Button variant="ghost" className="flex-1 text-xs font-bold" onClick={() => setEditingPayment(m)}>Edit</Button>
                      <Button variant="ghost" className="flex-1 text-xs font-bold text-destructive hover:bg-destructive/10" onClick={async () => {
                         if (window.confirm('Hapus metode pembayaran ini?')) {
                            await api.deletePaymentMethods(m.id);
                            setPaymentMethods(prev => prev.filter(p => p.id !== m.id));
                         }
                      }}>Hapus</Button>
                   </CardFooter>
                </Card>
              ))}

              {paymentMethods.length === 0 && (
                <div className="col-span-full py-20 text-center ">
                   <CreditCard size={64} className="mx-auto mb-4" />
                   <p className="text-xl font-black">Belum Ada Rekening</p>
                   <p className="text-sm">Tambahkan rekening bank atau QRIS untuk mulai menerima pembayaran non-tunai.</p>
                </div>
              )}
           </div>

           {(showAddPayment || editingPayment) && (
             <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                   <CardHeader className="border-b">
                      <CardTitle>{editingPayment ? 'Edit Rekening' : 'Tambah Rekening Baru'}</CardTitle>
                      <CardDescription>Masukkan detail akun pembayaran Anda untuk ditampilkan ke pelanggan.</CardDescription>
                   </CardHeader>
                   <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Nama Bank / E-Wallet</label>
                            <Input 
                              placeholder="Contoh: BCA, GoPay, QRIS" 
                              value={editingPayment ? editingPayment.name : (window._newPayment?.name || '')} 
                              onChange={e => {
                                 if (editingPayment) setEditingPayment({...editingPayment, name: e.target.value});
                                 else window._newPayment = { ...window._newPayment, name: e.target.value };
                              }}
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Tipe</label>
                            <select 
                              className="flex h-10 w-full rounded-lg border border-input bg-transparent px-4 py-1 text-sm shadow-sm font-bold"
                              value={editingPayment ? editingPayment.type : (window._newPayment?.type || 'manual_transfer')}
                              onChange={e => {
                                 if (editingPayment) setEditingPayment({...editingPayment, type: e.target.value});
                                 else window._newPayment = { ...window._newPayment, type: e.target.value };
                              }}
                            >
                               <option value="manual_transfer">Transfer Bank Manual</option>
                               <option value="qris">QRIS (QR Code)</option>
                               <option value="digital_payment">E-Wallet / Digital</option>
                            </select>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Nomor Rekening / ID Akun</label>
                         <Input 
                           placeholder="0011-2233-44" 
                           value={editingPayment ? editingPayment.account_number : (window._newPayment?.account_number || '')}
                           onChange={e => {
                              if (editingPayment) setEditingPayment({...editingPayment, account_number: e.target.value});
                              else window._newPayment = { ...window._newPayment, account_number: e.target.value };
                           }}
                         />
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Nama Pemilik Akun</label>
                         <Input 
                           placeholder="Nama sesuai buku tabungan" 
                           value={editingPayment ? editingPayment.account_name : (window._newPayment?.account_name || '')}
                           onChange={e => {
                              if (editingPayment) setEditingPayment({...editingPayment, account_name: e.target.value});
                              else window._newPayment = { ...window._newPayment, account_name: e.target.value };
                           }}
                         />
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Instruksi Khusus (Optional)</label>
                         <textarea 
                           className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-4 py-2 text-sm shadow-sm focus:ring-amber-500/20" 
                           placeholder="Contoh: Lampirkan bukti transfer dan kirim ke WhatsApp 0812..."
                           value={editingPayment ? editingPayment.instructions : (window._newPayment?.instructions || '')}
                           onChange={e => {
                              if (editingPayment) setEditingPayment({...editingPayment, instructions: e.target.value});
                              else window._newPayment = { ...window._newPayment, instructions: e.target.value };
                           }}
                         />
                      </div>
                   </CardContent>
                   <CardFooter className="border-t p-6 gap-4">
                      <Button variant="ghost" className="flex-1 font-bold rounded-lg" onClick={() => { setShowAddPayment(false); setEditingPayment(null); }}>Batal</Button>
                      <Button variant="primary" className="flex-[2] font-black" onClick={async () => {
                         try {
                            if (editingPayment) {
                               await api.updatePaymentMethods(editingPayment);
                               setPaymentMethods(prev => prev.map(p => p.id === editingPayment.id ? editingPayment : p));
                               setEditingPayment(null);
                            } else {
                               const newItem = await api.addPaymentMethods(window._newPayment || { type: 'manual_transfer' });
                               setPaymentMethods(prev => [...prev, newItem]);
                               setShowAddPayment(false);
                               window._newPayment = null;
                            }
                            showToast('Data pembayaran berhasil disimpan!');
                         } catch (e) { showToast('Gagal menyimpan data.', 'error'); }
                      }}>Simpan Rekening</Button>
                   </CardFooter>
                </Card>
             </div>
           )}
        </div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-xl bg-card">
            <CardHeader className="border-b bg-background">
              <CardTitle className="flex items-center gap-2">
                <Store className="text-amber-600 dark:text-amber-400" /> Profil & Biaya Operasional
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Nama Bisnis</label>
                <Input value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} className="h-12 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1 flex items-center gap-1"><Percent size={12}/> Pajak PPN (%)</label>
                  <Input type="number" value={settings.tax} onChange={e => setSettings({...settings, tax: Number(e.target.value)})} className="h-12 font-bold font-mono tabular-nums" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1 flex items-center gap-1"><Percent size={12}/> Service Charge (%)</label>
                  <Input type="number" value={settings.serviceCharge} onChange={e => setSettings({...settings, serviceCharge: Number(e.target.value)})} className="h-12 font-bold font-mono tabular-nums" />
                </div>
              </div>

              <div className="pt-6 border-t space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">Program Loyalty Member</h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-100 uppercase font-bold tracking-wider mt-1">Akumulasi poin belanja</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-10 h-6 accent-amber-500 cursor-pointer" 
                    checked={loyaltyConfig.enabled} 
                    onChange={e => setLoyaltyConfig({...loyaltyConfig, enabled: e.target.checked})} 
                  />
                </div>
                {loyaltyConfig.enabled && (
                  <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">Setiap Belanja (Rp)</label>
                      <Input 
                        type="number" 
                        value={loyaltyConfig.multiplier} 
                        onChange={e => setLoyaltyConfig({...loyaltyConfig, multiplier: Number(e.target.value)})} 
                        className="h-10 text-sm font-bold font-mono tabular-nums" 
                      />
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-100 italic">Dapat 1 Poin</p>
                    </div>
                    <div className="space-y-2 ">
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">Nilai 1 Poin (Rp)</label>
                      <Input type="number" value={100} disabled className="h-10 text-sm font-bold font-mono tabular-nums" />
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-100 italic">Potongan diskon (Segera)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t space-y-6">
                <div>
                  <h4 className="font-bold flex items-center gap-2">
                    <ShieldCheck className="text-amber-600 dark:text-amber-400" size={18} />
                    Otoritas Persetujuan VOID (Pembatalan)
                  </h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mt-1">
                    Pilih jabatan yang diizinkan untuk menyetujui pembatalan transaksi
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { key: 'owner', label: 'Owner' },
                    { key: 'manager', label: 'Manager / Admin' },
                    { key: 'accounting', label: 'Akuntan / Accounting' },
                    { key: 'kasir', label: 'Kasir' },
                    { key: 'chef', label: 'Koki / Barista' }
                  ].map(roleItem => {
                    const currentApprovers = settings.void_approvers || ['owner', 'manager'];
                    
                    // Support dual-key checking for UI selection alignment
                    let isChecked = currentApprovers.includes(roleItem.key);
                    if (roleItem.key === 'manager' && currentApprovers.includes('admin')) isChecked = true;
                    if (roleItem.key === 'accounting' && currentApprovers.includes('akuntan')) isChecked = true;
                    if (roleItem.key === 'chef' && currentApprovers.includes('koki')) isChecked = true;
                    
                    return (
                      <div
                        key={roleItem.key}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none",
                          isChecked
                            ? "bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/30 text-amber-900 dark:text-amber-400"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                        )}
                        onClick={() => {
                          let newApprovers = [...currentApprovers];
                          
                          if (isChecked) {
                            // Turn OFF both dual-keys
                            if (roleItem.key === 'manager') {
                              newApprovers = newApprovers.filter(r => r !== 'manager' && r !== 'admin');
                            } else if (roleItem.key === 'accounting') {
                              newApprovers = newApprovers.filter(r => r !== 'accounting' && r !== 'akuntan');
                            } else if (roleItem.key === 'chef') {
                              newApprovers = newApprovers.filter(r => r !== 'chef' && r !== 'koki');
                            } else {
                              newApprovers = newApprovers.filter(r => r !== roleItem.key);
                            }
                          } else {
                            // Turn ON both dual-keys
                            if (roleItem.key === 'manager') {
                              newApprovers.push('manager', 'admin');
                            } else if (roleItem.key === 'accounting') {
                              newApprovers.push('accounting', 'akuntan');
                            } else if (roleItem.key === 'chef') {
                              newApprovers.push('chef', 'koki');
                            } else {
                              newApprovers.push(roleItem.key);
                            }
                          }
                          
                          // Deduplicate
                          newApprovers = Array.from(new Set(newApprovers));
                          setSettings({ ...settings, void_approvers: newApprovers });
                        }}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                          isChecked 
                            ? "bg-amber-500 border-amber-500 dark:bg-amber-400 dark:border-amber-400" 
                            : "bg-white border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600"
                        )}>
                          {isChecked && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-zinc-900">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">{roleItem.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold flex items-center gap-2">
                      <ShieldCheck className="text-amber-600 dark:text-amber-400" size={18} />
                      Alur Persetujuan Jurnal Beban Besar
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mt-1">
                      Pencatatan beban ≥ Rp 10.000.000 wajib disetujui Owner sebelum diposting ke Buku Besar.
                    </p>
                  </div>
                  <button 
                    onClick={() => setSettings({ ...settings, approval_workflow_enabled: !(settings.approval_workflow_enabled !== false) })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative flex items-center shrink-0 border-2",
                      settings.approval_workflow_enabled !== false 
                        ? "bg-amber-500 border-amber-500 dark:bg-amber-400 dark:border-amber-400" 
                        : "bg-zinc-200 dark:bg-zinc-700 border-transparent"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 bg-white dark:bg-zinc-900 rounded-full shadow transition-transform absolute", 
                      settings.approval_workflow_enabled !== false ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-dashed border-zinc-150 dark:border-zinc-800">
                  <div>
                    <h4 className="font-bold flex items-center gap-2">
                      <ShieldCheck className="text-amber-600 dark:text-amber-400" size={18} />
                      Otoritas Akhir Stok Opname (Owner Approval)
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mt-1">
                      Aktifkan jika penyesuaian stok wajib ditinjau langsung oleh Owner. Jika mati, Manajer yang Anda bayar dapat langsung menyetujui & memposting tanpa mengganggu Anda!
                    </p>
                  </div>
                  <button 
                    onClick={() => setSettings({ ...settings, opname_owner_approval_required: !(settings.opname_owner_approval_required === true) })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative flex items-center shrink-0 border-2",
                      settings.opname_owner_approval_required === true 
                        ? "bg-amber-500 border-amber-500 dark:bg-amber-400 dark:border-amber-400" 
                        : "bg-zinc-200 dark:bg-zinc-700 border-transparent"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 bg-white dark:bg-zinc-900 rounded-full shadow transition-transform absolute", 
                      settings.opname_owner_approval_required === true ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={18} className="text-zinc-500 dark:text-zinc-100" />
                  <h4 className="font-bold">Integrasi Pembayaran</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {['Midtrans', 'Xendit', 'Doku'].map(gw => (
                    <div key={gw} className="p-4 rounded-lg border border-dashed flex flex-col items-center justify-center gap-2  grayscale hover:grayscale-0 transition-all cursor-not-allowed group">
                      <p className="text-xs font-black uppercase tracking-tighter">{gw}</p>
                      <span className="text-white font-black bg-amber-500 px-1.5 py-0.5 rounded-lg uppercase group-hover:">Segera</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-background p-6">
              <Button className="w-full h-12 font-black bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95" onClick={handleSaveSettings} disabled={savingSettings}>
                {savingSettings ? 'Menyimpan...' : 'Simpan Konfigurasi'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-xl bg-card h-fit">
            <CardHeader className="border-b bg-background">
              <CardTitle className="flex items-center gap-2">
                <RefreshCw size={18} className="text-amber-600 dark:text-amber-400" /> Pemeliharaan & Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex gap-4 items-start p-4 bg-background rounded-lg border border-dashed">
                <div className="h-10 w-10 bg-background rounded-lg flex items-center justify-center shrink-0 border">
                  <Download size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold">Ekspor Seluruh Data Bisnis</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-100 mt-1">Unduh semua master data dan riwayat transaksi dalam format JSON untuk cadangan keamanan.</p>
                  <Button variant="outline" className="mt-4 w-full h-10 font-bold border-amber-500 dark:border-amber-400 text-zinc-900 dark:text-zinc-100 hover:" onClick={handleBackup}>
                    Unduh Backup Sekarang
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t space-y-6">
                <div>
                   <h4 className="font-bold">Lokasi Toko & Geofencing Absensi</h4>
                   <p className="text-[10px] text-zinc-500 dark:text-zinc-100 uppercase font-bold tracking-wider mt-1">Kunci koordinat untuk absen pegawai</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">Latitude</label>
                    <Input 
                      type="number" 
                      value={geofence.latitude} 
                      onChange={e => setGeofence({...geofence, latitude: Number(e.target.value)})} 
                      className="h-10 text-sm font-bold font-mono tabular-nums" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">Longitude</label>
                    <Input 
                      type="number" 
                      value={geofence.longitude} 
                      onChange={e => setGeofence({...geofence, longitude: Number(e.target.value)})} 
                      className="h-10 text-sm font-bold font-mono tabular-nums" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">Radius Toleransi (Meter)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="20" max="500" step="10"
                      className="flex-1 accent-amber-500"
                      value={geofence.radius}
                      onChange={e => setGeofence({...geofence, radius: Number(e.target.value)})}
                    />
                    <span className="w-16 text-center font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">{geofence.radius}m</span>
                  </div>
                </div>

                <Button 
                  variant="outline" className="w-full h-12 rounded-lg border-dashed gap-2 font-bold"
                  onClick={() => {
                    navigator.geolocation.getCurrentPosition((pos) => {
                       setGeofence({
                         ...geofence,
                         latitude: pos.coords.latitude,
                         longitude: pos.coords.longitude
                       });
                    });
                  }}
                >
                  <MapPin size={18} /> Ambil Lokasi Saya Sekarang
                </Button>
              </div>

              <div className="pt-6 border-t">
                <h4 className="text-sm font-bold text-destructive">Zona Bahaya</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-100 mt-1">Tindakan di bawah ini tidak dapat dibatalkan. Mohon berhati-hati.</p>
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
            <CardHeader className="border-b bg-background">
              <CardTitle className="flex items-center gap-2">
                <Palette size={18} className="text-amber-600 dark:text-amber-400" /> Identitas Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-6">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">System Accent Tone (White-Labeling)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: 'amber', label: 'Amber Elite', color: 'bg-amber-500', desc: 'Default KEN' },
                    { id: 'zinc', label: 'Zinc Stealth', color: 'bg-zinc-500', desc: 'Enterprise Tone' },
                  ].map(c => (
                    <button key={c.id} className="group relative p-4 rounded-lg border-2 border-transparent bg-background hover:border-border transition-all text-center">
                       <div className={cn("w-12 h-12 rounded-lg mx-auto mb-4 shadow-lg", c.color)} />
                       <p className="text-[10px] font-black uppercase tracking-widest">{c.label}</p>
                       <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-100 uppercase mt-1 ">{c.desc}</p>
                       {c.id === 'amber' && <div className="absolute top-2 right-2 w-4 h-4 "><CheckCircle2 size={10} /></div>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-dashed">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1 flex items-center gap-2">
                   <Globe size={14} className="text-amber-500" /> Portal Identity (Self-Order)
                </label>
                <div className="space-y-4 bg-background p-6 rounded-lg border">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">Portal Welcome Header</p>
                      <Input defaultValue="Welcome to our Digital Menu" className="h-10 text-sm font-bold bg-background" />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">Terms & Conditions URL</p>
                      <Input defaultValue="https://brewmaster.co/terms" className="h-10 text-xs font-medium bg-background font-mono tabular-nums" />
                   </div>
                </div>
              </div>

              <div className="space-y-2 pt-6 border-t border-dashed">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Teks Penutup Struk & Digital Receipt</label>
                <textarea 
                   className="w-full min-h-[100px] rounded-lg border border-input bg-transparent px-4 py-4 text-sm shadow-sm focus:ring-amber-500 outline-none" 
                   defaultValue={'Terima kasih sudah berkunjung!\nFollow IG: @brewmaster_coffee\nNikmati harimu!'} 
                />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-background p-6">
              <Button className="w-full h-12 font-black bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95" onClick={async () => {
                try {
                  setSavingSettings(true);
                  await api.saveSettings(settings);
                  await api.updateOutletGeofence(geofence);
                  showToast('Branding & Lokasi Toko berhasil disimpan');
                } catch (e) {
                  showToast('Gagal menyimpan pengaturan', 'error');
                } finally {
                  setSavingSettings(false);
                }
              }}>
                {savingSettings ? 'Menyimpan...' : 'Simpan Visual & Lokasi'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-xl bg-card">
            <CardHeader className="border-b bg-background">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon size={18} className="text-amber-600 dark:text-amber-400" /> Aset Media
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
               <div className="aspect-video rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center p-10 text-center hover:bg-background hover:border-amber-500/40 transition-all group cursor-pointer overflow-hidden relative">
                  <div className="w-16 h-16 bg-background rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4 group-hover:">
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="text-lg font-black">Upload Logo Bisnis</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-100 mt-1">Rekomendasi format PNG transparan (maks 2MB)</p>
                  </div>
                   <input
                     type="file"
                     ref={fileInputRef}
                     className="hidden"
                     accept="image/png, image/jpeg, image/webp"
                     onChange={handleLogoUpload}
                   />
                   <Button
                     variant="outline"
                     className="mt-6 font-bold active:scale-95 transition-all"
                     onClick={() => fileInputRef.current?.click()}
                   >
                     Pilih File Logo
                   </Button>
               </div>
               
               <div className="mt-8 p-6 bg-background rounded-lg border border-dashed flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 ">B</div>
                    <div>
                      <p className="text-sm font-black">Kitchen Enterprise Nodes</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-100 uppercase font-bold tracking-widest">Logo Default Sistem</p>
                    </div>
                  </div>
                  <span className="text-white font-black ">Aktif</span>
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'marketplace' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
           {(!user?.tier || user?.tier === 'lite') && (
              <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
                 <Card className="max-w-md p-10 text-center shadow-2xl border-2 border-amber-500 dark:border-amber-400 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center mx-auto mb-6">
                       <Shield size={40} />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Buka Fitur Omnichannel</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-100 mb-8">Hubungkan GoFood, GrabFood, dan ShopeeFood langsung ke KDS Anda. Fitur ini tersedia untuk paket **PRO**.</p>
                    <Button className="w-full h-14 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95">
                       Upgrade ke Paket PRO
                    </Button>
                    <p className="mt-4 text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-100 tracking-widest cursor-pointer hover:text-amber-600 dark:text-amber-400">Lihat Perbandingan Paket</p>
                 </Card>
              </div>
           )}
           <div className="flex items-center justify-between">
              <div>
                 <h3 className="text-xl font-bold">Integrasi Omnichannel Marketplace</h3>
                 <p className="text-sm text-zinc-500 dark:text-zinc-100">Hubungkan BrewMaster dengan platform marketplace untuk sinkronisasi pesanan & stok otomatis.</p>
              </div>
           </div>

           <div className="p-6 ">
              <div className="w-16 h-16 ">
                 <Server size={32} />
              </div>
              <div className="flex-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-1">Universal Webhook URL</p>
                 <div className="flex items-center gap-2">
                    <code className="bg-background px-4 py-2 rounded-lg text-sm font-bold border font-mono tabular-nums flex-1">
                       {window.location.origin}/api/v1/marketplace/webhook
                    </code>
                    <Button variant="outline" className="h-10 rounded-lg font-bold" onClick={() => {
                       navigator.clipboard.writeText(`${window.location.origin}/api/v1/marketplace/webhook`);
                       showToast('Webhook URL disalin!');
                    }}>Salin URL</Button>
                 </div>
                 <p className="text-[10px] text-zinc-500 dark:text-zinc-100 mt-2 italic font-medium">Gunakan URL ini di pengaturan Developer Portal Marketplace Anda.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'gofood', name: 'GoFood', color: 'bg-[#00AA13]', desc: 'Integrasi GoBiz Portal' },
                { id: 'grabfood', name: 'GrabFood', color: 'bg-[#00B14F]', desc: 'Integrasi Grab Merchant' },
                { id: 'shopeefood', name: 'ShopeeFood', color: 'bg-[#EE4D2D]', desc: 'Integrasi Shopee Partner' },
              ].map(mp => (
                <Card key={mp.id} className="border-none shadow-xl bg-card overflow-hidden group hover:scale-[1.02] transition-all">
                   <div className={cn("h-2 w-full", mp.color)} />
                   <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                         <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-lg", mp.color)}>
                            <Store size={24} />
                         </div>
                         <input type="checkbox" className="w-10 h-6 accent-amber-500 cursor-pointer" defaultChecked />
                      </div>
                      <h4 className="text-lg font-black">{mp.name}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-100 font-medium mt-1">{mp.desc}</p>
                      
                      <div className="mt-8 space-y-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Merchant ID</label>
                            <Input placeholder="Contoh: MID-12345" className="h-10 text-xs font-bold bg-background border-none" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">API Key / Token</label>
                            <Input type="password" placeholder="••••••••••••" className="h-10 text-xs font-bold bg-background border-none" />
                         </div>
                      </div>
                   </CardContent>
                   <CardFooter className="bg-background border-t p-4">
                      <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest  hover:">
                         Simpan Konfigurasi
                      </Button>
                   </CardFooter>
                </Card>
              ))}
           </div>
        </div>
      )}


      {activeTab === 'subscription' && (
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-card overflow-hidden">
            <CardHeader className="bg-amber-500 text-zinc-950 p-8">
               <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl font-black mb-2">Paket & Modul Sistem</CardTitle>
                    <CardDescription className="text-zinc-900/80 font-medium">Anda sedang berlangganan tingkat {tenant?.tier?.toUpperCase() || 'LITE'}. Sesuaikan modul yang ingin ditampilkan di outlet Anda.</CardDescription>
                  </div>
                  <div className="px-6 py-2 bg-zinc-950 text-amber-500 rounded-lg font-black tracking-[0.2em] uppercase text-xl shadow-lg">
                    {tenant?.tier || 'LITE'}
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-8">
               <p className="text-sm font-bold text-zinc-500 dark:text-zinc-100 mb-8 border-l-4 border-amber-500 pl-4 py-1">
                 Sebagai Owner, Anda dapat menghidup-matikan modul di bawah ini agar antarmuka KEN menjadi lebih rapi dan sesuai dengan model bisnis Anda. (Hanya modul yang termasuk dalam paket berlangganan Anda yang dapat diaktifkan).
               </p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FEATURE_CATALOG.map(feature => {
                     const tier = tenant?.tier || 'lite';
                     const allowedByTier = TIER_DEFAULTS[tier]?.[feature.key] ?? false;
                     // Superadmin bypass
                     const isSuperAdmin = globalUser?.role === 'superadmin';
                     const isAllowed = isSuperAdmin || allowedByTier;
                     
                     // Current state
                     const isTurnedOn = featureOverrides[feature.key] !== false && isAllowed;

                     return (
                       <div 
                         key={feature.key}
                         className={cn(
                           "p-4 rounded-2xl border-2 transition-all flex items-start gap-4",
                           !isAllowed ? "opacity-50 grayscale bg-muted border-muted" : 
                           isTurnedOn ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500/30 shadow-sm" : "bg-background border-border"
                         )}
                       >
                         <div className="text-3xl shrink-0">{feature.icon}</div>
                         <div className="flex-1">
                            <h4 className="font-bold text-sm leading-none mb-1 text-foreground">{feature.label}</h4>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">{feature.group}</p>
                            
                            {!isAllowed ? (
                              <span className="text-[9px] px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded font-black uppercase tracking-widest">
                                UPGRADE KE {feature.group === 'Enterprise' ? 'ENTERPRISE' : 'PRO'}
                              </span>
                            ) : (
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer"
                                  checked={isTurnedOn}
                                  onChange={async (e) => {
                                     const newValue = e.target.checked;
                                     const newOverrides = { ...featureOverrides, [feature.key]: newValue };
                                     setFeatureOverrides(newOverrides);
                                     
                                     try {
                                        await api.updateTenantFeatures({ feature_overrides: newOverrides });
                                        
                                        // Update local app store tenant instance to reflect immediately
                                        if (globalUser) {
                                           useAppStore.getState().setUser({
                                              ...globalUser,
                                              tenant: {
                                                 ...tenant,
                                                 feature_overrides: newOverrides
                                              }
                                           });
                                        }
                                        showToast(`Modul ${feature.label} berhasil ${newValue ? 'diaktifkan' : 'dimatikan'}`);
                                     } catch (err) {
                                        showToast('Gagal mengubah status modul', 'error');
                                        setFeatureOverrides(featureOverrides); // rollback
                                     }
                                  }}
                                />
                                <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-amber-500"></div>
                                <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">
                                  {isTurnedOn ? 'AKTIF' : 'NONAKTIF'}
                                </span>
                              </label>
                            )}
                         </div>
                       </div>
                     )
                  })}
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'ai' && (
        <Card className="border-none shadow-xl bg-card border-l-4 border-l-accent overflow-hidden">
          <CardHeader className="border-b bg-background">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl font-black">
                  <BrainCircuit className="text-amber-600 dark:text-amber-400" /> Integrasi AI (Bring Your Own Key)
                </CardTitle>
                <CardDescription className="mt-1">
                  Hubungkan akun API Anda sendiri untuk mengaktifkan AI Business Intelligence tanpa biaya berlangganan ekstra.
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 bg-background p-2 rounded-lg border border-muted">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">Status Engine:</span>
                <span className={cn(
                  "px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1",
                  aiConfig.isEnabled && aiConfig.apiKey ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" : "bg-destructive/20 text-destructive"
                )}>
                  {aiConfig.isEnabled && aiConfig.apiKey ? <><CheckCircle2 size={12}/> AKTIF</> : <><AlertCircle size={12}/> NONAKTIF</>}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 flex gap-4">
              <KeyRound className="text-amber-600 shrink-0 mt-1" />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-700">Keamanan API Key Anda Terjamin</h4>
                <p className="text-sm text-amber-700/80 font-medium">
                  API Key Anda disimpan secara aman di perangkat lokal (localStorage) dan tidak pernah dibagikan. Seluruh biaya token dibebankan langsung ke akun OpenAI, DeepSeek, atau Gemini Anda sendiri.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Pilih Mesin AI</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'openai', name: 'OpenAI', icon: BrainCircuit },

                    { id: 'deepseek', name: 'DeepSeek', icon: Zap },
                    { id: 'grok', name: 'Grok (xAI)', icon: KeyRound }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setAiConfig({...aiConfig, provider: p.id})}
                      className={cn(
                        "p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-4 group relative overflow-hidden",
                        aiConfig.provider === p.id 
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]" 
                          : "border-border bg-background hover:border-amber-500/50 hover:bg-background"
                      )}
                    >
                      <div className={cn(
                        "w-16 h-16 rounded-lg flex items-center justify-center transition-all duration-500 shadow-inner",
                        aiConfig.provider === p.id 
                          ? "bg-amber-500 text-zinc-950 scale-110 rotate-3 shadow-[0_10px_20px_rgba(245,158,11,0.3)]" 
                          : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-zinc-600"
                      )}>
                        <p.icon size={32} strokeWidth={2.5} />
                      </div>
                      <span className={cn(
                        "text-[11px] font-black uppercase tracking-[0.2em] transition-colors mt-2",
                        aiConfig.provider === p.id ? "text-amber-600" : "text-zinc-400 group-hover:text-zinc-600"
                      )}>{p.name}</span>
                      {aiConfig.provider === p.id && (
                        <div className="absolute top-4 right-4 animate-in zoom-in duration-300">
                           <div className="w-6 h-6 ">
                              <CheckCircle2 size={14} strokeWidth={4} />
                           </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1 flex items-center gap-2">
                  <Server size={14} /> Secret API Key
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input 
                      type="password" 
                      placeholder="sk-..." 
                      className="h-12 font-mono bg-background text-sm border-2 focus:border-amber-500 dark:border-amber-400 flex-1"
                      value={aiConfig.apiKey}
                      onChange={e => setAiConfig({...aiConfig, apiKey: e.target.value})}
                    />
                    <Button 
                      variant="outline" 
                      className="h-12 px-4 border-destructive/20 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setAiConfig({...aiConfig, apiKey: '', isEnabled: false});
                        localStorage.removeItem('ken_ai_config');
                        showToast('Kunci API telah dihapus dari perangkat ini.');
                      }}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-bold">Dapatkan key ini dari dashboard {aiConfig.provider === 'openai' ? 'platform.openai.com' : aiConfig.provider === 'deepseek' ? 'platform.deepseek.com' : 'console.x.ai'}.</p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={aiConfig.isEnabled}
                      onChange={e => setAiConfig({...aiConfig, isEnabled: e.target.checked})}
                    />
                    <div className="w-12 h-6 "></div>
                  </label>
                  <span className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100">
                    {aiConfig.isEnabled ? 'Fitur AI Menyala' : 'Fitur AI Dimatikan'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="">
            <Button className="h-16 px-10 font-black bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95" onClick={handleSaveSettings}>
              {savingSettings ? <RefreshCw className="animate-spin" /> : <Save size={24} strokeWidth={3} />}
              SIMPAN PENGATURAN AI
            </Button>
          </CardFooter>
        </Card>
      )}

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onSave={handleAddUser} loading={loading} />}
      
      {/* Toast Notification */}
      {toast.msg && (
        <div className="fixed bottom-12 right-12 z-[250] animate-in slide-in-from-right-10 duration-500">
          <div className={cn(
            "relative group overflow-hidden rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5",
            "bg-zinc-950/90 backdrop-blur-xl px-8 py-6 flex items-center gap-6 min-w-[320px]"
          )}>
            {/* Status Indicator Glow */}
            <div className={cn(
               "absolute top-0 left-0 w-1.5 h-full",
               toast.type === 'success' ? "bg-amber-500" : "bg-rose-500"
            )} />
            
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center shadow-lg",
              toast.type === 'success' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-500" : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
            )}>
              {toast.type === 'success' ? <CheckCircle2 size={24} strokeWidth={3} /> : <AlertCircle size={24} strokeWidth={3} />}
            </div>
            
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Notification</p>
              <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">{toast.msg}</p>
            </div>

            <button onClick={() => setToast({msg:'', type:'success'})} className="text-zinc-600 hover:text-zinc-100 transition-colors">
               <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
