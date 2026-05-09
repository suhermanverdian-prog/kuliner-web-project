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

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const toggleFeature = async (tenant, featureKey) => {
    try {
      const currentFeatures = tenant.features || {};
      const newFeatures = { ...currentFeatures, [featureKey]: !currentFeatures[featureKey] };
      await api.updateTenant({ id: tenant.id, features: newFeatures });
      fetchTenants();
    } catch (err) {
      alert('Gagal update fitur');
    }
  };

  const filtered = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  if (loading && tenants.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground font-bold animate-pulse uppercase tracking-widest text-[10px]">Menghubungkan ke Pusat Server...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full">System Owner Access</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 animate-pulse"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Server Online</span>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-primary">SuperAdmin Hub</h2>
           <p className="text-muted-foreground mt-1 font-medium">Panel kendali pusat untuk manajemen platform SaaS BrewMaster.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="h-12 font-bold" onClick={fetchTenants}><RefreshCw className="mr-2 h-4 w-4" /> Sinkronisasi</Button>
           <Button className="h-12 px-8 font-black bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20">+ Daftarkan Client</Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: 'Total Client', val: tenants.length, icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/10' },
           { label: 'Active Subscription', val: tenants.filter(t=>t.is_active).length, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
           { label: 'Premium Tier', val: tenants.filter(t=>t.tier==='pro' || t.tier==='franchise').length, icon: ShieldCheck, color: 'text-accent', bg: 'bg-accent/10' },
           { label: 'System Health', val: '99.9%', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-600/10' },
         ].map((s, i) => (
           <Card key={i} className="border-none shadow-md bg-card group hover:scale-[1.02] transition-all">
             <CardContent className="p-6 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</p>
                   <p className={cn("text-3xl font-black mt-1", s.color)}>{s.val}</p>
                </div>
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", s.bg)}>
                   <s.icon size={24} className={cn("group-hover:scale-110 transition-transform", s.color)} />
                </div>
             </CardContent>
           </Card>
         ))}
      </div>

      {/* Main Control Panel */}
      <Card className="border-none shadow-2xl bg-card overflow-hidden rounded-[2.5rem]">
         <CardHeader className="p-8 border-b bg-muted/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div>
                  <CardTitle className="text-xl font-black">Manajemen Tenant</CardTitle>
                  <CardDescription className="text-xs uppercase font-bold tracking-widest mt-1">Konfigurasi Hak Akses & Fitur Global Client</CardDescription>
               </div>
               <div className="relative group min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={18} />
                  <Input 
                    className="pl-12 h-12 rounded-2xl border-none bg-muted/20 focus:bg-background shadow-inner font-bold" 
                    placeholder="Cari nama bisnis..." 
                    value={search} onChange={e => setSearch(e.target.value)}
                  />
               </div>
            </div>
         </CardHeader>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b">
                     <th className="px-8 py-4">Client / Bisnis</th>
                     <th className="px-8 py-4">Paket Langganan</th>
                     <th className="px-8 py-4">Izin Fitur Pembayaran</th>
                     <th className="px-8 py-4">Status & Billing</th>
                     <th className="px-8 py-4 text-right">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-muted/10 transition-colors group">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-xl font-black shadow-sm group-hover:bg-accent group-hover:text-white transition-all">
                                {t.name[0]}
                             </div>
                             <div>
                                <p className="text-sm font-black group-hover:text-accent transition-colors">{t.name}</p>
                                <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 uppercase">
                                   <Calendar size={10} /> Terdaftar: {new Date(t.created_at).toLocaleDateString('id-ID')}
                                </p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <select 
                            value={t.tier} 
                            onChange={(e) => changeTier(t, e.target.value)}
                            className={cn(
                              "h-10 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-widest outline-none transition-all",
                              t.tier === 'pro' || t.tier === 'franchise' ? "bg-accent/5 border-accent text-accent" : "bg-muted border-transparent"
                            )}
                          >
                             <option value="lite">LITE</option>
                             <option value="pro">PRO</option>
                             <option value="franchise">FRANCHISE</option>
                          </select>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-2 max-w-[200px]">
                             {['QRIS', 'Debit', 'Transfer', 'Hutang', 'Points'].map(m => {
                               const key = `allow_${m.toLowerCase()}`;
                               const isEnabled = t.features?.[key] === true;
                               return (
                                 <button 
                                   key={m}
                                   onClick={() => toggleFeature(t, key)}
                                   className={cn(
                                     "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border transition-all",
                                     isEnabled ? "bg-blue-500/10 border-blue-500/20 text-blue-600" : "bg-muted text-muted-foreground/40 border-transparent hover:bg-muted/80"
                                   )}
                                 >
                                    {m}
                                 </button>
                               );
                             })}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                            t.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                          )}>
                             <div className={cn("w-1.5 h-1.5 rounded-full", t.is_active ? "bg-emerald-500 animate-pulse" : "bg-destructive")} />
                             {t.is_active ? 'Subscription Active' : 'Account Suspended'}
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                             <Button 
                               variant={t.is_active ? "destructive" : "default"} 
                               size="sm"
                               className="h-9 px-4 font-black text-[10px] uppercase tracking-widest rounded-xl"
                               onClick={() => toggleStatus(t)}
                             >
                                {t.is_active ? 'Suspend' : 'Activate'}
                             </Button>
                             <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><MoreHorizontal size={16} /></Button>
                          </div>
                       </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                       <td colSpan="5" className="py-24 text-center opacity-20 space-y-4">
                          <Shield size={64} className="mx-auto" strokeWidth={1} />
                          <p className="text-xl font-black uppercase tracking-[0.2em]">Tenant Tidak Ditemukan</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </Card>

      {/* Security Info Banner */}
      <div className="p-8 bg-blue-500/5 border-2 border-dashed border-blue-500/20 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6">
         <div className="w-16 h-16 bg-blue-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20 shrink-0">
            <ShieldCheck size={32} />
         </div>
         <div className="flex-1 space-y-1 text-center md:text-left">
            <p className="text-lg font-black text-blue-600">Protokol Keamanan Level Tinggi</p>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
               Anda sedang berada di dashboard pusat. Seluruh aktivitas audit log terekam secara otomatis. Pastikan hanya merubah konfigurasi tier atas izin manajerial atau kontrak berlangganan yang sah.
            </p>
         </div>
         <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 font-black rounded-xl">LIHAT LOG AUDIT</Button>
      </div>
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
