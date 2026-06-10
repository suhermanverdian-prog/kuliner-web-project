import React, { useState } from 'react';
import { 
  Truck, ArrowRightLeft, Package, 
  MapPin, Clock, CheckCircle2, 
  RefreshCw, Search, Filter, 
  TrendingUp, Box, Layers,
  Zap, BrainCircuit, ShieldCheck,
  ChevronRight, MoreVertical, Timer,
  ArrowUpRight, Landmark
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "@/lib/utils";
import { useLogisticsHubPage } from '../hooks/useLogisticsHubPage';
import { useNavigate } from 'react-router-dom';
import StockTransferModal from '../components/StockTransferModal';

export default function LogisticsHubPage() {
  const navigate = useNavigate();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const {
    loading,
    activeShipments
  } = useLogisticsHubPage();
  
  const logisticsStats = [
    { label: 'Active Shipments', val: `${activeShipments.length} Units`, trend: 'Real-time', icon: Truck, color: 'text-amber-500', bg: 'bg-amber-' },
    { label: 'Network Health', val: '98.2%', trend: 'Optimal', icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Stock Rebalance', val: 'Active', trend: 'AI Suggestion', icon: Timer, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Efficiency', val: '94%', trend: '+4%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-mono tabular-nums">
      <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Orchestrating Logistics Nodes...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2 py-1 bg-amber- border border-amber-500/20 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Supply Chain Node</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">Live Fleet Tracking</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Internal <span className="text-amber-500 italic">Logistics Hub</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">Coordinate stock movement across multi-outlet nodes with real-time tracking.</p>
        </div>
        <div className="flex gap-4">
           <Button onClick={() => alert("Menampilkan logistik riwayat...")} variant="outline" className="h-14 px-8 font-black uppercase tracking-widest text-[10px] bg-card border-border rounded-lg">
              <Timer size={18} className="mr-2" /> Shipment Logs
           </Button>
           <Button onClick={() => setShowTransferModal(true)} className="h-14 px-10 font-black uppercase tracking-widest text-white ">
              <ArrowRightLeft size={18} className="mr-2" /> New Transfer
           </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {logisticsStats.map((s, i) => (
          <Card key={i} className="border-none bg-card shadow-sm rounded-lg overflow-hidden">
            <CardContent className="p-8 flex items-center justify-between">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">{s.label}</p>
                  <p className={cn("text-2xl font-black font-mono tabular-nums leading-none my-1", s.color)}>{s.val}</p>
                  <div className="flex items-center gap-1.5">
                     <ArrowUpRight size={12} className={cn(s.trend.startsWith('+') ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500")} />
                     <span className={cn("text-[10px] font-black uppercase", s.trend.startsWith('+') ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500")}>{s.trend}</span>
                  </div>
               </div>
               <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center border border-border", s.bg)}>
                  <s.icon size={24} className={cn(s.color)} />
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
         {/* Live Shipments */}
         <div className="xl:col-span-8 space-y-8">
            <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
               <CardHeader className="p-12 border-b border-border bg-background flex flex-row items-center justify-between">
                  <div className="space-y-1">
                     <CardTitle className="text-2xl font-black tracking-tighter uppercase leading-none">Fleet Orchestration</CardTitle>
                     <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">Monitor active stock movements between physical nodes</CardDescription>
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 border-b border-border">
                              <th className="px-12 py-6">Shipment ID</th>
                              <th className="px-12 py-6">Material Node</th>
                              <th className="px-12 py-6">Transit Path</th>
                              <th className="px-12 py-6 text-right">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                           {activeShipments.map((s, i) => (
                             <tr key={i} className="hover:bg-background transition-all group">
                                <td className="px-12 py-8">
                                   <p className="text-sm font-black font-mono tabular-nums text-amber-500">{s.id}</p>
                                   <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">Internal Transfer</p>
                                </td>
                                <td className="px-12 py-8">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center border border-border group-hover:">
                                         <Package size={20} />
                                      </div>
                                      <div>
                                         <p className="text-sm font-black text-foreground uppercase tracking-tight">{s.material}</p>
                                         <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">{s.qty}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-12 py-8">
                                   <div className="flex items-center gap-4">
                                      <span className="text-[10px] font-black uppercase tracking-tight text-zinc-500 dark:text-zinc-100">{s.from}</span>
                                      <ArrowRightLeft size={12} className="text-amber-500" />
                                      <span className="text-[10px] font-black uppercase tracking-tight text-foreground">{s.to}</span>
                                   </div>
                                </td>
                                <td className="px-12 py-8 text-right">
                                   <div className="inline-flex items-center gap-4">
                                      <div className="text-right">
                                         <p className={cn("text-[10px] font-black uppercase tracking-widest", s.status === 'In Transit' ? "text-amber-500" : s.status === 'Completed' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-100")}>{s.status}</p>
                                         <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">ETA: {s.eta}</p>
                                      </div>
                                      <div className={cn("w-2 h-2 rounded-lg", s.status === 'In Transit' ? "bg-amber-500 animate-pulse" : s.status === 'Completed' ? "bg-emerald-500" : "bg-background")} />
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="border-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 group-hover:scale-110 transition-transform duration-1000">
                     <BrainCircuit size={120} />
                  </div>
                  <div className="space-y-2 relative z-10">
                     <div className="inline-flex items-center gap-2 px-4 py-1 ">Logistics Insight</div>
                     <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Route <span className="text-amber-500 italic">Optimization</span></h4>
                     <p className="text-zinc-500 text-xs font-medium leading-relaxed">
                        Sistem mendeteksi kemacetan tinggi di rute Sudirman-Menteng. Neural model menyarankan pengiriman stok dijadwalkan sebelum pukul 08:00 WIB untuk efisiensi bahan bakar 15%.
                     </p>
                  </div>
                  <Button onClick={() => alert("Menjalankan optimasi jadwal rute pengiriman...")} className="w-full h-14 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800">OPTIMIZE SCHEDULE</Button>
               </Card>
               <Card className="border-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 group-hover:rotate-12 transition-transform duration-1000">
                     <Truck size={120} />
                  </div>
                  <div className="space-y-2 relative z-10">
                     <div className="inline-flex items-center gap-2 px-4 py-1 ">Fleet Intelligence</div>
                     <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Driver <span className="italic  underline">Performance</span></h4>
                     <p className="text-zinc-900 text-xs font-bold leading-relaxed uppercase ">
                        Rata-rata waktu bongkar muat di PIK Hub meningkat. Sistem menyarankan peninjauan SOP penerimaan barang untuk mempercepat rotasi armada.
                     </p>
                  </div>
                  <Button onClick={() => alert("Membuka laporan kinerja armada logistik...")} className="w-full h-14 ">VIEW FLEET REPORT</Button>
               </Card>
            </div>
         </div>

         {/* Maps/Status Sidebar */}
         <div className="xl:col-span-4 space-y-8 sticky top-24">
            <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
               <CardHeader className="p-8 border-b border-border bg-background">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-background border border-border rounded-lg flex items-center justify-center">
                        <MapPin size={20} className="text-foreground" />
                     </div>
                     <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tighter">Node Proximity</CardTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">Fleet Distribution</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-8">
                  <div className="aspect-square bg-background rounded-lg border border-dashed border-border flex flex-col items-center justify-center p-10 text-center relative overflow-hidden group cursor-crosshair">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--amber-500)_0%,transparent_70%)]  group-hover: transition-opacity" />
                     <MapPin size={48} className="text-amber-500 mb-4 animate-bounce" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">Interactive Fleet Map</p>
                     <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-100/60 uppercase mt-2">Connecting 5 Active Nodes</p>
                  </div>
               </CardContent>
            </Card>

            <div className="p-10 ">
               <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
               <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center">
                     <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Supply Balance</p>
                     <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Auto <span className="text-amber-500 italic">Balancing</span></h3>
                  <div className="space-y-4 pt-4">
                     {[
                       { label: 'Sudirman WH', val: 85, color: 'bg-emerald-500' },
                       { label: 'PIK Hub', val: 45, color: 'bg-amber-500' },
                       { label: 'Menteng Edge', val: 65, color: 'bg-blue-500' },
                     ].map(n => (
                       <div key={n.label} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                             <span className="text-zinc-500">{n.label}</span>
                             <span>{n.val}%</span>
                          </div>
                          <div className="h-1 bg-background/5 rounded-lg overflow-hidden">
                             <div className={cn("h-full rounded-lg transition-all duration-1000", n.color)} style={{ width: `${n.val}%` }} />
                          </div>
                       </div>
                     ))}
                  </div>
                  <p className="text-[9px] font-bold text-zinc-500 leading-relaxed pt-4 border-t border-white/5 uppercase ">
                     Sistem menyarankan penyeimbangan stok biji kopi dari Sudirman ke PIK dalam 24 jam ke depan.
                  </p>
               </div>
            </div>
         </div>
      </div>
      <StockTransferModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />
    </div>
  );
}
