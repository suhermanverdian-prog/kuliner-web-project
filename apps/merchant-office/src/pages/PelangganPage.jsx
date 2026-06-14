import { formatRupiah } from '../utils/formatters';
import { 
  Users, UserPlus, Gift, Star, 
  Crown, QrCode, Search, Filter, 
  MoreHorizontal, Download, Phone, 
  Mail, Calendar, History, TrendingUp,
  CreditCard, ChevronRight, X, Save,
  CheckCircle2, Bell, AlertTriangle,
  Zap, Heart, Target, Sparkles, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { usePelangganPage } from '../hooks/usePelangganPage';

const STATUS_BADGE = {
  vip: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', label: 'VIP', icon: Crown },
  member: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', label: 'MEMBER', icon: UserPlus },
  guest: { bg: 'bg-amber-500/10', text: 'text-zinc-900 dark:text-zinc-100', label: 'GUEST', icon: Users },
};

export default function PelangganPage() {
  const {
    customers,
    search, setSearch,
    selected, setSelected,
    activeTab, setActiveTab,
    rewardEnabled, setRewardEnabled,
    showAddModal, setShowAddModal,
    newForm, setNewForm,
    loading,
    filtered,
    totalPoints,
    totalMembers,
    vipCount,
    handleAdd
  } = usePelangganPage();

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-mono tabular-nums">
      <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse text-zinc-850 dark:text-zinc-100">Syncing Customer Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-8 pt-2 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded-sm text-[9px] font-black text-amber-500 uppercase tracking-widest">Predictive CRM</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">AI Analysis Online</span>
              </div>
           </div>
           <h1 className="text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">CRM & LOYALTY <span className="text-amber-500 italic">COCKPIT</span></h1>
           <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Data-driven behavioral analytics & automated engagement engine.</p>
        </div>
        <Button variant="primary" size="sm" className="font-bold gap-4 rounded-md" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} /> REGISTRASI MEMBER
        </Button>
      </div>

      {/* Advanced KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Market Reach', val: customers.length, sub: 'Global Entities', icon: Globe, color: 'text-foreground', bg: 'bg-background' },
          { label: 'Active Retention', val: `${((totalMembers/customers.length)*100).toFixed(1)}%`, sub: 'Member Conversion', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'VIP Network', val: vipCount, sub: 'Top Tier Spenders', icon: Crown, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Loyalty Points', val: totalPoints.toLocaleString('id-ID'), sub: 'Redeemable Assets', icon: Gift, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
        ].map((s, i) => (
          <Card key={i} className="group border border-zinc-200 dark:border-zinc-800 bg-card shadow-sm hover:shadow-md transition-all rounded-lg overflow-hidden">
             <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{s.label}</p>
                   <p className={cn("text-3xl font-black font-mono tabular-nums", s.color)}>{s.val}</p>
                   <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">{s.sub}</p>
                </div>
                <div className={cn("w-14 h-14 rounded-md flex items-center justify-center border border-border group-hover:scale-110 transition-transform", s.bg)}>
                   <s.icon size={24} className={cn(s.color)} />
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Behavioral Overview */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-card shadow-lg rounded-lg overflow-hidden relative group">
         <div className="absolute top-0 right-0 p-8 text-zinc-200/50 dark:text-zinc-800/50 pointer-events-none">
            <Sparkles size={160} />
         </div>
         <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
            <div className="flex gap-6 items-center">
               <div className="w-16 h-16 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-md border border-amber-500/20">
                  <Zap size={40} />
               </div>
               <div className="space-y-1">
                  <h4 className="text-2xl font-semibold tracking-tighter uppercase text-zinc-800 dark:text-zinc-100">AI Behavioral <span className="text-amber-500">Segmentation</span></h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-lg font-medium leading-relaxed">
                     Sistem secara otomatis mendeteksi anomali kunjungan dan risiko *churn*. Saat ini terdeteksi <span className="text-amber-500 font-bold font-mono tabular-nums">12</span> pelanggan berisiko tinggi yang belum berkunjung dalam 14 hari terakhir.
                  </p>
               </div>
            </div>
            <div className="flex gap-4 items-center">
               <div className="text-center px-6 border-r border-border">
                  <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Avg Spend</p>
                  <p className="text-xl font-black font-mono tabular-nums text-amber-500">Rp 125K</p>
               </div>
               <div className="text-center px-6">
                  <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Churn Risk</p>
                  <p className="text-xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400">8.4%</p>
               </div>
               <Button size="sm" className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md">RE-ENGAGE ALL</Button>
            </div>
         </CardContent>
      </Card>

      {/* Main Layout Grid */}
      <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
        {/* Left Side: Search & Table */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
           <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                 <Input 
                   className="pl-12 h-10 rounded-md bg-card border border-zinc-200 dark:border-zinc-800 shadow-sm font-medium focus:ring-amber-500 text-sm" 
                   placeholder="Cari identitas pelanggan atau nomor WhatsApp..." 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                 />
              </div>
              <Button variant="outline" size="sm" className="font-bold uppercase tracking-widest rounded-md bg-card">
                 <Filter size={18} className="mr-2" /> Filter Database
              </Button>
           </div>

           <Card className="border border-zinc-200 dark:border-zinc-800 bg-card shadow-xl rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                       <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-border">
                          <th className="px-6 py-2">Identity</th>
                          <th className="px-6 py-2">Engagement</th>
                          <th className="px-6 py-2">Tier Status</th>
                          <th className="px-6 py-2">Balance</th>
                          <th className="px-6 py-2">Churn Risk</th>
                          <th className="px-6 py-2 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                       {filtered.map(c => (
                         <tr key={c.id} className={cn("hover:bg-background transition-all group cursor-pointer", selected?.id === c.id && "bg-amber-50 dark:bg-amber-950/30")} onClick={() => setSelected(c)}>
                            <td className="px-6 py-2">
                               <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-md bg-zinc-150 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-black group-hover:scale-110 border border-border">
                                     {c.avatar ? (
                                       <img src={c.avatar} alt={c.name} className="w-full h-full object-cover rounded-md" />
                                     ) : (
                                       c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                     )}
                                   </div>
                                  <div>
                                     <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-amber-500 transition-colors">{c.name}</p>
                                     <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Join: {c.joinDate}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-2">
                               <p className="text-xs font-black font-mono tabular-nums text-zinc-800 dark:text-zinc-100">{c.phone}</p>
                               <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase font-mono tabular-nums">Visits: {c.visits}</p>
                            </td>
                            <td className="px-6 py-2">
                               <span className={cn(
                                 "px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border border-transparent",
                                 STATUS_BADGE[c.status].bg, STATUS_BADGE[c.status].text
                               )}>
                                  {STATUS_BADGE[c.status].label}
                               </span>
                            </td>
                            <td className="px-6 py-2">
                               <div className="flex items-center gap-2 font-black text-sm text-amber-500 font-mono tabular-nums">
                                  <Star size={16} fill="currentColor" /> {c.points}
                               </div>
                               <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase mt-0.5 font-mono tabular-nums">{formatRupiah(c.totalSpend)}</p>
                            </td>
                            <td className="px-6 py-2">
                               <div className={cn(
                                 "inline-flex items-center gap-2 px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border",
                                 c.churnRisk === 'Low' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800" : 
                                 (c.churnRisk === 'Medium' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500/20" : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800")
                               )}>
                                  <div className={cn("w-1.5 h-1.5 rounded-sm", c.churnRisk === 'Low' ? "bg-emerald-500" : (c.churnRisk === 'Medium' ? "bg-amber-500" : "bg-rose-500 animate-pulse"))} />
                                  {c.churnRisk} Risk
                               </div>
                            </td>
                            <td className="px-6 py-2 text-right">
                               <Button 
                                 variant="ghost" 
                                 size="xs" 
                                 className="h-8 w-8 p-0 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setSelected(c);
                                 }}
                               >
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

        {/* Modal: Deep Analytics Profile (Tampil di Tengah Layar) */}
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             {/* Backdrop Overlay */}
             <div className="absolute inset-0" onClick={() => setSelected(null)} />
             
             {/* Modal Container */}
             <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-lg overflow-hidden z-[110] flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
                <Card className="border-0 rounded-none bg-card flex flex-col overflow-y-auto no-scrollbar">
                   {/* Modal Header */}
                   <div className="p-6 bg-background border-b border-border flex items-center gap-6 relative">
                      <div className="absolute top-0 right-0 p-4 text-zinc-200/50 dark:text-zinc-800/30 pointer-events-none">
                         <Zap size={80} className="rotate-12" />
                      </div>
                      <Button variant="ghost" size="xs" className="absolute top-4 right-4 h-8 w-8 p-0 rounded-md hover:bg-background" onClick={() => setSelected(null)}>
                         <X size={20} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" />
                      </Button>

                      <div className="w-20 h-20 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-border overflow-hidden shrink-0">
                         {selected.avatar ? (
                           <img src={selected.avatar} alt={selected.name} className="w-full h-full object-cover" />
                         ) : (
                           <span className="text-2xl font-black text-zinc-700 dark:text-zinc-200">{selected.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                         )}
                      </div>

                      <div className="space-y-1">
                         <h3 className="text-2xl font-semibold tracking-tighter uppercase text-zinc-800 dark:text-zinc-100">{selected.name}</h3>
                         <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Executive Loyalty ID: <span className="text-amber-500 font-mono tabular-nums">#{selected.id.slice(-6)}</span></p>
                      </div>
                   </div>

                   {/* Modal Body */}
                   <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh] no-scrollbar">
                      {/* Metrics Drills */}
                      <div className="grid grid-cols-2 gap-6">
                         <div className="p-4 bg-background rounded-md space-y-1 border border-border">
                            <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">LTV (Lifetime Value)</p>
                            <p className="text-lg font-black text-foreground font-mono tabular-nums">{formatRupiah(selected.totalSpend)}</p>
                         </div>
                         <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-md space-y-1 border border-amber-500/10">
                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">Reward Assets</p>
                            <p className="text-lg font-black text-amber-500 flex items-center gap-1.5 font-mono tabular-nums"><Star size={16} fill="currentColor" /> {selected.points}</p>
                         </div>
                      </div>

                      {/* Behavioral Tags */}
                      <div className="space-y-3">
                         <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                           <Zap size={12} className="text-amber-500" /> AI Behavioral Insight
                         </p>
                         <div className="flex flex-wrap gap-2">
                            <div className="px-3 py-1.5 bg-background rounded-sm text-[10px] font-black uppercase text-zinc-800 dark:text-zinc-200 border border-border">Loyal Customer</div>
                            <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-sm text-[10px] font-black uppercase text-amber-500 border border-amber-500/20">High Ticket Spender</div>
                            <div className="px-3 py-1.5 bg-background rounded-sm text-[10px] font-black uppercase text-zinc-800 dark:text-zinc-200 border border-border">Morning Regular</div>
                         </div>
                      </div>

                      {/* Favorites Section */}
                      <div className="space-y-3">
                         <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                           <Heart size={12} className="text-rose-600 dark:text-rose-400" /> Menu Favorites
                         </p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selected.favorites.map((fav, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-background border border-border rounded-md hover:bg-background transition-all">
                                 <span className="text-xs font-black uppercase text-zinc-800 dark:text-zinc-200">{fav}</span>
                                 <div className="px-2.5 py-0.5 bg-background rounded-sm text-[9px] font-bold text-zinc-500 dark:text-zinc-400 border border-border">Top Choice</div>
                              </div>
                             ))}
                         </div>
                      </div>

                      {/* Predictive Action */}
                      <div className="p-4 bg-background border border-border rounded-md relative group/promo overflow-hidden">
                         <div className="absolute -top-4 -right-4 text-zinc-200/40 dark:text-zinc-800/40 pointer-events-none group-hover/promo:scale-110 transition-transform">
                           <Sparkles size={80} />
                         </div>
                         <div className="relative z-10 space-y-3">
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Recommended AI Action</p>
                           <p className="text-xs font-bold text-zinc-850 dark:text-zinc-100 uppercase leading-snug">{selected.recommendedAction}</p>
                         </div>
                      </div>
                   </div>

                   {/* Modal Footer */}
                   <div className="p-6 bg-background border-t border-border flex justify-end gap-3">
                      <Button variant="ghost" size="sm" className="font-bold rounded-md" onClick={() => setSelected(null)}>
                         BATAL
                      </Button>
                      <Button variant="primary" size="sm" className="font-bold rounded-md">
                         EKSEKUSI PROMO SEKARANG
                      </Button>
                   </div>
                </Card>
             </div>
          </div>
        )}
      </div>

      {/* Add Member Modal (Redesigned) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <Card className="w-full max-w-md shadow-2xl border border-border rounded-lg overflow-hidden animate-in zoom-in-95 duration-200 bg-card">
              <CardHeader className="bg-background border-b border-border p-6">
                 <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl font-semibold uppercase tracking-tighter text-zinc-850 dark:text-zinc-100">
                       <span className="text-amber-500">MEMBER</span> REGISTRATION
                    </CardTitle>
                    <Button variant="ghost" size="xs" className="h-8 w-8 p-0 rounded-md hover:bg-background" onClick={() => setShowAddModal(false)}>
                      <X size={20} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" />
                    </Button>
                 </div>
                 <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Build your elite loyalist network</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 px-1">Nama Lengkap Identity</label>
                    <Input className="h-10 rounded-md bg-background border-border font-bold text-sm" value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="cth: Rina Marlina" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 px-1">WhatsApp Activation Node</label>
                    <Input className="h-10 rounded-md bg-background border-border font-black font-mono tabular-nums text-sm" value={newForm.phone} onChange={e => setNewForm({ ...newForm, phone: e.target.value })} placeholder="cth: 081234567890" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 px-1">Digital Correspondence (Optional)</label>
                    <Input className="h-10 rounded-md bg-background border-border font-bold text-sm" value={newForm.email} onChange={e => setNewForm({ ...newForm, email: e.target.value })} placeholder="cth: rina@email.com" />
                 </div>
              </CardContent>
              <CardFooter className="p-6 bg-background border-t border-border flex flex-col gap-4">
                 <Button variant="primary" size="sm" className="w-full font-bold uppercase tracking-[0.3em]" onClick={handleAdd}>AKTIFKAN MEMBER</Button>
                 <Button variant="ghost" size="sm" className="w-full font-black uppercase tracking-widest text-[9px] text-zinc-500 dark:text-zinc-400" onClick={() => setShowAddModal(false)}>BATALKAN</Button>
              </CardFooter>
           </Card>
        </div>
      )}
    </div>
  );
}

function RefreshCw({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-in spin-in duration-700", className)}
      {...props}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
