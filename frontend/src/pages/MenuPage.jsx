import { useState } from 'react';
import { formatRupiah } from '../utils/formatters';
import { MENU_CATEGORIES } from '../utils/constants';
import { api } from '../api';
import { 
  Plus, Search, Edit3, Trash2, 
  Grid, List, Image as ImageIcon, 
  FlaskConical, ArrowUpRight, DollarSign,
  ChevronRight, X, Upload, MoreHorizontal,
  Coffee, Milk, Droplets, IceCream, Pizza, Cookie
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { useMenuPage, getConversion } from '../hooks/useMenuPage';

const ICON_MAP = {
  'Coffee': Coffee,
  'Milk': Milk,
  'Droplets': Droplets,
  'IceCream': IceCream,
  'Pizza': Pizza,
  'Cookie': Cookie
};

const IconRenderer = ({ iconName, className }) => {
  const IconComp = ICON_MAP[iconName] || Coffee;
  return <IconComp className={className} />;
};

// Helper for resolving full image URL
const getImgUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `http://${window.location.hostname}:3001/api`
    : '/api';
  return `${apiBase}${url}`;
};

const emptyForm = {
  name: '', category: 'Coffee', price: 0, cost: 0, icon: 'Coffee', image: '', unit: 'Cup', bom: []
};



