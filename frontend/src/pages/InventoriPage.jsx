import React from 'react';
import { formatRupiah } from '../utils/formatters';
import { useInventori } from '../hooks/useInventori';
import InventoryFormModal from '../components/InventoryFormModal';
import { 
  Package, Search, Filter, Plus, 
  MapPin, Settings, RefreshCw, 
  Trash2, Edit3, MoreHorizontal,
  ChevronRight, AlertTriangle, CheckCircle2,
  PackageOpen, Warehouse, Archive, Box,
  ArrowRightLeft, MoreVertical, 
  ArrowUpRight, ArrowDownRight, Scale,
  History, ClipboardCheck, X, Save,
  Sparkles, Zap, BrainCircuit, Timer,
  TrendingUp, Truck, FileText, ShoppingCart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";

// ... (Helper functions getConversion, getMediumUnit, getMediumQty tetap sama)
function getConversion(bahan) {
  if (!bahan) return { ratio: 1, unit: 'Unit' };
  const u = (bahan.unit || '').toLowerCase();
  const name = (bahan.name || '').toLowerCase();
  if (u === 'kg' || u === 'kilogram' || name.includes('kopi') || name.includes('bubuk')) return { ratio: u === 'kg' ? 1000 : 1, unit: 'Gram' };
  if (u === 'liter' || u === 'l' || name.includes('susu') || name.includes('sirup') || name.includes('cair')) return { ratio: u === 'liter' ? 1000 : 1, unit: 'ml' };
  if (u === 'dus' || u === 'karton' || u === 'pack') return { ratio: 1, unit: 'Pcs/Gram' };
  return { ratio: 1, unit: bahan.unit || 'Pcs' };
}
function getMediumUnit(item) {
  const name = (item.name || '').toLowerCase();
  const unit = (item.unit || '').toUpperCase();
  if (unit === 'DUS' || unit === 'KARTON' || unit === 'PACK') {
    if (name.includes('kopi') || name.includes('gula') || name.includes('bubuk')) return 'KG';
    if (name.includes('susu') || name.includes('oat') || name.includes('sirup')) return 'LITER';
    if (name.includes('cup') || name.includes('sedotan')) return 'PACK';
    if (name.includes('air') || name.includes('mineral')) return 'BOTOL';
  }
  if (unit === 'GRAM' && item.stock >= 1000) return 'KG';
  if (unit === 'ML' && item.stock >= 1000) return 'LITER';
  return item.unit;
}
function getMediumQty(item) {
  const mUnit = getMediumUnit(item);
  const unit = (item.unit || '').toUpperCase();
  if (unit === 'GRAM' && mUnit === 'KG') return item.stock / 1000;
  if (unit === 'ML' && mUnit === 'LITER') return item.stock / 1000;
  if ((unit === 'DUS' || unit === 'KARTON') && (mUnit === 'KG' || mUnit === 'LITER')) return item.stock * 12; 
  return item.stock;
}

const TagInput = ({ label, tags, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); const val = inputValue.trim(); if (val && !tags.includes(val)) onChange([...tags, val]); setInputValue(''); } };
  return (
    <div className="space-y-3 p-4 bg-background rounded-lg border font-mono tabular-nums">
      <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">{label}</label>
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-background rounded-lg border border-dashed">
        {tags.length === 0 && <span className="text-[10px] text-zinc-500 dark:text-zinc-100 italic p-2">Belum ada data</span>}
        {tags.map((tag, index) => (
          <span key={index} className="px-4 py-1 active-state text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-2 border border-primary/20 shadow-sm">
            {tag} <button onClick={() => onChange(tags.filter((_, i) => i !== index))} className="hover:text-destructive"><X size={12} /></button>
          </span>
        ))}
      </div>
      <Input className="h-10 text-xs border-none bg-background shadow-inner" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ketik & Enter..." />
    </div>
  );
};

