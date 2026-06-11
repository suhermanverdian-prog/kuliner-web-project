import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Plus, Trash2, Loader2, CheckCircle2, ChevronRight, Store, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { api } from '../api';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

function SearchableBahanSelect({ value, onChange, bahanList, placeholder = "-- Cari atau pilih bahan baku --" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = React.useRef(null);

  const selectedBahan = bahanList.find(b => b.id === value);

  useEffect(() => {
    if (!isOpen) {
      setSearch(selectedBahan ? `${selectedBahan.name} (Stok: ${selectedBahan.stock} ${selectedBahan.unit})` : '');
    }
  }, [value, isOpen, selectedBahan]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBahan = bahanList.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          className="flex h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 cursor-pointer"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch('');
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
          <ChevronDown size={14} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[110] w-full mt-1 max-h-60 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg custom-scrollbar">
          {filteredBahan.length === 0 ? (
            <div className="p-3 text-xs text-zinc-400 text-center">Bahan tidak ditemukan</div>
          ) : (
            filteredBahan.map((b) => (
              <button
                key={b.id}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors flex justify-between items-center",
                  b.id === value ? "text-amber-500 bg-amber-500/5 dark:bg-amber-500/10 font-bold" : "text-zinc-700 dark:text-zinc-300"
                )}
                onClick={() => {
                  onChange({ target: { value: b.id } });
                  setIsOpen(false);
                }}
              >
                <span>{b.name}</span>
                <span className="font-mono tabular-nums text-[10px] text-zinc-400">Stok: {b.stock} {b.unit}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function StockTransferModal({ isOpen, onClose, onSuccess }) {
  const user = useAppStore(state => state.user);
  
  // Resolve outlet ID from user info or storage fallback
  const resolvedOutletId = user?.outlet_id || user?.outletId || '22222222-2222-2222-2222-222222222222'; 

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Master Data
  const [outlets, setOutlets] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [bahanList, setBahanList] = useState([]);

  // Form State
  const [transferType, setTransferType] = useState('intra'); // 'intra' or 'inter'
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  
  // Destination State
  const [destWarehouseId, setDestWarehouseId] = useState(''); // for intra
  const [destOutletId, setDestOutletId] = useState(''); // for inter

  // Transfer Items
  const [items, setItems] = useState([{ bahanId: '', qty: 1, selectedUnit: '', multiplier: 1 }]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [outletsRes, warehousesRes, bahanRes] = await Promise.all([
        api.getOutlets().catch(() => []),
        api.getWarehouses().catch(() => []),
        api.getBahan().catch(() => [])
      ]);
      setOutlets(outletsRes || []);
      setWarehouses(warehousesRes || []);
      setBahanList(bahanRes || []);
    } catch (e) {
      console.error("Failed loading transfer setup:", e);
    } finally {
      setLoading(false);
    }
  };

  // Find source outlet name
  const sourceOutlet = outlets.find(o => o.id === resolvedOutletId);
  const sourceOutletName = sourceOutlet ? sourceOutlet.name : 'Outlet Saat Ini';

  // Filter warehouses based on source outlet
  const sourceWarehouses = warehouses.filter(w => w.outlet_id === resolvedOutletId);

  // Filter warehouses for destination (same outlet, excluding source warehouse)
  const destWarehouses = warehouses.filter(w => w.outlet_id === resolvedOutletId && w.id !== sourceWarehouseId);

  // Auto-select first source warehouse (or Main Warehouse) when warehouses load
  useEffect(() => {
    if (transferType === 'inter') {
      // Branch transfer MUST start from Main Warehouse
      const mainWH = sourceWarehouses.find(w => w.is_main);
      if (mainWH) {
        setSourceWarehouseId(mainWH.id);
      } else if (sourceWarehouses.length > 0) {
        setSourceWarehouseId(sourceWarehouses[0].id);
      }
    } else {
      if (sourceWarehouses.length > 0 && !sourceWarehouseId) {
        setSourceWarehouseId(sourceWarehouses[0].id);
      }
    }
  }, [resolvedOutletId, warehouses, transferType]);

  // Adjust items unit and price mapping
  const handleItemChange = (index, field, val) => {
    const newItems = [...items];
    newItems[index][field] = val;

    // Side effect when bahanId changes: set default unit & multiplier
    if (field === 'bahanId') {
      const selectedBahan = bahanList.find(b => b.id === val);
      if (selectedBahan) {
        newItems[index].selectedUnit = selectedBahan.unit;
        newItems[index].multiplier = 1;
      } else {
        newItems[index].selectedUnit = '';
        newItems[index].multiplier = 1;
      }
    }

    // Side effect when selectedUnit changes
    if (field === 'selectedUnit') {
      const selectedBahan = bahanList.find(b => b.id === newItems[index].bahanId);
      if (selectedBahan) {
        if (val === selectedBahan.unit) {
          newItems[index].multiplier = 1;
        } else {
          const conversion = (selectedBahan.conversions || []).find(c => c.from_unit === val);
          newItems[index].multiplier = conversion ? (Number(conversion.multiplier) || 1) : 1;
        }
      }
    }

    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { bahanId: '', qty: 1, selectedUnit: '', multiplier: 1 }]);
  };

  const removeItemRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter(i => i.bahanId && Number(i.qty) > 0);
    if (validItems.length === 0) {
      alert("Pilih bahan baku dan masukkan kuantitas yang valid!");
      return;
    }

    // Validate stock constraints
    for (const item of validItems) {
      const selectedBahan = bahanList.find(b => b.id === item.bahanId);
      if (selectedBahan) {
        const transferQtyInBaseUnit = Number(item.qty) * (Number(item.multiplier) || 1);
        const availableStock = Number(selectedBahan.stock || 0);
        if (transferQtyInBaseUnit > availableStock) {
          alert(`Stok tidak mencukupi untuk ${selectedBahan.name}! Tersedia: ${availableStock} ${selectedBahan.unit}. Diminta: ${transferQtyInBaseUnit} ${selectedBahan.unit}.`);
          return;
        }
      }
    }

    if (transferType === 'intra' && !destWarehouseId) {
      alert("Pilih gudang tujuan transfer internal!");
      return;
    }

    if (transferType === 'inter' && !destOutletId) {
      alert("Pilih outlet tujuan transfer!");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        sourceWarehouseId,
        destWarehouseId: transferType === 'intra' ? destWarehouseId : null,
        destOutletId: transferType === 'inter' ? destOutletId : null,
        items: validItems.map(i => ({
          bahanId: i.bahanId,
          qty: Number(i.qty) * (Number(i.multiplier) || 1) // convert to base unit before sending to server
        }))
      };
      
      const res = await api.executeTransfer(payload);
      alert(res.message || 'Transfer stok berhasil diselesaikan!');
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.message || 'Gagal mengeksekusi transfer stok.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-zinc-950/60 backdrop-blur-sm">
      <Card className="w-full max-w-4xl border border-zinc-200 dark:border-zinc-700 shadow-2xl bg-white dark:bg-zinc-800 rounded-lg overflow-hidden flex flex-col max-h-[85vh]">
        <CardHeader className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80">
          <div className="flex justify-between items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5">
                <ArrowRightLeft size={10} /> Stock Relocation
              </div>
              <CardTitle className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                Buat Mutasi Stok
              </CardTitle>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </CardHeader>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 animate-pulse">Memuat Struktur Gudang...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar flex-1 flex flex-col text-sm">
            <CardContent className="p-6 space-y-5 flex-1">
              
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setTransferType('intra')}
                  className={cn(
                    "py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                    transferType === 'intra'
                      ? "bg-white dark:bg-zinc-800 text-amber-500 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  )}
                >
                  Mutasi Internal (Intra-Outlet)
                </button>
                <button
                  type="button"
                  onClick={() => setTransferType('inter')}
                  className={cn(
                    "py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                    transferType === 'inter'
                      ? "bg-white dark:bg-zinc-800 text-amber-500 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  )}
                >
                  Mutasi Cabang (Inter-Outlet)
                </button>
              </div>

              {/* Status Alert */}
              <div className={cn(
                "p-3 rounded-lg border flex items-center gap-3",
                transferType === 'intra'
                  ? "bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/80"
                  : "bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/80"
              )}>
                <CheckCircle2 size={14} className="shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {transferType === 'intra'
                    ? "Tipe: Mutasi Internal Outlet (Tanpa Jurnal Akuntansi - Stok berpindah secara fisik)"
                    : "Tipe: Transfer Antar Cabang (Memicu Jurnal Akuntansi Persediaan Otomatis)"}
                </span>
              </div>

              {/* Proximity / Node Layout */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Left Node (Source) */}
                  <div className="flex-1 space-y-1">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Node Asal</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-amber-500 shrink-0">
                        <Store size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">{sourceOutletName}</p>
                        {transferType === 'intra' ? (
                          <div className="mt-1">
                            <Select
                              value={sourceWarehouseId}
                              onChange={e => setSourceWarehouseId(e.target.value)}
                              className="h-8 py-1 px-2 text-[10px] min-w-[150px]"
                            >
                              {sourceWarehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name} {w.is_main ? '(Utama)' : ''}</option>
                              ))}
                            </Select>
                          </div>
                        ) : (
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                            Gudang Utama (Otomatis)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex items-center justify-center px-2">
                    <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* Right Node (Destination) */}
                  <div className="flex-1 space-y-1">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Node Tujuan</p>
                    
                    {transferType === 'intra' ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                          <Store size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">{sourceOutletName}</p>
                          <Select
                            value={destWarehouseId}
                            onChange={e => setDestWarehouseId(e.target.value)}
                            className="h-8 py-1 px-2 text-[10px] mt-1"
                          >
                            <option value="">-- Pilih gudang --</option>
                            {destWarehouses.map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                          <Store size={18} />
                        </div>
                        <div className="flex-1">
                          <Select
                            value={destOutletId}
                            onChange={e => setDestOutletId(e.target.value)}
                            className="h-8 py-1 px-2 text-[10px]"
                          >
                            <option value="">-- Pilih outlet tujuan --</option>
                            {outlets.filter(o => o.id !== resolvedOutletId).map(o => (
                              <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                          </Select>
                          <p className="text-[8px] text-zinc-500 italic uppercase mt-1">
                            * Otomatis dikirim ke Gudang Utama outlet tujuan.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Material Lines */}
              <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-700 pt-5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    Daftar Bahan Baku
                  </label>
                </div>

                {/* Table Headers */}
                <div className="hidden md:flex gap-4 px-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest pb-1 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex-1">Pilih Bahan</div>
                  <div className="w-32">Kuantitas</div>
                  <div className="w-28">Satuan</div>
                  <div className="w-36 text-right">Unit Cost</div>
                  <div className="w-10"></div>
                </div>

                <div className="space-y-1.5 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {items.map((item, idx) => {
                    const selectedBahan = bahanList.find(b => b.id === item.bahanId) || {};
                    const conversions = selectedBahan.conversions || [];
                    
                    // Available units: Base Unit + Conversions
                    const availableUnits = [selectedBahan.unit, ...conversions.map(c => c.from_unit)].filter(Boolean);

                    // Real-time stock verification
                    const transferQtyInBaseUnit = Number(item.qty) * (Number(item.multiplier) || 1);
                    const availableStock = Number(selectedBahan.stock || 0);
                    const isOverStock = transferQtyInBaseUnit > availableStock;

                    // Temporary text search state local to row or inline filter
                    return (
                      <div key={idx} className="flex flex-col gap-1.5 pt-1.5 first:pt-0">
                        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
                          {/* Searchable selector */}
                          <div className="flex-1 min-w-0">
                            <span className="md:hidden text-[8px] font-black uppercase text-zinc-400 block mb-1">Pilih Bahan</span>
                            <div className="relative w-full">
                              <SearchableBahanSelect
                                value={item.bahanId}
                                onChange={e => handleItemChange(idx, 'bahanId', e.target.value)}
                                bahanList={bahanList}
                              />
                            </div>
                          </div>

                          <div className="w-full md:w-32">
                            <span className="md:hidden text-[8px] font-black uppercase text-zinc-400 block mb-1">Kuantitas</span>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.qty}
                              onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                              placeholder="Qty"
                              className="font-mono tabular-nums h-10"
                            />
                          </div>

                          <div className="w-full md:w-28">
                            <span className="md:hidden text-[8px] font-black uppercase text-zinc-400 block mb-1">Satuan</span>
                            {availableUnits.length > 1 ? (
                              <Select
                                value={item.selectedUnit}
                                onChange={e => handleItemChange(idx, 'selectedUnit', e.target.value)}
                                className="h-10"
                              >
                                {availableUnits.map(unitName => (
                                  <option key={unitName} value={unitName}>{unitName}</option>
                                ))}
                              </Select>
                            ) : (
                              <div className="h-10 px-3 flex items-center border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-500 uppercase">
                                {selectedBahan.unit || '-'}
                              </div>
                            )}
                          </div>

                          <div className="w-full md:w-36">
                            <span className="md:hidden text-[8px] font-black uppercase text-zinc-400 block mb-1">Unit Cost</span>
                            <div className="h-10 px-3 flex items-center justify-end border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-mono tabular-nums text-zinc-500 font-bold md:text-right">
                              Rp {((selectedBahan.cost || 0) * (item.multiplier || 1)).toLocaleString('id-ID')}
                            </div>
                          </div>

                          <div className="flex items-center justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
                              onClick={() => removeItemRow(idx)}
                              disabled={items.length === 1}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>

                        {/* Real-time warning alert */}
                        {isOverStock && (
                          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase mt-1 px-1">
                            <AlertCircle size={12} />
                            <span>Stok tidak mencukupi! Tersedia: {availableStock} {selectedBahan.unit}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={addItemRow}
                  className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-lg flex items-center justify-center gap-2 text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400 text-xs font-black uppercase tracking-widest transition-all mt-4"
                >
                  <Plus size={14} /> + ADD NEW REQUISITION LINE
                </button>
              </div>

            </CardContent>

            <CardFooter className="p-6 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-700 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 font-black uppercase tracking-widest text-xs"
                onClick={onClose}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 h-11 font-black uppercase tracking-widest text-xs text-white dark:text-zinc-900"
                disabled={actionLoading || items.some(i => {
                  const b = bahanList.find(x => x.id === i.bahanId);
                  return b && (Number(i.qty) * (Number(i.multiplier) || 1) > Number(b.stock));
                })}
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : 'Eksekusi Mutasi'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
