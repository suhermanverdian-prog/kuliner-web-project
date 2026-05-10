import { useState, useEffect } from 'react';
import { api } from '../api';
import { formatRupiah } from '../data';
import { 
  ShoppingBag, Truck, Plus, Search, 
  Printer, CheckCircle2, XCircle, Clock,
  MoreHorizontal, ChevronRight, Filter,
  Calendar, FileText, User, MapPin,
  Trash2, Edit3, Save, X, ArrowUpRight,
  Download, History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";

export default function PembelianPage() {
  const [activeTab, setActiveTab] = useState('PO'); // 'PO' or 'SUPPLIER'
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPos] = useState([]);
  const [bahanList, setBahanList] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Modal States
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  
  // Form States
  const [supplierForm, setSupplierForm] = useState({ id: null, name: '', contact: '', address: '' });
  const [poForm, setPoForm] = useState({ supplierId: '', location: '', items: [] });
  const [receiveForm, setReceiveForm] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppData, poData, bahanData, locData] = await Promise.all([
        api.getSuppliers().catch(() => []),
        api.getPO().catch(() => []),
        api.getBahan().catch(() => []),
        api.getLocations().catch(() => [])
      ]);
      setSuppliers(suppData);
      setPos(Array.isArray(poData) ? [...poData].reverse() : []);
      setBahanList(bahanData);
      setLocations(locData);
    } finally {
      setLoading(false);
    }
  };

  // --- SUPPLIER ACTIONS ---
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    await api.saveSupplier(supplierForm);
    setShowSupplierModal(false);
    fetchData();
  };

  const handleDeleteSupplier = async (id) => {
    if (confirm('Yakin ingin menghapus supplier ini?')) {
      await api.deleteSupplier(id);
      fetchData();
    }
  };

  const openEditSupplier = (supp) => {
    setSupplierForm(supp);
    setShowSupplierModal(true);
  };

  // --- PO ACTIONS ---
  const handleAddPoItem = () => {
    setPoForm({ ...poForm, items: [...poForm.items, { bahanId: '', qty: 1, price: 0 }] });
  };

  const updatePoItem = (index, field, value) => {
    const newItems = [...poForm.items];
    newItems[index][field] = value;
    if (field === 'bahanId') {
      const bahan = bahanList.find(b => b.id === Number(value));
      if (bahan) newItems[index].price = bahan.price || 0;
    }
    setPoForm({ ...poForm, items: newItems });
  };

  const removePoItem = (index) => {
    const newItems = poForm.items.filter((_, i) => i !== index);
    setPoForm({ ...poForm, items: newItems });
  };

  const handleSavePO = async (e) => {
    e.preventDefault();
    if (!poForm.supplierId) return alert('Pilih supplier!');
    const validItems = poForm.items.filter(i => i.bahanId && i.qty > 0);
    if (validItems.length === 0) return alert('Pilih minimal 1 bahan baku!');
    
    // Hitung faktor konversi untuk setiap item sebelum dikirim
    const processedItems = validItems.map(item => {
      const b = bahanList.find(x => x.id === Number(item.bahanId));
      let factor = 1;
      let unitLabel = b?.unit || 'unit';

      if (item.buyUnit === 'Box' && b?.storageType === 'Kemasan') {
        factor = (Number(b.packageItemsCount) || 1) * (Number(b.packageItemVolume) || 1);
        unitLabel = b.packageUnit;
      } else if (item.buyUnit === 'Pouch' && b?.storageType === 'Kemasan') {
        factor = Number(b.packageItemVolume) || 1;
        unitLabel = b.packageItemUnit;
      }

      return {
        ...item,
        conversionFactor: factor,
        buyUnitLabel: unitLabel
      };
    });
    
    await api.savePO({ ...poForm, items: processedItems });
    setShowPOModal(false);
    fetchData();
  };

  const openReceiveModal = (po) => {
    setReceiveForm({
      id: po.id,
      poNumber: po.poNumber,
      items: po.items.map(i => ({ ...i, receivedQty: i.qty }))
    });
    setShowReceiveModal(true);
  };

  const handleReceiveUpdateQty = (index, value) => {
    const newItems = [...receiveForm.items];
    newItems[index].receivedQty = Number(value);
    setReceiveForm({ ...receiveForm, items: newItems });
  };

  const submitReceivePO = async (e) => {
    e.preventDefault();
    await api.updatePOStatus(receiveForm.id, 'Diterima', receiveForm.items);
    setShowReceiveModal(false);
    fetchData();
  };

  const cancelPO = async (id) => {
    if (confirm('Yakin membatalkan PO ini?')) {
      await api.updatePOStatus(id, 'Dibatalkan', []);
      fetchData();
    }
  };

  const printPO = (po) => {
    const supplier = suppliers.find(s => s.id === Number(po.supplierId));
    let printContent = `
      <html>
        <head>
          <title>Cetak PO - ${po.poNumber}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .brand { font-size: 24px; font-weight: 900; }
            .brand span { color: #f59e0b; }
            h1 { font-size: 20px; margin: 0; color: #64748b; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .info-box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px; }
            .info-box p { font-weight: 700; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f8fafc; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .total-row { background: #f8fafc; font-weight: 900; font-size: 16px; }
            .footer { margin-top: 60px; display: grid; grid-template-cols: 1fr 1fr; gap: 40px; }
            .signature { border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">BrewMaster<span>.</span></div>
            <h1>PURCHASE ORDER</h1>
          </div>
          <div class="info-grid">
            <div class="info-box">
              <h3>Supplier</h3>
              <p>${supplier ? supplier.name : 'Unknown'}</p>
              <span style="font-size: 12px; color: #64748b;">${supplier ? supplier.address : ''}<br/>${supplier ? supplier.contact : ''}</span>
            </div>
            <div class="info-box" style="text-align: right;">
              <h3>Detail Pesanan</h3>
              <p>${po.poNumber}</p>
              <span style="font-size: 12px; color: #64748b;">Tanggal: ${new Date(po.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item / Bahan Baku</th>
                <th style="text-align: center;">Qty</th>
                <th>Satuan</th>
                <th style="text-align: right;">Harga Satuan</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${po.items.map(item => {
                const b = bahanList.find(x => x.id === Number(item.bahanId));
                return `
                <tr>
                  <td style="font-weight: 600;">${b ? b.name : '-'}</td>
                  <td style="text-align: center;">${item.qty}</td>
                  <td style="color: #64748b;">${b ? b.unit : '-'}</td>
                  <td style="text-align: right;">${formatRupiah(item.price)}</td>
                  <td style="text-align: right; font-weight: 700;">${formatRupiah(item.price * item.qty)}</td>
                </tr>
                `;
              }).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align: right; padding-right: 20px;">Total Estimasi</td>
                <td style="text-align: right; color: #f59e0b;">${formatRupiah(po.items.reduce((sum, i) => sum + (i.price * i.qty), 0))}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <div class="signature">Dipesan Oleh,</div>
            <div class="signature">Disetujui Oleh,</div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    const printWin = window.open('', '_blank');
    printWin.document.write(printContent);
    printWin.document.close();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse font-medium">Memuat data pembelian...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Pembelian</h2>
          <p className="text-muted-foreground mt-1">Kelola pengadaan bahan baku, supplier, dan pelacakan PO.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-12 font-bold gap-2" onClick={() => { setSupplierForm({ id: null, name: '', contact: '', address: '' }); setShowSupplierModal(true); }}>
            <Truck size={18} /> + Supplier
          </Button>
          <Button size="lg" className="h-12 px-8 font-bold gap-2 shadow-xl shadow-accent/20" onClick={() => { setPoForm({ supplierId: '', location: locations[0]?.name || '', items: [] }); setShowPOModal(true); }}>
            <Plus size={20} strokeWidth={3} /> Buat PO Baru
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-2xl border w-fit">
        <Button 
          variant={activeTab === 'PO' ? "secondary" : "ghost"} 
          className={cn("h-10 px-6 font-bold rounded-xl", activeTab === 'PO' && "bg-background shadow-sm")}
          onClick={() => setActiveTab('PO')}
        >
          <FileText size={16} className="mr-2" /> Purchase Orders
        </Button>
        <Button 
          variant={activeTab === 'SUPPLIER' ? "secondary" : "ghost"} 
          className={cn("h-10 px-6 font-bold rounded-xl", activeTab === 'SUPPLIER' && "bg-background shadow-sm")}
          onClick={() => setActiveTab('SUPPLIER')}
        >
          <Truck size={16} className="mr-2" /> Daftar Supplier
        </Button>
      </div>

      {activeTab === 'PO' ? (
        <div className="space-y-6">
          {/* PO List */}
          <Card className="border-none shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b">
                    <th className="px-6 py-4">No PO / Tanggal</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Total Estimasi</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pos.map(po => {
                    const supp = suppliers.find(s => s.id === Number(po.supplierId));
                    const totalEst = po.items.reduce((s, i) => s + (i.price * i.qty), 0);
                    return (
                      <tr key={po.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">
                              <FileText size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{po.poNumber}</p>
                              <p className="text-[10px] text-muted-foreground font-medium">{new Date(po.createdAt).toLocaleDateString('id-ID')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold">{supp ? supp.name : 'Unknown'}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{supp?.contact}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md">{po.items.length} Macam</span>
                        </td>
                        <td className="px-6 py-4 font-black text-sm">{formatRupiah(totalEst)}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            po.status === 'Pending' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                            po.status === 'Diterima' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                            "bg-destructive/10 text-destructive border-destructive/20"
                          )}>
                            {po.status === 'Pending' ? '🟠 Pending' : po.status === 'Diterima' ? '🟢 Diterima' : '🔴 Batal'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printPO(po)} title="Cetak PO"><Printer size={14} /></Button>
                            {po.status === 'Pending' && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => openReceiveModal(po)} title="Terima Barang"><ArrowUpRight size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => cancelPO(po.id)} title="Batalkan PO"><XCircle size={14} /></Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pos.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center opacity-40">
                        <History size={48} className="mx-auto mb-4" />
                        <p className="font-bold">Belum ada riwayat PO</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map(s => (
            <Card key={s.id} className="group hover:border-accent/40 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">
                    <Truck size={24} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSupplier(s)}><Edit3 size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteSupplier(s.id)}><Trash2 size={14} /></Button>
                  </div>
                </div>
                <CardTitle className="mt-4">{s.name}</CardTitle>
                <CardDescription className="flex items-center gap-1"><User size={12} /> {s.contact}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]"><MapPin size={12} className="inline mr-1" /> {s.address || 'Alamat tidak tersedia'}</p>
              </CardContent>
              <CardFooter className="pt-0">
                <div className="w-full h-px bg-muted mb-4" />
                <div className="flex justify-between items-center w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Total PO</span>
                  <span className="text-primary">{pos.filter(p => p.supplierId == s.id).length} Transaksi</span>
                </div>
              </CardFooter>
            </Card>
          ))}
          <button 
            className="h-full min-h-[200px] rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center p-6 text-center hover:bg-muted/10 hover:border-accent/40 transition-all group"
            onClick={() => { setSupplierForm({ id: null, name: '', contact: '', address: '' }); setShowSupplierModal(true); }}
          >
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:bg-accent group-hover:text-white transition-all mb-4 shadow-sm">
              <Plus size={24} strokeWidth={3} />
            </div>
            <p className="font-bold text-muted-foreground group-hover:text-primary transition-colors">Tambah Supplier Baru</p>
          </button>
        </div>
      )}

      {/* Modals */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>{supplierForm.id ? 'Edit Supplier' : 'Tambah Supplier'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowSupplierModal(false)}><X size={20} /></Button>
              </div>
            </CardHeader>
            <form onSubmit={handleSaveSupplier}>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Nama Perusahaan / Supplier</label>
                  <Input required value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} placeholder="cth: CV. Kopi Nusantara" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Kontak (HP/Telp/Email)</label>
                  <Input required value={supplierForm.contact} onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})} placeholder="cth: 0812xxxx atau email@supp.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Alamat Kantor</label>
                  <textarea className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} placeholder="Alamat lengkap supplier..." />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6 gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setShowSupplierModal(false)}>Batal</Button>
                <Button type="submit" className="flex-[2] h-12 font-bold bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">Simpan Supplier</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {showPOModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Buat Purchase Order</CardTitle>
                  <CardDescription>Dokumen pesanan resmi untuk supplier.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPOModal(false)}><X size={20} /></Button>
              </div>
            </CardHeader>
            <form onSubmit={handleSavePO}>
              <CardContent className="pt-6 space-y-6 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Pilih Supplier</label>
                    <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required value={poForm.supplierId} onChange={e => setPoForm({...poForm, supplierId: e.target.value})}>
                      <option value="">-- Pilih Supplier --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Lokasi Penerimaan</label>
                    <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required value={poForm.location} onChange={e => setPoForm({...poForm, location: e.target.value})}>
                      {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Daftar Barang (Item)</label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddPoItem}>+ Tambah Item</Button>
                  </div>
                  
                  <div className="space-y-3">
                    {poForm.items.map((item, i) => {
                      const b = bahanList.find(x => x.id === Number(item.bahanId));
                      return (
                        <div key={i} className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/20 rounded-2xl border border-dashed relative group animate-in slide-in-from-left-2">
                          <div className="flex-[3] space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Bahan Baku</label>
                            <select className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold shadow-sm" required value={item.bahanId} onChange={e => updatePoItem(i, 'bahanId', e.target.value)}>
                              <option value="">- Pilih Bahan -</option>
                              {bahanList.map(b => <option key={b.id} value={b.id}>{b.name} ({b.unit})</option>)}
                            </select>
                          </div>

                          <div className="flex-[1.5] space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Satuan Beli</label>
                            <select className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold shadow-sm" value={item.buyUnit || 'Base'} onChange={e => updatePoItem(i, 'buyUnit', e.target.value)}>
                              <option value="Base">{b?.unit || 'Gram'}</option>
                              {b?.storageType === 'Kemasan' && (
                                <>
                                  <option value="Box">{b.packageUnit || 'Box'}</option>
                                  <option value="Pouch">{b.packageItemUnit || 'Pouch'}</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Qty</label>
                            <Input type="number" min="1" className="h-11 font-black text-center" required value={item.qty} onChange={e => updatePoItem(i, 'qty', e.target.value)} />
                          </div>

                          <div className="flex-[1.5] space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Harga Beli</label>
                            <Input type="number" min="0" className="h-11 font-bold text-accent" required value={item.price} onChange={e => updatePoItem(i, 'price', e.target.value)} />
                          </div>

                          <Button type="button" variant="ghost" size="icon" className="text-destructive h-10 w-10 shrink-0 self-end mb-1" onClick={() => removePoItem(i)}><Trash2 size={16} /></Button>
                          
                          {b?.storageType === 'Kemasan' && item.buyUnit && item.buyUnit !== 'Base' && (
                            <div className="absolute -top-2 right-12 px-2 py-0.5 bg-accent text-white text-[9px] font-black uppercase tracking-widest rounded-md shadow-sm">
                              Konversi: x{item.buyUnit === 'Box' ? (Number(b.packageItemsCount) * Number(b.packageItemVolume)) : Number(b.packageItemVolume)} {b.unit}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {poForm.items.length === 0 && <p className="text-center py-10 text-xs text-muted-foreground italic border-2 border-dashed rounded-[2rem] bg-muted/5">Klik tombol di atas untuk menambah item pesanan.</p>}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6 gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setShowPOModal(false)}>Batal</Button>
                <Button type="submit" className="flex-[2] h-12 font-bold bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">Simpan & Kirim PO</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {showReceiveModal && receiveForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Terima Barang</CardTitle>
                  <CardDescription>{receiveForm.poNumber} · Verifikasi jumlah aktual.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowReceiveModal(false)}><X size={20} /></Button>
              </div>
            </CardHeader>
            <form onSubmit={submitReceivePO}>
              <CardContent className="pt-6 space-y-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-2">
                      <th className="pb-3">Bahan Baku</th>
                      <th className="pb-3 text-center">Qty Pesan</th>
                      <th className="pb-3 text-right" style={{ width: '120px' }}>Qty Diterima</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {receiveForm.items.map((item, i) => {
                      const b = bahanList.find(x => x.id === Number(item.bahanId));
                      return (
                        <tr key={i}>
                          <td className="py-3">
                            <p className="text-sm font-bold">{b ? b.name : 'Unknown'}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{b ? b.unit : '-'}</p>
                          </td>
                          <td className="py-3 text-center font-bold">{item.qty}</td>
                          <td className="py-3">
                            <Input type="number" min="0" required className="h-9 text-right font-black" value={item.receivedQty} onChange={e => handleReceiveUpdateQty(i, e.target.value)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
              <CardFooter className="border-t pt-6 gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setShowReceiveModal(false)}>Batal</Button>
                <Button type="submit" className="flex-[2] h-12 font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">Konfirmasi Penerimaan</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
