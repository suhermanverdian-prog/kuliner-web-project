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
  RefreshCw,
  Leaf,
  FlaskConical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { cn } from "../lib/utils";

export default function InventoryFormModal({ isOpen, onClose, onSave, initialData, inventoryMeta, isSaving, bahanList }) {
  const categories = inventoryMeta?.categories?.length > 0 ? inventoryMeta.categories : ['Bahan Baku', 'Assembly / Setengah Jadi', 'Kemasan', 'Lainnya'];
  const suppliers = inventoryMeta?.suppliers || [];
  const masterUnits = ['ml', 'L', 'Gram', 'Kg', 'Pcs', 'Unit', 'Sachet', 'Botol', 'Dus', 'Pack', 'Karton', 'Can', 'Zak'];

  const initialFormState = {
    name: '',
    category: categories[0],
    supplier_id: '',
    unit: 'ml',
    conversions: [],
    bom: [],
    minStock: '',
    notes: '',
    isAssembly: false
  };
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const hasBom = Array.isArray(initialData.bom) && initialData.bom.length > 0;
        const cat = (initialData.category || '').toUpperCase();
        const initialIsAssembly = hasBom || cat.includes('ASSEMBLY') || cat.includes('SETENGAH JADI');

        // Normalize conversions data keys and casing to lowercase
        const normalizedConversions = (initialData.conversions || []).map(c => {
          const rawUnit = (c.unit || c.from_unit || '').toLowerCase();
          const rawToUnit = (c.to_unit || initialData.unit || '').toLowerCase();

          return {
            unit: rawUnit,
            to_unit: rawToUnit,
            multiplier: c.multiplier !== undefined ? String(c.multiplier) : '1'
          };
        });

        // Find if min_stock can be represented in any conversion unit cleanly
        let selectedMinStockUnit = (initialData.unit || 'ml').toLowerCase();
        let displayedMinStock = initialData.min_stock !== undefined ? initialData.min_stock : (initialData.minStock || 0);

        for (let i = normalizedConversions.length - 1; i >= 0; i--) {
          const conv = normalizedConversions[i];
          let multiplier = 1;
          for (let j = 0; j <= i; j++) {
            multiplier *= Number(normalizedConversions[j].multiplier) || 1;
          }
          if (multiplier > 1 && displayedMinStock % multiplier === 0 && displayedMinStock > 0) {
            displayedMinStock = displayedMinStock / multiplier;
            selectedMinStockUnit = conv.unit;
            break;
          }
        }

        setForm({
          ...initialFormState,
          ...initialData,
          unit: (initialData.unit || 'ml').toLowerCase(),
          supplier_id: initialData.supplier_id || '',
          conversions: normalizedConversions,
          bom: (initialData.bom || []).map(b => ({
            bahanId: String(b.bahanId || b.bahan_id || ''),
            qty: b.qty
          })),
          minStock: String(displayedMinStock),
          minStockUnit: selectedMinStockUnit,
          isAssembly: initialIsAssembly
        });
      } else {
        setForm({ 
          ...initialFormState, 
          category: categories[0], 
          supplier_id: suppliers[0]?.id || '',
          minStockUnit: 'ml',
          isAssembly: false
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAddTier = () => {
    const lastTier = form.conversions[form.conversions.length - 1];
    const newUnit = lastTier ? lastTier.to_unit : 'dus';
    const newToUnit = (form.unit || '').toLowerCase();
    setForm({
      ...form,
      conversions: [...form.conversions, { unit: newUnit.toLowerCase(), multiplier: '1', to_unit: newToUnit }]
    });
  };

  const handleConversionChange = (index, field, value) => {
    const newConversions = [...form.conversions];
    newConversions[index][field] = value.toLowerCase();
    if (field === 'to_unit' && newConversions[index + 1]) {
      newConversions[index + 1].unit = value.toLowerCase();
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
    
    const mappedConversions = form.conversions
      .filter(c => c.unit && c.multiplier)
      .map(c => ({
        unit: c.unit.toLowerCase(),
        to_unit: (c.to_unit || form.unit).toLowerCase(),
        multiplier: Number(c.multiplier) || 1
      }));

    const mappedBom = form.isAssembly ? (form.bom || [])
      .filter(b => b.bahanId && String(b.bahanId) !== 'undefined' && String(b.bahanId) !== 'null' && b.qty)
      .map(b => ({
        bahanId: String(b.bahanId),
        qty: Number(b.qty) || 0
      })) : [];

    if (form.isAssembly && mappedBom.length === 0) {
      return alert('Bahan Baku Assembly wajib memiliki minimal 1 bahan penyusun dalam BOM!');
    }

    const getUnitMultiplier = (targetUnit) => {
      const tUnit = (targetUnit || '').toLowerCase();
      const bUnit = (form.unit || '').toLowerCase();
      if (tUnit === bUnit) return 1;
      const idx = form.conversions.findIndex(c => (c.unit || '').toLowerCase() === tUnit);
      if (idx !== -1) {
        let mult = 1;
        for (let i = 0; i <= idx; i++) {
          mult *= Number(form.conversions[i].multiplier) || 1;
        }
        return mult;
      }
      return 1;
    };

    const multiplier = getUnitMultiplier(form.minStockUnit || form.unit);
    const convertedMinStock = Number(form.minStock || 0) * multiplier;

    onSave({
      ...form,
      unit: (form.unit || '').toLowerCase(),
      minStockUnit: (form.minStockUnit || form.unit || '').toLowerCase(),
      price: Number(form.cost || form.price || 0),
      min_stock: convertedMinStock,
      stock: Number(form.stock || 0),
      conversions: mappedConversions,
      bom: mappedBom
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
                    {categories.map((c, idx) => <option key={idx} value={c}>{c}</option>)}
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

              {/* Tipe Bahan Baku Selection Card Matrix */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ml-1">Tipe Bahan Baku</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => {
                      setForm({ ...form, isAssembly: false, bom: [] });
                    }}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 active:scale-95",
                      !form.isAssembly 
                        ? "border-amber-500 bg-amber-500/5 text-amber-600 dark:border-amber-400 dark:text-amber-400" 
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-650"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                      !form.isAssembly ? "bg-amber-500/10 text-amber-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                    )}>
                      <Leaf size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-zinc-850 dark:text-zinc-100">Bahan Baku Murni</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Bahan murni tanpa komposisi BOM penyusun</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setForm({ ...form, isAssembly: true, bom: form.bom?.length > 0 ? form.bom : [{ bahanId: '', qty: '' }] });
                    }}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 active:scale-95",
                      form.isAssembly 
                        ? "border-amber-500 bg-amber-500/5 text-amber-600 dark:border-amber-400 dark:text-amber-400" 
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-650"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                      form.isAssembly ? "bg-amber-500/10 text-amber-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                    )}>
                      <FlaskConical size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-zinc-850 dark:text-zinc-100">Bahan Baku Assembly</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Bahan setengah jadi yang butuh komposisi BOM</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Logic & Thresholds */}
              <div className="p-6 bg-card/40 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-800 dark:text-white pointer-events-none">
                  <Database size={60} />
                </div>
                <div className="space-y-2 relative z-10">
                  <label className="text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-500 ml-1">System Base Unit (Anchor)</label>
                  <select 
                    className="h-12 w-full bg-card border-2 border-amber-500/30 rounded-md text-sm font-black font-mono tabular-nums text-amber-600 dark:text-amber-500" 
                    value={(form.unit || '').toLowerCase()} 
                    onChange={e => {
                      const newUnit = e.target.value.toLowerCase();
                      setForm(prev => {
                        const updatedConversions = (prev.conversions || []).map(c => ({
                          ...c,
                          to_unit: newUnit
                        }));
                        return {
                          ...prev,
                          unit: newUnit,
                          conversions: updatedConversions,
                          minStockUnit: (prev.minStockUnit || '').toLowerCase() === (prev.unit || '').toLowerCase() 
                            ? newUnit 
                            : (updatedConversions.some(c => c.unit.toLowerCase() === (prev.minStockUnit || '').toLowerCase()) 
                                ? (prev.minStockUnit || '').toLowerCase() 
                                : newUnit)
                        };
                      });
                    }}
                  >
                    {!masterUnits.some(u => u.toLowerCase() === (form.unit || '').toLowerCase()) && form.unit && (
                      <option value={form.unit.toLowerCase()}>{form.unit.toUpperCase()}</option>
                    )}
                    {masterUnits.map(u => <option key={u} value={u.toLowerCase()}>{u.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2 relative z-10">
                  <label className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ml-1">Safety Threshold (Min. Stock)</label>
                  <div className="relative flex gap-2">
                    <Input type="number" className="h-12 flex-1 bg-card border-zinc-200 dark:border-zinc-700 rounded-md text-center font-mono tabular-nums text-amber-600 dark:text-amber-500" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
                    <select 
                      className="h-12 w-32 rounded-md border border-zinc-200 dark:border-zinc-700 bg-card px-3 text-xs font-black uppercase tracking-widest text-zinc-650 dark:text-zinc-300"
                      value={(form.minStockUnit || form.unit || '').toLowerCase()}
                      onChange={e => setForm({ ...form, minStockUnit: e.target.value.toLowerCase() })}
                    >
                      <option value={(form.unit || '').toLowerCase()}>{(form.unit || '').toUpperCase()} (BASE)</option>
                      {(form.conversions || []).filter(c => c.unit).map(c => (
                        <option key={c.unit} value={c.unit.toLowerCase()}>{c.unit.toUpperCase()}</option>
                      ))}
                    </select>
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
                          <select className="w-full h-10 bg-card border border-zinc-300 dark:border-zinc-700 rounded-md px-4 text-xs font-black uppercase outline-none focus:ring-1 ring-amber-500" value={(conv.unit || '').toLowerCase()} onChange={e => handleConversionChange(idx, 'unit', e.target.value.toLowerCase())} disabled={idx > 0}>
                            {masterUnits.map(u => <option key={u} value={u.toLowerCase()}>{u.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div className="col-span-1 text-center font-black text-amber-500 text-xl">=</div>
                        <div className="col-span-2">
                          <Input type="number" className="h-10 w-full bg-card border border-zinc-300 dark:border-zinc-700 text-xs font-black text-center font-mono tabular-nums rounded-md focus:ring-1 ring-amber-500" value={conv.multiplier} onChange={e => handleConversionChange(idx, 'multiplier', e.target.value)} />
                        </div>
                        <div className="col-span-3">
                          <select className="w-full h-10 bg-card border border-zinc-300 dark:border-zinc-700 rounded-md px-4 text-xs font-black uppercase outline-none focus:ring-1 ring-amber-500" value={(conv.to_unit || '').toLowerCase()} onChange={e => handleConversionChange(idx, 'to_unit', e.target.value.toLowerCase())}>
                            <option value={(form.unit || '').toLowerCase()}>{(form.unit || '').toUpperCase()} (BASE)</option>
                            {masterUnits.filter(u => u.toLowerCase() !== (conv.unit || '').toLowerCase() && u.toLowerCase() !== (form.unit || '').toLowerCase()).map(u => <option key={u} value={u.toLowerCase()}>{u.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="text-xs font-black text-amber-600 dark:text-amber-500 font-mono tabular-nums">
                            {conv.multiplier} <span className="text-xs text-zinc-700 dark:text-zinc-300 font-bold uppercase ml-1 px-2 py-0.5 bg-card rounded border border-zinc-300 dark:border-zinc-700 font-mono tabular-nums">{(conv.to_unit || '').toUpperCase()}</span>
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const nextConvs = form.conversions.filter((_, i) => i !== idx);
                          const isValidMinUnit = nextConvs.some(c => c.unit === form.minStockUnit) || form.minStockUnit === form.unit;
                          setForm({ 
                            ...form, 
                            conversions: nextConvs,
                            minStockUnit: isValidMinUnit ? form.minStockUnit : form.unit
                          });
                        }} 
                        className="h-10 w-10 flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:bg-rose-950/30 rounded-md transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {form.isAssembly && (
                <div className="space-y-4 p-5 bg-amber-500/5 rounded-md border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <label className="text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-500">Resep / BOM Produksi (Formula)</label>
                    </div>
                    <Button variant="ghost" type="button" className="h-8 px-4 text-xs font-black uppercase text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 rounded-md" onClick={() => setForm({ ...form, bom: [...(form.bom || []), { bahanId: '', qty: '' }] })}>
                      + Tambah Bahan Penyusun
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {(form.bom || []).length === 0 && (
                      <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500 uppercase italic font-bold">
                        Belum ada bahan penyusun yang ditambahkan
                      </div>
                    )}
                    {(form.bom || []).map((row, i) => (
                      <div key={i} className="flex gap-4 items-center p-3 bg-card rounded-md border border-zinc-200 dark:border-zinc-700">
                        <select
                          className="h-10 flex-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-card px-4 text-xs font-black text-zinc-800 dark:text-zinc-200"
                          value={row.bahanId || row.bahan_id || ''}
                          onChange={e => {
                            const next = [...form.bom];
                            next[i].bahanId = e.target.value;
                            setForm({ ...form, bom: next });
                          }}
                        >
                          <option value="">Pilih Bahan Dasar...</option>
                          {bahanList?.filter(b => String(b.id) !== String(initialData?.id)).map(b => (
                            <option key={b.id} value={String(b.id)}>{b.name.toUpperCase()} (per {b.unit})</option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          placeholder="Takaran"
                          className="h-10 w-32 bg-card border-zinc-200 dark:border-zinc-700 rounded-md font-mono text-center"
                          value={row.qty}
                          onChange={e => {
                            const next = [...form.bom];
                            next[i].qty = e.target.value;
                            setForm({ ...form, bom: next });
                          }}
                        />
                        <span className="text-xs font-black text-zinc-500 font-mono">
                          {bahanList?.find(b => String(b.id) === String(row.bahanId || row.bahan_id))?.unit || ''}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-10 w-10 text-rose-500 hover:bg-rose-500/10 rounded-md"
                          onClick={() => setForm({ ...form, bom: form.bom.filter((_, idx) => idx !== i) })}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      {form.category || 'NO CATEGORY'} · <span className="text-amber-500 font-bold">{form.isAssembly ? 'ASSEMBLY (BOM)' : 'MURNI'}</span>
                    </p>
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
                      <p className="text-lg font-black font-mono tabular-nums text-rose-600 dark:text-rose-400">{form.minStock || 0} <span className="text-xs uppercase">{form.minStockUnit || form.unit}</span></p>
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
