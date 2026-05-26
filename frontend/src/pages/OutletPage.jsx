import React from 'react';
import { 
  Store, Plus, MapPin, Phone, Edit2, Trash2, 
  ArrowRight, Globe, CheckCircle2, XCircle, 
  TrendingUp, Activity, LayoutGrid, Search,
  Filter, MoreHorizontal, Settings, Info,
  Map, Server, ShieldCheck, RefreshCw, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "@/lib/utils";
import { useOutletPage } from '../hooks/useOutletPage';

const OutletPage = () => {
  const {
    outlets,
    loading,
    showModal, setShowModal,
    editingOutlet, setEditingOutlet,
    search, setSearch,
    formData, setFormData,
    handleSubmit,
    handleEdit,
    handleDelete,
    filtered
  } = useOutletPage();

  if (loading && outlets.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-mono tabular-nums">
      <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Global Outlet Nodes...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-4">
              <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-500 text-[10px] font-black uppercase tracking-wider rounded border border-amber-500/20">Multi-Outlet Master</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">All Nodes Synced</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Outlet <span className="text-amber-500 italic">Orchestrator</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium max-w-2xl">Central command for managing physical locations, POS connectivity, and regional performance monitoring.</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-14 px-8 font-black uppercase tracking-widest text-[10px] bg-card border-border rounded-lg">
              <Map size={18} className="mr-2" /> View Map Hub
           </Button>
           <Button variant="primary"
             onClick={() => { setEditingOutlet(null); setFormData({ name: '', address: '', phone: '', is_active: true }); setShowModal(true); }}
             className="h-14 px-10 font-black uppercase tracking-widest rounded-lg"
           >
             <Plus size={18} className="mr-2" /> Add New Node
           </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Total Nodes', val: outlets.length, sub: 'Global Locations', icon: Store, color: 'text-foreground', bg: 'bg-background' },
           { label: 'Operational', val: outlets.filter(o => o.is_active).length, sub: 'Active & Online', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
           { label: 'Network Mode', val: 'Enterprise', sub: 'Infinite Scalability', icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
         ].map((s, i) => (
           <Card key={i} className="group border-none bg-card shadow-sm hover:shadow-md transition-all rounded-lg overflow-hidden">
             <CardContent className="p-8 flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">{s.label}</p>
                   <p className={cn("text-3xl font-black font-mono tabular-nums", s.color)}>{s.val}</p>
                   <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100  uppercase">{s.sub}</p>
                </div>
                <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center border border-border group-hover:scale-110 transition-transform", s.bg)}>
                   <s.icon size={28} className={cn(s.color)} />
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
                  <CardTitle className="text-2xl font-black tracking-tighter uppercase leading-none">Outlet Connectivity Hub</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">Monitor & Configure Physical Edge Nodes</CardDescription>
               </div>
               <div className="relative group min-w-[350px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-100 group-focus-within:text-amber-500 transition-colors" size={18} />
                  <Input 
                    className="pl-12 h-12 bg-background/50 border-border rounded-lg font-medium" 
                    placeholder="Search by location name or ID..." 
                    value={search} onChange={e => setSearch(e.target.value)}
                  />
               </div>
            </div>
         </CardHeader>
         <div className="p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filtered.map(outlet => (
                <Card key={outlet.id} className="border-none bg-background hover:bg-background border border-border transition-all rounded-lg overflow-hidden group/item">
                  <CardContent className="p-10 space-y-8">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center text-zinc-500 border border-border group-hover/item:text-amber-500 transition-colors">
                          <Store size={28} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black tracking-tighter uppercase leading-none group-hover/item:text-amber-500 transition-colors">{outlet.name}</h3>
                          <div className={cn(
                            "inline-flex items-center gap-2 mt-2 px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            outlet.is_active ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800"
                          )}>
                             <div className={cn("w-1.5 h-1.5 rounded-lg", outlet.is_active ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                             {outlet.is_active ? 'Online' : 'Offline'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(outlet)} className="h-12 w-12 rounded-lg hover:bg-amber-500/10 hover:text-amber-500 transition-colors">
                          <Edit2 size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(outlet.id)} className="h-12 w-12 rounded-lg hover:bg-rose-50 dark:bg-rose-950/30 hover:text-rose-600 dark:text-rose-400 transition-colors">
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-4">
                          <div className="flex items-start gap-4">
                             <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                             <p className="text-xs font-bold text-zinc-500 dark:text-zinc-100 leading-relaxed uppercase tracking-tight">{outlet.address || 'No Address Data'}</p>
                          </div>
                          <div className="flex items-center gap-4">
                             <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                             <p className="text-xs font-black font-mono tabular-nums">{outlet.phone || 'N/A'}</p>
                          </div>
                       </div>
                       <div className="p-6 bg-card rounded-lg border border-border flex flex-col justify-center items-center text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 mb-1">POS Health</p>
                          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">100%</p>
                       </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button variant="outline" className="flex-1 h-14 bg-card border-border text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-background group/btn">
                        <TrendingUp size={16} className="mr-3 group-hover/btn:scale-110 transition-transform" /> ANALYTICS
                      </Button>
                      <Button variant="primary" className="flex-1 h-14 font-black uppercase tracking-[0.2em] rounded-lg">
                        <Globe size={16} className="mr-3 group-hover/btn:rotate-12 transition-transform" /> MANAGE POS <ArrowRight size={14} className="ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-32 text-center  space-y-6">
                   <Server size={80} className="mx-auto text-zinc-500 dark:text-zinc-100" strokeWidth={1} />
                   <div className="space-y-2">
                      <p className="text-sm font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-100">No Outlet Node Detected</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100">Try adjusting your search filter or add a new node.</p>
                   </div>
                </div>
              )}
            </div>
         </div>
         <CardFooter className="p-10 border-t border-border bg-background justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-100 animate-pulse">Scanning Global Multi-Outlet Network Configuration...</p>
         </CardFooter>
      </Card>

      {/* Feature Promo: Centralized Procurement */}
      <Card className="border-none bg-background shadow-2xl rounded-lg overflow-hidden relative group">
         <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-20 group-hover:opacity-50 transition-opacity duration-1000" />
         <CardContent className="p-16 flex flex-col md:flex-row items-center gap-16 relative z-10">
            <div className="w-24 h-24 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-lg">
               <LayoutGrid size={48} />
            </div>
            <div className="flex-1 space-y-4">
               <h3 className="text-4xl font-black tracking-tighter uppercase leading-none">Centralized <span className="text-amber-500">Procurement</span> Hub</h3>
               <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium leading-relaxed max-w-3xl">
                  Kelola pengadaan bahan baku untuk seluruh cabang dari satu pintu. Hemat biaya operasional hingga <span className="text-amber-500 font-black">15%</span> dengan pembelian massal terpusat dan logistik terintegrasi.
               </p>
            </div>
            <Button className="h-16 px-12 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800">ENABLE HUB</Button>
         </CardContent>
      </Card>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-xl shadow-2xl bg-card border-none rounded-lg overflow-hidden">
            <CardHeader className="bg-background border-b border-border flex flex-row items-center justify-between p-10">
               <div className="space-y-1">
                  <CardTitle className="text-2xl font-black uppercase tracking-tighter">{editingOutlet ? 'Modify Node' : 'Initialize New Node'}</CardTitle>
                  <CardDescription className="uppercase font-black tracking-[0.2em] text-[10px] text-amber-500">Outlet Infrastructure Setup</CardDescription>
               </div>
               <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background" onClick={() => setShowModal(false)}><X size={20} /></Button>
            </CardHeader>
            <form onSubmit={handleSubmit}>
               <CardContent className="p-10 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 ml-1">Node Identification Name</label>
                     <Input 
                       required
                       className="h-14 bg-background border-border rounded-lg font-bold px-6 focus:ring-amber-500"
                       value={formData.name}
                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                       placeholder="e.g. BrewMaster - Central Sudirman"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 ml-1">Physical Coordinates (Address)</label>
                     <textarea 
                       rows="3"
                       className="w-full bg-background border border-border rounded-lg p-6 font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                       value={formData.address}
                       onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                       placeholder="Complete building, floor, and city details..."
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 ml-1">Secure Contact Line</label>
                     <Input 
                       className="h-14 bg-background border-border rounded-lg font-black font-mono tabular-nums px-6"
                       value={formData.phone}
                       onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                       placeholder="+62 812 XXXX"
                     />
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border">
                     <input 
                       type="checkbox" id="is_active"
                       className="w-6 h-6 rounded-lg border-border text-amber-500 focus:ring-amber-500 transition-all cursor-pointer"
                       checked={formData.is_active}
                       onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                     />
                     <label htmlFor="is_active" className="text-xs font-black uppercase tracking-widest text-foreground cursor-pointer">Operational Readiness Active</label>
                  </div>
               </CardContent>
               <CardFooter className="bg-background p-8 border-t border-border flex gap-4">
                  <Button type="button" variant="ghost" className="flex-1 h-14 font-black uppercase tracking-widest text-[10px] rounded-lg" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" className="flex-1 h-14 font-black uppercase tracking-[0.2em] text-[10px] rounded-lg">
                     {editingOutlet ? 'UPDATE INFRASTRUCTURE' : 'INITIALIZE NODE'}
                  </Button>
               </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OutletPage;
