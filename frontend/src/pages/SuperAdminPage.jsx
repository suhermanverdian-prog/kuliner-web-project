import { 
  ShieldCheck, Users, Zap, 
  CreditCard, ToggleLeft, ToggleRight,
  TrendingUp, Activity, CheckCircle2,
  AlertCircle, ChevronRight, Search,
  Filter, MoreHorizontal, Globe,
  Shield, Landmark, Wallet,
  Layers, Settings, Info, X, Save,
  BarChart3, Box, Calendar, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { FEATURE_CATALOG, resolveFeatures } from '../lib/featureFlags';
import { useSuperAdminPage } from '../hooks/useSuperAdminPage';

export default function SuperAdminPage() {
  const {
    tenants,
    loading,
    search, setSearch,
    editingFeatures, setEditingFeatures,
    fetchTenants,
    toggleStatus,
    changeTier,
    toggleFeatureOverride,
    resetFeatureOverrides,
    handleRegisterClient,
    filtered
  } = useSuperAdminPage();

  if (loading && tenants.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-mono tabular-nums">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-lg animate-spin" />
      <p className="text-zinc-500 dark:text-zinc-100 font-medium animate-pulse uppercase tracking-widest text-[10px] font-mono tabular-nums">Establishing Secure Node Connection...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-4">
              <span className="px-2.5 py-0.5 bg-amber- text-amber-500 text-[10px] font-black uppercase tracking-wider rounded border border-amber-500/20">System Owner Access</span>
              <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest"><div className="w-1.5 h-1.5 rounded-lg bg-emerald-500 animate-pulse" /> Nodes Online</span>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">SuperAdmin Hub</h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">
             Pusat kendali platform SaaS <span className="text-amber-500 font-black">KEN</span> &mdash; Kitchen Enterprise Nodes.
           </p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" size="sm" onClick={fetchTenants} className="h-10 px-6 font-black uppercase tracking-widest text-[10px] rounded-lg border-border">
             <RefreshCw className="mr-2 h-3 w-3" /> Sinkronisasi
           </Button>
            <Button 
              onClick={handleRegisterClient}
              size="sm" 
              className="h-10 px-8 font-black uppercase tracking-widest text-white rounded-lg "
            >
              + Registrasi Client
            </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Total Client', val: tenants.length, icon: Globe, color: 'text-foreground', bg: 'bg-background' },
           { label: 'Subskripsi Aktif', val: tenants.filter(t=>t.is_active).length, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-' },
           { label: 'Tier Enterprise', val: tenants.filter(t=>t.tier==='enterprise').length, icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
           { label: 'Node Health', val: '99.9%', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
         ].map((s, i) => (
           <Card key={i} className="group border-none bg-card shadow-sm hover:shadow-md transition-all rounded-lg overflow-hidden">
             <CardContent className="p-8 flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">{s.label}</p>
                   <p className={cn("text-3xl font-black font-mono tabular-nums", s.color)}>{s.val}</p>
                </div>
                <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center border border-border group-hover:scale-110 transition-transform", s.bg)}>
                   <s.icon size={24} className={cn(s.color)} />
                </div>
             </CardContent>
           </Card>
         ))}
      </div>

      {/* Main Control Panel */}
      <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
         <CardHeader className="p-10 border-b border-border bg-background">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="space-y-1">
                  <CardTitle className="text-2xl font-black tracking-tighter uppercase">Manajemen Tenant</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">Konfigurasi Hak Akses & Fitur Global Client</CardDescription>
               </div>
               <div className="relative group min-w-[350px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-100 group-focus-within:text-amber-500 transition-colors" size={18} />
                  <Input 
                    className="pl-12 h-12 bg-background/50 border-border rounded-lg font-medium" 
                    placeholder="Cari nama bisnis atau ID..." 
                    value={search} onChange={e => setSearch(e.target.value)}
                  />
               </div>
            </div>
         </CardHeader>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
               <thead>
                  <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 border-b border-border">
                     <th className="px-6 py-6">Client / Bisnis</th>
                     <th className="px-6 py-6">Paket Langganan</th>
                     <th className="px-10 py-6">Kustomisasi Fitur</th>
                     <th className="px-6 py-6">Status & Billing</th>
                     <th className="px-6 py-6 text-right">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-background transition-colors group">
                       <td className="px-6 py-8">
                          <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-lg bg-background flex items-center justify-center text-white font-black text-white border border-border group-hover:">
                                {t.name[0]}
                             </div>
                             <div>
                                <p className="text-base font-black text-foreground group-hover:text-amber-500 transition-colors">{t.name}</p>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-bold flex items-center gap-2 uppercase mt-1">
                                   <Calendar size={12} /> Terdaftar: <span className="font-mono tabular-nums font-black">{new Date(t.created_at).toLocaleDateString('id-ID')}</span>
                                </p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-8">
                          <select 
                            value={t.tier} 
                            onChange={(e) => changeTier(t, e.target.value)}
                            className={cn(
                              "h-10 px-4 rounded-lg border text-[10px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer shadow-sm",
                              t.tier === 'enterprise' || t.tier === 'pro' ? "bg-amber- border-amber-500/30 text-amber-600 dark:text-amber-500" : "bg-background border-border text-zinc-500 dark:text-zinc-100"
                            )}
                          >
                             <option value="lite">LITE</option>
                             <option value="pro">PRO</option>
                             <option value="enterprise">ENTERPRISE</option>
                          </select>
                       </td>
                       <td className="px-10 py-8">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-10 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest border-border hover:bg-background"
                            onClick={() => setEditingFeatures(t)}
                          >
                            <Settings size={14} className="mr-2" /> Atur Fitur
                          </Button>
                       </td>
                       <td className="px-6 py-8">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            t.is_active ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800"
                          )}>
                             <div className={cn("w-1.5 h-1.5 rounded-lg", t.is_active ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                             {t.is_active ? 'Active' : 'Suspended'}
                          </div>
                       </td>
                       <td className="px-6 py-8 text-right">
                          <div className="flex justify-end gap-4">
                             <Button 
                               variant={t.is_active ? "destructive" : "default"} 
                               size="sm"
                               className="h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                               onClick={() => toggleStatus(t)}
                             >
                                {t.is_active ? 'Suspend' : 'Activate'}
                             </Button>
                             <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background"><MoreHorizontal size={16} /></Button>
                          </div>
                       </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                       <td colSpan="5" className="py-24 text-center  space-y-4">
                          <Shield size={64} className="mx-auto text-zinc-500 dark:text-zinc-100" strokeWidth={1} />
                          <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-100">Node Not Found</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
         <CardFooter className="p-6 border-t border-border bg-background justify-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">End of Ledger &mdash; Securely Encrypted by KEN Node-01</p>
         </CardFooter>
      </Card>

      {/* Security Info Banner */}
       <div className="p-10 relative flex items-center gap-8 rounded-lg border border-border bg-card overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
         <div className="w-20 h-20 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 relative z-10">
            <ShieldCheck size={40} className="text-amber-500" />
         </div>
         <div className="flex-1 space-y-2 text-center md:text-left relative z-10">
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase">Enterprise Security Protocol <span className="text-amber-500 italic">v4.0</span></p>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
               Sistem dalam pengawasan enkripsi end-to-end. Seluruh mutasi tier, suspend, dan akses data tenant dicatat dalam Immutable Ledger untuk audit kepatuhan global.
            </p>
         </div>
         <Button className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 relative z-10 shrink-0">Audit Log</Button>
      </div>

      {/* Feature Flag Modal */}
      {editingFeatures && (
        <div className="fixed inset-0 z-50 flex items-center justify-center ">
          <Card className="w-full max-w-3xl shadow-2xl bg-card border-none rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
            <CardHeader className="bg-background border-b border-border flex flex-row items-start justify-between p-10">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black uppercase tracking-tighter">{editingFeatures.name}</CardTitle>
                <CardDescription className="uppercase font-black tracking-[0.2em] text-[10px] text-amber-500">Feature Flags & Overrides</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background" onClick={() => setEditingFeatures(null)}><X size={20} /></Button>
            </CardHeader>
            <CardContent className="p-10 overflow-y-auto no-scrollbar space-y-10">
              {['Core', 'Produksi', 'Pengadaan', 'Laporan', 'Keuangan', 'Bisnis', 'Enterprise'].map(group => (
                <div key={group} className="space-y-5">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-100 border-b border-border pb-4">{group} Management</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {FEATURE_CATALOG.filter(f => f.group === group).map(f => {
                      const isActive = resolveFeatures(editingFeatures)[f.key];
                      const isOverride = editingFeatures.feature_overrides && (f.key in editingFeatures.feature_overrides);
                      
                      return (
                        <div key={f.key} className={cn(
                          "flex items-center justify-between p-4 rounded-lg border transition-all duration-300 group/feature",
                          isActive ? "bg-amber- border-amber-500/20" : "bg-background border-border "
                        )}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 border border-border group-hover/feature:border-amber-500/30 transition-colors shrink-0">
                              <f.icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover/feature:text-amber-500 transition-colors" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-foreground leading-none">{f.label}</p>
                              <p className="text-[9px] text-zinc-500 dark:text-zinc-100 mt-1.5 font-bold uppercase tracking-wider">{f.description}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => toggleFeatureOverride(editingFeatures, f.key)}
                            className={cn(
                              "w-12 h-6 rounded-lg transition-all relative flex items-center shadow-inner",
                              isActive ? "bg-amber-500" : "bg-zinc-700",
                              isOverride ? "ring-4 ring-amber-500/20" : ""
                            )}
                          >
                            <span className={cn("w-4.5 h-4.5 bg-background rounded-lg shadow-lg transition-transform absolute left-1", isActive ? "translate-x-5.5" : "translate-x-0")} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="bg-background p-8 border-t border-border flex justify-between gap-6">
              <Button variant="ghost" size="sm" className="text-[10px] uppercase font-black tracking-widest text-zinc-500 dark:text-zinc-100 hover:text-foreground" onClick={() => resetFeatureOverrides(editingFeatures)}>Reset Defaults</Button>
              <Button size="sm" className="h-12 px-10 font-black uppercase tracking-[0.2em] text-white rounded-lg " onClick={() => setEditingFeatures(null)}>Save Matrix</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
