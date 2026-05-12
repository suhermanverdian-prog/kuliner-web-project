import { useState } from 'react';
import { formatRupiah } from '../data';
import { 
  Users, UserPlus, Gift, Star, 
  Crown, QrCode, Search, Filter, 
  MoreHorizontal, Download, Phone, 
  Mail, Calendar, History, TrendingUp,
  CreditCard, ChevronRight, X, Save,
  CheckCircle2, Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";

const MOCK_CUSTOMERS = [
  { id: 1, name: 'Rina Marlina', phone: '081234567890', email: 'rina@email.com', points: 450, totalSpend: 1250000, visits: 18, lastVisit: '2026-05-01', status: 'member', joinDate: '2026-01-15' },
  { id: 2, name: 'Doni Pratama', phone: '082198765432', email: 'doni@email.com', points: 120, totalSpend: 380000, visits: 5, lastVisit: '2026-04-28', status: 'member', joinDate: '2026-03-10' },
  { id: 3, name: 'Sari Dewi', phone: '085311223344', email: 'sari@email.com', points: 890, totalSpend: 3200000, visits: 42, lastVisit: '2026-05-02', status: 'vip', joinDate: '2025-12-01' },
  { id: 4, name: 'Budi Cahyo', phone: '087765432100', email: '', points: 0, totalSpend: 95000, visits: 2, lastVisit: '2026-04-20', status: 'guest', joinDate: '2026-04-20' },
  { id: 5, name: 'Fitri Handayani', phone: '089900112233', email: 'fitri@email.com', points: 320, totalSpend: 890000, visits: 12, lastVisit: '2026-04-30', status: 'member', joinDate: '2026-02-14' },
];

const MOCK_HISTORY = [
  { id: 'TRX-042', date: '2026-05-01', items: 'Latte, Croissant', total: 57000, points: '+57', type: 'Dine-in' },
  { id: 'TRX-038', date: '2026-04-29', items: 'Americano x2', total: 56000, points: '+56', type: 'Take Away' },
  { id: 'TRX-031', date: '2026-04-25', items: 'Nasi Goreng, Latte', total: 70000, points: '+70', type: 'Dine-in' },
];

const STATUS_BADGE = {
  vip: { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'VIP', icon: Crown },
  member: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'MEMBER', icon: UserPlus },
  guest: { bg: 'bg-slate-500/10', text: 'text-slate-600', label: 'GUEST', icon: Users },
};