export default function InventoriPage() {
  const {
    user,
    search, setSearch,
    showModal, setShowModal,
    editItem, setEditItem,
    saving,
    bahan,
    locations,
    isOpnameMode, setIsOpnameMode,
    opnameData, setOpnameData,
    showSettingsModal, setShowSettingsModal,
    inventoryMeta,
    showAdjModal, setShowAdjModal,
    adjItem, setAdjItem,
    adjForm, setAdjForm,
    aiPredictions,
    openEdit,
    handleSave,
    handleAdjustment,
    handleOpnameSave,
    filtered
  } = useInventori();

  const getStockStatus = (item) => {
    const ratio = item.stock / (item.minStock || item.min_stock || 1);
    if (item.stock === 0) {
      return { 
        label: 'HABIS', 
        color: 'text-rose-700 dark:text-rose-400', 
        bg: 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80', 
        barCls: 'bg-rose-500', 
        pct: 0 
      };
    }
    if (ratio < 1) {
      return { 
        label: 'LOW', 
        color: 'text-amber-700 dark:text-amber-400', 
        bg: 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80', 
        barCls: 'bg-amber-500', 
        pct: Math.min((ratio * 100), 100) 
      };
    }
    return { 
      label: 'AMAN', 
      color: 'text-emerald-700 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80', 
      barCls: 'bg-emerald-500', 
      pct: Math.min((ratio / 2 * 100), 100) 
    };
  };

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-700">
      {/* 👑 Header Section (Preserved Original Color & Structure) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
               <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Inventory Node</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">Real-time Stock Ingestion</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Inventory <span className="text-amber-500 italic">Orchestrator</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">Global stock visibility, neural forecasting, and automated supply chain management.</p>
        </div>
        <div className="flex gap-4">
            <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
                <Settings size={18} className="mr-2 text-amber-500" /> Master Config
            </Button>
            <Button variant="default" onClick={() => { setEditItem(null); setShowModal(true); }}>
                <Plus size={18} className="mr-2" /> Add New Material
            </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
         <div className="xl:col-span-8 space-y-8">
            {/* AI Predictions Hub (Luxury Glass Gradient Card - Upgraded Contrast) */}
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-card text-card-foreground rounded-lg shadow-lg overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                  <BrainCircuit size={160} />
               </div>
               <CardHeader className="p-6 pb-0 relative z-10 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                     <div className="flex items-center gap-4">
                        <Sparkles className="text-amber-500 animate-pulse" size={20} />
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">
                          Neural Stock <span className="text-amber-500 italic">Forecaster</span>
                        </CardTitle>
                     </div>
                     <CardDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-400">
                       Predictive analysis based on consumption trends
                     </CardDescription>
                  </div>
                   <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-400/20 text-amber-600 dark:text-amber-400 rounded-lg font-bold shadow-sm">
                     <Zap size={12} className="text-amber-500 fill-current animate-pulse" />
                     <span className="text-[9px] font-black uppercase tracking-widest">AI ACTIVE</span>
                  </div>
               </CardHeader>
               <CardContent className="p-6 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {aiPredictions.length === 0 ? (
                     <div className="col-span-3 py-8 text-center text-zinc-500 text-xs font-black uppercase tracking-widest border border-dashed border-border rounded-lg">
                       Need more transaction data for accurate prediction
                     </div>
                  ) : aiPredictions.map((pred, i) => (
                    <div key={i} className="p-4 rounded-md border border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/20 dark:bg-zinc-900/40 hover:-translate-y-0.5 transition-all shadow-sm flex flex-col justify-between min-h-[160px]">
                       <div>
                          <div className="flex justify-between items-start mb-2">
                             <p className="text-xs font-black uppercase tracking-tight text-zinc-800 dark:text-zinc-200 truncate max-w-[80%]">{pred.name}</p>
                             <Timer size={14} className={cn(pred.status === 'Kritis' ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")} />
                          </div>
                          <div className="space-y-0.5">
                             <p className="text-xl font-black font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{pred.daysLeft} DAYS</p>
                             <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Estimated stockout</p>
                          </div>
                       </div>
                       <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-850/50 flex items-center justify-between">
                          <span className={cn(
                            "px-2.5 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest border",
                            pred.status === 'Kritis' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                          )}>{pred.recommendation}</span>
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ArrowUpRight size={14} /></Button>
                       </div>
                    </div>
                  ))}
               </CardContent>
            </Card>

            {/* Main Inventory Table (Luxury Zinc Panel) */}
            <Card className="border border-border bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden">
               <CardHeader className="p-8 border-b border-zinc-200/80 dark:border-zinc-800/50 bg-background">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                     <div className="space-y-1">
                        <CardTitle className="text-2xl font-black tracking-tighter uppercase leading-none text-zinc-900 dark:text-zinc-100">Global Ledger Node</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">Monitor & Adjust Material Availability</CardDescription>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="relative group min-w-[250px]">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-100 group-focus-within:text-amber-500 transition-colors" size={18} />
                           <Input 
                             className="pl-12 h-12 bg-background border-zinc-200 dark:border-zinc-800 rounded-md font-medium focus-visible:ring-amber-500/20" 
                             placeholder="Filter materials..." 
                             value={search} onChange={e => setSearch(e.target.value)}
                           />
                        </div>
                        <Button variant={isOpnameMode ? "destructive" : "outline"} className="h-12 px-6 font-black uppercase tracking-widest text-[9px] rounded-md border-zinc-200 dark:border-zinc-800" onClick={() => setIsOpnameMode(!isOpnameMode)}>
                           {isOpnameMode ? <X size={16} className="mr-2" /> : <ClipboardCheck size={16} className="mr-2 text-amber-500" />}
                           {isOpnameMode ? 'CANCEL OPNAME' : 'STOCK OPNAME'}
                        </Button>
                     </div>
                  </div>
               </CardHeader>
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 border-b border-zinc-200/80 dark:border-zinc-800/50">
                           <th className="px-4 py-4">Material Node</th>
                           <th className="px-4 py-4 text-center">Availability</th>
                           <th className="px-4 py-4">Unit Cost</th>
                           <th className="px-4 py-4">Status</th>
                           <th className="px-4 py-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/50">
                        {filtered.map(item => {
                          const st = getStockStatus(item);
                          return (
                            <tr key={item.id} className="hover:bg-background transition-all group">
                               <td className="px-4 py-4">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center shrink-0 text-amber-500 dark:text-amber-400 shadow-inner">
                                        <Package size={18} />
                                     </div>
                                     <div>
                                        <p className="text-sm font-black tracking-tight uppercase text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500 transition-colors">{item.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                           <Truck size={10} className="text-zinc-500 dark:text-zinc-100" />
                                           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">{item.supplier?.name || 'No Supplier'}</span>
                                        </div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-4 py-4">
                                  <div className="flex flex-col items-center gap-1.5">
                                     <p className="text-base font-black font-mono tabular-nums leading-none text-zinc-900 dark:text-zinc-100">
                                       {getMediumQty(item).toLocaleString('id-ID')} <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">{getMediumUnit(item)}</span>
                                     </p>
                                     <div className="h-1.5 w-24 bg-background border border-zinc-250 dark:border-zinc-800 rounded-full overflow-hidden">
                                        <div className={cn("h-full transition-all duration-1000", st.barCls)} style={{ width: `${st.pct}%` }} />
                                     </div>
                                  </div>
                               </td>
                               <td className="px-4 py-4 text-sm font-black font-mono tabular-nums text-zinc-800 dark:text-zinc-200">{formatRupiah(item.cost || 0)}</td>
                               <td className="px-4 py-4">
                                  <span className={cn(
                                    "px-3 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest shadow-sm border",
                                    st.bg, st.color
                                  )}>
                                     {st.label}
                                  </span>
                                </td>
                               <td className="px-4 py-4 text-right">
                                  {isOpnameMode ? (
                                    <Input 
                                      type="number" 
                                      className="w-24 h-10 bg-background border-amber-500/50 rounded-md text-center font-black font-mono tabular-nums focus:ring-amber-500 focus:border-amber-500"
                                      placeholder={item.stock}
                                      value={opnameData[item.id] ?? ''}
                                      onChange={e => setOpnameData({...opnameData, [item.id]: e.target.value})}
                                    />
                                  ) : (
                                    <div className="flex justify-end gap-2">
                                       <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md border border-zinc-200 dark:border-zinc-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-500 text-zinc-500 dark:text-zinc-400" onClick={() => { setAdjItem(item); setShowAdjModal(true); }}><Scale size={16} /></Button>
                                       <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md border border-zinc-200 dark:border-zinc-800/80 hover:bg-background text-zinc-500" onClick={() => openEdit(item)}><Edit3 size={16} /></Button>
                                    </div>
                                  )}
                                </td>
                             </tr>
                           );
                         })}
                      </tbody>
                   </table>
                </div>
             </Card>
          </div>

          {/* Right Sidebar Activity */}
          <div className="xl:col-span-4 space-y-8 sticky top-24">
             <Card className="border border-border bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden">
                <CardHeader className="p-8 border-b border-zinc-200/80 dark:border-zinc-800/50 bg-background">
                   <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center shrink-0 text-amber-500 dark:text-amber-400 shadow-inner">
                          <History size={18} />
                       </div>
                      <div>
                         <CardTitle className="text-lg font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">Stock Ledger</CardTitle>
                         <CardDescription className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">Recent Movement History</CardDescription>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-8">
                   <div className="space-y-8">
                      {[
                        { label: 'Stock Adjustment', sub: 'Waste Monitoring', val: '-500g', time: '12m ago', icon: Scale, color: 'text-rose-600 dark:text-rose-400' },
                        { label: 'Procurement In', sub: 'Supplier Log', val: '+25kg', time: '1h ago', icon: Truck, color: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'System Sync', sub: 'Auto Balance', val: '12L', time: '3h ago', icon: RefreshCw, color: 'text-amber-600 dark:text-amber-400' },
                      ].map((l, i) => (
                         <div key={i} className="flex gap-4 group relative">
                            <div className="w-10 h-10 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center shrink-0 text-amber-500 dark:text-amber-400 shadow-inner">
                               <l.icon size={18} />
                            </div>
                           <div className="flex-1 pt-1">
                              <div className="flex justify-between items-start">
                                 <p className="text-sm font-black uppercase tracking-tight leading-none text-zinc-800 dark:text-zinc-200">{l.label}</p>
                                 <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100">{l.time}</span>
                              </div>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-100 mt-1 font-medium italic">{l.sub}</p>
                              <p className={cn("text-xs font-black font-mono tabular-nums mt-1", l.color)}>{l.val}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>

             {/* Dynamic Luxury Obsidian Pearl Card (Smart Suggestion) */}
             <div className="p-8 bg-card text-card-foreground border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg relative group/promo active:scale-[0.98]">
                {/* Glowing neon backdrop blob */}
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-500/10 dark:bg-amber-400/10 rounded-lg blur-3xl group-hover/promo:scale-150 transition-all duration-1000" />
                
                <div className="absolute top-0 right-0 p-8 text-zinc-700/30 dark:text-zinc-600/20  group-hover/promo:rotate-12 transition-transform duration-500">
                   <ShoppingCart size={120} />
                </div>
                
                <div className="relative z-10 space-y-4">
                   <div className="inline-flex items-center gap-2 px-4 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-400/20 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                     <Sparkles size={10} className="text-amber-500" /> Smart Suggestion
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-2xl font-black uppercase tracking-tighter leading-none text-zinc-900 dark:text-zinc-100">
                        Automated <span className="text-amber-500 italic">Procurement</span>
                      </h4>
                      <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed uppercase tracking-wider">
                        Berdasarkan tren penjualan terakhir, sistem menyarankan pengadaan bahan baku segera untuk menjaga stok aman.
                      </p>
                   </div>
                </div>
                
                <Button variant="default" className="w-full h-14 mt-6 font-black uppercase tracking-widest">
                    GENERATE PURCHASE ORDER
                 </Button>
             </div>
          </div>
       </div>

       <InventoryFormModal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} onSave={handleSave} initialData={editItem} locations={locations} inventoryMeta={inventoryMeta} isSaving={saving} />

       {/* Adjustment Modal */}
       {showAdjModal && adjItem && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 ">
            <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 border border-border rounded-lg bg-card text-card-foreground overflow-hidden">
               <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/50 p-8 bg-[#fafaf9]/85/85 dark:bg-zinc-800/85">
                  <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-4 text-zinc-900 dark:text-zinc-100">
                     <Scale className="text-amber-500" /> Stock Adjustment
                  </CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">{adjItem.name}</CardDescription>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Type</label>
                     <select className="w-full h-12 bg-background border border-border rounded-md px-4 text-xs font-black text-foreground outline-none appearance-none cursor-pointer focus:ring-1 ring-amber-500/30" value={adjForm.type} onChange={e => setAdjForm({...adjForm, type: e.target.value})}>
                        <option>Penambahan</option>
                        <option>Pengurangan</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Reason</label>
                     <Input className="h-12 bg-background border-border text-sm font-black rounded-md focus:ring-amber-500 shadow-inner text-foreground" value={adjForm.reason} onChange={e => setAdjForm({...adjForm, reason: e.target.value})} placeholder="e.g. Expired, Spilled..." />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quantity ({adjItem.unit})</label>
                     <Input type="number" className="h-12 bg-background border-border text-sm font-black rounded-md focus:ring-amber-500 shadow-inner text-foreground font-mono tabular-nums" value={adjForm.qty} onChange={e => setAdjForm({...adjForm, qty: e.target.value})} />
                  </div>
               </CardContent>
               <CardFooter className="p-8 pt-0 gap-4">
                  <Button variant="ghost" className="flex-1 h-12 font-black uppercase tracking-widest text-[9px]" onClick={() => setShowAdjModal(false)}>Cancel</Button>
                  <Button 
                    className="flex-1 h-12 font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 shadow-lg shadow-amber-500/20 dark:shadow-amber-400/10 active:scale-[0.98] transition-all rounded-md" 
                    onClick={handleAdjustment} 
                    disabled={saving}
                  >
                     {saving ? 'Processing...' : 'Save Adjust'}
                  </Button>
               </CardFooter>
            </Card>
         </div>
       )}

       {/* Floating Opname Save */}
       {isOpnameMode && Object.keys(opnameData).length > 0 && (
         <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10">
            <Button 
              className="h-16 px-12 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 dark:text-zinc-100 dark:bg-emerald-400 dark:text-zinc-900 dark:hover:bg-emerald-500 rounded-md shadow-2xl shadow-emerald-500/30 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-4 transition-all active:scale-95" 
              onClick={handleOpnameSave} 
              disabled={saving}
            >
               {saving ? <RefreshCw className="animate-spin" /> : <Save />}
               {saving ? 'SYNCING DATA...' : 'SAVE STOCK OPNAME'}
            </Button>
         </div>
       )}

       {/* ⚙️ Master Config Overview Modal */}
       {showSettingsModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 ">
             <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 border border-border rounded-lg bg-card text-card-foreground overflow-hidden">
                <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/50 p-8 bg-[#fafaf9]/85/85 dark:bg-zinc-800/85">
                  <div className="flex items-center gap-4">
                     <Settings className="text-amber-500 animate-spin-slow" size={24} />
                     <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">
                           Master Configuration
                        </CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">
                           Metadata schema, active categories, and unit registers.
                        </CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                  {/* Category Node List */}
                  <div className="space-y-4">
                     <h5 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Package size={14} className="text-amber-500" /> Active Categories
                     </h5>
                     <div className="grid grid-cols-2 gap-4 max-h-[160px] overflow-y-auto pr-2">
                        {inventoryMeta.categories && inventoryMeta.categories.length > 0 ? (
                           inventoryMeta.categories.map((cat, idx) => {
                              const count = bahan.filter(item => item.category?.trim().toUpperCase() === cat).length;
                              return (
                                 <div key={idx} className="p-4 bg-[#f5f5f3] dark:bg-zinc-800">
                                    <span className="text-xs font-bold uppercase text-zinc-800 dark:text-zinc-200">{cat}</span>
                                    <span className="text-[10px] font-mono tabular-nums font-black px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                       {count} {count === 1 ? 'Item' : 'Items'}
                                    </span>
                                 </div>
                              );
                           })
                        ) : (
                           <div className="col-span-2 text-center py-6 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                              No categories found
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Unit Node List */}
                  <div className="space-y-4">
                     <h5 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Scale size={14} className="text-amber-500" /> Active Units
                     </h5>
                     <div className="grid grid-cols-2 gap-4 max-h-[160px] overflow-y-auto pr-2">
                        {inventoryMeta.units && inventoryMeta.units.length > 0 ? (
                           inventoryMeta.units.map((unit, idx) => {
                              const count = bahan.filter(item => item.unit?.trim().toUpperCase() === unit).length;
                              return (
                                 <div key={idx} className="p-4 bg-[#f5f5f3] dark:bg-zinc-800">
                                    <span className="text-xs font-bold uppercase text-zinc-800 dark:text-zinc-200">{unit}</span>
                                    <span className="text-[10px] font-mono tabular-nums font-black px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                       {count} {count === 1 ? 'Item' : 'Items'}
                                    </span>
                                 </div>
                              );
                           })
                        ) : (
                           <div className="col-span-2 text-center py-6 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                              No units found
                           </div>
                        )}
                     </div>
                  </div>
               </CardContent>
               <CardFooter className="p-8 pt-0">
                  <Button variant="ghost" className="w-full h-12 font-black uppercase tracking-widest text-[9px]" onClick={() => setShowSettingsModal(false)}>
                     Close Configuration
                  </Button>
               </CardFooter>
             </Card>
          </div>
        )}

      </div>
   );
}
