import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../data';
import { api } from '../api';
import InventoryFormModal from '../components/InventoryFormModal';
import { 
  Package, Search, Filter, Plus, 
  MapPin, Settings, RefreshCw, 
  Trash2, Edit3, MoreHorizontal,
  ChevronRight, AlertTriangle, CheckCircle2,
  PackageOpen, Warehouse, Archive, Box,
  ArrowRightLeft, MoreVertical, 
  ArrowUpRight, ArrowDownRight, Scale,
  History, ClipboardCheck, X, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";

function getConversion(bahan) {
  if (!bahan) return { ratio: 1, unit: 'Unit' };
  const u = (bahan.unit || '').toLowerCase();
  const name = (bahan.name || '').toLowerCase();
  
  if (u === 'kg' || u === 'kilogram' || name.includes('kopi') || name.includes('bubuk')) 
    return { ratio: u === 'kg' ? 1000 : 1, unit: 'Gram' };
    
  if (u === 'liter' || u === 'l' || name.includes('susu') || name.includes('sirup') || name.includes('cair')) 
    return { ratio: u === 'liter' ? 1000 : 1, unit: 'ml' };

  if (u === 'dus' || u === 'karton' || u === 'pack')
    return { ratio: 1, unit: 'Pcs/Gram' };
    
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
  
  if ((unit === 'DUS' || unit === 'KARTON') && (mUnit === 'KG' || mUnit === 'LITER')) {
    return item.stock * 12; 
  }
  
  return item.stock;
}

const TagInput = ({ label, tags, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !tags.includes(val)) onChange([...tags, val]);
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-3 p-4 bg-muted/20 rounded-2xl border">
      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">{label}</label>
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-background rounded-xl border border-dashed">
        {tags.length === 0 && <span className="text-[10px] text-muted-foreground italic p-2">Belum ada data</span>}
        {tags.map((tag, index) => (
          <span key={index} className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 border border-accent/20">
            {tag}
            <button onClick={() => removeTag(index)} className="hover:text-destructive transition-colors"><X size={12} /></button>
          </span>
        ))}
      </div>
      <Input 
        className="h-10 text-xs border-none bg-background shadow-inner" 
        value={inputValue} 
        onChange={e => setInputValue(e.target.value)} 
        onKeyDown={handleKeyDown} 
        placeholder="Ketik & Enter untuk menambah..." 
      />
    </div>
  );
};

