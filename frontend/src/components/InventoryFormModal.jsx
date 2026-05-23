import { useState, useEffect } from 'react';
import { formatRupiah } from '../utils/formatters';
import { 
  Package, Info, Database, 
  X, Save, Layers, Plus, Trash2,
  Scale, Truck, Box, ArrowRight, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { cn } from "../lib/utils";

export default function InventoryFormModal({ isOpen, onClose, onSave, initialData, inventoryMeta, isSaving }) {
  const categories = inventoryMeta?.categories?.length > 0 ? inventoryMeta.categories : ['Bahan Baku', 'Minuman', 'Makanan', 'Kemasan', 'Lainnya'];
  const suppliers = inventoryMeta?.suppliers || [];
  const masterUnits = ['ml', 'L', 'Gram', 'Kg', 'Pcs', 'Unit', 'Sachet', 'Botol', 'Dus', 'Pack', 'Karton', 'Can', 'Zak'];

  const initialFormState = {
    name: '',
    category: categories[0],
    supplier_id: '',
    unit: 'ml',
    conversions: [],
    minStock: '',
    notes: ''
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({ 
          ...initialFormState, 
          ...initialData,
          supplier_id: initialData.supplier_id || '',
          conversions: initialData.conversions || []
        });
      } else {
        setForm({ ...initialFormState, category: categories[0], supplier_id: suppliers[0]?.id || '' });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAddTier = () => {
    const lastTier = form.conversions[form.conversions.length - 1];
    const newUnit = lastTier ? lastTier.to_unit : 'Dus';
    const newToUnit = form.unit; 

    setForm({
      ...form,
      conversions: [...form.conversions, { unit: newUnit, multiplier: '1', to_unit: newToUnit }]
    });
  };

  const handleConversionChange = (index, field, value) => {
    const newConversions = [...form.conversions];
    newConversions[index][field] = value;
    if (field === 'to_unit' && newConversions[index + 1]) {
      newConversions[index + 1].unit = value;
    }
    setForm({ ...form, conversions: newConversions });
  };

  const getCumulativeMultiplier = (index) => {
    let multiplier = 1;
    for (let i = 0; i <= index; i++) {
      multiplier *= (Number(form.conversions[i].multiplier) || 1);
    }
    return multiplier;
  };

  const handleSave = () => {
    if (!form.name?.trim() || !form.unit?.trim()) return alert('Nama dan Satuan Dasar wajib diisi!');
    // HPP & Stock removed from master entry as requested
    onSave({ ...form, 
      minStock: Number(form.minStock) || 0, 
      conversions: form.conversions.filter(c => c.unit && c.multiplier)
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-md">
      <Card className="w-full max-w-[1200px] max-h-[95vh] border border-zinc-200/80 dark:border-zinc-800/50 rounded-[2.5rem] bg-[#fbfbfa] dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
        
        {/* Compact Header */}
        <div className="px-8 py-4 border-b border-zinc-200/80 dark:border-zinc-800/50 bg-[#fafaf9]/80 dark:bg-zinc-900/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white dark:text-zinc-950 shadow-lg shadow-amber-500/20"><Package size={20} /></div>
              <div>
                 <CardTitle className="text-lg font-black uppercase tracking-tighter text-zinc-900 dark:text-white">{initialData ? 'Update Master Registry' : 'Register New Material'}</CardTitle>
                 <CardDescription className="text-[9px] uppercase tracking-widest font-black text-amber-600 dark:text-amber-500/80 leading-none">Material definition & conversion matrix</CardDescription>
              </div>
           </div>
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={onClose}><X size={20} /></Button>
        </div>

        <CardContent className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
           <div className="grid grid-cols-12 gap-8">
              
              {/* LEFT: PRIMARY INFO & CONVERSIONS */}
              <div className="col-span-8 space-y-10">
                 
                 {/* 1. Identity Grid */}
                 <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Nama Bahan *</label>
                       <Input className="h-12 bg-[#f5f5f3] dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 text-sm font-black rounded-2xl focus:ring-amber-500 shadow-inner placeholder:text-zinc-400" placeholder="Input name..." value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Kategori</label>
                       <select className="flex h-12 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-[#f5f5f3] dark:bg-zinc-800 px-4 text-xs font-black text-zinc-800 dark:text-zinc-200 outline-none appearance-none cursor-pointer focus:ring-1 ring-amber-500/30" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 ml-1 font-bold">Pemasok Strategis</label>
                       <select className="flex h-12 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-[#f5f5f3] dark:bg-zinc-800 px-4 text-xs font-black text-zinc-800 dark:text-zinc-200 outline-none appearance-none cursor-pointer ring-1 ring-amber-500/20 focus:ring-amber-500 shadow-sm" value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})}>
                          <option value="">Pilih Supplier...</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    </div>
                 </div>

                 {/* 2. Logic & Thresholds */}
                 <div className="grid grid-cols-2 gap-6 p-6 bg-[#f4f4f2] dark:bg-zinc-950/40 rounded-[1.8rem] border border-zinc-200/80 dark:border-zinc-800/80 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-5 text-zinc-800 dark:text-white pointer-events-none"><Database size={60} /></div>
                    <div className="space-y-2 relative z-10">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 ml-1">System Base Unit (Anchor)</label>
                       <select className="h-12 w-full bg-[#eaeaea] dark:bg-zinc-950 border-2 border-amber-500/30 text-sm font-black text-center text-amber-600 dark:text-amber-500 rounded-2xl outline-none appearance-none shadow-md font-mono tabular-nums" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                          {masterUnits.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2 relative z-10">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Safety Threshold (Min. Stock)</label>
                       <div className="relative">
                          <Input type="number" className="h-12 bg-[#eaeaea] dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700/80 text-sm font-black text-center font-mono tabular-nums rounded-2xl shadow-inner text-amber-600 dark:text-amber-500" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 dark:text-zinc-300 uppercase bg-[#dcdcdc] dark:bg-zinc-900 px-4 py-1 rounded-lg border border-zinc-300 dark:border-white/10 font-mono tabular-nums">{form.unit}</span>
                       </div>
                    </div>
                 </div>

                 {/* 3. Multi-UOM Matrix */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <div className="flex items-center gap-4">
                          <div className="h-px w-8 bg-zinc-300 dark:bg-zinc-800" />
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Unit Conversions</label>
                       </div>
                       <Button variant="ghost" className="h-8 px-4 text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 dark:border-amber-400/20 rounded-lg transition-all" onClick={handleAddTier}>
                          <Plus size={12} className="mr-2" /> Define New Level
                       </Button>
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                       {form.conversions.length === 0 && (
                          <div className="py-12 text-center border-2 border-dashed border-zinc-200 dark:border-white/5 rounded-[2rem] text-[11px] text-zinc-400 dark:text-zinc-650 font-black uppercase italic tracking-widest">No packaging tiers defined</div>
                       )}
                       {form.conversions.map((conv, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-[#f5f5f3] dark:bg-zinc-850/40 rounded-[1.5rem] border border-zinc-200 dark:border-white/5 group hover:border-amber-500/20 transition-all">
                             <div className="w-10 h-10 rounded-2xl bg-[#eaeaea] dark:bg-zinc-950 flex items-center justify-center text-[10px] font-black text-zinc-500 dark:text-zinc-600 shrink-0 border border-zinc-250 dark:border-white/5 shadow-inner">L{idx+1}</div>
                             <div className="grid grid-cols-11 gap-4 flex-1 items-center">
                                <div className="col-span-3">
                                   <select className="w-full h-10 bg-[#eaeaea] dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 rounded-lg px-4 text-[11px] font-black text-zinc-800 dark:text-zinc-200 uppercase outline-none focus:ring-1 ring-amber-500 transition-all shadow-sm" value={conv.unit} onChange={e => handleConversionChange(idx, 'unit', e.target.value)} disabled={idx > 0}>
                                      {masterUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                   </select>
                                </div>
                                <div className="col-span-1 text-center font-black text-amber-500 text-xl leading-none">=</div>
                                <div className="col-span-2">
                                   <Input type="number" className="h-10 bg-[#eaeaea] dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-xs font-black text-center text-zinc-900 dark:text-zinc-100 font-mono tabular-nums rounded-lg focus:ring-1 ring-amber-500 shadow-inner" value={conv.multiplier} onChange={e => handleConversionChange(idx, 'multiplier', e.target.value)} />
                                </div>
                                <div className="col-span-3">
                                   <select className="w-full h-10 bg-[#eaeaea] dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 rounded-lg px-4 text-[11px] font-black text-zinc-800 dark:text-zinc-200 uppercase outline-none focus:ring-1 ring-amber-500 transition-all shadow-sm" value={conv.to_unit} onChange={e => handleConversionChange(idx, 'to_unit', e.target.value)}>
                                      <option value={form.unit}>{form.unit.toUpperCase()} (BASE)</option>
                                      {masterUnits.filter(u => u !== conv.unit && u !== form.unit).map(u => <option key={u} value={u}>{u}</option>)}
                                   </select>
                                </div>
                                <div className="col-span-2 text-right">
                                   <p className="text-[11px] font-black text-amber-600 dark:text-amber-500 font-mono tabular-nums leading-none">
                                      {conv.multiplier} <span className="text-[10px] text-zinc-700 dark:text-zinc-300 font-bold uppercase ml-1 px-2 py-0.5 bg-[#eaeaea] dark:bg-zinc-950 rounded border border-zinc-300 dark:border-white/5 font-mono tabular-nums">{conv.to_unit}</span>
                                   </p>
                                </div>
                             </div>
                             <button onClick={() => setForm({...form, conversions: form.conversions.filter((_, i) => i !== idx)})} className="h-10 w-10 flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:bg-rose-950/30 rounded-2xl transition-all"><Trash2 size={18} /></button>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* RIGHT: SUMMARY & ACTIONS */}
              <div className="col-span-4 bg-[#f3f3f0] dark:bg-zinc-950/50 rounded-[2.5rem] p-8 space-y-10 border border-zinc-200/80 dark:border-zinc-800/80 relative shadow-inner overflow-hidden">
                 <div className="absolute -bottom-10 -right-10 p-4 opacity-[0.02] dark:opacity-[0.04] text-zinc-800 dark:text-white pointer-events-none rotate-12 scale-150"><RefreshCw size={200} /></div>
                 
                 <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                    <div className="w-32 h-32 bg-[#eaeaea] dark:bg-zinc-900 rounded-[3rem] border border-zinc-200 dark:border-white/5 flex items-center justify-center text-amber-500 shadow-xl group-hover:scale-105 transition-transform">
                       <Box size={60} strokeWidth={1} />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-2xl font-black uppercase tracking-tighter leading-none text-zinc-900 dark:text-white">{form.name || 'REGISTERING...'}</h4>
                       <div className="flex items-center justify-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em]">{form.category || 'NO CATEGORY'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-[#e8e8e5] dark:bg-zinc-900 rounded-[2rem] border border-zinc-250 dark:border-white/5 space-y-6 relative z-10 shadow-sm">
                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.4em]">Matrix Preview</p>
                    <div className="space-y-4">
                       <div className="flex justify-between text-[11px] font-black">
                          <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest italic">BASE SCALE</span>
                          <span className="text-zinc-800 dark:text-zinc-100 font-mono tabular-nums uppercase px-4 py-1 bg-[#dcdcdc] dark:bg-zinc-950 rounded-lg ring-1 ring-zinc-300 dark:ring-white/10">1 {form.unit}</span>
                       </div>
                       {form.conversions.filter(c => c.unit && c.multiplier).map((c, i) => (
                          <div key={i} className="flex justify-between items-center text-[11px] font-black animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                             <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">1 {c.unit}</span>
                             <div className="flex items-center gap-4">
                                <div className="h-px w-6 bg-zinc-300 dark:bg-zinc-800" />
                                <span className="text-amber-600 dark:text-amber-500 font-mono tabular-nums bg-[#dcdcdc] dark:bg-zinc-950 px-4 py-1 rounded-lg ring-1 ring-amber-500/10">
                                   {getCumulativeMultiplier(i).toLocaleString()} <span className="text-[8px] text-zinc-500 dark:text-zinc-400 ml-1">{form.unit.toUpperCase()}</span>
                                </span>
                             </div>
                          </div>
                       ))}
                    </div>
                    <div className="pt-6 border-t border-zinc-300 dark:border-white/10">
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[8px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Safety Margin</p>
                             <p className="text-lg font-black font-mono tabular-nums text-rose-600 dark:text-rose-600 dark:text-rose-400 leading-none">{form.minStock || 0} <span className="text-[10px]">{form.unit}</span></p>
                          </div>
                          <Truck size={24} className="text-zinc-500 dark:text-zinc-400" />
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col gap-4 relative z-10">
                    <Button className="h-16 w-full bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-lg shadow-amber-500/20 dark:shadow-amber-400/10 flex items-center justify-center gap-4 transition-all active:scale-95 group border-none" onClick={handleSave} disabled={isSaving}>
                       {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} className="group-hover:rotate-12 transition-transform" />}
                       {initialData ? 'SAVE REGISTRY' : 'INITIALIZE MATERIAL'}
                    </Button>
                    <Button variant="ghost" className="h-12 w-full font-black uppercase tracking-widest text-[9px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" onClick={onClose}>Discard Change</Button>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
