// InventoryFormModal.jsx - Updated to follow KEN Enterprise design system
import { useState, useEffect } from 'react';
import { formatRupiah } from '../utils/formatters';
import {
  Package,
  Info,
  Database,
  X,
  Save,
  Layers,
  Plus,
  Trash2,
  Scale,
  Truck,
  Box,
  ArrowRight,
  RefreshCw
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
      multiplier *= Number(form.conversions[i].multiplier) || 1;
    }
    return multiplier;
  };

  const handleSave = () => {
    if (!form.name?.trim() || !form.unit?.trim()) return alert('Nama dan Satuan Dasar wajib diisi!');
    onSave({
      ...form,
      minStock: Number(form.minStock) || 0,
      conversions: form.conversions.filter(c => c.unit && c.multiplier)
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
      <Card className="w-full max-w-[1200px] max-h-[95vh] rounded-lg bg-card border border-zinc-200/80 dark:border-zinc-800/50 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-zinc-200/80 dark:border-zinc-800/50 bg-card/80">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white dark:text-zinc-900 shadow-lg shadow-amber-500/20">
              <Package size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-tighter text-foreground">
                {initialData ? 'Update Master Registry' : 'Register New Material'}
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest font-black text-amber-600 dark:text-amber-500">
                Material definition & conversion matrix
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
        {/* Body */}
        <CardContent className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-12 gap-8">
            {/* LEFT: Primary Info & Conversions */}
            <div className="col-span-8 space-y-10">
              {/* Identity Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ml-1">Nama Bahan *</label>
                  <Input className="h-12 bg-card border-zinc-200 dark:border-zinc-700 rounded-md text-foreground placeholder:text-zinc-400" placeholder="Input name..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ml-1">Kategori</label>
                  <select className="h-12 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-card px-4 text-xs font-black text-zinc-800 dark:text-zinc-200" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-500 ml-1">Pemasok Strategis</label>
                  <select className="h-12 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-card px-4 text-xs font-black text-zinc-800 dark:text-zinc-200" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                    <option value="">Pilih Supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              {/* Logic & Thresholds */}
              <div className="p-6 bg-card/40 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-800 dark:text-white pointer-events-none">
                  <Database size={60} />
                </div>
                <div className="space-y-2 relative z-10">
                  <label className="text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-500 ml-1">System Base Unit (Anchor)</label>
                  <select className="h-12 w-full bg-card border-2 border-amber-500/30 rounded-md text-sm font-black font-mono tabular-nums text-amber-600 dark:text-amber-500" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    {masterUnits.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2 relative z-10">
                  <label className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ml-1">Safety Threshold (Min. Stock)</label>
                  <div className="relative">
                    <Input type="number" className="h-12 w-full bg-card border-zinc-200 dark:border-zinc-700 rounded-md text-center font-mono tabular-nums text-amber-600 dark:text-amber-500" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 dark:text-zinc-300 bg-card px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 font-mono tabular-nums">{form.unit}</span>
                  </div>
                </div>
              </div>
              {/* Multi‑UOM Matrix */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    <div className="h-px w-8 bg-zinc-300 dark:bg-zinc-800" />
                    <label className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Unit Conversions</label>
                  </div>
                  <Button variant="ghost" className="h-8 px-4 text-xs font-black uppercase text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 dark:border-amber-400/20 rounded-md transition-all" onClick={handleAddTier}>
                    <Plus size={12} className="mr-2" /> Define New Level
                  </Button>
                </div>
                <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {form.conversions.length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-400 dark:text-zinc-600 font-black uppercase italic tracking-widest">
                      No packaging tiers defined
                    </div>
                  )}
                  {form.conversions.map((conv, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-card/40 rounded-md border border-zinc-200 dark:border-zinc-700 group hover:border-amber-500/20 transition-all">
                      <div className="w-10 h-10 rounded-md bg-card flex items-center justify-center text-xs font-black text-zinc-500 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-700 shadow-inner">L{idx + 1}</div>
                      <div className="grid grid-cols-11 gap-4 flex-1 items-center">
                        <div className="col-span-3">
                          <select className="w-full h-10 bg-card border border-zinc-300 dark:border-zinc-700 rounded-md px-4 text-xs font-black uppercase outline-none focus:ring-1 ring-amber-500" value={conv.unit} onChange={e => handleConversionChange(idx, 'unit', e.target.value)} disabled={idx > 0}>
                            {masterUnits.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div className="col-span-1 text-center font-black text-amber-500 text-xl">=</div>
                        <div className="col-span-2">
                          <Input type="number" className="h-10 w-full bg-card border border-zinc-300 dark:border-zinc-700 text-xs font-black text-center font-mono tabular-nums rounded-md focus:ring-1 ring-amber-500" value={conv.multiplier} onChange={e => handleConversionChange(idx, 'multiplier', e.target.value)} />
                        </div>
                        <div className="col-span-3">
                          <select className="w-full h-10 bg-card border border-zinc-300 dark:border-zinc-700 rounded-md px-4 text-xs font-black uppercase outline-none focus:ring-1 ring-amber-500" value={conv.to_unit} onChange={e => handleConversionChange(idx, 'to_unit', e.target.value)}>
                            <option value={form.unit}>{form.unit.toUpperCase()} (BASE)</option>
                            {masterUnits.filter(u => u !== conv.unit && u !== form.unit).map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="text-xs font-black text-amber-600 dark:text-amber-500 font-mono tabular-nums">
                            {conv.multiplier} <span className="text-xs text-zinc-700 dark:text-zinc-300 font-bold uppercase ml-1 px-2 py-0.5 bg-card rounded border border-zinc-300 dark:border-zinc-700 font-mono tabular-nums">{conv.to_unit}</span>
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setForm({ ...form, conversions: form.conversions.filter((_, i) => i !== idx) })} className="h-10 w-10 flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:bg-rose-950/30 rounded-md transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* RIGHT: Summary & Actions */}
            <div className="col-span-4 bg-card/50 rounded-lg p-8 space-y-10 border border-zinc-200/80 dark:border-zinc-800/80 relative shadow-inner overflow-hidden">
              <div className="absolute -bottom-10 -right-10 p-4 opacity-2 dark:opacity-4 text-zinc-800 dark:text-white rotate-12 scale-150 pointer-events-none">
                <RefreshCw size={200} />
              </div>
              <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                <div className="w-32 h-32 bg-card rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-amber-500 shadow-xl group-hover:scale-105 transition-transform">
                  <Box size={60} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black uppercase tracking-tighter text-foreground">{form.name || 'REGISTERING...'}</h4>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{form.category || 'NO CATEGORY'}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-card rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-6 relative z-10 shadow-sm">
                <p className="text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider">Matrix Preview</p>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest italic">BASE SCALE</span>
                    <span className="text-foreground font-mono tabular-nums bg-card px-4 py-1 rounded-lg ring-1 ring-zinc-300 dark:ring-white/10">1 {form.unit}</span>
                  </div>
                  {form.conversions.filter(c => c.unit && c.multiplier).map((c, i) => (
                    <div key={i} className="flex justify-between items-center text-xs font-black" style={{ animationDelay: `${i * 100}ms` }}>
                      <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">1 {c.unit}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-px w-6 bg-zinc-300 dark:bg-zinc-800" />
                        <span className="text-amber-600 dark:text-amber-500 font-mono tabular-nums bg-card px-4 py-1 rounded-lg ring-1 ring-amber-500/10">
                          {getCumulativeMultiplier(i).toLocaleString()} <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">{form.unit.toUpperCase()}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-zinc-300 dark:border-zinc-700">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase mb-1">Safety Margin</p>
                      <p className="text-lg font-black font-mono tabular-nums text-rose-600 dark:text-rose-400">{form.minStock || 0} <span className="text-xs">{form.unit}</span></p>
                    </div>
                    <Truck size={24} className="text-zinc-500 dark:text-zinc-400" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 relative z-10">
                <Button className="h-16 w-full bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 font-black uppercase tracking-wider text-xs rounded-md shadow-lg dark:shadow-amber-400/10 flex items-center justify-center gap-2 active:scale-95" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} className="group-hover:rotate-12 transition-transform" />}
                  {initialData ? 'SAVE REGISTRY' : 'INITIALIZE MATERIAL'}
                </Button>
                <Button variant="ghost" className="h-12 w-full font-black uppercase tracking-wider text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" onClick={onClose}>Discard Change</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