export default function InventoriPage() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{"name":"Admin"}'));
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [bahan, setBahan] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [inventoryMeta, setInventoryMeta] = useState({ categories: [], packageUnits: [], itemUnits: [] });
  const [transferForm, setTransferForm] = useState({ bahanName: '', fromLocation: '', toLocation: '', qty: 0 });
  const [locForm, setLocForm] = useState({ name: '', type: 'Warehouse' });
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjItem, setAdjItem] = useState(null);
  const [adjForm, setAdjForm] = useState({ type: 'Pengurangan', reason: 'Waste/Basi', qty: 0 });
  const [isOpnameMode, setIsOpnameMode] = useState(false);
  const [opnameData, setOpnameData] = useState({});
  const [metaForm, setMetaForm] = useState({ categories: [], packageUnits: [], itemUnits: [] });

  const loadData = async () => {
    try {
      setLoading(true);
      const [bahanData, locData, metaData] = await Promise.all([api.getBahan(), api.getLocations(), api.getInventoryMeta()]);
      setBahan(bahanData);
      setLocations(locData);
      setInventoryMeta(metaData);
      setMetaForm({
        categories: metaData.categories || [],
        packageUnits: metaData.packageUnits || [],
        itemUnits: metaData.itemUnits || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const safeBahan = Array.isArray(bahan) ? bahan : [];
  const safeLocations = Array.isArray(locations) ? locations : [];

  const filtered = safeBahan.filter(b => {
    const matchSearch = (b.name || '').toLowerCase().includes(search.toLowerCase());
    const matchLoc = locationFilter === 'Semua' || b.location === locationFilter;
    return matchSearch && matchLoc;
  });

  const openAdd = () => { setEditItem(null); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setShowModal(true); };

  const handleSave = async (formData) => {
    await api.saveBahan({ ...formData, id: editItem?.id });
    loadData();
    setShowModal(false);
  };

  const handleTransfer = async () => {
    const sourceBahan = safeBahan.find(b => b.name === transferForm.bahanName && b.location === transferForm.fromLocation);
    if (!sourceBahan || !transferForm.toLocation || transferForm.qty <= 0) return alert('Data transfer tidak lengkap atau stok tidak ditemukan');
    await api.transferStock({ ...transferForm, bahanId: sourceBahan.id });
    loadData();
    setShowTransferModal(false);
  };

  const handleSaveMeta = async () => {
    await api.saveInventoryMeta(metaForm);
    loadData();
    setShowSettingsModal(false);
  };

  const handleSaveLocation = async () => {
    if (!locForm.name) return alert('Nama lokasi wajib diisi');
    await api.saveLocation(locForm);
    loadData();
    setShowLocationModal(false);
    setLocForm({ name: '', type: 'Warehouse' });
  };

  const handleDeleteLocation = async (id) => {
    if (window.confirm('Hapus lokasi ini?')) {
      await api.deleteLocation(id);
      loadData();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus bahan ini?')) {
      await api.deleteBahan(id);
      loadData();
    }
  };

  const handleAdjustment = async () => {
    if (adjForm.qty <= 0) return alert('Jumlah harus lebih dari 0');
    try {
      setLoading(true);
      await fetch(`${api.url}/inventory/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bahanId: adjItem.id,
          changeQty: adjForm.type === 'Penambahan' ? adjForm.qty : -adjForm.qty,
          type: 'Adjustment',
          reason: adjForm.reason,
          userName: user?.name
        })
      });
      loadData();
      setShowAdjModal(false);
      setAdjForm({ type: 'Pengurangan', reason: 'Waste/Basi', qty: 0 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFinalizeOpname = async () => {
    if (!window.confirm('Finalisasi Stock Opname? Stok akan diperbarui sesuai input fisik.')) return;
    setLoading(true);
    try {
      const promises = Object.keys(opnameData).map(id => {
        const item = safeBahan.find(b => b.id === Number(id));
        if (!item) return null;
        return fetch(`${api.url}/inventory/adjust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bahanId: item.id,
            nextStock: Number(opnameData[id]),
            type: 'Opname',
            reason: 'Stock Opname Rutin',
            userName: user?.name
          })
        });
      }).filter(Boolean);
      await Promise.all(promises);
      setIsOpnameMode(false);
      setOpnameData({});
      loadData();
    } finally { setLoading(false); }
  };

  const getStockStatus = (item) => {
    const ratio = item.stock / (item.minStock || 1);
    if (item.stock === 0) return { label: 'HABIS', color: 'text-destructive', bg: 'bg-destructive/10', barCls: 'bg-destructive', pct: 0 };
    if (ratio < 1) return { label: 'LOW', color: 'text-amber-600', bg: 'bg-amber-600/10', barCls: 'bg-amber-500', pct: Math.min((ratio * 100), 100) };
    return { label: 'AMAN', color: 'text-emerald-600', bg: 'bg-emerald-600/10', barCls: 'bg-emerald-500', pct: Math.min((ratio / 2 * 100), 100) };
  };

  if (loading && bahan.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse font-medium">Sinkronisasi gudang & stok...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventori & Bahan Baku</h2>
          <p className="text-muted-foreground mt-1">Kelola pergerakan stok, gudang, dan ambang batas ketersediaan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={isOpnameMode ? "destructive" : "outline"} className="h-11 font-black gap-2 border-accent text-accent" onClick={() => setIsOpnameMode(!isOpnameMode)}>
            {isOpnameMode ? <Trash2 size={18} /> : <ClipboardCheck size={18} />}
            {isOpnameMode ? 'Batal Opname' : 'Stock Opname'}
          </Button>
          {isOpnameMode && (
            <Button className="h-11 font-black gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200" onClick={handleFinalizeOpname}>
              <CheckCircle2 size={18} /> Simpan Hasil Opname
            </Button>
          )}
          <Button className="h-11 font-black gap-2 bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20" onClick={openAdd}>
            <Plus size={20} /> Tambah Barang Baru
          </Button>
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border" onClick={() => setShowSettingsModal(true)}>
            <Settings size={20} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-2xl shadow-sm border border-muted/20">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              className="pl-12 h-12 rounded-xl border-none bg-muted/20 focus:ring-accent" 
              placeholder="Cari nama bahan baku..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <select 
          className="h-12 px-4 rounded-xl border-none bg-muted/20 font-bold text-sm min-w-[180px] w-full sm:w-auto"
          value={locationFilter} 
          onChange={e => setLocationFilter(e.target.value)}
         >
           <option value="Semua">Semua Lokasi</option>
           {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
         </select>
         <Button variant="outline" className="h-12 w-full sm:w-auto font-black gap-2 border-accent text-accent hover:bg-accent/5" onClick={() => setShowTransferModal(true)}>
            <ArrowRightLeft size={18} /> Transfer Stok
         </Button>
      </div>

      <Card className="border-none shadow-xl bg-card overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b">
                     <th className="px-6 py-4">Bahan Baku</th>
                     <th className="px-6 py-4">Satuan</th>
                     <th className="px-6 py-4">Ketersediaan</th>
                     <th className="px-6 py-4">Modal / Unit</th>
                     <th className="px-6 py-4">Lokasi</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y">
                  {filtered.map(item => {
                    const st = getStockStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-muted/10 transition-colors group">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors shadow-sm">
                                  <Package size={20} />
                               </div>
                               <div>
                                  <p className="text-sm font-black">{item.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Min. Stok: {getMediumQty({...item, stock: item.minStock})} {getMediumUnit(item)}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded border border-amber-200">{getMediumUnit(item)}</span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="space-y-2 max-w-[120px]">
                               <p className="text-sm font-black">{getMediumQty(item).toLocaleString('id-ID')} <span className="text-[10px] text-muted-foreground ml-1">{getMediumUnit(item)}</span></p>
                               <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                                  <div className={cn("h-full transition-all duration-1000", st.barCls)} style={{ width: `${st.pct}%` }} />
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4 font-black text-sm">{formatRupiah(item.price)}</td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                               <MapPin size={12} className="text-accent" /> {item.location}
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent shadow-sm",
                              st.bg, st.color
                            )}>
                               {st.label}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                                {isOpnameMode ? (
                                   <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-accent/20">
                                      <span className="text-[10px] font-black px-2">FISIK:</span>
                                      <input 
                                        type="number" 
                                        className="w-20 h-8 bg-background border rounded px-2 text-sm font-bold focus:ring-1 ring-accent outline-none"
                                        placeholder={item.stock}
                                        value={opnameData[item.id] ?? ''}
                                        onChange={e => setOpnameData({...opnameData, [item.id]: e.target.value})}
                                      />
                                   </div>
                                ) : (
                                  <>
                                    <Button variant="ghost" size="icon" title="Penyesuaian / Waste" className="h-8 w-8 text-amber-600 hover:bg-amber-50" onClick={() => { setAdjItem(item); setShowAdjModal(true); }}><Scale size={14} /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-accent/10" onClick={() => openEdit(item)}><Edit3 size={14} /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></Button>
                                  </>
                                )}
                             </div>
                         </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                       <td colSpan="7" className="py-24 text-center opacity-30">
                          <PackageOpen size={64} className="mx-auto mb-4" strokeWidth={1} />
                          <p className="font-black text-xl">Stok Tidak Ditemukan</p>
                          <p className="text-xs uppercase tracking-widest font-bold">Coba ubah kata kunci atau lokasi filter</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </Card>

      <InventoryFormModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSave={handleSave} 
        initialData={editItem} 
        locations={locations}
        inventoryMeta={inventoryMeta}
      />
      
      {showAdjModal && adjItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <Scale className="text-amber-600" /> Penyesuaian Stok
              </CardTitle>
              <CardDescription>{adjItem.name} ({adjItem.location})</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                {['Pengurangan', 'Penambahan'].map(t => (
                  <button key={t} onClick={() => setAdjForm({...adjForm, type: t})} className={cn("py-2 rounded-lg text-xs font-black uppercase transition-all", adjForm.type === t ? "bg-background shadow-sm text-accent" : "text-muted-foreground")}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Alasan</label>
                <select className="w-full h-11 bg-transparent border rounded-xl px-4 text-sm font-bold" value={adjForm.reason} onChange={e => setAdjForm({...adjForm, reason: e.target.value})}>
                  <option>Waste/Basi</option>
                  <option>Barang Rusak</option>
                  <option>Kesalahan Input</option>
                  <option>Pemberian Gratis</option>
                  <option>Lainnya</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Koreksi Stok / Waste ({getConversion(adjItem).unit})
                </label>
                <Input 
                  type="number" 
                  value={adjForm.qty} 
                  onChange={e => setAdjForm({...adjForm, qty: Number(e.target.value)})} 
                  className="h-12 font-black text-2xl focus:ring-accent bg-muted/10 border-none rounded-2xl" 
                  placeholder={`0 ${getConversion(adjItem).unit}`}
                />
                <p className="text-[10px] text-muted-foreground font-medium px-1">
                  * Masukkan angka dalam satuan <strong>{getConversion(adjItem).unit}</strong>. <br/>
                  Contoh: Jika tumpah sedikit, masukkan 10 atau 20.
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 gap-2">
              <Button variant="outline" className="flex-1 font-bold" onClick={() => setShowAdjModal(false)}>Batal</Button>
              <Button className="flex-1 font-black bg-amber-600 hover:bg-amber-700" onClick={handleAdjustment}>Simpan</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><ArrowRightLeft className="text-accent" /> Transfer Stok</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowTransferModal(false)}><X size={20} /></Button>
              </div>
              <CardDescription>Pindahkan bahan baku antar lokasi penyimpanan.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Pilih Bahan Baku</label>
                  <select 
                    className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm font-bold shadow-sm"
                    value={transferForm.bahanName} 
                    onChange={e => setTransferForm({...transferForm, bahanName: e.target.value, fromLocation: ''})}
                  >
                    <option value="">-- Pilih Bahan --</option>
                    {[...new Set(bahan.map(b => b.name))].map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Asal</label>
                     <select className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm font-bold" value={transferForm.fromLocation} onChange={e => setTransferForm({...transferForm, fromLocation: e.target.value})}>
                        <option value="">-- Asal --</option>
                        {bahan.filter(b => b.name === transferForm.bahanName && b.stock > 0).map(b => (
                          <option key={b.id} value={b.location}>{b.location} ({b.stock})</option>
                        ))}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Tujuan</label>
                     <select className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm font-bold" value={transferForm.toLocation} onChange={e => setTransferForm({...transferForm, toLocation: e.target.value})}>
                        <option value="">-- Tujuan --</option>
                        {locations.filter(l => l.name !== transferForm.fromLocation).map(l => (
                          <option key={l.id} value={l.name}>{l.name}</option>
                        ))}
                     </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Jumlah Transfer</label>
                  <Input type="number" className="h-12 font-black text-lg text-center" value={transferForm.qty} onChange={e => setTransferForm({...transferForm, qty: Number(e.target.value)})} />
               </div>
            </CardContent>
            <CardFooter className="border-t pt-6 gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowTransferModal(false)}>Batal</Button>
              <Button className="flex-[2] font-black bg-accent hover:bg-accent/90" onClick={handleTransfer}>Jalankan Transfer</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {showLocationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b pb-4">
               <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><MapPin className="text-accent" /> Lokasi Penyimpanan</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowLocationModal(false)}><X size={20} /></Button>
               </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                    <Warehouse size={12} /> Daftar Lokasi Aktif
                  </label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {locations.map(l => (
                      <span key={l.id} className="px-3 py-1.5 bg-muted rounded-xl flex items-center gap-2 text-[10px] font-black group shadow-sm border">
                        {l.name} <span className="opacity-40">{l.type}</span>
                        <button onClick={() => handleDeleteLocation(l.id)} className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
               </div>

               <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                     <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Nama Lokasi Baru</label>
                     <Input value={locForm.name} onChange={e => setLocForm({...locForm, name: e.target.value})} placeholder="cth: Gudang Beku" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Tipe Lokasi</label>
                     <select className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm font-bold shadow-sm" value={locForm.type} onChange={e => setLocForm({...locForm, type: e.target.value})}>
                        <option>Warehouse</option>
                        <option>Kitchen</option>
                        <option>Outlet</option>
                        <option>Fridge</option>
                     </select>
                  </div>
                  <Button className="w-full h-11 font-black bg-primary" onClick={handleSaveLocation}>
                     <Save size={18} className="mr-2" /> Simpan Lokasi
                  </Button>
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Settings className="text-accent" /> Master Konfigurasi</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowSettingsModal(false)}><X size={20} /></Button>
              </div>
              <CardDescription>Atur metadata global untuk kategorisasi inventori.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <TagInput label="Kategori Produk" tags={metaForm.categories} onChange={tags => setMetaForm({...metaForm, categories: tags})} />
              <TagInput label="Satuan Kemasan (Bulk)" tags={metaForm.packageUnits} onChange={tags => setMetaForm({...metaForm, packageUnits: tags})} />
              <TagInput label="Satuan Eceran (Retail)" tags={metaForm.itemUnits} onChange={tags => setMetaForm({...metaForm, itemUnits: tags})} />
            </CardContent>
            <CardFooter className="border-t pt-6 gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSettingsModal(false)}>Batal</Button>
              <Button className="flex-[2] font-black bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20" onClick={handleSaveMeta}>Simpan Perubahan</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
