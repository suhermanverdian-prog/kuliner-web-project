import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, Plus, MapPin, Phone, Edit2, Trash2, 
  ArrowRight, Globe, CheckCircle2, XCircle, 
  TrendingUp, Activity, LayoutGrid, Search,
  Filter, MoreHorizontal, Settings, Info,
  Map, Server, ShieldCheck, RefreshCw, X, Warehouse
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "@/lib/utils";
import { useOutletPage } from '../hooks/useOutletPage';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api';

const OutletPage = () => {
  const user = useAppStore(state => state.user);
  const isSuperAdmin = user?.role === 'super_admin';
  const navigate = useNavigate();
  
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

  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [selectedOutletForWarehouse, setSelectedOutletForWarehouse] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [warehouseSaving, setWarehouseSaving] = useState(false);

  const openWarehouseModal = async (outlet) => {
    setSelectedOutletForWarehouse(outlet);
    setWarehouseModalOpen(true);
    setWarehousesLoading(true);
    try {
      const res = await api.getWarehouses();
      setWarehouses(res.filter(w => w.outlet_id === outlet.id));
    } catch (e) {
      console.error(e);
    } finally {
      setWarehousesLoading(false);
    }
  };

  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    if (!newWarehouseName.trim()) return;
    setWarehouseSaving(true);
    try {
      await api.addWarehouse({
        outletId: selectedOutletForWarehouse.id,
        name: newWarehouseName.trim()
      });
      const res = await api.getWarehouses();
      setWarehouses(res.filter(w => w.outlet_id === selectedOutletForWarehouse.id));
      setNewWarehouseName('');
    } catch (e) {
      alert("Gagal menambahkan gudang: " + e.message);
    } finally {
      setWarehouseSaving(false);
    }
  };

  if (loading && outlets.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-mono tabular-nums">
      <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse text-zinc-850 dark:text-zinc-100">Syncing Global Outlet Nodes...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-8 pt-2 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-4">
              <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-500 text-[10px] font-black uppercase tracking-wider rounded-sm border border-amber-500/20">Multi-Outlet Master</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">All Nodes Synced</span>
              </div>
           </div>
           <h1 className="text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">Outlet <span className="text-amber-500 italic">Orchestrator</span></h1>
           <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl">Central command for managing physical locations, POS connectivity, and regional performance monitoring.</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" size="sm" onClick={() => navigate('/settings')} className="font-bold uppercase tracking-widest rounded-md">
              <Map size={18} className="mr-2" /> View Map Hub
           </Button>
           {isSuperAdmin && (
             <Button variant="primary" size="sm"
               onClick={() => { setEditingOutlet(null); setFormData({ name: '', address: '', phone: '', is_active: true }); setShowModal(true); }}
               className="font-bold uppercase tracking-widest rounded-md animate-none"
             >
               <Plus size={18} className="mr-2" /> Add New Node
             </Button>
           )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Total Nodes', val: outlets.length, sub: 'Global Locations', icon: Store, color: 'text-foreground', bg: 'bg-background' },
           { label: 'Operational', val: outlets.filter(o => o.is_active).length, sub: 'Active & Online', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
           { label: 'Network Mode', val: 'Enterprise', sub: 'Infinite Scalability', icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
         ].map((s, i) => (
           <Card key={i} className="group border border-zinc-200 dark:border-zinc-800 bg-card shadow-sm hover:shadow-md transition-all rounded-lg overflow-hidden">
             <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{s.label}</p>
                   <p className={cn("text-3xl font-black font-mono tabular-nums", s.color)}>{s.val}</p>
                   <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">{s.sub}</p>
                </div>
                <div className={cn("w-16 h-16 rounded-md flex items-center justify-center border border-border group-hover:scale-110 transition-transform", s.bg)}>
                   <s.icon size={28} className={cn(s.color)} />
                </div>
             </CardContent>
           </Card>
         ))}
      </div>

      {/* Main Control Panel */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-card shadow-xl rounded-lg overflow-hidden">
         <CardHeader className="p-6 border-b border-border bg-background">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="space-y-1">
                  <CardTitle className="text-2xl font-semibold tracking-tighter uppercase leading-none text-zinc-800 dark:text-zinc-100">Outlet Connectivity Hub</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Monitor & Configure Physical Edge Nodes</CardDescription>
               </div>
               <div className="relative group min-w-[350px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                  <Input 
                    className="pl-12 h-10 bg-background/50 border-border rounded-md font-medium" 
                    placeholder="Search by location name or ID..." 
                    value={search} onChange={e => setSearch(e.target.value)}
                  />
               </div>
            </div>
         </CardHeader>
         <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filtered.map(outlet => (
                <Card key={outlet.id} className="border border-zinc-200 dark:border-zinc-800 bg-background hover:bg-background transition-all rounded-lg overflow-hidden group/item">
                  <CardContent className="p-6 space-y-8">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-card rounded-md flex items-center justify-center text-zinc-500 border border-border group-hover/item:text-amber-500 transition-colors">
                          <Store size={28} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold tracking-tighter uppercase leading-none text-zinc-800 dark:text-zinc-100 group-hover/item:text-amber-500 transition-colors">{outlet.name}</h3>
                          <div className={cn(
                            "inline-flex items-center gap-2 mt-2 px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border",
                            outlet.is_active ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800"
                          )}>
                             <div className={cn("w-1.5 h-1.5 rounded-sm", outlet.is_active ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                             {outlet.is_active ? 'Online' : 'Offline'}
                          </div>
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="xs" onClick={() => handleEdit(outlet)} className="h-10 w-10 p-0 rounded-md hover:bg-amber-500/10 hover:text-amber-500 transition-colors">
                            <Edit2 size={18} />
                          </Button>
                          <Button variant="ghost" size="xs" onClick={() => handleDelete(outlet.id)} className="h-10 w-10 p-0 rounded-md hover:bg-rose-50 dark:bg-rose-950/30 hover:text-rose-600 dark:text-rose-400 transition-colors">
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-4">
                          <div className="flex items-start gap-4">
                             <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                             <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed uppercase tracking-tight">{outlet.address || 'No Address Data'}</p>
                          </div>
                          <div className="flex items-center gap-4">
                             <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                             <p className="text-xs font-black font-mono tabular-nums text-zinc-800 dark:text-zinc-100">{outlet.phone || 'N/A'}</p>
                          </div>
                       </div>
                       <div className="p-6 bg-card rounded-md border border-border flex flex-col justify-center items-center text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">POS Health</p>
                          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">100%</p>
                       </div>
                    </div>

                     <div className="flex gap-2 pt-4">
                       <Button variant="outline" size="sm" onClick={() => navigate('/revenue-intel')} className="flex-1 bg-card border-border text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-background group/btn">
                         <TrendingUp size={14} className="mr-2 group-hover/btn:scale-110 transition-transform" /> ANALYTICS
                       </Button>
                       <Button variant="outline" size="sm" className="flex-1 bg-card border-border text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-background group/btn" onClick={() => openWarehouseModal(outlet)}>
                         <Warehouse size={14} className="mr-2 group-hover/btn:scale-110 transition-transform" /> GUDANG
                       </Button>
                       <Button variant="primary" size="sm" onClick={() => navigate('/kasir')} className="flex-1 text-[10px] font-bold uppercase tracking-wider rounded-md group/btn">
                         <Globe size={14} className="mr-2 group-hover/btn:rotate-12 transition-transform" /> POS <ArrowRight size={10} className="ml-1" />
                       </Button>
                     </div>
                  </CardContent>
                </Card>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-32 text-center space-y-6">
                   <Server size={80} className="mx-auto text-zinc-500 dark:text-zinc-400" strokeWidth={1} />
                   <div className="space-y-2">
                      <p className="text-sm font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400">No Outlet Node Detected</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Try adjusting your search filter or add a new node.</p>
                   </div>
                </div>
              )}
            </div>
         </div>
         <CardFooter className="p-6 border-t border-border bg-background justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400 animate-pulse">Scanning Global Multi-Outlet Network Configuration...</p>
         </CardFooter>
      </Card>

      {/* Feature Promo: Centralized Procurement */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-background shadow-2xl rounded-lg overflow-hidden relative group">
         <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-20 group-hover:opacity-50 transition-opacity duration-1000" />
         <CardContent className="p-8 flex flex-col md:flex-row items-center gap-16 relative z-10">
            <div className="w-24 h-24 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-lg">
               <LayoutGrid size={48} />
            </div>
            <div className="flex-1 space-y-4">
               <h3 className="text-3xl font-semibold tracking-tighter uppercase leading-none text-zinc-800 dark:text-zinc-100">Centralized <span className="text-amber-500">Procurement</span> Hub</h3>
               <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium leading-relaxed max-w-3xl">
                  Kelola pengadaan bahan baku untuk seluruh cabang dari satu pintu. Hemat biaya operasional hingga <span className="text-amber-500 font-black">15%</span> dengan pembelian massal terpusat dan logistik terintegrasi.
               </p>
            </div>
            <Button size="sm" onClick={() => navigate('/procurement')} className="px-6 bg-zinc-100 dark:bg-zinc-855 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-750 rounded-md">ENABLE HUB</Button>
         </CardContent>
      </Card>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl bg-card border border-border rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
            <CardHeader className="bg-background border-b border-border flex flex-row items-center justify-between p-5">
               <div className="space-y-0.5">
                  <CardTitle className="text-xl font-semibold uppercase tracking-tighter text-zinc-850 dark:text-zinc-100">{editingOutlet ? 'Modify Node' : 'Initialize New Node'}</CardTitle>
                  <CardDescription className="uppercase font-black tracking-[0.2em] text-[9px] text-amber-500">Outlet Infrastructure Setup</CardDescription>
               </div>
               <Button variant="ghost" size="xs" className="h-8 w-8 p-0 rounded-md hover:bg-background" onClick={() => setShowModal(false)}><X size={18} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" /></Button>
            </CardHeader>
            <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar flex-1">
               <CardContent className="p-5 space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Node Identification Name</label>
                     <Input 
                       required
                       className="h-10 bg-background border-border rounded-md font-bold px-4 focus:ring-amber-500 text-sm"
                       value={formData.name}
                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                       placeholder="e.g. BrewMaster - Central Sudirman"
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Physical Coordinates (Address)</label>
                     <textarea 
                       rows="3"
                       className="w-full bg-background border border-border rounded-md p-4 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all text-foreground"
                       value={formData.address}
                       onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                       placeholder="Complete building, floor, and city details..."
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Secure Contact Line</label>
                     <Input 
                       className="h-10 bg-background border-border rounded-md font-black font-mono tabular-nums px-4 text-sm"
                       value={formData.phone}
                       onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                       placeholder="+62 812 XXXX"
                     />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-background rounded-md border border-border">
                     <input 
                       type="checkbox" id="is_active"
                       className="w-5 h-5 rounded-sm border-border text-amber-500 focus:ring-amber-500 transition-all cursor-pointer"
                       checked={formData.is_active}
                       onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                     <label htmlFor="is_active" className="text-[10px] font-black uppercase tracking-widest text-foreground cursor-pointer">Operational Readiness Active</label>
                  </div>
               </CardContent>
               <CardFooter className="bg-background p-4 border-t border-border flex gap-3">
                  <Button type="button" variant="ghost" className="flex-1 h-10 font-black uppercase tracking-widest text-[9px] rounded-md" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" className="flex-1 h-10 font-black uppercase tracking-[0.2em] text-[9px] rounded-md">
                     {editingOutlet ? 'UPDATE INFRASTRUCTURE' : 'INITIALIZE NODE'}
                  </Button>
               </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Warehouse Modal */}
      {warehouseModalOpen && selectedOutletForWarehouse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl bg-card border border-border rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
            <CardHeader className="bg-background border-b border-border flex flex-row items-center justify-between p-5">
              <div className="space-y-0.5">
                <CardTitle className="text-xl font-semibold uppercase tracking-tighter text-zinc-855 dark:text-zinc-100">Kelola Gudang</CardTitle>
                <CardDescription className="uppercase font-black tracking-[0.2em] text-[9px] text-amber-500">
                  {selectedOutletForWarehouse.name}
                </CardDescription>
              </div>
              <Button variant="ghost" size="xs" className="h-8 w-8 p-0 rounded-md hover:bg-background" onClick={() => setWarehouseModalOpen(false)}>
                <X size={18} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" />
              </Button>
            </CardHeader>

            <CardContent className="p-5 flex-1 overflow-y-auto space-y-4">
              {warehousesLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Syncing Warehouses...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Daftar Gudang Aktif</p>
                  <div className="space-y-2">
                    {warehouses.map((wh) => (
                      <div key={wh.id} className="flex items-center justify-between p-4 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/10">
                        <div className="flex items-center gap-3">
                          <Warehouse size={16} className="text-amber-500 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">{wh.name}</p>
                            {wh.is_main ? (
                              <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-sm px-1 py-0.5 uppercase tracking-wide mt-1 inline-block">Gudang Utama</span>
                            ) : (
                              <span className="text-[8px] font-black text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-sm px-1 py-0.5 uppercase tracking-wide mt-1 inline-block">Gudang Cabang</span>
                            )}
                          </div>
                        </div>
                        {!wh.is_main && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                            onClick={async () => {
                              if (window.confirm(`Apakah Anda yakin ingin menghapus gudang "${wh.name}"?`)) {
                                try {
                                  await api.deleteWarehouse(wh.id);
                                  // Refresh gudang
                                  const res = await api.getWarehouses();
                                  setWarehouses(res.filter(w => w.outlet_id === selectedOutletForWarehouse.id));
                                } catch (err) {
                                  alert(err.message);
                                }
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    ))}
                    {warehouses.length === 0 && (
                      <p className="text-xs text-zinc-400 italic text-center py-4">Belum ada gudang terdaftar</p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleAddWarehouse} className="pt-4 border-t border-border space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tambah Gudang Baru</p>
                <div className="flex gap-2">
                  <Input
                    required
                    className="h-10 text-xs font-bold animate-none"
                    placeholder="Nama gudang (misal: Dapur, Bar)"
                    value={newWarehouseName}
                    onChange={(e) => setNewWarehouseName(e.target.value)}
                  />
                  <Button type="submit" variant="primary" className="h-10 text-[10px] font-black uppercase whitespace-nowrap px-4" disabled={warehouseSaving}>
                    {warehouseSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Tambah"}
                  </Button>
                </div>
              </form>
            </CardContent>

            <CardFooter className="bg-background p-4 border-t border-border">
              <Button type="button" variant="ghost" className="w-full h-10 font-black uppercase tracking-widest text-[9px] rounded-md" onClick={() => setWarehouseModalOpen(false)}>
                Selesai
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OutletPage;
