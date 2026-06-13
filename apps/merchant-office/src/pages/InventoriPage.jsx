import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
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
  TrendingUp, Truck, FileText, ShoppingCart,
  Layers, FlaskConical, Leaf, ChevronDown
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

// Relative time helper
function timeAgo(dateStr) {
  if (!dateStr) return '-';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const LOG_TYPE_CONFIG = {
  Sales:        { icon: ShoppingCart,    color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',           label: 'Penjualan'    },
  Restock_Void: { icon: RefreshCw,       color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', label: 'Void Restock' },
  Adjustment:   { icon: Scale,           color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',         label: 'Adjustment'   },
  Penambahan:   { icon: ArrowUpRight,    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', label: 'Penambahan'   },
  Pengurangan:  { icon: ArrowDownRight,  color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',           label: 'Pengurangan'  },
  Waste:        { icon: Trash2,          color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',           label: 'Waste'        },
  Opname:       { icon: ClipboardCheck,  color: 'text-sky-600 dark:text-sky-400',         bg: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800',               label: 'Stock Opname' },
  Procurement:  { icon: Truck,           color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', label: 'Procurement'  },
  Transfer:     { icon: ArrowRightLeft,  color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',       label: 'Transfer'     },
};
const LOG_TYPE_DEFAULT = { icon: History, color: 'text-zinc-500 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700', label: 'Mutasi Stok' };

// ─── Helper: Deteksi tipe material ─────────────────────────────────────────
function getMaterialType(item) {
  const bomCount = Array.isArray(item.bom) ? item.bom.filter(b => b && !b.isSupplierMarker).length : 0;
  const cat = (item.category || '').toUpperCase();
  const isAssembly = bomCount > 0 || cat.includes('ASSEMBLY') || cat.includes('SETENGAH JADI');
  return { isAssembly, bomCount };
}


export default function InventoriPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');
  const [unassignedSupplierId, setUnassignedSupplierId] = useState('');
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
    stockLogs,
    openEdit,
    handleSave,
    handleAdjustment,
    handleOpnameSave,
    handleCreateCategory,
    handleDeleteCategory,
    handleDeleteBahan,
    handleAssemble,
    filtered,
    warehouses,
    selectedWarehouseId,
    setSelectedWarehouseId
  } = useInventori();

  const getDisplayStock = (item) => {
    if (selectedWarehouseId === 'all') {
      return item.stock;
    }
    const whStock = (item.warehouse_stocks || []).find(ws => ws.warehouse_id === selectedWarehouseId);
    return whStock ? whStock.qty : 0;
  };

  const getDisplayMediumQty = (item, displayStock) => {
    const mUnit = getMediumUnit(item);
    const unit = (item.unit || '').toUpperCase();
    if (unit === 'GRAM' && mUnit === 'KG') return displayStock / 1000;
    if (unit === 'ML' && mUnit === 'LITER') return displayStock / 1000;
    if ((unit === 'DUS' || unit === 'KARTON') && (mUnit === 'KG' || mUnit === 'LITER')) return displayStock * 12; 
    return displayStock;
  };

  const getDisplayStockStatus = (item, displayStock) => {
    const ratio = displayStock / (item.minStock || item.min_stock || 1);
    if (displayStock === 0) {
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

  const [showAssemblyModal, setShowAssemblyModal] = useState(false);
  const [selectedAssemblyBahanId, setSelectedAssemblyBahanId] = useState('');
  const [produceQty, setProduceQty] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [showPoHubModal, setShowPoHubModal] = useState(false);
  const [poHubGroups, setPoHubGroups] = useState([]);
  const [poHubLoading, setPoHubLoading] = useState(false);
  const [suppliersList, setSuppliersList] = useState([]);
  const [fallbackMap, setFallbackMap] = useState({});


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
    <div className="space-y-6 pb-8 animate-in fade-in duration-700">
      {/* 👑 Header Section — Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
           <div className="flex flex-wrap items-center gap-2 mb-2">
               <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Inventory Node</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">Real-time Stock Ingestion</span>
              </div>
           </div>
           <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter text-foreground uppercase">Inventory <span className="text-amber-500 italic">Orchestrator</span></h2>
           <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">Global stock visibility, neural forecasting, and automated supply chain management.</p>
        </div>
        {/* Action Buttons — aligned cleanly without uneven wrapping */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end">
             <Button variant="outline" size="sm" className="border-zinc-200 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs text-zinc-700 dark:text-zinc-300 flex-1 sm:flex-none" onClick={() => { setSelectedAssemblyBahanId(''); setProduceQty(''); setShowAssemblyModal(true); }}>
                 <RefreshCw size={14} className="mr-1.5 text-amber-500" /> <span>Assemble</span>
             </Button>
            <Button variant="outline" size="sm" className="border-zinc-200 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs text-zinc-700 dark:text-zinc-300 flex-1 sm:flex-none" onClick={() => setShowSettingsModal(true)}>
                <Settings size={14} className="mr-1.5 text-amber-500" /> <span>Master Config</span>
            </Button>
            <Button size="sm" className="text-xs bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 text-white flex-1 sm:flex-none shadow-md" onClick={() => { setEditItem(null); setShowModal(true); }}>
                <Plus size={14} className="mr-1.5" /> <span>Add New Material</span>
            </Button>
        </div>
      </div>
      
      {/* ── Tabs Navigation ── */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
         <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
               "px-6 py-3 text-xs font-black uppercase tracking-wider transition-all relative",
               activeTab === 'inventory' 
                  ? "text-amber-500 border-b-2 border-amber-500 font-bold" 
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
         >
            Inventori & Stok
         </button>
         <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
               "px-6 py-3 text-xs font-black uppercase tracking-wider transition-all relative flex items-center gap-1.5",
               activeTab === 'analytics' 
                  ? "text-amber-500 border-b-2 border-amber-500 font-bold" 
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
         >
            <BrainCircuit size={14} className={activeTab === 'analytics' ? 'text-amber-500' : 'text-zinc-400'} />
            Analitik & Rekomendasi AI
         </button>
      </div>

      {activeTab === 'inventory' ? (
         <div className="w-full">
            {/* Main Inventory Table — Responsive */}
            <Card className="border border-border bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden">
               <CardHeader className="p-4 sm:p-6 border-b border-zinc-200/80 dark:border-zinc-800/50 bg-background">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div className="space-y-1">
                        <CardTitle className="text-lg sm:text-xl font-black tracking-tighter uppercase leading-none text-zinc-900 dark:text-zinc-100">Global Ledger Node</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Monitor &amp; Adjust Material Availability</CardDescription>
                     </div>
                     <div className="flex flex-wrap items-center gap-2">
                        <div className="relative group flex-1 min-w-[160px] sm:min-w-[200px]">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-amber-500 transition-colors" size={14} />
                           <Input 
                             className="pl-9 h-9 bg-background border-zinc-200 dark:border-zinc-800 rounded-md font-medium text-xs focus-visible:ring-amber-500/20" 
                             placeholder="Filter materials..." 
                             value={search} onChange={e => setSearch(e.target.value)}
                           />
                        </div>
                        <select 
                           value={selectedWarehouseId} 
                           onChange={(e) => setSelectedWarehouseId(e.target.value)}
                           className="h-9 px-3 bg-background border border-zinc-200 dark:border-zinc-800 rounded-md text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/20 shadow-sm"
                        >
                           <option value="all">Semua Gudang (Keseluruhan)</option>
                           {warehouses.map(w => (
                             <option key={w.id} value={w.id}>
                               {w.outlet?.name ? `${w.outlet.name} - ${w.name}` : w.name}
                             </option>
                           ))}
                        </select>
                     </div>
                  </div>

                  {/* Legend — Type Indicator */}
                  <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Tipe:</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <Leaf size={10} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400">Bahan Murni</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                        <FlaskConical size={10} className="text-sky-600 dark:text-sky-400" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400">Assembly / BOM</span>
                    </div>
                  </div>
               </CardHeader>
               
               {/* ── Desktop Table View ── */}
               <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                     <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest">
                           <th className="px-4 py-3">Nama Bahan</th>
                           <th className="px-4 py-3">Kategori</th>
                           <th className="px-4 py-3 text-center">Stok Fisik (Unit)</th>
                           <th className="px-4 py-3 text-center">Status</th>
                           <th className="px-4 py-3 text-right">Unit Cost</th>
                           <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/50">
                        {filtered.map(item => {
                          const displayStock = getDisplayStock(item);
                          const st = getDisplayStockStatus(item, displayStock);
                          const { isAssembly, bomCount } = getMaterialType(item);
                          return (
                            <tr key={item.id} className={cn(
                              "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors font-medium text-zinc-700 dark:text-zinc-300",
                              st.label === 'HABIS' && "bg-rose-50/20 dark:bg-rose-950/5"
                            )}>
                               <td className="px-4 py-3 min-w-[160px]">
                                  <div className="flex items-center gap-3">
                                     <div className="min-w-0">
                                        <p className="font-black text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm tracking-tight truncate">{item.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                           <span className="text-[10px] font-bold text-zinc-400 capitalize tracking-tighter">Min: {item.min_stock || item.minStock || 0} {item.unit}</span>
                                           {isAssembly && (
                                             <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 text-[8px] font-black uppercase tracking-widest rounded-sm">
                                                <Layers size={8} /> BOM ({bomCount})
                                             </span>
                                           )}
                                        </div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[9px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                                     {item.category || 'N/A'}
                                  </span>
                               </td>
                               <td className="px-4 py-3">
                                  <div className="flex flex-col items-center gap-1">
                                     <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-black font-mono tabular-nums leading-none text-zinc-900 dark:text-zinc-100">
                                          {getDisplayMediumQty(item, displayStock).toLocaleString('id-ID')} <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">{getMediumUnit(item)}</span>
                                        </p>
                                        
                                        {item.warehouse_stocks && item.warehouse_stocks.length > 0 && (
                                          <div className="relative group/wh inline-block">
                                            <span className="cursor-pointer text-[10px] text-amber-500 hover:underline flex items-center gap-0.5">
                                              <Warehouse size={10} />
                                            </span>
                                            {/* Tooltip detail per gudang */}
                                            <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-950 text-white text-[10px] p-2.5 rounded-md shadow-2xl border border-zinc-800 pointer-events-none opacity-0 group-hover/wh:opacity-100 transition-opacity">
                                              <p className="font-bold border-b border-zinc-800 pb-1 mb-1 text-zinc-400">Rincian Gudang:</p>
                                              {item.warehouse_stocks.map((ws, idx) => (
                                                <div key={idx} className="flex justify-between items-center py-0.5">
                                                  <span className="truncate max-w-[70%]">{ws.warehouse_name} <span className="text-[8px] text-zinc-500">({ws.outlet_name})</span></span>
                                                  <span className="font-mono font-bold text-amber-400">{ws.qty.toLocaleString('id-ID')} {item.unit}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                     </div>
                                     <div className="w-24 sm:w-28 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className={cn("h-full transition-all", st.barCls)} style={{ width: `${st.pct}%` }} />
                                     </div>
                                  </div>
                               </td>
                               <td className="px-4 py-3 text-center">
                                  <span className={cn(
                                    "px-2.5 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest border shadow-sm",
                                    st.bg,
                                    st.color
                                  )}>
                                     {st.label}
                                  </span>
                               </td>
                               <td className="px-4 py-3 text-right font-mono tabular-nums font-black text-zinc-900 dark:text-zinc-100">
                                  {formatRupiah(item.cost || 0)}
                               </td>
                               <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1.5">
                                       <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md border border-zinc-200 dark:border-zinc-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-500 text-zinc-500 dark:text-zinc-400" onClick={() => { setAdjItem(item); setShowAdjModal(true); }}><Scale size={14} /></Button>
                                       <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md border border-zinc-200 dark:border-zinc-800/80 hover:bg-background text-zinc-500" onClick={() => openEdit(item)}><Edit3 size={14} /></Button>
                                       <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md border border-zinc-200 dark:border-zinc-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 text-zinc-500 dark:text-zinc-400" onClick={() => {
                                          if (confirm(`Apakah Anda yakin ingin menghapus bahan baku "${item.name}"?`)) {
                                            handleDeleteBahan(item.id);
                                          }
                                        }}><Trash2 size={14} /></Button>
                                    </div>
                                </td>
                             </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>

               {/* ── Mobile Card List — only on small screens ── */}
               <div className="block sm:hidden divide-y divide-zinc-200/80 dark:divide-zinc-800/50">
                 {filtered.map(item => {
                   const displayStock = getDisplayStock(item);
                   const st = getDisplayStockStatus(item, displayStock);
                   const { isAssembly, bomCount } = getMaterialType(item);
                   return (
                     <div key={item.id} className={cn(
                       "p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors",
                       st.label === 'HABIS' && "bg-rose-50/10 dark:bg-rose-950/5"
                     )}>
                       <div className="flex items-start justify-between gap-3">
                         {/* Left: Material Name + Details */}
                         <div className="min-w-0 flex-1">
                           <p className="font-black text-zinc-900 dark:text-zinc-100 text-sm tracking-tight truncate">{item.name}</p>
                           <div className="flex flex-wrap items-center gap-1.5 mt-1">
                             <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[8px] font-bold text-zinc-500 uppercase">{item.category || 'N/A'}</span>
                             <span className="text-[10px] font-black text-zinc-400 font-mono tabular-nums leading-none">Min: {item.min_stock || 0} {item.unit}</span>
                             {isAssembly && (
                               <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 text-[8px] font-black rounded-sm">
                                 BOM ({bomCount})
                               </span>
                             )}
                           </div>
                           
                           {/* Qty and Progress Bar */}
                           <div className="flex items-center gap-2 mt-2">
                             <div className="flex items-center gap-1.5">
                               <p className="text-sm font-black font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                                 {getDisplayMediumQty(item, displayStock).toLocaleString('id-ID')} <span className="text-[10px] uppercase text-zinc-400">{getMediumUnit(item)}</span>
                               </p>
                               {item.warehouse_stocks && item.warehouse_stocks.length > 0 && (
                                 <div className="relative group/wh inline-block">
                                   <span className="cursor-pointer text-[10px] text-amber-500 hover:underline">
                                     <Warehouse size={10} />
                                   </span>
                                   <div className="absolute z-20 bottom-full left-0 mb-2 w-44 bg-zinc-950 text-white text-[9px] p-2 rounded-md shadow-2xl border border-zinc-800 pointer-events-none opacity-0 group-hover/wh:opacity-100 transition-opacity">
                                     {item.warehouse_stocks.map((ws, idx) => (
                                       <div key={idx} className="flex justify-between items-center py-0.5">
                                         <span className="truncate max-w-[65%]">{ws.warehouse_name}</span>
                                         <span className="font-mono text-amber-400">{ws.qty} {item.unit}</span>
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               )}
                             </div>
                             <div className="h-1.5 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                               <div className={cn("h-full transition-all", st.barCls)} style={{ width: `${st.pct}%` }} />
                             </div>
                           </div>
                         </div>
                         {/* Right: status + actions */}
                         <div className="flex flex-col items-end gap-2 shrink-0">
                           <span className={cn("px-2 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest border", st.bg, st.color)}>{st.label}</span>
                           <p className="text-xs font-black font-mono tabular-nums text-zinc-600 dark:text-zinc-300">{formatRupiah(item.cost || 0)}</p>
                           <div className="flex gap-1">
                               <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-amber-50 text-zinc-500" onClick={() => { setAdjItem(item); setShowAdjModal(true); }}><Scale size={12} /></Button>
                               <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500" onClick={() => openEdit(item)}><Edit3 size={12} /></Button>
                               <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 hover:text-rose-600 text-zinc-500" onClick={() => {
                                 if (confirm(`Apakah Anda yakin ingin menghapus bahan baku "${item.name}"?`)) {
                                   handleDeleteBahan(item.id);
                                 }
                               }}><Trash2 size={12} /></Button>
                           </div>
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>

               {/* Empty State */}
               {filtered.length === 0 && (
                 <div className="py-16 text-center">
                   <Package size={32} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                   <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Tidak ada material ditemukan</p>
                 </div>
               )}
            </Card>
         </div>
      ) : (
         <div className="space-y-6">
            {/* Stat Summary Bar — Mobile friendly */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Bahan', value: filtered.length, icon: Package, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
                { label: 'Bahan Murni', value: filtered.filter(i => !getMaterialType(i).isAssembly).length, icon: Leaf, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
                { label: 'Assembly / BOM', value: filtered.filter(i => getMaterialType(i).isAssembly).length, icon: FlaskConical, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/20' },
                { label: 'Stok Kritis', value: filtered.filter(i => i.stock <= (i.min_stock || 0)).length, icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-card border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <div className={cn('w-8 h-8 rounded-md flex items-center justify-center shrink-0', stat.bg)}>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest truncate">{stat.label}</p>
                    <p className="text-lg font-black font-mono tabular-nums text-zinc-900 dark:text-zinc-100 leading-none">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
               <div className="xl:col-span-8 space-y-6">
                  {/* AI Predictions Hub */}
                  <Card className="border border-zinc-200 dark:border-zinc-800 bg-card text-card-foreground rounded-lg shadow-lg overflow-hidden relative group">
                     <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <BrainCircuit size={120} />
                     </div>
                     <CardHeader className="p-4 sm:p-6 pb-0 relative z-10 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                           <div className="flex items-center gap-3">
                              <Sparkles className="text-amber-500 animate-pulse" size={16} />
                              <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">
                                Neural Stock <span className="text-amber-500 italic">Forecaster</span>
                              </CardTitle>
                           </div>
                           <CardDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                             Predictive analysis based on consumption trends
                           </CardDescription>
                        </div>
                         <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-400/20 text-amber-600 dark:text-amber-400 rounded-lg font-bold shadow-sm">
                           <Zap size={10} className="text-amber-500 fill-current animate-pulse" />
                           <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">AI ACTIVE</span>
                        </div>
                     </CardHeader>
                     <CardContent className="p-4 sm:p-6 relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {aiPredictions.length === 0 ? (
                           <div className="col-span-3 py-8 text-center text-zinc-500 text-xs font-black uppercase tracking-widest border border-dashed border-border rounded-lg">
                             Need more transaction data for accurate prediction
                           </div>
                        ) : aiPredictions.map((pred, i) => (
                          <div key={i} className="p-4 rounded-md border border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/20 dark:bg-zinc-900/40 hover:-translate-y-0.5 transition-all shadow-sm flex flex-col justify-between min-h-[140px]">
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
                             <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
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

                  {/* Smart Suggestion Card (Automated Procurement) */}
                  <div className="p-6 bg-card text-card-foreground border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg relative group/promo active:scale-[0.98]">
                     <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 dark:bg-amber-400/10 rounded-lg blur-3xl group-hover/promo:scale-150 transition-all duration-1000" />
                     <div className="absolute top-0 right-0 p-6 text-zinc-700/20 dark:text-zinc-600/20 group-hover/promo:rotate-12 transition-transform duration-500">
                        <ShoppingCart size={80} />
                     </div>
                     <div className="relative z-10 space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-400/20 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          <Sparkles size={10} className="text-amber-500" /> Smart Suggestion
                        </div>
                        <div className="space-y-1">
                           <h4 className="text-xl font-black uppercase tracking-tighter leading-none text-zinc-900 dark:text-zinc-100">
                             Automated <span className="text-amber-500 italic">Procurement</span>
                           </h4>
                           <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed uppercase tracking-wider">
                             Berdasarkan tren penjualan terakhir, sistem menyarankan pengadaan bahan baku segera untuk menjaga stok aman.
                           </p>
                        </div>
                     </div>
                     <Button 
                         onClick={async () => {
                           try {
                             setPoHubLoading(true);
                             const suggestions = await api.getReplenishmentPredictions();
                             const criticals = suggestions.filter(s => s.status === 'Kritis' && !s.isOtw && s.suggestedQty > 0);
                             if (criticals.length === 0) {
                               alert("🎉 Semua bahan baku terpantau aman (atau sudah memiliki Purchase Order yang sedang berjalan)!");
                               return;
                             }
                             const sData = await api.getSuppliers();
                             setSuppliersList(sData || []);
                             if (sData && sData.length > 0) {
                               setUnassignedSupplierId(sData[0].id);
                             }
                             const supplierMap = {};
                             (sData || []).forEach(s => { supplierMap[s.id] = s.name; });
                             const groups = {};
                             criticals.forEach(c => {
                               const sId = c.supplier_id || 'unassigned';
                               const sName = supplierMap[sId] || 'Tanpa Supplier / Vendor Lain';
                               if (!groups[sId]) {
                                 groups[sId] = { id: sId, name: sName, items: [] };
                               }
                               groups[sId].items.push(c);
                             });
                             setPoHubGroups(Object.values(groups));
                             setShowPoHubModal(true);
                           } catch (e) {
                             alert("Gagal memproses saran pengadaan AI: " + e.message);
                           } finally {
                             setPoHubLoading(false);
                           }
                         }}
                         disabled={poHubLoading}
                         className="w-full h-12 mt-4 font-black uppercase tracking-widest text-xs bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 text-white active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                           {poHubLoading ? <RefreshCw className="animate-spin" size={14} /> : <BrainCircuit size={14} />}
                           {poHubLoading ? 'MEMPROSES REKOMENDASI...' : 'GENERATE PURCHASE ORDER'}
                      </Button>
                  </div>
               </div>

               <div className="xl:col-span-4 space-y-6">
                  {/* Stock Ledger */}
                  <Card className="border border-border bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden">
                     <CardHeader className="p-6 border-b border-zinc-200/80 dark:border-zinc-800/50 bg-background">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center shrink-0 text-amber-500 dark:text-amber-400">
                               <History size={16} />
                            </div>
                           <div>
                              <CardTitle className="text-base font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">Stock Ledger</CardTitle>
                              <CardDescription className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Recent Movement History</CardDescription>
                           </div>
                        </div>
                     </CardHeader>
                     <CardContent className="p-6">
                        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                           {stockLogs.length === 0 ? (
                             <div className="py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg">
                               <History size={20} className="mx-auto mb-2 text-zinc-400 dark:text-zinc-600" />
                               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Belum ada riwayat mutasi stok</p>
                             </div>
                           ) : stockLogs.map((log, i) => {
                             const cfg = LOG_TYPE_CONFIG[log.type] || LOG_TYPE_DEFAULT;
                             const IconComp = cfg.icon;
                             const isPositive = (log.change_qty || 0) > 0;
                             return (
                               <div key={log.id || i} className="flex gap-3 group relative">
                                 <div className={cn(
                                   "w-9 h-9 rounded-md border flex items-center justify-center shrink-0",
                                   cfg.bg
                                 )}>
                                   <IconComp size={14} className={cfg.color} />
                                 </div>
                                 <div className="flex-1 pt-0.5 min-w-0">
                                   <div className="flex justify-between items-start gap-2">
                                     <div className="min-w-0">
                                       <p className="text-xs font-black uppercase tracking-tight leading-none text-zinc-800 dark:text-zinc-200 truncate">{cfg.label}</p>
                                       <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium truncate">
                                         {log.bahan_name || '-'}
                                         {log.reference_id ? <span className="ml-1 font-mono text-zinc-400">#{log.reference_id}</span> : ''}
                                       </p>
                                     </div>
                                     <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 shrink-0 whitespace-nowrap">{timeAgo(log.created_at)}</span>
                                   </div>
                                   <div className="flex items-center gap-2 mt-1">
                                     <span className={cn(
                                       "text-xs font-black font-mono tabular-nums",
                                       isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                     )}>
                                       {isPositive ? '+' : ''}{Number(log.change_qty || 0).toLocaleString('id-ID')}
                                       {log.unit && <span className="ml-1 text-[10px] font-bold uppercase opacity-70">{log.unit}</span>}
                                     </span>
                                     {log.reason && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic truncate">· {log.reason}</span>}
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                        </div>
                     </CardContent>
                  </Card>
                </div>
             </div>
          </div>
       )}

        <InventoryFormModal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} onSave={handleSave} initialData={editItem} locations={locations} inventoryMeta={inventoryMeta} isSaving={saving} bahanList={bahan} />

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
                     
                     <div className="flex gap-2">
                        <Input 
                           value={newCatName} 
                           onChange={e => setNewCatName(e.target.value)} 
                           placeholder="Nama kategori baru..."
                           className="h-10 text-xs bg-background border-zinc-200 dark:border-zinc-800"
                        />
                        <Button 
                           type="button"
                           className="h-10 text-[10px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 text-white shadow-md active:scale-95"
                           onClick={async () => {
                              if (!newCatName.trim()) return;
                              await handleCreateCategory(newCatName.trim());
                              setNewCatName('');
                           }}
                           disabled={saving}
                        >
                           + Tambah
                        </Button>
                     </div>

                     <div className="grid grid-cols-2 gap-4 max-h-[200px] overflow-y-auto pr-2">
                        {inventoryMeta.categories && inventoryMeta.categories.length > 0 ? (
                           inventoryMeta.categories.map((cat, idx) => {
                              const count = bahan.filter(item => (item.category || '').trim().toUpperCase() === (cat || '').trim().toUpperCase()).length;
                              const rawCats = inventoryMeta.rawCategories || [];
                              const rawCat = rawCats.find(rc => rc.name.trim().toUpperCase() === cat);
                              
                              return (
                                 <div key={idx} className="p-3 bg-[#f5f5f3] dark:bg-zinc-800 flex justify-between items-center rounded border border-zinc-200/50 dark:border-zinc-700/50">
                                    <div className="space-y-1">
                                       <div className="text-xs font-bold uppercase text-zinc-800 dark:text-zinc-200">{cat}</div>
                                       <span className="text-[9px] font-mono tabular-nums font-black px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                          {count} {count === 1 ? 'Item' : 'Items'}
                                       </span>
                                    </div>
                                    {rawCat && (
                                       <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          type="button"
                                          className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-md"
                                          onClick={() => {
                                             if (confirm(`Apakah Anda yakin ingin menghapus kategori "${rawCat.name}"?`)) {
                                                handleDeleteCategory(rawCat.id);
                                             }
                                          }}
                                       >
                                          <Trash2 size={12} />
                                       </Button>
                                    )}
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

       {/* 🔄 Assembly / Produksi Modal */}
       {showAssemblyModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300">
             <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 border border-border rounded-lg bg-card text-card-foreground overflow-hidden">
                <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/50 p-8 bg-[#fafaf9]/85 dark:bg-zinc-850">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white dark:text-zinc-900 shadow-lg shadow-amber-500/20">
                            <RefreshCw size={20} className="animate-spin-slow text-white dark:text-zinc-900" />
                         </div>
                         <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">
                               Assembly BOM Produksi
                            </CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                               Batch Production of Semi-Finished Goods
                            </CardDescription>
                         </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setShowAssemblyModal(false)}>
                         <X size={20} />
                      </Button>
                   </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                   {/* Target Material Select */}
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Pilih Bahan Setengah Jadi *</label>
                      <select 
                         className="w-full h-12 bg-background border border-border rounded-md px-4 text-xs font-black text-foreground outline-none focus:ring-1 ring-amber-500/30" 
                         value={selectedAssemblyBahanId} 
                         onChange={e => {
                            setSelectedAssemblyBahanId(e.target.value);
                            setProduceQty('1');
                         }}
                      >
                         <option value="">Pilih bahan...</option>
                         {bahan.filter(b => b.bom && b.bom.length > 0).map(b => (
                            <option key={b.id} value={b.id}>
                               {b.name.toUpperCase()} ({b.unit.toUpperCase()})
                            </option>
                         ))}
                      </select>
                   </div>

                   {selectedAssemblyBahanId && (() => {
                      const targetBahan = bahan.find(b => String(b.id) === String(selectedAssemblyBahanId));
                      if (!targetBahan) return null;
                      const hasBom = Array.isArray(targetBahan.bom) && targetBahan.bom.length > 0;
                      
                      let hasInsufficientStock = false;
                      const bomItems = hasBom ? targetBahan.bom.map(bomItem => {
                         const ingredient = bahan.find(b => String(b.id) === String(bomItem.bahanId || bomItem.bahan_id));
                         const needed = (Number(bomItem.qty) || 0) * (Number(produceQty) || 0);
                         const available = Number(ingredient?.stock) || 0;
                         if (available < needed) {
                            hasInsufficientStock = true;
                         }
                         return {
                            ...bomItem,
                            ingredient,
                            needed,
                            available
                         };
                      }) : [];

                      return (
                         <div className="space-y-6">
                            {/* Quantity Input */}
                            <div className="grid grid-cols-2 gap-6 bg-zinc-50/50 dark:bg-zinc-800/30 p-4 rounded-md border border-zinc-200 dark:border-zinc-800">
                               <div className="space-y-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Stok Saat Ini</span>
                                  <p className="text-lg font-black font-mono tabular-nums text-zinc-900 dark:text-white">
                                     {Number(targetBahan.stock || 0).toLocaleString('id-ID')} <span className="text-xs uppercase">{targetBahan.unit}</span>
                                  </p>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Jumlah Produksi ({targetBahan.unit})</label>
                                  <Input 
                                     type="number" 
                                     placeholder="Jumlah..." 
                                     className="h-10 bg-background border-border text-sm font-black rounded-md font-mono tabular-nums text-foreground"
                                     value={produceQty} 
                                     onChange={e => setProduceQty(e.target.value)} 
                                  />
                               </div>
                            </div>

                            {/* Ingredients Calculation List */}
                            <div className="space-y-3">
                               <h5 className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                  <Layers size={14} className="text-amber-500" /> Kebutuhan Bahan Baku Penyusun
                               </h5>
                               <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                  {bomItems.map((item, idx) => {
                                     const isShort = item.available < item.needed;
                                     return (
                                        <div key={idx} className={cn(
                                           "p-3 rounded-md border flex items-center justify-between text-xs font-bold font-mono tabular-nums",
                                           isShort 
                                              ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800" 
                                              : "bg-zinc-50/20 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                                        )}>
                                           <div>
                                              <p className="text-xs font-black uppercase text-zinc-850 dark:text-zinc-100">{item.ingredient?.name || 'Unknown Item'}</p>
                                              <p className="text-[10px] text-zinc-550 mt-0.5">
                                                 Resep standar: {Number(item.qty).toLocaleString('id-ID')} {item.ingredient?.unit || ''}
                                              </p>
                                           </div>
                                           <div className="text-right">
                                              <p className={cn(
                                                 "text-sm font-black",
                                                 isShort ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"
                                              )}>
                                                 {Number(item.needed).toLocaleString('id-ID')} / {Number(item.available).toLocaleString('id-ID')} <span className="text-[10px] uppercase font-bold text-zinc-500">{item.ingredient?.unit}</span>
                                              </p>
                                              <p className={cn(
                                                 "text-[9px] font-black uppercase tracking-widest mt-0.5",
                                                 isShort ? "text-rose-500" : "text-emerald-500"
                                              )}>
                                                 {isShort ? 'STOK KURANG' : 'STOK CUKUP'}
                                              </p>
                                           </div>
                                        </div>
                                     );
                                  })}
                               </div>
                            </div>

                            {/* Warning Banner */}
                            {hasInsufficientStock && (
                               <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-md flex items-start gap-3">
                                  <AlertTriangle className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={16} />
                                  <div className="space-y-1">
                                     <p className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-tight">Stok Bahan Baku Tidak Mencukupi</p>
                                     <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-500 leading-normal">
                                        Beberapa bahan baku penyusun memiliki stok di bawah jumlah kebutuhan produksi. Silakan lakukan restock atau kurangi jumlah produksi.
                                     </p>
                                  </div>
                               </div>
                            )}

                            {/* Action Button inside modal content */}
                            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-4">
                               <Button variant="ghost" className="flex-1 h-12 font-black uppercase tracking-widest text-[9px]" onClick={() => setShowAssemblyModal(false)}>
                                  Batal
                               </Button>
                               <Button 
                                  className={cn(
                                     "flex-1 h-12 font-black uppercase tracking-widest text-[10px] rounded-md transition-all active:scale-[0.98]",
                                     hasInsufficientStock
                                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-650 cursor-not-allowed border"
                                        : "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-lg shadow-amber-500/20"
                                  )}
                                  disabled={hasInsufficientStock || saving || !produceQty || Number(produceQty) <= 0}
                                  onClick={async () => {
                                     const success = await handleAssemble(selectedAssemblyBahanId, Number(produceQty));
                                     if (success) {
                                        setShowAssemblyModal(false);
                                     }
                                  }}
                               >
                                  {saving ? 'MEMPROSES...' : 'MULAI PRODUKSI'}
                               </Button>
                            </div>
                         </div>
                      );
                   })()}
                </CardContent>
             </Card>
          </div>
        )}

        {/* 🤖 AI Multi-PO Hub Confirmation Modal */}
        {showPoHubModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-mono tabular-nums">
            <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 border border-border rounded-lg bg-card text-card-foreground overflow-hidden max-h-[85vh] flex flex-col">
              <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50 dark:bg-zinc-900 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="text-amber-500 animate-pulse" size={24} />
                    <div>
                      <CardTitle className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-50">🤖 AI Multi-PO Generation Hub</CardTitle>
                      <CardDescription className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Saran pengadaan cerdas terkelompok berdasarkan supplier</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowPoHubModal(false)}><X size={20} /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar bg-background">
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-dashed border-amber-200 dark:border-amber-800 rounded-md text-xs text-amber-700 dark:text-amber-400 font-bold leading-relaxed">
                  💡 AI berhasil menyusun rencana pengadaan cerdas. Bahan baku kritis dikelompokkan secara terpisah berdasarkan vendor masing-masing. Silakan klik <strong>Eksekusi PO</strong> pada vendor pilihan Anda untuk menyesuaikan kuantitas dan harga secara manual sebelum diajukan.
                </div>

                <div className="space-y-4">
                  {poHubGroups.map((group, gIdx) => (
                    <div key={gIdx} className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm bg-card">
                      <div className="bg-[#fafaf9]/85/85 dark:bg-zinc-900/50 p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4 flex-wrap sm:flex-nowrap">
                        <span className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <Truck size={14} className="text-amber-500 shrink-0" /> {group.name}
                        </span>
                        
                        <div className="flex items-center gap-3 flex-wrap">
                          {group.id === 'unassigned' ? (
                            <div className="flex items-center gap-2 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 shadow-sm">
                              <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase shrink-0">Alokasikan Supplier:</span>
                              <select
                                className="bg-transparent text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 outline-none cursor-pointer focus:ring-0"
                                value={fallbackMap[group.id] || ''}
                                onChange={(e) => setFallbackMap({ ...fallbackMap, [group.id]: e.target.value })}
                              >
                                {suppliersList.map(s => (
                                  <option key={s.id} value={s.id} className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800">{s.name.toUpperCase()}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">{group.items.length} Item</span>
                          )}

                          <Button
                            size="sm"
                            onClick={() => {
                              const sId = group.id === 'unassigned' ? fallbackMap[group.id] : group.id;
                              if (!sId) {
                                alert('⚠️ Harap alokasikan supplier terlebih dahulu!');
                                return;
                              }
                              setShowPoHubModal(false);
                              navigate('/procurement', {
                                state: {
                                  prefilledPo: {
                                    supplierId: sId,
                                    items: group.items.map(it => ({
                                      bahanId: it.id,
                                      purchaseQty: it.suggestedQty,
                                      purchaseUnit: it.unit || 'Unit',
                                      unitPrice: 0
                                    }))
                                  }
                                }
                              });
                            }}
                            className="h-8 px-3 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 text-white rounded text-[10px] font-black uppercase active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                          >
                            <ShoppingCart size={11} /> Eksekusi PO
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 divide-y divide-zinc-100 dark:divide-zinc-800 space-y-2">
                        {group.items.map((item, iIdx) => (
                          <div key={iIdx} className="flex justify-between items-center py-2 text-xs">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{item.name}</span>
                            <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                              Order: {item.suggestedQty.toLocaleString('id-ID')} <span className="text-[10px] font-bold text-zinc-400 uppercase">{item.unit}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
                <Button className="w-full h-12 font-black uppercase text-xs rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all" onClick={() => setShowPoHubModal(false)}>
                  Tutup AI Hub
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

      </div>
   );
}
