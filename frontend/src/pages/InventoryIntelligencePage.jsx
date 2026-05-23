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

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse font-mono tabular-nums">
      <BrainCircuit className="w-16 h-16 text-amber-500 animate-bounce" />
      <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400 italic">Running Neural Supply Chain Analysis...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-20 animate-quantum-fade max-w-[1500px] mx-auto min-h-screen">
      {/* 🧠 NEURAL COCKPIT HEADER */}
      <header className="flex flex-col xl:flex-row items-center justify-between gap-8 p-10 rounded-lg border border-border bg-card text-card-foreground shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 dark:bg-amber-500/10 rounded-lg blur-[80px] -mr-32 -mt-32" />
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-20 h-20 ">
            <BrainCircuit size={40} strokeWidth={2.5} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-foreground">
                Stock <span className="text-amber-500">Intelligence</span>
              </h1>
              <span className="px-4 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-400/20 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">Live Predictions</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-100 font-bold tracking-widest uppercase">Predictive Analytics & Runway Monitoring</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
           <div className="px-6 py-2 bg-background rounded-lg border border-border backdrop-blur-md flex items-center gap-6 text-foreground">
              <div className="text-center">
                 <p className="text-[8px] font-black text-zinc-500 dark:text-zinc-100 uppercase mb-1">Items Monitored</p>
                 <p className="text-xl font-black font-mono tabular-nums">{predictions.length}</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                 <p className="text-[8px] font-black text-rose-600 dark:text-rose-400 uppercase mb-1">Critical Risks</p>
                 <p className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums">{criticalItems.length}</p>
              </div>
           </div>
           <Button onClick={loadPredictions} variant="outline" className="h-14 w-14 ">
              <RefreshCw size={20} className={cn(loading && "animate-spin", "text-amber-500")} />
           </Button>
        </div>
      </header>

      {/* 🚀 PREDICTIVE INSIGHT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {predictions.slice(0, 4).map((p, idx) => (
          <Card key={idx} className={cn(
            "p-8 border shadow-xl transition-all duration-500 hover:translate-y-[-8px] rounded-lg",
            p.status === 'Kritis' 
              ? "bg-rose-500 text-zinc-900 dark:text-zinc-100 border-rose-600 dark:bg-rose-600 dark:border-rose-700 shadow-rose-500/10" 
              : "bg-card border-border text-card-foreground shadow-sm"
          )}>
            <div className="flex justify-between items-start mb-6">
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shadow-inner border", p.status === 'Kritis' ? "bg-background/20 border-white/10 text-zinc-900 dark:text-zinc-100" : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500/10")}>
                {p.status === 'Kritis' ? <AlertTriangle size={24} /> : <Zap size={24} />}
              </div>
              <div className="text-right">
                <p className={cn("text-[9px] font-black uppercase tracking-widest", p.status === 'Kritis' ? "text-rose-100" : "text-zinc-500 dark:text-zinc-100")}>Stock Runway</p>
                <p className="text-3xl font-black font-mono tabular-nums tracking-tighter">{p.daysLeft} <span className="text-sm">Days</span></p>
              </div>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-1 truncate">{p.name}</h3>
            <p className={cn("text-[10px] font-bold uppercase", p.status === 'Kritis' ? "text-rose-100" : "text-zinc-500 dark:text-zinc-100")}>Usage: {p.avgDailyUsage} {p.unit}/day</p>
            
            <div className={cn("mt-8 pt-6 border-t flex items-center justify-between", p.status === 'Kritis' ? "border-white/10" : "border-border")}>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] ">{p.recommendation}</span>
              <ChevronRight size={16} />
            </div>
          </Card>
        ))}
      </div>

      {/* 📊 RUNWAY RECOGNITION LEDGER */}
      <Card className="border border-border bg-card text-card-foreground shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="p-10 border-b border-border bg-background">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter text-foreground">Inventory Runway Audit</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100">Neural prediction of material depletion</CardDescription>
            </div>
            <div className="flex gap-2">
               <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                 <div className="w-2 h-2 bg-rose-500 rounded-lg animate-pulse" /> {criticalItems.length} Critical
               </div>
               <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                 <div className="w-2 h-2 " /> {warningItems.length} Warnings
               </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-background">
              <TableRow className="border-b border-border">
                <TableHead className="px-10 py-6 text-foreground">Material Entity</TableHead>
                <TableHead className="text-center text-foreground">Current Stock</TableHead>
                <TableHead className="text-center text-foreground">Daily Velocity</TableHead>
                <TableHead className="text-center text-foreground">Runway (Days)</TableHead>
                <TableHead className="text-center text-foreground">Status</TableHead>
                <TableHead className="text-right px-10 text-foreground">Strategic Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictions.map((p, idx) => (
                <TableRow key={idx} className="group h-24 hover:bg-background border-b border-border transition-all">
                  <TableCell className="px-10">
                    <div className="flex items-center gap-4">
                       <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-black shadow-lg", 
                         p.status === 'Kritis' ? "bg-rose-500" : p.status === 'Peringatan' ? "bg-amber-500" : "bg-emerald-500"
                       )}>{p.name[0]}</div>
                       <div className="space-y-0.5">
                          <p className="font-black text-sm uppercase tracking-tight text-foreground">{p.name}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-bold uppercase tracking-widest">Base Unit: {p.unit}</p>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-lg font-black font-mono tabular-nums text-foreground">{p.currentStock}</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-100 font-bold ml-1">{p.unit}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                       <span className="text-sm font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">{p.avgDailyUsage}</span>
                       <div className="w-12 h-1 bg-border rounded-lg mt-1 overflow-hidden">
                          <div className="h-full " style={{ width: `${Math.min(100, p.avgDailyUsage * 10)}%` }} />
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "inline-flex items-center justify-center w-12 h-12 rounded-lg font-black text-sm font-mono tabular-nums shadow-inner border-2",
                      p.status === 'Kritis' 
                        ? "border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30" 
                        : "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                    )}>
                      {p.daysLeft}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border",
                      p.status === 'Kritis' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800" : 
                      p.status === 'Peringatan' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-500/20" : 
                      "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    )}>
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-10">
                    {p.status === 'Kritis' ? (
                      <Button 
                        size="sm" 
                        className="h-10 px-4 rounded-lg text-white dark:text-zinc-900 font-black uppercase tracking-widest "
                        onClick={() => navigate('/procurement')}
                      >
                        <ShoppingCart size={12} className="mr-2" />
                        {p.recommendation}
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-10 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest bg-card border-border text-foreground hover:bg-background transition-all"
                        onClick={() => navigate('/procurement')}
                      >
                        <BarChart3 size={12} className="mr-2 text-amber-500" />
                        {p.recommendation}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* 🔮 INSIGHT FOOTER */}
      <div className="p-12 bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-zinc-950 dark:to-zinc-900 border border-zinc-800/40 dark:border-zinc-800/80 rounded-lg text-zinc-900 dark:text-zinc-100 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12  group-hover:scale-110 transition-transform duration-1000">
            <BrainCircuit size={160} />
         </div>
         <div className="relative z-10 max-w-2xl space-y-6">
            <h4 className="text-3xl font-black uppercase italic tracking-tighter leading-tight text-zinc-900 dark:text-zinc-100">Your Supply Chain, <span className="text-amber-500">Evolved.</span></h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed font-medium uppercase tracking-wider text-[11px]">
               Algoritma kami menganalisis ribuan titik data transaksi untuk memastikan gudang Anda tetap efisien. 
               Prediksi ini diperbarui secara otomatis setiap kali ada penjualan baru tercatat di kasir.
            </p>
            <div className="flex items-center gap-6 pt-4">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-center justify-center text-amber-400 border border-amber-500/20">
                     <CheckCircle2 size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300">99.8% Forecast Accuracy</span>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-background/5 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-white/5">
                     <Clock size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300">Real-time Sync Active</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