function MenuFormModal({ item, onClose, onSave, bahanList }) {
  const [form, setForm] = useState(item || { ...emptyForm });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      setForm({ ...form, image: res.url });
    } finally {
      setUploading(false);
    }
  };

  const calcHPP = (bom) => bom.reduce((sum, row) => {
    const b = bahanList?.find(x => String(x.id) === String(row.bahanId || row.bahan_id));
    if (!b) return sum;
    const conv = getConversion(b);
    const materialCost = b.cost || b.price || 0;
    return sum + (materialCost / conv.ratio) * Number(row.qty);
  }, 0);

  const hppOtomatis = calcHPP(form.bom || []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4  font-mono tabular-nums">
      <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 rounded-lg border border-border bg-card">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-foreground">
                {item ? 'Edit Produk' : 'Tambah Produk Baru'}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 dark:text-zinc-100 mt-1">
                Detail produk dan manajemen resep bahan baku.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-md"><X size={20} /></Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Nama Produk</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="cth: Caramel Macchiato" className="rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Kategori</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-card text-foreground px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-amber-500/20" value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {MENU_CATEGORIES.filter(c => c !== 'Semua').map(c => <option key={c} className="bg-card text-foreground">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Satuan Jual</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-card text-foreground px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-amber-500/20" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    {['Cup', 'Pcs', 'Porsi', 'Botol'].map(u => <option key={u} className="bg-card text-foreground">{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Harga Jual</label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="rounded-md font-mono tabular-nums" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Estimasi HPP</label>
                  <div className="h-10 flex items-center px-3 rounded-md bg-background border font-black text-primary font-mono tabular-nums">
                    {formatRupiah(hppOtomatis)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Media Produk</label>
              <div className="aspect-square bg-background rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center p-4 text-center group relative overflow-hidden transition-all hover:bg-background hover:border-primary/40">
                {form.image ? (
                  <>
                    <img src={getImgUrl(form.image)} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 ">
                      <Button variant="secondary" size="sm" onClick={() => document.getElementById('upload-input').click()} className="rounded-md">Ubah Foto</Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-card rounded-md mx-auto flex items-center justify-center shadow-sm border">
                      <Upload size={20} className="text-zinc-500 dark:text-zinc-100" />
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Unggah gambar produk</p>
                    <input id="upload-input" type="file" className="hidden" onChange={handleUpload} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('upload-input').click()} className="rounded-md" disabled={uploading}>
                      {uploading ? 'Mengunggah...' : 'Pilih File'}
                    </Button>
                  </div>
                )}
              </div>
              {!form.image && (
                <div className="flex justify-center gap-4">
                  {Object.keys(ICON_MAP).map(key => {
                    const IconComp = ICON_MAP[key];
                    return (
                      <button 
                        key={key} 
                        onClick={() => setForm({ ...form, icon: key })} 
                        className={cn(
                          "w-10 h-10 rounded-md border flex items-center justify-center transition-all hover:scale-110", 
                          form.icon === key 
                            ? "bg-amber-500 text-white dark:text-zinc-100 dark:bg-amber-400 dark:text-zinc-900 border-amber-500 dark:border-amber-400 shadow-lg shadow-amber-500/20 dark:shadow-amber-400/10" 
                            : "bg-card border-border text-zinc-500 dark:text-zinc-100"
                        )}
                      >
                        <IconComp size={18} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 flex items-center gap-2">
                <FlaskConical size={14} /> Resep / BOM
              </label>
              <Button variant="outline" size="sm" className="rounded-md" onClick={() => setForm({ ...form, bom: [...(form.bom || []), { bahanId: '', qty: 0 }] })}>+ Tambah Bahan</Button>
            </div>
            <div className="space-y-2">
              {(form.bom || []).map((row, i) => {
                const b = bahanList.find(x => String(x.id) === String(row.bahanId));
                const conv = getConversion(b);
                return (
                  <div key={i} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
                    <select 
                      className="flex-3 h-10 rounded-md border border-input bg-card text-foreground px-3 text-sm"
                      value={row.bahanId}
                      onChange={e => {
                        const next = [...form.bom]; next[i].bahanId = e.target.value; setForm({ ...form, bom: next });
                      }}
                    >
                      <option value="">Pilih Bahan Baku</option>
                      {(bahanList || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <Input 
                      className="flex-1 h-10 text-right font-black font-mono tabular-nums rounded-md" 
                      type="number" value={row.qty} 
                      onChange={e => {
                        const next = [...form.bom]; next[i].qty = e.target.value; setForm({ ...form, bom: next });
                      }}
                    />
                    <div className="flex-1 flex items-center justify-center text-[10px] font-black text-zinc-500 dark:text-zinc-100 bg-background rounded-md uppercase">{conv.unit || '–'}</div>
                    <Button variant="ghost" size="icon" className="text-destructive h-10 w-10 rounded-md shrink-0" onClick={() => {
                      const next = form.bom.filter((_, idx) => idx !== i); setForm({ ...form, bom: next });
                    }}><Trash2 size={14} /></Button>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 gap-4">
          <Button variant="outline" className="flex-1 h-12 rounded-md" onClick={onClose}>Batal</Button>
          <Button className="flex-[2] h-12 font-black " onClick={() => onSave({ ...form, cost: hppOtomatis })}>Simpan Produk</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function MenuPage({ user }) {
  const {
    bahanList,
    loading,
    search, setSearch,
    category, setCategory,
    showModal, setShowModal,
    editItem, setEditItem,
    viewMode, setViewMode,
    handleDelete,
    handleSave,
    filtered
  } = useMenuPage();

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-amber-500 dark:border-amber-400 border-t-transparent rounded-lg animate-spin" />
      <p className="text-zinc-500 dark:text-zinc-100 animate-pulse font-medium">Memuat katalog...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2.5 py-1 bg-amber- border border-amber-500/20 rounded-sm text-[9px] font-black text-amber-500 uppercase tracking-widest">Katalog Produk</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">Gateway Online</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Katalog <span className="text-amber-500 italic">Menu</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">Manajemen resep bahan baku, estimasi HPP otomatis & kalkulasi margin presisi.</p>
        </div>
        <Button size="lg" className="h-14 px-8 font-black " onClick={() => { setEditItem(null); setShowModal(true); }}>
          <Plus size={20} strokeWidth={3} />
          Tambah Produk
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-background p-2 rounded-lg border border-border">
        <div className="flex items-center bg-card rounded-md px-4 h-10 flex-1 max-w-md border border-border shadow-sm">
          <Search size={18} className="text-zinc-500 dark:text-zinc-100" />
          <input 
            placeholder="Cari di katalog..." 
            className="bg-transparent border-none outline-none px-4 w-full text-sm font-medium text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {MENU_CATEGORIES.map(c => (
            <Button key={c} variant={category === c ? "default" : "ghost"} size="sm" className="h-8 text-[11px] font-black uppercase tracking-wider rounded-md" onClick={() => setCategory(c)}>{c}</Button>
          ))}
        </div>
        <div className="flex border border-border rounded-md p-1 bg-card shrink-0 shadow-sm">
          <Button variant={viewMode === 'grid' ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-md" onClick={() => setViewMode('grid')}><Grid size={16} /></Button>
          <Button variant={viewMode === 'list' ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-md" onClick={() => setViewMode('list')}><List size={16} /></Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 auto-rows-max">
          {filtered.map(item => (
            <Card key={item.id} className="group overflow-hidden border border-border bg-card text-card-foreground shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-lg">
              <div className="aspect-square relative overflow-hidden bg-background">
                {item.image ? (
                  <img src={getImgUrl(item.image)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ">
                    <IconRenderer iconName={item.icon} className="w-16 h-16 text-zinc-500 dark:text-zinc-100" />
                  </div>
                )}
                {/* Subtle overlay on hover */}
                <div className="absolute inset-0 " />
                <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
                  <Button size="icon" className="h-7 w-7 bg-card backdrop-blur shadow-md text-primary hover:bg-card rounded-md border border-border" onClick={() => { setEditItem(item); setShowModal(true); }}>
                    <Edit3 size={12} />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 flex flex-col shrink-0">
                <div>
                  <h3 className="font-bold text-sm text-foreground leading-tight truncate group-hover:text-amber-500 transition-colors">{item.name}</h3>
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-100 mt-0.5 uppercase tracking-widest font-black">{item.category}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-base font-black text-foreground font-mono tabular-nums">{formatRupiah(item.price)}</p>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest leading-none">HPP</p>
                    <p className="text-xs font-bold text-amber-500 dark:text-amber-400 font-mono tabular-nums mt-0.5">{formatRupiah(item.cost)}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-3 pb-3 pt-0 border-none justify-between gap-1.5 flex flex-wrap">
                 <div className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-sm border border-dashed border-border shrink-0">
                    <FlaskConical size={10} className="text-zinc-500 dark:text-zinc-100" />
                    <span className="text-[8px] font-black text-zinc-500 dark:text-zinc-100 uppercase">{item.bom?.length || 0} Resep</span>
                 </div>
                 <div className="flex items-center gap-1 bg-amber- px-2 py-0.5 rounded-sm text-amber-600 dark:text-amber-400 font-black text-[8px] font-mono tabular-nums shrink-0">
                    {item.price > 0 ? Math.round(((item.price - item.cost) / item.price) * 100) : 0}% Mg
                 </div>
              </CardFooter>
            </Card>
          ))}
          <button 
            className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center p-4 text-center hover:bg-background hover:border-primary/40 transition-all group"
            onClick={() => { setEditItem(null); setShowModal(true); }}
          >
            <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 group-hover:">
              <Plus size={20} strokeWidth={3} />
            </div>
            <p className="font-bold text-xs text-zinc-500 dark:text-zinc-100 group-hover:text-primary transition-colors">Tambah Menu</p>
          </button>
        </div>
      ) : (
        <Card className="border-none shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 border-b">
                  <th className="px-6 py-4">Produk</th>
                  <th className="px-6 py-4 text-center">Kategori</th>
                  <th className="px-6 py-4 text-right">Harga Jual</th>
                  <th className="px-6 py-4 text-right">HPP</th>
                  <th className="px-6 py-4 text-center">Margin</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-background transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-background flex items-center justify-center shrink-0 overflow-hidden border border-border">
                          {item.image ? <img src={getImgUrl(item.image)} className="w-full h-full object-cover" /> : <IconRenderer iconName={item.icon} className="w-6 h-6  text-zinc-500 dark:text-zinc-100" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.name}</p>
                          <p className="text-[9px] text-zinc-500 dark:text-zinc-100 uppercase font-black tracking-widest">{item.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-background px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider border border-border text-zinc-500 dark:text-zinc-100">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-sm font-mono tabular-nums text-foreground">{formatRupiah(item.price)}</td>
                    <td className="px-6 py-4 text-right font-bold text-primary text-sm font-mono tabular-nums">{formatRupiah(item.cost)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-amber- text-amber-600 dark:text-amber-400 text-[9px] font-black font-mono tabular-nums border border-amber-500/10">
                        <ArrowUpRight size={10} />
                        {item.price > 0 ? Math.round(((item.price - item.cost) / item.price) * 100) : 0}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1  group-hover: transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => { setEditItem(item); setShowModal(true); }}><Edit3 size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-destructive" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showModal && (
        <MenuFormModal
          item={editItem}
          bahanList={bahanList}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
