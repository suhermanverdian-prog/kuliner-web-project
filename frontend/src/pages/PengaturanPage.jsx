import { useState, useRef, useEffect } from 'react';
import { usePengaturan } from '../hooks/usePengaturan';
import { api } from '../api';
import { 
  Users, Settings, Palette, Shield, 
  Trash2, Plus, Save, Download, 
  RefreshCw, CheckCircle2, AlertCircle,
  User, ShieldCheck, Mail, Lock,
  Store, Percent, CreditCard, Layout,
  Image as ImageIcon, Upload, LogOut, X, Search,
  ShieldAlert, AlertTriangle, FileCheck2, Fingerprint, ScanLine
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { BrainCircuit, KeyRound, Server, Sparkles, Zap, PackageOpen, MapPin, Globe, Coffee, SlidersHorizontal, Ticket, Droplets } from 'lucide-react';
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


// ================================================================
// ⚙️ POSCustomizationPanel — Kustomisasi Ukuran, Extras, Loyalty & Promo
// ================================================================
function POSCustomizationPanel({ showToast }) {
  const [sizes, setSizes] = useState([
    { key: 'S', label: 'Small', priceAdd: 0 },
    { key: 'R', label: 'Regular', priceAdd: 5000 },
    { key: 'L', label: 'Large', priceAdd: 10000 },
  ]);

  const [extras, setExtras] = useState([
    { key: 'whipped_cream',  label: 'Whipped Cream', priceAdd: 5000, dose: 15, unit: 'gram', bahanId: '' },
    { key: 'cocoa_powder',   label: 'Cocoa Powder',  priceAdd: 0, dose: 5, unit: 'gram', bahanId: '' },
    { key: 'caramel_drizzle',label: 'Caramel',       priceAdd: 3000, dose: 10, unit: 'ml', bahanId: '' },
    { key: 'cinnamon',       label: 'Cinnamon',      priceAdd: 0, dose: 2, unit: 'gram', bahanId: '' },
    { key: 'vanilla_syrup',  label: 'Vanilla Syrup', priceAdd: 5000, dose: 15, unit: 'ml', bahanId: '' },
    { key: 'hazelnut_syrup', label: 'Hazelnut Syrup',priceAdd: 5000, dose: 15, unit: 'ml', bahanId: '' },
  ]);

  const [milks, setMilks] = useState([
    { key: 'oat',     label: 'Oat Milk',     priceAdd: 5000, dose: 150, unit: 'ml', bahanId: '' },
    { key: 'almond',  label: 'Almond Milk',  priceAdd: 5000, dose: 150, unit: 'ml', bahanId: '' },
    { key: 'soy',     label: 'Soy Milk',     priceAdd: 5000, dose: 150, unit: 'ml', bahanId: '' },
  ]);

  const [doseEspresso, setDoseEspresso] = useState(7);
  const [bahanList, setBahanList] = useState([]);
  const [loadingCloud, setLoadingCloud] = useState(true);

  // Helper safely parsing array
  const parseSafeArray = (raw, fallback) => {
    try {
      if (!raw) return fallback;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
      console.warn("Parse error:", e);
      return fallback;
    }
  };

  // Muat data dari cloud (Supabase) dengan fallback ke localStorage
  useEffect(() => {
    // 1. Ambil Bahan Baku
    api.getBahan().then(data => {
      if (Array.isArray(data)) setBahanList(data);
      else setBahanList([]);
    }).catch(err => {
      console.error("Gagal load bahan baku:", err);
      setBahanList([]);
    });

    // 2. Ambil Kustomisasi POS dari Cloud
    setLoadingCloud(true);
    api.getCustomisations().then(res => {
      const cloudData = res?.data || res || {};
      
      // Sizes
      const cloudSizes = cloudData.ken_custom_sizes;
      if (cloudSizes) {
        const parsedSizes = parseSafeArray(cloudSizes, null);
        if (parsedSizes) {
          setSizes(parsedSizes);
          localStorage.setItem('ken_custom_sizes', JSON.stringify(parsedSizes));
        }
      } else {
        const saved = localStorage.getItem('ken_custom_sizes');
        if (saved) setSizes(parseSafeArray(saved, sizes));
      }

      // Extras
      const cloudExtras = cloudData.ken_custom_extras;
      if (cloudExtras) {
        const parsedExtras = parseSafeArray(cloudExtras, null);
        if (parsedExtras) {
          const normalized = parsedExtras.map(item => ({
            ...item,
            priceAdd: Number(item.priceAdd || 0),
            dose: item.dose !== undefined ? Number(item.dose) : 0,
            unit: item.unit !== undefined ? item.unit : 'gram',
            bahanId: item.bahanId !== undefined ? item.bahanId : ''
          }));
          setExtras(normalized);
          localStorage.setItem('ken_custom_extras', JSON.stringify(normalized));
        }
      } else {
        const saved = localStorage.getItem('ken_custom_extras');
        if (saved) setExtras(parseSafeArray(saved, extras));
      }

      // Milks
      const cloudMilks = cloudData.ken_custom_milks;
      if (cloudMilks) {
        const parsedMilks = parseSafeArray(cloudMilks, null);
        if (parsedMilks) {
          const normalized = parsedMilks.map(item => ({
            ...item,
            priceAdd: Number(item.priceAdd || 0),
            dose: item.dose !== undefined ? Number(item.dose) : 0,
            unit: item.unit !== undefined ? item.unit : 'ml',
            bahanId: item.bahanId !== undefined ? item.bahanId : ''
          }));
          setMilks(normalized);
          localStorage.setItem('ken_custom_milks', JSON.stringify(normalized));
        }
      } else {
        const saved = localStorage.getItem('ken_custom_milks');
        if (saved) setMilks(parseSafeArray(saved, milks));
      }

      // Dose Espresso
      const cloudDose = cloudData.ken_dose_espresso;
      if (cloudDose !== undefined && cloudDose !== null) {
        const parsedDose = Number(cloudDose) || 7;
        setDoseEspresso(parsedDose);
        localStorage.setItem('ken_dose_espresso', parsedDose.toString());
      } else {
        const saved = localStorage.getItem('ken_dose_espresso');
        if (saved) setDoseEspresso(Number(saved) || 7);
      }
    }).catch(err => {
      console.warn("⚠️ Gagal load kustomisasi dari Cloud Supabase, menggunakan lokal:", err);
      // Fallback lokal instan
      const savedSizes = localStorage.getItem('ken_custom_sizes');
      if (savedSizes) setSizes(parseSafeArray(savedSizes, sizes));
      const savedExtras = localStorage.getItem('ken_custom_extras');
      if (savedExtras) setExtras(parseSafeArray(savedExtras, extras));
      const savedMilks = localStorage.getItem('ken_custom_milks');
      if (savedMilks) setMilks(parseSafeArray(savedMilks, milks));
      const savedDose = localStorage.getItem('ken_dose_espresso');
      if (savedDose) setDoseEspresso(Number(savedDose) || 7);
    }).finally(() => {
      setLoadingCloud(false);
    });
  }, []);

  const [newExtra, setNewExtra] = useState({ label: '', priceAdd: 0, dose: 0, unit: 'gram', bahanId: '' });
  const [showAddExtra, setShowAddExtra] = useState(false);

  const handleAddExtra = async () => {
    if (!newExtra.label) return alert('Nama topping wajib diisi!');
    const key = newExtra.label.toLowerCase().replace(/\s+/g, '_');
    if (extras.some(e => e.key === key)) return alert('Topping dengan nama ini sudah ada!');
    
    const updated = [...extras, { ...newExtra, key, priceAdd: Number(newExtra.priceAdd), dose: Number(newExtra.dose) }];
    setExtras(updated);
    localStorage.setItem('ken_custom_extras', JSON.stringify(updated));
    setShowAddExtra(false);
    setNewExtra({ label: '', priceAdd: 0, dose: 0, unit: 'gram', bahanId: '' });

    try {
      await api.saveCustomisations({ key: 'ken_custom_extras', value: updated });
      showToast('Topping baru berhasil ditambahkan dan disinkronkan ke Cloud!');
    } catch (e) {
      showToast('Topping baru disimpan secara offline.', 'warning');
    }
  };

  const handleDeleteExtra = async (key) => {
    if (!window.confirm('Yakin ingin menghapus topping ini?')) return;
    const updated = extras.filter(e => e.key !== key);
    setExtras(updated);
    localStorage.setItem('ken_custom_extras', JSON.stringify(updated));

    try {
      await api.saveCustomisations({ key: 'ken_custom_extras', value: updated });
      showToast('Topping berhasil dihapus dari Cloud!');
    } catch (e) {
      showToast('Topping dihapus secara offline.', 'warning');
    }
  };

  const [newMilk, setNewMilk] = useState({ label: '', priceAdd: 0, dose: 150, unit: 'ml', bahanId: '' });
  const [showAddMilk, setShowAddMilk] = useState(false);

  const handleAddMilk = async () => {
    if (!newMilk.label) return alert('Nama jenis susu wajib diisi!');
    const key = newMilk.label.toLowerCase().replace(/\s+/g, '_');
    if (milks.some(m => m.key === key)) return alert('Jenis susu dengan nama ini sudah ada!');
    
    const updated = [...milks, { ...newMilk, key, priceAdd: Number(newMilk.priceAdd), dose: Number(newMilk.dose) }];
    setMilks(updated);
    localStorage.setItem('ken_custom_milks', JSON.stringify(updated));
    setShowAddMilk(false);
    setNewMilk({ label: '', priceAdd: 0, dose: 150, unit: 'ml', bahanId: '' });

    try {
      await api.saveCustomisations({ key: 'ken_custom_milks', value: updated });
      showToast('Jenis susu baru berhasil ditambahkan dan disinkronkan ke Cloud!');
    } catch (e) {
      showToast('Jenis susu baru disimpan secara offline.', 'warning');
    }
  };

  const handleDeleteMilk = async (key) => {
    if (!window.confirm('Yakin ingin menghapus jenis susu ini?')) return;
    const updated = milks.filter(m => m.key !== key);
    setMilks(updated);
    localStorage.setItem('ken_custom_milks', JSON.stringify(updated));

    try {
      await api.saveCustomisations({ key: 'ken_custom_milks', value: updated });
      showToast('Jenis susu berhasil dihapus dari Cloud!');
    } catch (e) {
      showToast('Jenis susu dihapus secara offline.', 'warning');
    }
  };

  const handleSaveMilks = async () => {
    localStorage.setItem('ken_custom_milks', JSON.stringify(milks));
    try {
      await api.saveCustomisations({ key: 'ken_custom_milks', value: milks });
      showToast('Kustomisasi susu alternatif berhasil disimpan ke Cloud!');
    } catch (e) {
      showToast('Kustomisasi susu alternatif disimpan secara offline.', 'warning');
    }
  };

  const handleSaveSizes = async () => {
    localStorage.setItem('ken_custom_sizes', JSON.stringify(sizes));
    try {
      await api.saveCustomisations({ key: 'ken_custom_sizes', value: sizes });
      showToast('Pengaturan harga ukuran berhasil disimpan ke Cloud!');
    } catch (e) {
      showToast('Pengaturan harga ukuran disimpan secara offline.', 'warning');
    }
  };

  const handleSaveExtras = async () => {
    localStorage.setItem('ken_custom_extras', JSON.stringify(extras));
    try {
      await api.saveCustomisations({ key: 'ken_custom_extras', value: extras });
      showToast('Pengaturan topping (extras) berhasil disimpan ke Cloud!');
    } catch (e) {
      showToast('Pengaturan topping (extras) disimpan secara offline.', 'warning');
    }
  };

  const handleSaveDoses = async () => {
    localStorage.setItem('ken_dose_espresso', doseEspresso.toString());
    try {
      await api.saveCustomisations({ key: 'ken_dose_espresso', value: doseEspresso });
      showToast('Dosis & gramasi espresso berhasil disimpan ke Cloud!');
    } catch (e) {
      showToast('Dosis & gramasi espresso disimpan secara offline.', 'warning');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl bg-card">
        <CardHeader className="border-b bg-zinc-50 dark:bg-zinc-900/50 p-6">
          <CardTitle className="text-xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <SlidersHorizontal className="text-amber-500" /> Kustomisasi Tambahan POS & Dosis
          </CardTitle>
          <CardDescription>Kelola harga ukuran cup, topping tambahan (extras), jenis susu alternatif, dan takaran dosis bahan baku resep.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          
          {/* SECTION: SIZES */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Coffee size={16} /> Tambahan Harga Ukuran (Sizes)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sizes.map((s, idx) => (
                <div key={s.key} className="p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg border border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-zinc-400">Cup {s.label} ({s.key})</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">+ Rp</span>
                    <input
                      type="number"
                      value={s.priceAdd}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setSizes(prev => prev.map((item, i) => i === idx ? { ...item, priceAdd: val } : item));
                      }}
                      className="w-full h-10 pl-14 pr-3 text-xs font-black font-mono bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-right"
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handleSaveSizes} className="h-10 px-6 font-bold bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 rounded-md active:scale-95 transition-all">Simpan Harga Ukuran</Button>
          </div>

                   {/* SECTION: EXTRAS */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><SlidersHorizontal size={16} /> Kustomisasi Topping & Dosis (Extras)</h3>
              <Button onClick={() => setShowAddExtra(true)} className="h-9 px-4 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 rounded-md active:scale-95 transition-all">
                <Plus size={14} className="mr-1 stroke-[3]" /> Tambah Topping
              </Button>
            </div>
            
            <div className="overflow-hidden rounded-lg border border-border bg-card font-sans">
              <table className="w-full text-left border-collapse font-mono tabular-nums">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-border text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    <th className="p-4">Nama Topping</th>
                    <th className="p-4 w-32 text-right">Harga Extra</th>
                    <th className="p-4 w-28 text-right">Takaran Dosis</th>
                    <th className="p-4 w-20 text-center">Satuan</th>
                    <th className="p-4 w-48 text-left">Bahan Baku Terkait</th>
                    <th className="p-4 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {extras.map((e, idx) => (
                    <tr key={e.key} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                      <td className="p-3">
                        <input
                          type="text"
                          value={e.label}
                          onChange={ev => {
                            const val = ev.target.value;
                            setExtras(prev => prev.map((item, i) => i === idx ? { ...item, label: val } : item));
                          }}
                          className="w-full h-9 px-2 font-bold bg-card border border-transparent hover:border-border focus:border-amber-500 rounded-md focus:outline-none transition-colors"
                        />
                      </td>
                      <td className="p-3">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-400 pointer-events-none">Rp</span>
                          <input
                            type="number"
                            value={e.priceAdd}
                            onChange={ev => {
                              const val = Number(ev.target.value);
                              setExtras(prev => prev.map((item, i) => i === idx ? { ...item, priceAdd: val } : item));
                            }}
                            className="w-full h-9 pl-7 pr-2 font-bold text-right bg-card border border-transparent hover:border-border focus:border-amber-500 rounded-md focus:outline-none transition-colors"
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={e.dose}
                          onChange={ev => {
                            const val = Number(ev.target.value);
                            setExtras(prev => prev.map((item, i) => i === idx ? { ...item, dose: val } : item));
                          }}
                          className="w-full h-9 px-2 font-bold text-right bg-card border border-transparent hover:border-border focus:border-amber-500 rounded-md focus:outline-none transition-colors"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={e.unit || 'gram'}
                          disabled={!!e.bahanId}
                          onChange={ev => {
                            const val = ev.target.value;
                            setExtras(prev => prev.map((item, i) => i === idx ? { ...item, unit: val } : item));
                          }}
                          className="w-full h-9 px-2 font-bold bg-card border border-transparent hover:border-border focus:border-amber-500 rounded-md focus:outline-none transition-colors text-center disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          <option value="gram">g</option>
                          <option value="ml">ml</option>
                          <option value="pcs">pcs</option>
                          {!['gram', 'ml', 'pcs'].includes(e.unit) && e.unit && (
                            <option value={e.unit}>{e.unit}</option>
                          )}
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={e.bahanId || ''}
                          onChange={ev => {
                            const val = ev.target.value;
                            const matchedBahan = bahanList.find(b => String(b.id) === String(val));
                            let updatedUnit = e.unit;
                            if (matchedBahan) {
                              const rawUnit = matchedBahan.unit || matchedBahan.satuan || 'gram';
                              const rawLower = rawUnit.toLowerCase();
                              if (['g', 'gr', 'gram'].includes(rawLower)) updatedUnit = 'gram';
                              else if (['ml', 'mililiter'].includes(rawLower)) updatedUnit = 'ml';
                              else if (['pcs', 'pc', 'piece', 'pieces'].includes(rawLower)) updatedUnit = 'pcs';
                              else updatedUnit = rawLower;
                            }
                            setExtras(prev => prev.map((item, i) => i === idx ? { ...item, bahanId: val, unit: updatedUnit } : item));
                          }}
                          className="w-full h-9 px-2 font-sans font-bold bg-card border border-transparent hover:border-border focus:border-amber-500 rounded-md focus:outline-none transition-colors text-left"
                        >
                          <option value="">-- Tanpa Potong Stok --</option>
                          {bahanList.map(b => (
                            <option key={b.id} value={b.id}>{b.name || b.nama || ''} ({b.unit || b.satuan || ''})</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteExtra(e.key)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                          title="Hapus Topping"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <Button onClick={handleSaveExtras} className="h-10 px-6 font-bold bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 rounded-md active:scale-95 transition-all">Simpan Kustomisasi Toppings</Button>
          </div>

          <hr className="border-border" />

          {/* SECTION: ALTERNATIVE MILKS */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Droplets size={16} /> Kustomisasi Susu Alternatif (Milk Options)</h3>
              <Button onClick={() => setShowAddMilk(true)} className="h-9 px-4 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 rounded-md active:scale-95 transition-all">
                <Plus size={14} className="mr-1 stroke-[3]" /> Tambah Susu Alternatif
              </Button>
            </div>
            
            <div className="overflow-hidden rounded-lg border border-border bg-card font-sans">
              <table className="w-full text-left border-collapse font-mono tabular-nums">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-border text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    <th className="p-4">Nama Susu</th>
                    <th className="p-4 w-32 text-right">Harga Tambahan</th>
                    <th className="p-4 w-28 text-right">Takaran Dosis</th>
                    <th className="p-4 w-20 text-center">Satuan</th>
                    <th className="p-4 w-48 text-left">Bahan Baku Terkait</th>
                    <th className="p-4 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {milks.map((m, idx) => (
                    <tr key={m.key} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                      <td className="p-3">
                        <input
                          type="text"
                          value={m.label}
                          onChange={ev => {
                            const val = ev.target.value;
                            setMilks(prev => prev.map((item, i) => i === idx ? { ...item, label: val } : item));
                          }}
                          className="w-full h-9 px-2 font-bold bg-card border border-transparent hover:border-border focus:border-amber-500 rounded-md focus:outline-none transition-colors"
                        />
                      </td>
                      <td className="p-3">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-400 pointer-events-none">Rp</span>
                          <input
                            type="number"
                            value={m.priceAdd}
                            onChange={ev => {
                              const val = Number(ev.target.value);
                              setMilks(prev => prev.map((item, i) => i === idx ? { ...item, priceAdd: val } : item));
                            }}
                            className="w-full h-9 pl-7 pr-2 font-bold text-right bg-card border border-transparent hover:border-border focus:border-amber-500 rounded-md focus:outline-none transition-colors"
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={m.dose}
                          onChange={ev => {
                            const val = Number(ev.target.value);
                            setMilks(prev => prev.map((item, i) => i === idx ? { ...item, dose: val } : item));
                          }}
                          className="w-full h-9 px-2 font-bold text-right bg-card border border-transparent hover:border-border focus:border-amber-500 rounded-md focus:outline-none transition-colors"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={m.unit || 'ml'}
                          disabled={!!m.bahanId}
                          onChange={ev => {
                            const val = ev.target.value;
                            setMilks(prev => prev.map((item, i) => i === idx ? { ...item, unit: val } : item));
                          }}
                          className="w-full h-9 px-2 font-bold bg-card border border-transparent hover:border-border focus:border-amber-500 rounded-md focus:outline-none transition-colors text-center disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          <option value="gram">g</option>
                          <option value="ml">ml</option>
                          <option value="pcs">pcs</option>
                          {!['gram', 'ml', 'pcs'].includes(m.unit) && m.unit && (
                            <option value={m.unit}>{m.unit}</option>
                          )}
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={m.bahanId || ''}
                          onChange={ev => {
                            const val = ev.target.value;
                            const matchedBahan = bahanList.find(b => String(b.id) === String(val));
                            let updatedUnit = m.unit;
                            if (matchedBahan) {
                              const rawUnit = matchedBahan.unit || matchedBahan.satuan || 'ml';
                              const rawLower = rawUnit.toLowerCase();
                              if (['g', 'gr', 'gram'].includes(rawLower)) updatedUnit = 'gram';
                              else if (['ml', 'mililiter'].includes(rawLower)) updatedUnit = 'ml';
                              else if (['pcs', 'pc', 'piece', 'pieces'].includes(rawLower)) updatedUnit = 'pcs';
                              else updatedUnit = rawLower;
                            }
                            setMilks(prev => prev.map((item, i) => i === idx ? { ...item, bahanId: val, unit: updatedUnit } : item));
                          }}
                          className="w-full h-9 px-2 font-sans font-bold bg-card border border-transparent hover:border-border focus:border-amber-500 rounded-md focus:outline-none transition-colors text-left"
                        >
                          <option value="">-- Tanpa Potong Stok --</option>
                          {bahanList.map(b => (
                            <option key={b.id} value={b.id}>{b.name || b.nama || ''} ({b.unit || b.satuan || ''})</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteMilk(m.key)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                          title="Hapus Susu"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <Button onClick={handleSaveMilks} className="h-10 px-6 font-bold bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 rounded-md active:scale-95 transition-all">Simpan Kustomisasi Susu</Button>
          </div>

          {/* SECTION: BRAND-SPECIFIC DOSES */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">⚖️ Gramasi & Dosis Bahan Baku Brand Utama</h3>
            <p className="text-[10px] text-zinc-400 leading-normal -mt-2">Atur takaran gramasi standar per porsi untuk brand/outlet Anda agar perhitungan HPP dan pemotongan stok bahan baku di backend menjadi 100% presisi (misal: Brand DEDE = 8g, Brand KAKA = 9g).</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg border border-border space-y-2">
                <span className="text-xs font-black uppercase text-zinc-400">1 Shot Espresso</span>
                <div className="relative">
                  <input
                    type="number"
                    value={doseEspresso}
                    onChange={e => setDoseEspresso(Math.max(1, Number(e.target.value)))}
                    className="w-full h-10 pr-12 text-xs font-black font-mono bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-right"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400 pointer-events-none">gram</span>
                </div>
              </div>



            </div>
            <Button onClick={handleSaveDoses} className="h-10 px-6 font-bold bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 rounded-md active:scale-95 transition-all">Simpan Takaran Dosis</Button>
          </div>

        </CardContent>
      </Card>

      {/* ADD TOPPING / EXTRA MODAL */}
      {showAddExtra && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border border-border rounded-lg bg-card overflow-hidden">
            <CardHeader className="border-b bg-zinc-50 dark:bg-zinc-900/50 p-6">
              <CardTitle className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Plus className="text-amber-500" /> Tambah Topping Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nama Topping</label>
                <Input value={newExtra.label} onChange={e => setNewExtra({ ...newExtra, label: e.target.value })} placeholder="CONTOH: Oreo Crumbs" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tambahan Harga (Rp)</label>
                <Input type="number" value={newExtra.priceAdd} onChange={e => setNewExtra({ ...newExtra, priceAdd: e.target.value })} placeholder="CONTOH: 4000" className="h-11 font-mono text-right" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Hubungkan Ke Bahan Baku Gudang</label>
                <select 
                  className="w-full h-11 px-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground" 
                  value={newExtra.bahanId || ''} 
                  onChange={e => {
                    const val = e.target.value;
                    const matchedBahan = bahanList.find(b => String(b.id) === String(val));
                    let updatedUnit = newExtra.unit;
                    if (matchedBahan) {
                      const rawUnit = matchedBahan.unit || matchedBahan.satuan || 'gram';
                      const rawLower = rawUnit.toLowerCase();
                      if (['g', 'gr', 'gram'].includes(rawLower)) updatedUnit = 'gram';
                      else if (['ml', 'mililiter'].includes(rawLower)) updatedUnit = 'ml';
                      else if (['pcs', 'pc', 'piece', 'pieces'].includes(rawLower)) updatedUnit = 'pcs';
                      else updatedUnit = rawLower;
                    }
                    setNewExtra({ ...newExtra, bahanId: val, unit: updatedUnit });
                  }}
                >
                  <option value="">-- Tanpa Potong Stok --</option>
                  {bahanList.map(b => (
                    <option key={b.id} value={b.id}>{b.name || b.nama || ''} ({b.unit || b.satuan || ''})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Takaran / Dosis</label>
                  <Input type="number" value={newExtra.dose} onChange={e => setNewExtra({ ...newExtra, dose: e.target.value })} placeholder="CONTOH: 10" className="h-11 font-mono text-right" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Satuan</label>
                  <select 
                    disabled={!!newExtra.bahanId}
                    className="w-full h-11 px-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground disabled:opacity-75 disabled:cursor-not-allowed" 
                    value={newExtra.unit} 
                    onChange={e => setNewExtra({ ...newExtra, unit: e.target.value })}
                  >
                    <option value="gram">Gram (g)</option>
                    <option value="ml">Mililiter (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    {!['gram', 'ml', 'pcs'].includes(newExtra.unit) && newExtra.unit && (
                      <option value={newExtra.unit}>{newExtra.unit}</option>
                    )}
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 p-6 flex justify-end gap-3 border-t">
              <Button variant="ghost" onClick={() => setShowAddExtra(false)} className="flex-1 h-12 rounded-lg font-bold">Batal</Button>
              <Button onClick={handleAddExtra} className="flex-1 h-12 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 rounded-lg font-black text-xs uppercase tracking-widest px-6 active:scale-95 transition-all">Tambah Topping</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* ADD ALTERNATIVE MILK MODAL */}
      {showAddMilk && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border border-border rounded-lg bg-card overflow-hidden">
            <CardHeader className="border-b bg-zinc-50 dark:bg-zinc-900/50 p-6">
              <CardTitle className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Plus className="text-amber-500" /> Tambah Susu Alternatif Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nama Susu</label>
                <Input value={newMilk.label} onChange={e => setNewMilk({ ...newMilk, label: e.target.value })} placeholder="CONTOH: Coconut Milk" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tambahan Harga (Rp)</label>
                <Input type="number" value={newMilk.priceAdd} onChange={e => setNewMilk({ ...newMilk, priceAdd: e.target.value })} placeholder="CONTOH: 6000" className="h-11 font-mono text-right" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Hubungkan Ke Bahan Baku Gudang</label>
                <select 
                  className="w-full h-11 px-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground" 
                  value={newMilk.bahanId || ''} 
                  onChange={e => {
                    const val = e.target.value;
                    const matchedBahan = bahanList.find(b => String(b.id) === String(val));
                    let updatedUnit = newMilk.unit;
                    if (matchedBahan) {
                      const rawUnit = matchedBahan.unit || matchedBahan.satuan || 'ml';
                      const rawLower = rawUnit.toLowerCase();
                      if (['g', 'gr', 'gram'].includes(rawLower)) updatedUnit = 'gram';
                      else if (['ml', 'mililiter'].includes(rawLower)) updatedUnit = 'ml';
                      else if (['pcs', 'pc', 'piece', 'pieces'].includes(rawLower)) updatedUnit = 'pcs';
                      else updatedUnit = rawLower;
                    }
                    setNewMilk({ ...newMilk, bahanId: val, unit: updatedUnit });
                  }}
                >
                  <option value="">-- Tanpa Potong Stok --</option>
                  {bahanList.map(b => (
                    <option key={b.id} value={b.id}>{b.name || b.nama || ''} ({b.unit || b.satuan || ''})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Takaran / Dosis</label>
                  <Input type="number" value={newMilk.dose} onChange={e => setNewMilk({ ...newMilk, dose: e.target.value })} placeholder="CONTOH: 150" className="h-11 font-mono text-right" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Satuan</label>
                  <select 
                    disabled={!!newMilk.bahanId}
                    className="w-full h-11 px-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground disabled:opacity-75 disabled:cursor-not-allowed" 
                    value={newMilk.unit} 
                    onChange={e => setNewMilk({ ...newMilk, unit: e.target.value })}
                  >
                    <option value="ml">Mililiter (ml)</option>
                    <option value="gram">Gram (g)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    {!['gram', 'ml', 'pcs'].includes(newMilk.unit) && newMilk.unit && (
                      <option value={newMilk.unit}>{newMilk.unit}</option>
                    )}
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 p-6 flex justify-end gap-3 border-t">
              <Button variant="ghost" onClick={() => setShowAddMilk(false)} className="flex-1 h-12 rounded-lg font-bold">Batal</Button>
              <Button onClick={handleAddMilk} className="flex-1 h-12 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 rounded-lg font-black text-xs uppercase tracking-widest px-6 active:scale-95 transition-all">Tambah Susu</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}


// ================================================================
// 🎟️ PromoPanel — Manajemen Kupon, Diskon, dan Promo Pelanggan
// ================================================================
function PromoPanel({ showToast }) {
  const [promos, setPromos] = useState(() => {
    const saved = localStorage.getItem('ken_custom_promos');
    return saved ? JSON.parse(saved) : [
      { code: 'KOPIHEMAT', type: 'percentage', value: 15, desc: 'Diskon 15% untuk semua menu' },
      { code: 'KENWEEKEND', type: 'fixed', value: 10000, desc: 'Potongan Rp 10.000' }
    ];
  });

  const [loyaltyRate, setLoyaltyRate] = useState(() => {
    const saved = localStorage.getItem('ken_custom_loyalty_rate');
    return saved ? parseInt(saved, 10) : 10; // 10 points per Rp 10.000
  });

  const [newPromo, setNewPromo] = useState({ code: '', type: 'percentage', value: '', desc: '' });
  const [showAddPromo, setShowAddPromo] = useState(false);

  const handleSaveLoyalty = async () => {
    localStorage.setItem('ken_custom_loyalty_rate', loyaltyRate.toString());
    try {
      await api.saveSettingsLoyalty({ enabled: true, multiplier: loyaltyRate * 1000 });
      showToast('Konfigurasi perolehan poin loyalty berhasil disimpan!');
    } catch {
      showToast('Konfigurasi disimpan lokal (gagal sinkronisasi server).');
    }
  };

  const handleAddPromo = () => {
    if (!newPromo.code || !newPromo.value) return alert('Kode dan Nilai Promo wajib diisi!');
    const updated = [...promos, { ...newPromo, code: newPromo.code.toUpperCase().trim(), value: Number(newPromo.value) }];
    setPromos(updated);
    localStorage.setItem('ken_custom_promos', JSON.stringify(updated));
    setShowAddPromo(false);
    setNewPromo({ code: '', type: 'percentage', value: '', desc: '' });
    showToast('Kode promo baru ditambahkan!');
  };

  const handleDeletePromo = (code) => {
    if (!window.confirm('Yakin ingin menghapus kode promo ini?')) return;
    const updated = promos.filter(p => p.code !== code);
    setPromos(updated);
    localStorage.setItem('ken_custom_promos', JSON.stringify(updated));
    showToast('Kode promo telah dihapus!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="border-none shadow-xl bg-card rounded-lg">
        <CardHeader className="border-b bg-zinc-50 dark:bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
                <Sparkles size={24} className="stroke-[2.5]" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-zinc-900 dark:text-zinc-50">Pengaturan Promo & Diskon</CardTitle>
                <CardDescription className="mt-1">Kelola voucher promosi, diskon kupon belanja, dan program loyalitas pelanggan.</CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddPromo(true)} 
              className="h-10 px-4 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 rounded-md shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Plus size={16} className="mr-2 stroke-[3]" /> Tambah Promo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Ticket size={16} /> Daftar Voucher & Kuon Promo
            </h3>

            {promos.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-md bg-zinc-50/50 dark:bg-zinc-900/20">
                <p className="text-sm font-medium text-zinc-400">Belum ada promo yang terdaftar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promos.map(p => (
                  <div key={p.code} className="p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-sm border border-amber-500/10 inline-block uppercase">
                        {p.code}
                      </span>
                      <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-2">{p.desc}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase font-mono tracking-wider mt-1">
                        Potongan: <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">{p.type === 'percentage' ? `${p.value}%` : `Rp ${p.value.toLocaleString('id-ID')}`}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeletePromo(p.code)} 
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md transition-colors active:scale-95"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-card rounded-lg">
        <CardHeader className="border-b bg-zinc-50 dark:bg-zinc-900/50 p-6">
          <CardTitle className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            ⭐ Aturan Loyalty Point Member
          </CardTitle>
          <CardDescription>
            Konfigurasi rasio perolehan poin loyalitas yang didapatkan pelanggan saat bertransaksi.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 max-w-xl">
            <div className="space-y-1">
              <p className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Poin Per Rp 10.000 Transaksi</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
                Tentukan jumlah poin loyalitas yang diperoleh pelanggan untuk kelipatan transaksi sebesar Rp 10.000.
              </p>
            </div>
            <div className="relative w-32 shrink-0">
              <input
                type="number"
                value={loyaltyRate}
                onChange={e => setLoyaltyRate(Math.max(1, Number(e.target.value)))}
                className="w-full h-11 px-3 text-sm font-black font-mono bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-amber-500/20 text-right rounded-md text-foreground"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400 pointer-events-none">Pts</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t bg-zinc-50 dark:bg-zinc-900/50">
          <Button 
            onClick={handleSaveLoyalty} 
            className="h-10 px-6 font-bold bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 rounded-md shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            Simpan Aturan Poin
          </Button>
        </CardFooter>
      </Card>

      {/* ADD PROMO MODAL */}
      {showAddPromo && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-700 rounded-lg bg-card overflow-hidden">
            <CardHeader className="border-b bg-zinc-50 dark:bg-zinc-900/50 p-6">
              <CardTitle className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Ticket className="text-amber-500" /> Tambah Kode Promo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Kode Promo</label>
                <Input 
                  value={newPromo.code} 
                  onChange={e => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })} 
                  placeholder="CONTOH: KOPIHEMAT" 
                  className="h-11 font-mono uppercase bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-amber-500/20 rounded-md" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Jenis Diskon</label>
                <select 
                  className="w-full h-11 px-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground" 
                  value={newPromo.type} 
                  onChange={e => setNewPromo({ ...newPromo, type: e.target.value })}
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal Flat (Rp)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nilai Potongan</label>
                <Input 
                  type="number" 
                  value={newPromo.value} 
                  onChange={e => setNewPromo({ ...newPromo, value: e.target.value })} 
                  placeholder={newPromo.type === 'percentage' ? '15' : '10000'} 
                  className="h-11 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-amber-500/20 rounded-md" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Deskripsi / Syarat</label>
                <Input 
                  value={newPromo.desc} 
                  onChange={e => setNewPromo({ ...newPromo, desc: e.target.value })} 
                  placeholder="Diskon 15% khusus pembelian kopi" 
                  className="h-11 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-amber-500/20 rounded-md" 
                />
              </div>
            </CardContent>
            <CardFooter className="p-6 border-t bg-zinc-50 dark:bg-zinc-900/50 flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-md font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300" 
                onClick={() => setShowAddPromo(false)}
              >
                Batal
              </Button>
              <Button 
                className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 text-white font-bold rounded-md shadow-lg shadow-amber-500/20 active:scale-95 transition-all" 
                onClick={handleAddPromo}
              >
                Simpan Promo
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}


// ================================================================
// 🔐 SecurityAuditPanel — Owner-Only Cryptographic Audit Portal
// ================================================================
function SecurityAuditPanel({ user }) {
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const isOwner = ['owner', 'superadmin'].includes(user?.role?.toLowerCase());

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setReport(null);
    try {
      const result = await api.getSystemIntegrity();
      setReport(result);
    } catch (err) {
      setError(err.message || 'Gagal menjalankan pemindaian integritas.');
    } finally {
      setScanning(false);
    }
  };

  const isCompliant = report?.integrityStatus === 'COMPLIANT';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Card */}
      <Card className="border-none shadow-xl bg-card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
        <CardHeader className="border-b bg-background">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                <Fingerprint className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
              <div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">Audit Integritas Kriptografis</CardTitle>
                <CardDescription className="mt-1">
                  Pemindaian real-time seluruh log audit menggunakan verifikasi tanda tangan HMAC-SHA256 untuk mendeteksi manipulasi data secara instan.
                </CardDescription>
              </div>
            </div>
            {report && (
              <div className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 shrink-0",
                isCompliant
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800"
              )}>
                {isCompliant ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {isCompliant ? 'COMPLIANT' : 'PELANGGARAN TERDETEKSI'}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {/* Access Guard */}
          {!isOwner ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
              <div className="w-20 h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Shield size={40} className="text-zinc-400 dark:text-zinc-600" />
              </div>
              <div>
                <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">Akses Dibatasi</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">Fitur Audit Integritas Kriptografis hanya dapat diakses oleh <strong>Owner</strong> atau <strong>Superadmin</strong>.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Info boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Fingerprint, label: 'Algoritma', value: 'HMAC-SHA256', color: 'text-amber-600 dark:text-amber-400' },
                  { icon: ScanLine, label: 'Cakupan', value: 'Seluruh Audit Log', color: 'text-amber-600 dark:text-amber-400' },
                  { icon: ShieldCheck, label: 'Standar', value: 'SCBD Grade Enterprise', color: 'text-amber-600 dark:text-amber-400' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-lg bg-background border border-zinc-200 dark:border-zinc-700 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                      <item.icon size={18} className={item.color} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{item.label}</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Scan Button & Radar Animation */}
              <div className="flex flex-col items-center justify-center gap-6">
                {scanning && (
                  <div className="relative w-40 h-40 rounded-full border-4 border-amber-500/20 dark:border-amber-400/20 flex items-center justify-center overflow-hidden animate-pulse">
                    <div className="absolute w-full h-full bg-gradient-to-tr from-transparent via-amber-500/10 to-amber-500/30 dark:via-amber-400/10 dark:to-amber-400/30 rounded-full animate-spin duration-1000" style={{ animationDuration: '1.5s' }} />
                    <Fingerprint className="text-amber-500 dark:text-amber-400 w-16 h-16 animate-bounce" />
                    <div className="absolute inset-0 border-t border-amber-500/40 dark:border-amber-400/40 rounded-full animate-spin duration-1000" />
                  </div>
                )}
                
                <Button
                  onClick={handleScan}
                  disabled={scanning}
                  className={cn(
                    "h-14 px-12 text-sm font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg gap-3",
                    "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20",
                    "dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 dark:shadow-amber-400/10"
                  )}
                >
                  {scanning ? (
                    <><RefreshCw size={20} className="animate-spin" /> Memindai Seluruh Log...</>
                  ) : (
                    <><ScanLine size={20} /> Jalankan Audit Integritas Sekarang</>
                  )}
                </Button>
              </div>

              {/* Error State */}
              {error && (
                <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-4">
                  <AlertCircle className="text-rose-600 dark:text-rose-400 shrink-0" size={20} />
                  <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{error}</p>
                </div>
              )}

              {/* Results */}
              {report && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Log Dipindai', value: report.totalLogsScanned, color: 'text-zinc-900 dark:text-zinc-100' },
                      { label: 'Log Sehat & Valid', value: report.healthyLogsCount, color: 'text-emerald-600 dark:text-emerald-400' },
                      { label: 'Log Terindikasi Manipulasi', value: report.tamperedLogsCount, color: report.tamperedLogsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400' },
                      { label: 'Status Sistem', value: report.integrityStatus, color: isCompliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400' },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 rounded-lg bg-background border border-zinc-200 dark:border-zinc-700 text-center">
                        <p className={cn("text-2xl font-black font-mono tabular-nums", stat.color)}>{stat.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Compliant Banner */}
                  {isCompliant && (
                    <div className="p-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-6">
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                        <FileCheck2 size={24} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-black text-emerald-700 dark:text-emerald-400 text-lg">Seluruh Log Audit Terverifikasi — Tidak Ada Manipulasi Terdeteksi</p>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-500 mt-1">
                          Semua <span className="font-black font-mono tabular-nums">{report.totalLogsScanned}</span> entri log memiliki signature HMAC-SHA256 yang valid dan belum pernah diubah.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Violated: Tampered Logs Table */}
                  {!isCompliant && report.tamperedLogs?.length > 0 && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-4">
                        <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400 shrink-0" />
                        <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
                          🚨 Terdeteksi <span className="font-black font-mono tabular-nums">{report.tamperedLogsCount}</span> entri log yang signature HMAC-nya tidak cocok. Kemungkinan data telah dimanipulasi secara langsung di database. Segera hubungi tim IT Anda.
                        </p>
                      </div>

                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Detail Log Terindikasi Dimanipulasi</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-900">
                              <tr>
                                {['ID Log', 'Penyebab', 'Action Type', 'Table'].map(h => (
                                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {report.tamperedLogs.map((log, i) => (
                                <tr key={i} className={cn("border-b border-zinc-100 dark:border-zinc-800", i % 2 === 0 ? "bg-white dark:bg-zinc-800" : "bg-zinc-50/50 dark:bg-zinc-700/20")}>
                                  <td className="px-4 py-3 font-mono tabular-nums text-xs text-zinc-500 dark:text-zinc-400">{String(log.id).slice(0, 8)}...</td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-black uppercase">{log.reason}</span>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{log.record?.action_type || '-'}</td>
                                  <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{log.record?.table_name || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
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

  const tabInfo = {
    users: {
      title: "Pengguna & Hak Akses",
      desc: "Manajemen anggota tim, hak akses (roles), dan izin akses fitur sistem.",
      icon: Users
    },
    system: {
      title: "Profil Outlet & Gerai",
      desc: "Informasi dasar gerai, titik koordinat GPS geofencing absensi, dan pengaturan pajak/layanan operasional.",
      icon: Settings
    },
    customization: {
      title: "Kustomisasi POS & Dosis",
      desc: "Pengaturan ukuran cup, opsi tambahan (extras), jenis susu alternatif, dan takaran dosis bahan baku resep.",
      icon: SlidersHorizontal
    },
    promo: {
      title: "Promo & Diskon",
      desc: "Manajemen kupon diskon, voucher belanja, dan program promosi pelanggan.",
      icon: Sparkles
    },
    payment: {
      title: "Aturan Keuangan & Pajak",
      desc: "Metode pembayaran kasir, nomor rekening transfer manual, dan integrasi gerbang pembayaran.",
      icon: CreditCard
    },
    branding: {
      title: "Branding & Personalisasi",
      desc: "Kustomisasi tampilan struk belanja, logo struk, dan identitas visual brand.",
      icon: Palette
    },
    marketplace: {
      title: "Omnichannel & Marketplace",
      desc: "Integrasi marketplace pihak ketiga dan pengelolaan channel penjualan digital.",
      icon: Store
    },
    subscription: {
      title: "Modul & Paket Layanan",
      desc: "Manajemen paket berlangganan sistem, riwayat tagihan, dan modul tambahan aktif.",
      icon: PackageOpen
    },
    ai: {
      title: "Modul AI & API",
      desc: "Integrasi sistem kecerdasan buatan, API Key OpenAI/Gemini, dan asisten kustomisasi menu otomatis.",
      icon: BrainCircuit
    },
    security: {
      title: "Kebijakan Approval & Keamanan",
      desc: "Konfigurasi otorisasi tindakan sensitif, kebijakan persetujuan owner, dan audit log keamanan.",
      icon: ShieldAlert
    }
  };

  const currentTab = tabInfo[activeTab] || tabInfo.users;
  
  const hash = window.location.hash;
  const searchPart = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(searchPart);
  const isStandalone = params.get('standalone') === 'true';

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {isStandalone ? (
        /* Dedicated Sub-page Header */
        <div className="flex items-center justify-between border-b pb-6 border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
              <currentTab.icon size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">{currentTab.title}</h2>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">{currentTab.desc}</p>
            </div>
          </div>
        </div>
      ) : (
        /* Original Premium Settings Header & Tabs Bar */
        <>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h2>
            <p className="text-zinc-500 dark:text-zinc-100 mt-1">Konfigurasi operasional, hak akses pengguna, dan personalisasi brand.</p>
          </div>

          <div className="flex items-center gap-2 bg-background p-1 rounded-lg border w-fit flex-wrap">
            {[
              { key: 'users', label: 'Pengguna & Akses', icon: Users },
              { key: 'system', label: 'Pajak & Sistem', icon: Settings },
              { key: 'customization', label: 'Kustomisasi POS', icon: SlidersHorizontal },
              { key: 'promo', label: 'Promo & Diskon', icon: Sparkles },
              { key: 'payment', label: 'Pembayaran', icon: CreditCard },
              { key: 'branding', label: 'Branding', icon: Palette },
              { key: 'marketplace', label: 'Marketplace', icon: Store },
              { key: 'subscription', label: 'Modul & Paket', icon: PackageOpen },
              { key: 'ai', label: 'Integrasi AI', icon: BrainCircuit },
              { key: 'security', label: 'Keamanan & Audit', icon: ShieldAlert },
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
                   <span className="text-white">PRO</span>
                )}
                {t.key === 'security' && (
                  <span className="bg-amber-500 dark:bg-amber-400 text-white dark:text-zinc-900 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">BARU</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

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

      {/* ================================================================ */}
      {/* TAB: KEAMANAN & AUDIT (OWNER-ONLY CRYPTOGRAPHIC SECURITY PORTAL) */}
      {/* ================================================================ */}
      {activeTab === 'security' && <SecurityAuditPanel user={user} />}

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

      {activeTab === 'customization' && (
        <POSCustomizationPanel showToast={showToast} />
      )}

      {activeTab === 'promo' && (
        <PromoPanel showToast={showToast} />
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
