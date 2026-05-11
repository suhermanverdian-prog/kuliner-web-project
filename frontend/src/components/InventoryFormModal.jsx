import { useState, useEffect } from 'react';
import { formatRupiah } from '../data';
import { 
  Package, Box, Info, Database, 
  Tag, MapPin, Archive, AlertTriangle,
  X, Save, ChevronRight, Barcode,
  Calendar, CreditCard, Layers,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { cn } from "../lib/utils";

export default function InventoryFormModal({ isOpen, onClose, onSave, initialData, locations, inventoryMeta }) {
  const categories = inventoryMeta?.categories?.length > 0 ? inventoryMeta.categories : ['Bahan Baku', 'Minuman', 'Makanan', 'Kemasan', 'Lainnya'];
  const packageUnits = inventoryMeta?.packageUnits?.length > 0 ? inventoryMeta.packageUnits : ['Karton', 'Dus', 'Ball', 'Box'];
  const itemUnits = inventoryMeta?.itemUnits?.length > 0 ? inventoryMeta.itemUnits : ['Botol', 'Pcs', 'Gram', 'ML', 'Sachet', 'Kg', 'Liter'];

  const initialFormState = {
    name: '',
    category: categories[0],
    location: locations.length > 0 ? locations[0].name : '',
    storageType: 'Satuan Biasa',
    unit: itemUnits[0],
    stock: '',
    minStock: '',
    price: '',
    packageUnit: packageUnits[0],
    packageStock: '',
    packageItemsCount: '',
    packageItemUnit: itemUnits[0],
    packageItemVolume: '',
    packageItemVolumeUnit: 'ml',
    packagePrice: '',
    packageMinStock: '',
    brand: '',
    sku: '',
    expiryDate: '',
    notes: ''
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({ ...initialFormState, ...initialData, storageType: initialData.storageType || 'Satuan Biasa' });
      } else {
        setForm({ ...initialFormState, category: categories[0], unit: itemUnits[0], packageUnit: packageUnits[0], packageItemUnit: itemUnits[0], location: locations[0]?.name || '' });
      }
    }
  }, [isOpen, initialData, inventoryMeta]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!form.name || !form.location) return alert('Nama dan Lokasi wajib diisi!');
    let normalizedData = { ...form };
    normalizedData.stock = Number(form.stock) || 0;
    normalizedData.minStock = Number(form.minStock) || 0;
    normalizedData.price = Number(form.price) || 0;
    
    if (form.storageType === 'Kemasan') {
      normalizedData.packageStock = Number(form.packageStock) || 0;
      normalizedData.packageItemsCount = Number(form.packageItemsCount) || 1;
      normalizedData.packagePrice = Number(form.packagePrice) || 0;
      normalizedData.packageMinStock = Number(form.packageMinStock) || 0;
      normalizedData.price = normalizedData.packageItemsCount > 0 ? normalizedData.packagePrice / normalizedData.packageItemsCount : 0;
      normalizedData.stock = normalizedData.packageStock;
      normalizedData.minStock = normalizedData.packageMinStock;
      normalizedData.unit = form.packageUnit;
    }
    onSave(normalizedData);
  };

  const calculatedUnitPrice = form.packageItemsCount > 0 && form.packagePrice ? Number(form.packagePrice) / Number(form.packageItemsCount) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border-none">
        
        {/* Header */}
        <div className="p-5 border-b bg-muted/10 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
                 <Package size={28} />
              </div>
              <div>
                 <CardTitle className="text-xl font-black">{initialData ? 'Ubah Master Stok' : 'Input Master Stok'}</CardTitle>
                 <CardDescription className="text-[10px] uppercase tracking-widest font-bold">Lengkapi detail barang untuk akurasi HPP</CardDescription>
              </div>
           </div>
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}><X size={20} /></Button>
        </div>

        {/* Scrollable Content */}
        <CardContent className="flex-1 overflow-y-auto p-0 flex flex-col xl:flex-row gap-0">
           
           {/* Form Section */}
           <div className="flex-1 p-5 space-y-10 pb-10">
              
              {/* Part 1: Identity */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent"><Info size={18} /></div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Informasi Dasar</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Nama Barang *</label>
                       <Input className="h-12 text-sm font-bold border-slate-300 bg-slate-50" placeholder="cth: Biji Kopi Robusta" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Kategori *</label>
                       <select className="flex h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-bold shadow-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Lokasi Gudang / Kitchen *</label>
                       <select className="flex h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-bold shadow-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none" value={form.location} onChange={e => setForm({...form, location: e.target.value})}>
                          {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                       </select>
                    </div>
                 </div>
              </div>

              {/* Part 2: Storage Model */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent"><Layers size={18} /></div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Model Penyimpanan</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setForm({...form, storageType: 'Satuan Biasa'})}
                      className={cn(
                        "p-6 rounded-3xl border-2 transition-all text-left space-y-2 group",
                        form.storageType === 'Satuan Biasa' ? "bg-accent/5 border-accent shadow-lg" : "bg-muted/10 border-transparent hover:bg-muted/30"
                      )}
                    >
                       <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors", form.storageType === 'Satuan Biasa' ? "bg-accent text-white" : "bg-muted-foreground/10")}>
                          <Box size={20} />
                       </div>
                       <p className={cn("text-sm font-black", form.storageType === 'Satuan Biasa' ? "text-accent" : "text-primary")}>Satuan Eceran</p>
                       <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">Cocok untuk bahan baku yang dibeli & dipakai per unit (pcs, gr, ml).</p>
                    </button>

                    <button 
                      onClick={() => setForm({...form, storageType: 'Kemasan'})}
                      className={cn(
                        "p-6 rounded-3xl border-2 transition-all text-left space-y-2 group",
                        form.storageType === 'Kemasan' ? "bg-accent/5 border-accent shadow-lg" : "bg-muted/10 border-transparent hover:bg-muted/30"
                      )}
                    >
                       <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors", form.storageType === 'Kemasan' ? "bg-accent text-white" : "bg-muted-foreground/10")}>
                          <Archive size={20} />
                       </div>
                       <p className={cn("text-sm font-black", form.storageType === 'Kemasan' ? "text-accent" : "text-primary")}>Model Kemasan / Grosir</p>
                       <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">Penyimpanan karton/dus dengan penghitungan isi otomatis ke HPP.</p>
                    </button>
                 </div>
              </div>

              {/* Part 3: Metrics */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent"><Database size={18} /></div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Metrik Stok & Harga</h3>
                 </div>

                 {form.storageType === 'Satuan Biasa' ? (
                   <div className="p-8 bg-muted/20 rounded-3xl border-2 border-dashed space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Satuan</label>
                            <select className="flex h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-bold shadow-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                               {itemUnits.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Stok Awal</label>
                            <Input type="number" className="h-11 font-black text-center border-slate-300 bg-slate-50" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Batas Kritis (Min)</label>
                            <Input type="number" className="h-11 font-black text-center border-amber-300 text-amber-600 bg-amber-50" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
                         </div>
                      </div>
                      <div className="space-y-2 max-w-sm">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Harga Beli Per {form.unit}</label>
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs">IDR</span>
                            <Input type="number" className="h-12 pl-12 font-black text-lg text-accent border-slate-300 bg-slate-50" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      <div className="p-8 bg-muted/20 rounded-3xl border-2 border-dashed space-y-6">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Satuan Kemasan</label>
                               <select className="flex h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-bold shadow-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none" value={form.packageUnit} onChange={e => setForm({...form, packageUnit: e.target.value})}>
                                  {packageUnits.map(u => <option key={u} value={u}>{u}</option>)}
                               </select>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Stok Kemasan</label>
                               <Input type="number" className="h-11 font-black text-center" value={form.packageStock} onChange={e => setForm({...form, packageStock: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Harga Beli / {form.packageUnit}</label>
                               <Input type="number" className="h-11 font-black text-accent border-slate-300 bg-slate-50" value={form.packagePrice} onChange={e => setForm({...form, packagePrice: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Batas Aman ({form.packageUnit})</label>
                               <Input type="number" className="h-11 font-black text-amber-600 text-center border-amber-300 bg-amber-50" value={form.packageMinStock} onChange={e => setForm({...form, packageMinStock: e.target.value})} />
                            </div>
                         </div>
                      </div>

                      <div className="p-8 bg-accent/5 rounded-3xl border-2 border-accent/20 border-dashed space-y-6">
                         <p className="text-xs font-black text-accent uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={14} /> Konversi Satuan Eceran (Untuk HPP)
                         </p>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Isi Per {form.packageUnit}</label>
                               <Input type="number" className="h-12 font-black text-center border-slate-300 bg-slate-50" value={form.packageItemsCount} onChange={e => setForm({...form, packageItemsCount: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Satuan Isi</label>
                               <select className="flex h-11 w-full rounded-xl border bg-background px-3 text-sm font-bold" value={form.packageItemUnit} onChange={e => setForm({...form, packageItemUnit: e.target.value})}>
                                  {itemUnits.map(u => <option key={u} value={u}>{u}</option>)}
                               </select>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Netto / Volume</label>
                               <div className="flex bg-background rounded-xl overflow-hidden border shadow-sm">
                                  <input type="number" className="w-full h-12 bg-slate-50 px-3 text-sm font-bold border-none" value={form.packageItemVolume} onChange={e => setForm({...form, packageItemVolume: e.target.value})} />
                                  <select className="h-11 bg-muted px-2 text-[10px] font-black uppercase" value={form.packageItemVolumeUnit} onChange={e => setForm({...form, packageItemVolumeUnit: e.target.value})}>
                                     <option value="ml">ml</option>
                                     <option value="gr">gr</option>
                                  </select>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                 )}
              </div>

              {/* Part 4: Advanced */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent"><Barcode size={18} /></div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Metadata & Expired</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Merek</label>
                       <Input className="h-12 font-bold border-slate-300 bg-slate-50" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">SKU / Barcode</label>
                       <Input className="h-12 font-bold border-slate-300 bg-slate-50" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Tgl Kadaluarsa</label>
                       <Input type="date" className="h-12 font-bold border-slate-300 bg-slate-50" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} />
                       <p className="text-[9px] text-muted-foreground mt-1 px-1 italic font-medium">Format: hari/bulan/tahun (Klik ikon kalender untuk memilih)</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Preview Sidebar */}
           <div className="w-full xl:w-[380px] bg-muted/30 border-l p-8 space-y-8 flex flex-col items-center">
              <div className="sticky top-8 w-full space-y-8">
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center">Live Preview Card</p>
                 
                 <Card className="w-full border-none shadow-2xl overflow-hidden bg-background ring-1 ring-muted transition-all duration-500">
                    <div className="p-8 flex flex-col items-center text-center space-y-4">
                       <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center text-4xl shadow-inner border-4 border-white">
                          {form.storageType === 'Kemasan' ? '📦' : '🥣'}
                       </div>
                       <div>
                          <h4 className="text-xl font-black text-primary truncate max-w-[280px]">{form.name || 'Nama Produk'}</h4>
                          <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-full border border-accent/20 mt-2 inline-block">
                             {form.category}
                          </span>
                       </div>
                    </div>
                    
                    <div className="p-8 bg-muted/10 border-t space-y-6">
                       <div className="flex justify-between items-end">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Kuantitas</p>
                             <p className="text-lg font-black text-primary">
                                {form.storageType === 'Kemasan' ? `${form.packageStock || 0} ${form.packageUnit}` : `${form.stock || 0} ${form.unit}`}
                             </p>
                          </div>
                          <div className="text-right space-y-1">
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Harga / Unit</p>
                             <p className="text-lg font-black text-accent">
                                {formatRupiah(form.storageType === 'Kemasan' ? calculatedUnitPrice : form.price)}
                             </p>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground">
                             <span>Health Status</span>
                             <span className="text-emerald-600">Perfect</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                             <div className="h-full bg-emerald-500 w-[80%] rounded-full" />
                          </div>
                       </div>

                       <div className="p-4 bg-background/50 rounded-2xl border border-dashed text-[10px] font-medium italic text-muted-foreground leading-relaxed">
                          {form.storageType === 'Kemasan' 
                            ? `Sistem akan menghitung HPP otomatis berdasarkan ${form.packageItemsCount || 0} unit ${form.packageItemUnit.toLowerCase()} per ${form.packageUnit.toLowerCase()}.`
                            : `Barang akan dikelola langsung dalam satuan ${form.unit.toLowerCase()} untuk perhitungan modal.`}
                       </div>
                    </div>
                 </Card>

                 <div className="p-6 bg-accent/5 rounded-3xl border border-accent/20 flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white shrink-0 shadow-lg shadow-accent/20">
                       <AlertCircle size={24} />
                    </div>
                    <div>
                       <p className="text-xs font-black text-accent uppercase tracking-widest leading-none">Smart Helper</p>
                       <p className="text-[10px] font-medium text-muted-foreground mt-1 leading-normal">Gunakan Model Kemasan jika Anda membeli barang dalam skala grosir untuk memudahkan pelacakan inventory.</p>
                    </div>
                 </div>
              </div>
           </div>
        </CardContent>

        <div className="p-5 border-t bg-background flex items-center justify-end gap-3">
           <Button variant="ghost" className="h-11 px-6 font-bold text-muted-foreground" onClick={onClose}>Batalkan</Button>
           <Button className="h-11 px-10 font-black bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20 gap-2" onClick={handleSave}>
              <Save size={18} /> {initialData ? 'Perbarui Barang' : 'Daftarkan Barang'}
           </Button>
        </div>
      </Card>
    </div>
  );
}
