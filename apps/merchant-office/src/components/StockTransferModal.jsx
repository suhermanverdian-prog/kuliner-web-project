import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Plus, Trash2, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { api } from '../api';
import { cn } from '../lib/utils';

export default function StockTransferModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Master Data
  const [outlets, setOutlets] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [bahanList, setBahanList] = useState([]);

  // Form State
  const [sourceOutletId, setSourceOutletId] = useState('');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [transferType, setTransferType] = useState('intra'); // 'intra' or 'inter'
  
  // Destination State
  const [destWarehouseId, setDestWarehouseId] = useState(''); // for intra
  const [destOutletId, setDestOutletId] = useState(''); // for inter

  // Transfer Items
  const [items, setItems] = useState([{ bahanId: '', qty: 1 }]);

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
      
      // Auto-select source if outlets exist
      if (outletsRes && outletsRes.length > 0) {
        setSourceOutletId(outletsRes[0].id);
      }
    } catch (e) {
      console.error("Failed loading transfer setup:", e);
    } finally {
      setLoading(false);
    }
  };

  // Filter warehouses based on source outlet
  const sourceWarehouses = warehouses.filter(w => w.outlet_id === sourceOutletId);

  // Filter warehouses for destination (same outlet, excluding source warehouse)
  const destWarehouses = warehouses.filter(w => w.outlet_id === sourceOutletId && w.id !== sourceWarehouseId);

  // Auto-select first source warehouse when source outlet changes
  useEffect(() => {
    if (sourceWarehouses.length > 0) {
      setSourceWarehouseId(sourceWarehouses[0].id);
    } else {
      setSourceWarehouseId('');
    }
  }, [sourceOutletId, warehouses]);

  // Adjust items unit and price mapping
  const handleItemChange = (index, field, val) => {
    const newItems = [...items];
    newItems[index][field] = val;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { bahanId: '', qty: 1 }]);
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
        items: validItems
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/60 backdrop-blur-sm">
      <Card className="w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl bg-white dark:bg-zinc-800 rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
        <CardHeader className="p-8 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80">
          <div className="flex justify-between items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-3">
                <ArrowRightLeft size={10} /> Stock Relocation
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                Buat Mutasi Stok
              </CardTitle>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </CardHeader>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 animate-pulse">Memuat Struktur Gudang...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar flex-1 flex flex-col">
            <CardContent className="p-8 space-y-6 flex-1">
              
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-100 dark:bg-zinc-900 p-2 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setTransferType('intra')}
                  className={cn(
                    "py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
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
                    "py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
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
                "p-4 rounded-lg border flex items-center gap-3",
                transferType === 'intra'
                  ? "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800"
                  : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
              )}>
                <CheckCircle2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {transferType === 'intra'
                    ? "Tipe: Mutasi Internal Outlet (Tanpa Jurnal Akuntansi - Stok berpindah secara fisik)"
                    : "Tipe: Transfer Antar Cabang (Memicu Jurnal Akuntansi Persediaan Otomatis)"}
                </span>
              </div>

              {/* Nodes Selectors */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* Source Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                      Outlet Asal *
                    </label>
                    <Select
                      value={sourceOutletId}
                      onChange={e => setSourceOutletId(e.target.value)}
                    >
                      {outlets.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                      Gudang Asal *
                    </label>
                    <Select
                      value={sourceWarehouseId}
                      onChange={e => setSourceWarehouseId(e.target.value)}
                    >
                      {sourceWarehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name} {w.is_main ? '(Utama)' : ''}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Destination Selection */}
                <div className="space-y-4">
                  {transferType === 'intra' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                        Gudang Tujuan *
                      </label>
                      <Select
                        value={destWarehouseId}
                        onChange={e => setDestWarehouseId(e.target.value)}
                      >
                        <option value="">-- Pilih gudang --</option>
                        {destWarehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                        Outlet Tujuan *
                      </label>
                      <Select
                        value={destOutletId}
                        onChange={e => setDestOutletId(e.target.value)}
                      >
                        <option value="">-- Pilih outlet tujuan --</option>
                        {outlets.filter(o => o.id !== sourceOutletId).map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </Select>
                      <p className="text-[9px] text-zinc-500 italic uppercase">
                        * Transfer antar outlet otomatis dikirim ke Gudang Utama outlet tujuan.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Material Lines */}
              <div className="space-y-4 border-t border-border pt-6">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    Daftar Bahan Baku
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg font-bold"
                    onClick={addItemRow}
                  >
                    <Plus size={12} className="mr-1.5" /> Tambah Bahan
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const selectedBahan = bahanList.find(b => b.id === item.bahanId) || {};
                    return (
                      <div key={idx} className="flex gap-4 items-end bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-border">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-zinc-500">Pilih Bahan</label>
                          <Select
                            value={item.bahanId}
                            onChange={e => handleItemChange(idx, 'bahanId', e.target.value)}
                          >
                            <option value="">-- Pilih bahan --</option>
                            {bahanList.map(b => (
                              <option key={b.id} value={b.id}>{b.name} (Stok: {b.stock} {b.unit})</option>
                            ))}
                          </Select>
                        </div>

                        <div className="w-24 space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-zinc-500">Kuantitas</label>
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

                        <div className="w-28 space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-zinc-500">Unit Cost (Read-only)</label>
                          <div className="h-10 px-3 flex items-center justify-end border border-border bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-mono tabular-nums text-zinc-500 font-bold">
                            Rp {(selectedBahan.cost || 0).toLocaleString('id-ID')}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length === 1}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </CardContent>

            <CardFooter className="p-8 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-700 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 font-black uppercase tracking-widest"
                onClick={onClose}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 h-12 font-black uppercase tracking-widest text-white dark:text-zinc-900"
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Eksekusi Mutasi'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
