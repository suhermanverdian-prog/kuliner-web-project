import React from 'react';
import { 
  Zap, TrendingDown, Package, AlertTriangle, 
  ArrowRight, ShoppingCart, RefreshCw, BarChart3,
  Clock, CheckCircle2, Loader2, BrainCircuit, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "../components/ui/Table";
import { cn } from "../lib/utils";
import { useNavigate } from 'react-router-dom';
import { useInventoryIntelligencePage } from '../hooks/useInventoryIntelligencePage';

export default function InventoryIntelligencePage() {
  const navigate = useNavigate();
  const {
    loading,
    predictions,
    criticalItems,
    warningItems,
    loadPredictions
  } = useInventoryIntelligencePage();

  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const filteredPredictions = statusFilter === 'ALL' 
    ? predictions 
    : predictions.filter(p => p.status === statusFilter);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse font-mono tabular-nums">
      <BrainCircuit className="w-16 h-16 text-amber-500 animate-bounce" />
      <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400 italic">Running Neural Supply Chain Analysis...</p>
    </div>
  );

  return (
    <div className="space-y-8 pt-4 pb-12 animate-quantum-fade max-w-[1500px] mx-auto min-h-screen">
      {/* 🧠 NEURAL COCKPIT HEADER */}
      <header className="flex flex-col xl:flex-row items-center justify-between gap-6 p-6 rounded-lg border border-border bg-card text-card-foreground shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 dark:bg-amber-500/10 rounded-lg blur-[80px] -mr-32 -mt-32" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-md bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
            <BrainCircuit size={32} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-zinc-900 dark:text-zinc-50">
                Stock <span className="text-amber-500 italic">Intelligence</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-400/20 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Live Predictions</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold tracking-widest uppercase">Predictive Analytics & Runway Monitoring</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
           <div className="px-4 py-2 bg-background rounded-lg border border-border backdrop-blur-md flex items-center gap-6 text-foreground">
              <div className="text-center">
                 <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-0.5">Items Monitored</p>
                 <p className="text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-zinc-50">{predictions.length}</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                 <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase mb-0.5">Critical Risks</p>
                 <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums">{criticalItems.length}</p>
              </div>
           </div>
           <Button onClick={loadPredictions} variant="outline" size="icon" className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-850">
              <RefreshCw size={18} className={cn(loading && "animate-spin", "text-amber-500")} />
           </Button>
        </div>
      </header>

      {/* 🚀 PREDICTIVE INSIGHT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {predictions.slice(0, 4).map((p, idx) => (
          <Card key={idx} className={cn(
            "p-6 border shadow-xl transition-all duration-500 hover:translate-y-[-8px] rounded-lg",
            p.status === 'Kritis' 
              ? "bg-rose-500 text-zinc-900 dark:text-zinc-100 border-rose-600 dark:bg-rose-600 dark:border-rose-700 shadow-rose-500/10" 
              : "bg-card border-border text-card-foreground shadow-sm"
          )}>
            <div className="flex justify-between items-start mb-4">
              <div className={cn("w-10 h-10 rounded-md flex items-center justify-center shadow-inner border", p.status === 'Kritis' ? "bg-background/20 border-white/10 text-zinc-900 dark:text-zinc-100" : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500/10")}>
                {p.status === 'Kritis' ? <AlertTriangle size={20} /> : <Zap size={20} />}
              </div>
              <div className="text-right">
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", p.status === 'Kritis' ? "text-rose-100" : "text-zinc-500 dark:text-zinc-400")}>Stock Runway</p>
                <p className="text-2xl font-black font-mono tabular-nums tracking-tight">{p.daysLeft} <span className="text-xs font-normal">Days</span></p>
              </div>
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight mb-0.5 truncate">{p.name}</h3>
            <p className={cn("text-xs font-semibold uppercase", p.status === 'Kritis' ? "text-rose-100" : "text-zinc-500 dark:text-zinc-400")}>Usage: {p.avgDailyUsage} {p.unit}/day</p>
            
            <div className={cn("mt-6 pt-4 border-t flex items-center justify-between", p.status === 'Kritis' ? "border-white/10" : "border-border")}>
              <span className="text-[10px] font-black uppercase tracking-wider">{p.recommendation}</span>
              <ChevronRight size={14} />
            </div>
          </Card>
        ))}
      </div>

      {/* 📊 RUNWAY RECOGNITION LEDGER */}
      <Card className="border border-border bg-card text-card-foreground shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="p-6 border-b border-border bg-background">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <CardTitle className="text-lg font-bold uppercase tracking-tight text-foreground">Inventory Runway Audit</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Neural prediction of material depletion</CardDescription>
            </div>
            <div className="flex gap-3 flex-wrap items-center">
               <select
                 className="flex h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-background px-3 py-1 text-xs font-bold uppercase shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20 text-foreground"
                 value={statusFilter}
                 onChange={e => setStatusFilter(e.target.value)}
               >
                 <option value="ALL">Semua Status</option>
                 <option value="Kritis">🔴 Kritis</option>
                 <option value="Peringatan">🟡 Peringatan</option>
                 <option value="Aman">🟢 Aman</option>
               </select>
               <div className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> {criticalItems.length} Critical
               </div>
               <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> {warningItems.length} Warnings
               </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto relative no-scrollbar">
            <table className="w-full caption-bottom text-sm border-collapse">
              <thead className="sticky top-0 z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                <tr className="border-b border-border bg-background">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-background text-left align-middle">Material Entity</th>
                  <th className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-background align-middle">Current Stock</th>
                  <th className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-background align-middle">Daily Velocity</th>
                  <th className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-background align-middle">Runway (Days)</th>
                  <th className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-background align-middle">Status</th>
                  <th className="text-right px-6 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-background align-middle">Strategic Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPredictions.map((p, idx) => (
                  <tr key={idx} className="group h-20 hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 border-b border-border transition-all">
                    <td className="px-6 align-middle">
                      <div className="flex items-center gap-3">
                         <div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold shadow-sm text-sm", 
                           p.status === 'Kritis' ? "bg-rose-500" : p.status === 'Peringatan' ? "bg-amber-500" : "bg-emerald-500"
                         )}>{p.name[0]}</div>
                         <div className="space-y-0.5 text-left">
                            <p className="font-bold text-sm uppercase tracking-tight text-foreground">{p.name}</p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Base Unit: {p.unit}</p>
                         </div>
                      </div>
                    </td>
                    <td className="text-center align-middle">
                      <span className="text-base font-black font-mono tabular-nums text-foreground">{p.currentStock}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold ml-1">{p.unit}</span>
                    </td>
                    <td className="text-center align-middle">
                      <div className="flex flex-col items-center">
                         <span className="text-sm font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">{p.avgDailyUsage}</span>
                         <div className="w-12 h-1 bg-border rounded-lg mt-1 overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, p.avgDailyUsage * 10)}%` }} />
                         </div>
                      </div>
                    </td>
                    <td className="text-center align-middle">
                      <div className={cn(
                        "inline-flex items-center justify-center w-10 h-10 rounded-md font-bold text-xs font-mono tabular-nums shadow-inner border",
                        p.status === 'Kritis' 
                          ? "border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30" 
                          : "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                      )}>
                        {p.daysLeft}
                      </div>
                    </td>
                    <td className="text-center align-middle">
                      <span className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                        p.status === 'Kritis' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800" : 
                        p.status === 'Peringatan' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-500/20" : 
                        "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      )}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-right px-6 align-middle">
                      {p.status === 'Kritis' ? (
                        <Button 
                          size="sm" 
                          className="h-8 px-3 rounded-md text-white dark:text-zinc-900 font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 active:scale-95 transition-all text-xs"
                          onClick={() => navigate('/procurement')}
                        >
                          <ShoppingCart size={12} className="mr-1.5" />
                          {p.recommendation}
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8 px-3 rounded-md text-xs font-bold uppercase tracking-wider bg-card border-border text-foreground hover:bg-background active:scale-95 transition-all"
                          onClick={() => navigate('/procurement')}
                        >
                          <BarChart3 size={12} className="mr-1.5 text-amber-500" />
                          {p.recommendation}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* 🔮 INSIGHT FOOTER */}
      <div className="p-8 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-lg text-zinc-100 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 text-zinc-800/30 group-hover:scale-110 transition-transform duration-1000">
            <BrainCircuit size={140} />
         </div>
         <div className="relative z-10 max-w-2xl space-y-4">
            <h4 className="text-2xl font-black uppercase italic tracking-tight leading-tight text-white">Your Supply Chain, <span className="text-amber-500">Evolved.</span></h4>
            <p className="text-zinc-400 text-xs leading-relaxed font-medium uppercase tracking-wider">
               Algoritma kami menganalisis ribuan titik data transaksi untuk memastikan gudang Anda tetap efisien. 
               Prediksi ini diperbarui secara otomatis setiap kali ada penjualan baru tercatat di kasir.
            </p>
            <div className="flex items-center gap-6 pt-2 flex-wrap">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-md flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                     <CheckCircle2 size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">99.8% Forecast Accuracy</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-500/20 rounded-md flex items-center justify-center text-sky-400 border border-sky-500/30">
                     <Clock size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">Real-time Sync Active</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