export default function PelangganPage() {
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [rewardEnabled, setRewardEnabled] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', phone: '', email: '' });

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const totalPoints = customers.reduce((s, c) => s + c.points, 0);
  const totalMembers = customers.filter(c => c.status !== 'guest').length;
  const vipCount = customers.filter(c => c.status === 'vip').length;

  const handleAdd = () => {
    if (!newForm.name || !newForm.phone) return alert('Nama dan nomor HP wajib diisi!');
    setCustomers(prev => [...prev, {
      id: Date.now(), ...newForm, points: 0, totalSpend: 0, visits: 0,
      lastVisit: '-', status: 'member', joinDate: new Date().toISOString().split('T')[0]
    }]);
    setShowAddModal(false);
    setNewForm({ name: '', phone: '', email: '' });
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Pelanggan & CRM</h2>
          <p className="text-muted-foreground mt-1">Kelola data member, program loyalitas, dan analitik pelanggan.</p>
        </div>
        <Button size="lg" className="h-12 px-8 font-bold gap-2 shadow-xl shadow-accent/20" onClick={() => setShowAddModal(true)}>
          <UserPlus size={20} strokeWidth={3} /> Tambah Member
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Pelanggan', val: customers.length, icon: Users, color: 'text-primary', bg: 'bg-muted/30' },
          { label: 'Total Member', val: totalMembers, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-600/10' },
          { label: 'Pelanggan VIP', val: vipCount, icon: Crown, color: 'text-amber-600', bg: 'bg-amber-600/10' },
          { label: 'Poin Beredar', val: totalPoints.toLocaleString('id-ID'), icon: Gift, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-md bg-card transition-all hover:scale-[1.02]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</p>
                <h3 className={cn("text-2xl font-black mt-1 data-mono", s.color)}>{s.val}</h3>
              </div>
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", s.bg)}>
                <s.icon className={s.color} size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reward Settings Card */}
      <Card className="border-none shadow-xl bg-card overflow-hidden border-l-4 border-l-accent">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex gap-4 items-center text-center md:text-left">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shrink-0">
                 <Gift size={32} />
              </div>
              <div>
                <h4 className="text-lg font-black leading-tight">Program Loyalitas & Reward</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-md font-medium">Aktifkan akumulasi poin otomatis untuk setiap transaksi pelanggan guna meningkatkan retensi dan kunjungan ulang.</p>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl border">
              <span className={cn("text-[10px] font-black uppercase tracking-widest px-3", rewardEnabled ? "text-emerald-600" : "text-destructive")}>
                 {rewardEnabled ? "AKTIF" : "NONAKTIF"}
              </span>
              <button 
                onClick={() => setRewardEnabled(!rewardEnabled)}
                className={cn(
                  "w-14 h-7 rounded-full transition-all relative p-1",
                  rewardEnabled ? "bg-accent" : "bg-muted-foreground/30"
                )}
              >
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full transition-all shadow-sm",
                  rewardEnabled ? "translate-x-7" : "translate-x-0"
                )} />
              </button>
           </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-subtle/50 p-1 rounded-xl border border-border-subtle w-fit">
        {[
          { key: 'list', label: 'Daftar Pelanggan', icon: Users },
          { key: 'qr', label: 'QR Self-Order', icon: QrCode },
        ].map(t => (
          <button 
            key={t.key} 
            className={cn(
              "h-8 px-4 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-2", 
              activeTab === t.key ? "active-state shadow-sm" : "text-text-tertiary hover:text-text-secondary"
            )}
            onClick={() => setActiveTab(t.key)}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main List */}
          <div className="flex-1 space-y-4 w-full">
            <div className="flex flex-col sm:flex-row gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input 
                    className="pl-12 h-12 rounded-2xl shadow-sm border-none bg-card focus:ring-accent" 
                    placeholder="Cari nama, email atau nomor WhatsApp..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
               </div>
               <Button variant="outline" className="h-12 px-6 font-bold gap-2 bg-card border-none shadow-sm hover:bg-muted/50">
                  <Filter size={18} /> Filter
               </Button>
            </div>

            <Card className="border-none shadow-xl bg-card overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b">
                           <th className="px-6 py-4">Pelanggan</th>
                           <th className="px-6 py-4">Kontak</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4">Poin</th>
                           <th className="px-6 py-4">Total Belanja</th>
                           <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y">
                        {filtered.map(c => (
                          <tr key={c.id} className="hover:bg-muted/20 transition-colors group">
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-black group-hover:scale-110 transition-transform shadow-sm">
                                      {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                   </div>
                                   <div>
                                      <p className="text-sm font-black group-hover:text-accent transition-colors">{c.name}</p>
                                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Join: {c.joinDate}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <p className="text-xs font-bold text-primary">{c.phone}</p>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{c.email || '-'}</p>
                             </td>
                             <td className="px-6 py-4">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                  STATUS_BADGE[c.status].bg, STATUS_BADGE[c.status].text, "border-transparent"
                                )}>
                                   {STATUS_BADGE[c.status].label}
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 font-bold text-sm text-accent data-mono">
                                   <Star size={14} fill="currentColor" /> {c.points}
                                </div>
                             </td>
                             <td className="px-6 py-4 font-bold text-sm data-mono">{formatRupiah(c.totalSpend)}</td>
                             <td className="px-6 py-4 text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-accent" onClick={() => setSelected(c)}>
                                   <ChevronRight size={20} />
                                </Button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </Card>
          </div>

          {/* Profile Sidebar */}
          <Card className={cn(
            "w-full lg:w-[350px] border-none shadow-xl bg-card shrink-0 overflow-hidden transition-all duration-500",
            !selected && "opacity-50 grayscale pointer-events-none"
          )}>
            {selected ? (
              <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                 <div className="p-8 bg-muted/10 border-b flex flex-col items-center text-center relative">
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setSelected(null)}>
                       <X size={20} />
                    </Button>
                    <div className="w-24 h-24 rounded-3xl bg-accent shadow-xl shadow-accent/20 flex items-center justify-center text-white text-3xl font-black mb-4">
                       {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <h3 className="text-2xl font-black">{selected.name}</h3>
                    <div className="flex gap-2 mt-2">
                       <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", STATUS_BADGE[selected.status].bg, STATUS_BADGE[selected.status].text)}>
                          {STATUS_BADGE[selected.status].label}
                       </span>
                    </div>
                 </div>

                 <CardContent className="p-8 space-y-8 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-muted/30 rounded-2xl space-y-1">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Belanja</p>
                          <p className="text-sm font-bold text-primary data-mono">{formatRupiah(selected.totalSpend)}</p>
                       </div>
                       <div className="p-4 bg-accent/5 rounded-2xl space-y-1 border border-accent/10">
                          <p className="text-[9px] font-black text-accent uppercase tracking-widest">Saldo Poin</p>
                          <p className="text-sm font-bold text-accent flex items-center gap-1 data-mono"><Star size={12} fill="currentColor" /> {selected.points}</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b pb-2">Informasi Kontak</p>
                       <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><Phone size={14} /></div>
                             <p className="text-sm font-bold">{selected.phone}</p>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><Mail size={14} /></div>
                             <p className="text-sm font-bold truncate">{selected.email || 'Email belum ditautkan'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><Calendar size={14} /></div>
                             <p className="text-sm font-bold data-mono">Terdaftar: {selected.joinDate}</p>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b pb-2">Riwayat Terakhir</p>
                       <div className="space-y-3">
                          {MOCK_HISTORY.map(h => (
                            <div key={h.id} className="p-3 bg-card border rounded-2xl space-y-2 hover:border-accent/40 transition-colors shadow-sm">
                               <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-accent data-mono">{h.id}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground data-mono">{h.date}</span>
                               </div>
                               <p className="text-xs font-black truncate">{h.items}</p>
                               <div className="flex justify-between items-center pt-2 border-t border-dashed">
                                  <p className="text-xs font-bold data-mono">{formatRupiah(h.total)}</p>
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full data-mono">{h.points} Poin</span>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </CardContent>
                 
                 <CardFooter className="p-6 border-t bg-muted/5 gap-3">
                    <Button variant="outline" className="flex-1 h-11 font-bold">Edit Profil</Button>
                    <Button className="flex-1 h-11 font-black bg-accent">Kirim Promo</Button>
                 </CardFooter>
              </div>
            ) : (
              <div className="p-20 text-center space-y-6 opacity-30">
                 <Users size={80} strokeWidth={1} />
                 <div>
                    <p className="text-lg font-black">Detail Profil</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Pilih pelanggan dari daftar</p>
                 </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="border-none shadow-xl bg-card overflow-hidden">
              <CardHeader className="bg-muted/10 border-b">
                 <CardTitle className="text-xl">QR Code Digital Menu</CardTitle>
                 <CardDescription>Akses langsung untuk pelanggan mandiri (Guest Mode).</CardDescription>
              </CardHeader>
              <CardContent className="p-12 flex flex-col items-center text-center space-y-8">
                 <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-accent rounded-[32px] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                    <div className="w-56 h-56 bg-white rounded-[32px] shadow-2xl border-2 border-muted flex items-center justify-center p-6 relative">
                       <QrCode size={180} strokeWidth={1.5} className="text-primary" />
                       <div className="absolute inset-0 flex items-center justify-center bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]">
                          <Button className="font-black bg-accent shadow-xl shadow-accent/20 gap-2">
                             <Download size={18} /> Unduh QR
                          </Button>
                       </div>
                    </div>
                 </div>
                 <div className="max-w-sm space-y-2">
                    <h4 className="text-lg font-black leading-tight">Berikan kemudahan memesan dari meja pelanggan</h4>
                    <p className="text-xs text-muted-foreground font-medium">Pelanggan dapat memindai kode ini untuk melihat menu digital, memesan mandiri, dan membayar tanpa harus antri di kasir.</p>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-xl bg-card">
              <CardHeader className="bg-muted/10 border-b">
                 <CardTitle className="text-xl">Konfigurasi Mode Pelanggan</CardTitle>
                 <CardDescription>Atur kebijakan interaksi pelanggan pada digital menu.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 {[
                   { id: '1', title: 'Tampilkan Harga Menu', desc: 'Sembunyikan jika ingin harga hanya terlihat di kasir.', active: true },
                   { id: '2', title: 'Wajib Verifikasi WA', desc: 'Pelanggan harus memasukkan OTP WhatsApp sebelum pesan.', active: false },
                   { id: '3', title: 'Izinkan Catatan Kustom', desc: 'Berikan kolom catatan untuk setiap item pesanan.', active: true },
                   { id: '4', title: 'Pembayaran Ditempat', desc: 'Izinkan pelanggan membayar langsung via QRIS mandiri.', active: true },
                 ].map(opt => (
                   <div key={opt.id} className="flex justify-between items-start gap-4 p-4 rounded-2xl hover:bg-muted/20 transition-all border border-transparent hover:border-muted-foreground/10 group">
                      <div className="space-y-1">
                         <p className="text-sm font-black group-hover:text-accent transition-colors">{opt.title}</p>
                         <p className="text-[10px] text-muted-foreground font-medium">{opt.desc}</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5 accent-accent cursor-pointer" defaultChecked={opt.active} />
                   </div>
                 ))}
                 <div className="pt-6 border-t">
                    <Button className="w-full h-12 font-black shadow-lg shadow-accent/20">
                       <Save size={18} className="mr-2" /> Simpan Pengaturan
                    </Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
           <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <CardHeader className="border-b pb-4">
                 <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                       <UserPlus className="text-accent" /> Registrasi Member
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}><X size={20} /></Button>
                 </div>
                 <CardDescription>Berikan pengalaman eksklusif untuk pelanggan setia.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Nama Lengkap *</label>
                    <Input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="cth: Rina Marlina" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Nomor WhatsApp (Aktif) *</label>
                    <Input value={newForm.phone} onChange={e => setNewForm({ ...newForm, phone: e.target.value })} placeholder="cth: 081234567890" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Email (Opsional)</label>
                    <Input value={newForm.email} onChange={e => setNewForm({ ...newForm, email: e.target.value })} placeholder="cth: rina@email.com" />
                 </div>
              </CardContent>
              <CardFooter className="border-t pt-6 gap-3">
                 <Button variant="outline" className="flex-1 h-12" onClick={() => setShowAddModal(false)}>Batal</Button>
                 <Button className="flex-[2] h-12 font-black bg-accent hover:bg-accent/90" onClick={handleAdd}>Daftarkan Sekarang</Button>
              </CardFooter>
           </Card>
        </div>
      )}
    </div>
  );
}
