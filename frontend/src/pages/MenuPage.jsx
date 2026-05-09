import { useState, useEffect } from 'react';
import { MENU_CATEGORIES, formatRupiah } from '../data';
import { api } from '../api';
import { 
  Plus, Search, Edit3, Trash2, 
  Grid, List, Image as ImageIcon, 
  FlaskConical, ArrowUpRight, DollarSign,
  ChevronRight, X, Upload, MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";

const emptyForm = {
  name: '', category: 'Kopi', price: 0, cost: 0, icon: '☕', image: '', unit: 'Cup', bom: []
};

function getConversion(bahan) {
  if (!bahan) return { ratio: 1, unit: '' };
  if (bahan.storageType === 'Kemasan') {
    const itemsCount = Number(bahan.packageItemsCount) || 1;
    const vol = Number(bahan.packageItemVolume) || 1;
    const volUnit = (bahan.packageItemVolumeUnit || '').toLowerCase();
    if (volUnit === 'ml' || volUnit === 'gr' || volUnit === 'gram') {
      return { ratio: itemsCount * vol, unit: volUnit === 'gr' ? 'Gram' : 'ml' };
    } else {
      return { ratio: itemsCount, unit: bahan.packageItemUnit || 'Pcs' };
    }
  } else {
    const u = (bahan.unit || '').toLowerCase();
    if (u === 'kg' || u === 'kilogram') return { ratio: 1000, unit: 'Gram' };
    if (u === 'liter' || u === 'l') return { ratio: 1000, unit: 'ml' };
    return { ratio: 1, unit: bahan.unit };
  }
}

function MenuFormModal({ item, onClose, onSave, bahanList }) {
  const [form, setForm] = useState(item || { ...emptyForm });
  const [uploading, setUploading] = useState(false);
  const ICONS = ['☕', '🥛', '🍵', '🧊', '🍮', '🍫', '🥐', '🍩', '🍪', '🧃', '🍹'];

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
    const b = bahanList?.find(x => x.id === Number(row.bahanId));
    if (!b) return sum;
    const conv = getConversion(b);
    return sum + (b.price / conv.ratio) * Number(row.qty);
  }, 0);

  const hppOtomatis = calcHPP(form.bom || []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{item ? 'Edit Produk' : 'Tambah Produk Baru'}</CardTitle>
              <CardDescription>Detail produk dan manajemen resep bahan baku.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Nama Produk</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="cth: Caramel Macchiato" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Kategori</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {MENU_CATEGORIES.filter(c => c !== 'Semua').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Satuan Jual</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    {['Cup', 'Pcs', 'Porsi', 'Botol'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Harga Jual</label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Estimasi HPP</label>
                  <div className="h-9 flex items-center px-3 rounded-md bg-muted/50 border font-bold text-emerald-600">
                    {formatRupiah(hppOtomatis)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Media Produk</label>
              <div className="aspect-square bg-muted/30 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center group relative overflow-hidden transition-all hover:bg-muted/50 hover:border-accent/40">
                {form.image ? (
                  <>
                    <img src={form.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm" onClick={() => document.getElementById('upload-input').click()}>Ubah Foto</Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-background rounded-xl mx-auto flex items-center justify-center shadow-sm">
                      <Upload size={20} className="text-muted-foreground" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Klik untuk unggah gambar produk</p>
                    <input id="upload-input" type="file" className="hidden" onChange={handleUpload} />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('upload-input').click()} disabled={uploading}>
                      {uploading ? 'Mengunggah...' : 'Pilih File'}
                    </Button>
                  </div>
                )}
              </div>
              {!form.image && (
                <div className="flex justify-center gap-2">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setForm({ ...form, icon: ic })} className={cn("w-8 h-8 rounded-lg border transition-all hover:bg-accent hover:text-white", form.icon === ic ? "bg-accent text-white border-accent" : "bg-background text-muted-foreground")}>{ic}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FlaskConical size={14} /> Resep / BOM
              </label>
              <Button variant="outline" size="sm" onClick={() => setForm({ ...form, bom: [...form.bom, { bahanId: '', qty: 0 }] })}>+ Tambah Bahan</Button>
            </div>
            <div className="space-y-2">
              {form.bom.map((row, i) => {
                const b = bahanList.find(x => x.id === Number(row.bahanId));
                const conv = getConversion(b);
                return (
                  <div key={i} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
                    <select 
                      className="flex-3 h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                      value={row.bahanId}
                      onChange={e => {
                        const next = [...form.bom]; next[i].bahanId = e.target.value; setForm({ ...form, bom: next });
                      }}
                    >
                      <option value="">Pilih Bahan Baku</option>
                      {bahanList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <Input 
                      className="flex-1 h-9 text-right font-bold" 
                      type="number" value={row.qty} 
                      onChange={e => {
                        const next = [...form.bom]; next[i].qty = e.target.value; setForm({ ...form, bom: next });
                      }}
                    />
                    <div className="flex-1 flex items-center justify-center text-[10px] font-bold text-muted-foreground bg-muted/30 rounded-md uppercase">{conv.unit || '–'}</div>
                    <Button variant="ghost" size="icon" className="text-destructive h-9 w-9 shrink-0" onClick={() => {
                      const next = form.bom.filter((_, idx) => idx !== i); setForm({ ...form, bom: next });
                    }}><Trash2 size={14} /></Button>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 gap-3">
          <Button variant="outline" className="flex-1 h-12" onClick={onClose}>Batal</Button>
          <Button className="flex-[2] h-12 font-bold bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20" onClick={() => onSave(form)}>Simpan Produk</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function MenuPage() {
  const [menus, setMenus] = useState([]);
  const [bahanList, setBahanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const loadData = async () => {
    try {
      const [m, b] = await Promise.all([api.getMenu().catch(() => []), api.getBahan().catch(() => [])]);
      setMenus(m); setBahanList(b);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = menus.filter(m => (category === 'Semua' || m.category === category) && m.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse font-medium">Memuat katalog...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Katalog Menu</h2>
          <p className="text-muted-foreground mt-1">Kelola produk, harga, dan resep bahan baku.</p>
        </div>
        <Button size="lg" className="h-14 px-8 font-bold gap-2 shadow-xl shadow-accent/20" onClick={() => { setEditItem(null); setShowModal(true); }}>
          <Plus size={20} strokeWidth={3} />
          Tambah Produk
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20 p-2 rounded-2xl border">
        <div className="flex items-center bg-background rounded-xl px-4 h-10 flex-1 max-w-md border shadow-sm">
          <Search size={18} className="text-muted-foreground" />
          <input 
            placeholder="Cari di katalog..." 
            className="bg-transparent border-none outline-none px-3 w-full text-sm font-medium"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {MENU_CATEGORIES.map(c => (
            <Button key={c} variant={category === c ? "default" : "ghost"} size="sm" className="h-8 text-[11px] font-bold uppercase tracking-wider" onClick={() => setCategory(c)}>{c}</Button>
          ))}
        </div>
        <div className="flex border rounded-xl p-1 bg-background shrink-0 shadow-sm">
          <Button variant={viewMode === 'grid' ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}><Grid size={16} /></Button>
          <Button variant={viewMode === 'list' ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}><List size={16} /></Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 auto-rows-max">
          {filtered.map(item => (
            <Card key={item.id} className="group overflow-hidden border-none shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="aspect-square relative overflow-hidden bg-muted">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500 opacity-40">{item.icon || '☕'}</div>
                )}
                {/* Subtle overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
                  <Button size="icon" className="h-8 w-8 bg-background/80 backdrop-blur shadow-lg text-primary hover:bg-background" onClick={() => { setEditItem(item); setShowModal(true); }}>
                    <Edit3 size={14} />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 flex flex-col shrink-0">
                <div>
                  <h3 className="font-bold text-base text-foreground leading-tight truncate group-hover:text-accent transition-colors">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.category}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-lg font-black text-foreground">{formatRupiah(item.price)}</p>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">HPP</p>
                    <p className="text-sm font-bold text-emerald-500">{formatRupiah(item.cost)}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-5 pb-5 pt-0 border-none justify-between">
                 <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1 rounded-full border border-dashed">
                    <FlaskConical size={12} className="text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.bom?.length || 0} Bahan baku</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full text-emerald-600 font-bold text-[10px]">
                    {item.price > 0 ? Math.round(((item.price - item.cost) / item.price) * 100) : 0}% Margin
                 </div>
              </CardFooter>
            </Card>
          ))}
          <button 
            className="aspect-[4/5] rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center p-6 text-center hover:bg-muted/10 hover:border-accent/40 transition-all group"
            onClick={() => { setEditItem(null); setShowModal(true); }}
          >
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:bg-accent group-hover:text-white transition-all mb-4 shadow-sm">
              <Plus size={24} strokeWidth={3} />
            </div>
            <p className="font-bold text-muted-foreground group-hover:text-primary transition-colors">Tambah Produk Baru</p>
          </button>
        </div>
      ) : (
        <Card className="border-none shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b">
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
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0 overflow-hidden border">
                          {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : (item.icon || '☕')}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">{item.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-muted px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-transparent group-hover:border-border transition-all">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-sm">{formatRupiah(item.price)}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-500 text-sm">{formatRupiah(item.cost)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black">
                        <ArrowUpRight size={10} />
                        {item.price > 0 ? Math.round(((item.price - item.cost) / item.price) * 100) : 0}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowModal(true); }}><Edit3 size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => { if(confirm('Hapus produk ini?')){ await api.deleteMenu(item.id); loadData(); } }}><Trash2 size={14} /></Button>
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
          onSave={async (data) => {
            await api.saveMenu(data); loadData(); setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
