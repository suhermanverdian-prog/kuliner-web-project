import { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  ShieldCheck, Users, Zap, 
  CreditCard, ToggleLeft, ToggleRight,
  TrendingUp, Activity, CheckCircle2,
  AlertCircle, ChevronRight, Search,
  Filter, MoreHorizontal, Globe,
  Shield, Landmark, Wallet,
  Layers, Settings, Info, X, Save,
  BarChart3, Box, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { FEATURE_CATALOG, TIER_DEFAULTS, resolveFeatures } from '../lib/featureFlags';

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingFeatures, setEditingFeatures] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await api.getTenants();
      setTenants(res || []);
    } catch (err) {
      console.error('Failed to fetch tenants', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (tenant) => {
    try {
      await api.updateTenant({ id: tenant.id, is_active: !tenant.is_active });
      fetchTenants();
    } catch (err) {
      alert('Gagal update status');
    }
  };

  const changeTier = async (tenant, newTier) => {
    try {
      await api.updateTenant({ id: tenant.id, tier: newTier });
      fetchTenants();
    } catch (err) {
      alert('Gagal update tier');
    }
  };

  const toggleFeatureOverride = async (tenant, featureKey) => {
    try {
      const overrides = tenant.feature_overrides || {};
      const newOverrides = { ...overrides, [featureKey]: !resolveFeatures(tenant)[featureKey] };
      await api.updateTenant({ id: tenant.id, feature_overrides: newOverrides });
      fetchTenants();
      setEditingFeatures({ ...tenant, feature_overrides: newOverrides }); // update modal state
    } catch (err) {
      alert('Gagal update fitur override');
    }
  };

  const resetFeatureOverrides = async (tenant) => {
    try {
      await api.updateTenant({ id: tenant.id, feature_overrides: {} });
      fetchTenants();
      setEditingFeatures({ ...tenant, feature_overrides: {} });
    } catch (err) {
      alert('Gagal reset override');
    }
  };

  const filtered = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  if (loading && tenants.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px] data-mono">Establishing Secure Node Connection...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded border border-primary/20">System Owner Access</span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Nodes Online</span>
           </div>
           <h2 className="text-3xl font-bold tracking-tight text-text-primary">SuperAdmin Hub</h2>
           <p className="text-sm text-text-secondary mt-1">
             Pusat kendali platform SaaS <span className="text-primary font-bold">KEN</span> &mdash; Kitchen Enterprise Nodes.
           </p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" size="sm" onClick={fetchTenants} className="h-9 px-4">
             <RefreshCw className="mr-2 h-4 w-4" /> Sinkronisasi
           </Button>
           <Button size="sm" className="h-9 px-6 font-bold shadow-lg shadow-primary/10">+ Registrasi Client</Button>
        </div>
      </div>

      {/* KPI Stats - 8px Snap */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: 'Total Client', val: tenants.length, icon: Globe, color: 'text-text-primary', bg: 'bg-subtle' },
           { label: 'Subskripsi Aktif', val: tenants.filter(t=>t.is_active).length, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
           { label: 'Tier Enterprise', val: tenants.filter(t=>t.tier==='enterprise').length, icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/10' },
           { label: 'Node Health', val: '99.9%', icon: Activity, color: 'text-info', bg: 'bg-info/10' },
         ].map((s, i) => (
           <Card key={i} className="group hover:border-border-strong transition-all">
             <CardContent className="p-5 flex items-center justify-between">
                <div>
                   <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">{s.label}</p>
                   <p className={cn("text-2xl font-bold mt-1 data-mono", s.color)}>{s.val}</p>
                </div>
                <div className={cn("w-10 h-10 rounded-md flex items-center justify-center border border-border-subtle", s.bg)}>
                   <s.icon size={20} className={cn("group-hover:scale-110 transition-transform", s.color)} />
                </div>
             </CardContent>
           </Card>
         ))}
      </div>

      {/* Main Control Panel */}
      <Card className="overflow-hidden">
         <CardHeader className="border-b bg-subtle/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div>
                  <CardTitle className="text-lg font-bold">Manajemen Tenant</CardTitle>
                  <CardDescription className="text-xs font-medium text-text-tertiary mt-0.5">Konfigurasi Hak Akses & Fitur Global Client</CardDescription>
               </div>
               <div className="relative group min-w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors" size={16} />
                  <Input 
                    className="pl-10 h-9" 
                    placeholder="Cari nama bisnis atau ID..." 
                    value={search} onChange={e => setSearch(e.target.value)}
                  />
               </div>
            </div>
         </CardHeader>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-subtle text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border-subtle">
                     <th className="px-6 py-3">Client / Bisnis</th>
                     <th className="px-6 py-3">Paket Langganan</th>
                     <th className="px-6 py-3">Kustomisasi Fitur</th>
                     <th className="px-6 py-3">Status & Billing</th>
                     <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border-subtle">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-subtle/50 transition-colors group">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-md bg-subtle flex items-center justify-center text-lg font-bold text-text-primary border border-border-subtle group-hover:bg-primary group-hover:text-white transition-all">
                                {t.name[0]}
                             </div>
                             <div>
                                <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">{t.name}</p>
                                <p className="text-[11px] text-text-tertiary font-medium flex items-center gap-1 uppercase">
                                   <Calendar size={10} /> Terdaftar: <span className="data-mono">{new Date(t.created_at).toLocaleDateString('id-ID')}</span>
                                </p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <select 
                            value={t.tier} 
                            onChange={(e) => changeTier(t, e.target.value)}
                            className={cn(
                              "h-9 px-3 rounded-md border text-[11px] font-bold uppercase tracking-wider outline-none transition-all cursor-pointer",
                              t.tier === 'enterprise' || t.tier === 'pro' ? "bg-primary/5 border-primary/30 text-primary" : "bg-subtle border-border-strong text-text-secondary"
                            )}
                          >
                             <option value="lite">LITE</option>
                             <option value="pro">PRO</option>
                             <option value="enterprise">ENTERPRISE</option>
                          </select>
                       </td>
                       <td className="px-6 py-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[11px] font-bold uppercase tracking-wider"
                            onClick={() => setEditingFeatures(t)}
                          >
                            <Settings size={14} className="mr-2" /> Atur Fitur
                          </Button>
                       </td>
                       <td className="px-6 py-4">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                            t.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-error/10 text-error border-error/20"
                          )}>
                             <div className={cn("w-1.5 h-1.5 rounded-full", t.is_active ? "bg-emerald-500 animate-pulse" : "bg-error")} />
                             {t.is_active ? 'Active' : 'Suspended'}
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                             <Button 
                               variant={t.is_active ? "destructive" : "default"} 
                               size="sm"
                               className="h-8 px-3 text-[10px] uppercase tracking-wider"
                               onClick={() => toggleStatus(t)}
                             >
                                {t.is_active ? 'Suspend' : 'Activate'}
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"><MoreHorizontal size={14} /></Button>
                          </div>
                       </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                       <td colSpan="5" className="py-20 text-center opacity-40 space-y-4">
                          <Shield size={48} className="mx-auto text-text-tertiary" strokeWidth={1.5} />
                          <p className="text-sm font-semibold uppercase tracking-widest text-text-tertiary">Client Tidak Ditemukan</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </Card>

      {/* Security Info Banner */}
      <div className="p-6 bg-info/5 border border-info/20 rounded-xl flex flex-col md:flex-row items-center gap-6">
         <div className="w-12 h-12 bg-info rounded-lg flex items-center justify-center text-white shadow-lg shadow-info/20 shrink-0">
            <ShieldCheck size={24} />
         </div>
         <div className="flex-1 space-y-1 text-center md:text-left">
            <p className="text-base font-bold text-info">Protokol Keamanan Level Tinggi</p>
            <p className="text-xs font-medium text-text-secondary leading-relaxed">
               Anda sedang berada di dashboard pusat. Seluruh aktivitas audit log terekam secara otomatis. Pastikan hanya merubah konfigurasi tier atas izin manajerial yang sah.
            </p>
         </div>
         <Button variant="outline" className="border-info/30 text-info hover:bg-info/10 h-9 px-6 text-xs font-bold uppercase tracking-wider">Audit Log</Button>
      </div>

      {/* Feature Flag Modal */}
      {editingFeatures && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl shadow-2xl bg-card border-border-subtle overflow-hidden flex flex-col max-h-[90vh]">
            <CardHeader className="bg-subtle/50 border-b flex flex-row items-start justify-between p-6">
              <div>
                <CardTitle className="text-xl font-bold">{editingFeatures.name}</CardTitle>
                <CardDescription className="uppercase font-bold tracking-widest text-[10px] text-primary mt-1">Feature Flags &amp; Overrides</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => setEditingFeatures(null)}><X size={18} /></Button>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 no-scrollbar">
              {['Core', 'Produksi', 'Pengadaan', 'Laporan', 'Keuangan', 'Bisnis', 'Enterprise'].map(group => (
                <div key={group} className="space-y-3 col-span-1 md:col-span-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary border-b border-border-subtle pb-2">{group}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FEATURE_CATALOG.filter(f => f.group === group).map(f => {
                      const isActive = resolveFeatures(editingFeatures)[f.key];
                      const isOverride = editingFeatures.feature_overrides && (f.key in editingFeatures.feature_overrides);
                      
                      return (
                        <div key={f.key} className="flex items-center justify-between p-3 rounded-md border border-border-subtle bg-subtle/20 hover:bg-subtle/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{f.icon}</span>
                            <div>
                              <p className="text-[13px] font-semibold text-text-primary leading-none">{f.label}</p>
                              <p className="text-[10px] text-text-tertiary mt-1 font-medium">{f.description}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => toggleFeatureOverride(editingFeatures, f.key)}
                            className={cn(
                              "w-9 h-5 rounded-full transition-colors relative flex items-center",
                              isActive ? "bg-emerald-500" : "bg-text-tertiary/30",
                              isOverride ? "ring-2 ring-primary ring-offset-2 ring-offset-bg-card" : ""
                            )}
                          >
                            <span className={cn("w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform absolute left-0.5", isActive ? "translate-x-4" : "translate-x-0")} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="bg-subtle/30 p-4 border-t flex justify-between gap-3">
              <Button variant="outline" size="sm" className="text-[10px] uppercase font-bold" onClick={() => resetFeatureOverrides(editingFeatures)}>Reset ke Default {editingFeatures.tier}</Button>
              <Button size="sm" className="px-6 font-bold" onClick={() => setEditingFeatures(null)}>Simpan Perubahan</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

function RefreshCw({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-in spin-in duration-700", className)}
      {...props}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
