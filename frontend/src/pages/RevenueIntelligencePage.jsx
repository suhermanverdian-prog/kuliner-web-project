import React from 'react';
import { 
  TrendingUp, TrendingDown, Zap, 
  Target, ShieldAlert, BarChart3, 
  ArrowUpRight, ArrowDownRight, 
  RefreshCw, DollarSign, Box, 
  LineChart, Sparkles, AlertTriangle,
  Info, Save, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { formatRupiah } from '../utils/formatters';
import { useRevenueIntelligencePage, pricingSuggestions } from '../hooks/useRevenueIntelligencePage';

export default function RevenueIntelligencePage() {
  const {
    loading,
    analysisMode, setAnalysisMode
  } = useRevenueIntelligencePage();

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-mono tabular-nums">
      <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Running Neural Pricing Models...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2 py-1 bg-amber- border border-amber-500/20 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Enterprise Intelligence</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">Live Neural Feed</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Revenue <span className="text-amber-500 italic">Intelligence</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">Predictive pricing models & automated margin protection system.</p>
        </div>
        <div className="flex gap-4 p-1 bg-background rounded-lg border">
           <button 
             className={cn("px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", analysisMode === 'optimization' ? "bg-card text-foreground shadow-sm" : "text-zinc-500 dark:text-zinc-100 hover:text-foreground")}
             onClick={() => setAnalysisMode('optimization')}
           >
             Optimization
           </button>
           <button 
             className={cn("px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", analysisMode === 'forecasting' ? "bg-card text-foreground shadow-sm" : "text-zinc-500 dark:text-zinc-100 hover:text-foreground")}
             onClick={() => setAnalysisMode('forecasting')}
           >
             Forecasting
           </button>
        </div>
      </div>

      {/* Hero Analytics Card */}
      <Card className="border-none ">
         <div className="absolute top-0 right-0 p-12  group-hover:scale-110 transition-transform duration-1000">
            <LineChart size={240} />
         </div>
         <CardContent className="p-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-8">
               <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1 ">
                     AI Insight: Expansion Required
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter uppercase leading-none">
                     Potential <span className="text-amber-500">Revenue Growth</span> Identified: Rp 45.2M
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium max-w-md">
                     Neural models menyarankan penyesuaian harga pada 8 kategori menu untuk mengimbangi kenaikan biaya logistik global.
                  </p>
               </div>
               <div className="flex gap-6">
                  <Button className="">
                     VIEW RECOMMENDATIONS
                  </Button>
                  <Button variant="ghost" className="h-14 px-8 font-black uppercase tracking-widest text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100">
                     DISMISS ALERT
                  </Button>
               </div>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-6 items-center">
               <div className="p-6 bg-background/5 rounded-lg border border-white/10 space-y-2">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Confidence Score</p>
                  <p className="text-4xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">98.2%</p>
               </div>
               <div className="p-6 bg-background/5 rounded-lg border border-white/10 space-y-2">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Market Stability</p>
                  <p className="text-4xl font-black font-mono tabular-nums text-amber-500">High</p>
               </div>
               <div className="col-span-2 p-6 bg-amber- rounded-lg border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest">Last Sync</p>
                    <p className="text-xs font-bold text-amber-500 uppercase">2 minutes ago</p>
                  </div>
                  <RefreshCw size={24} className="text-amber-500 " />
               </div>
            </div>
         </CardContent>
      </Card>

      {/* Main Analysis Engine */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         {/* Optimization List */}
         <div className="xl:col-span-8 space-y-6">
            <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
               <CardHeader className="p-10 border-b border-border bg-background">
                  <div className="flex items-center justify-between">
                     <div>
                        <CardTitle className="text-2xl font-black tracking-tighter uppercase">Smart Pricing Optimization</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">Real-time dynamic price adjustments</CardDescription>
                     </div>
                     <Sparkles className="text-amber-500" />
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 border-b border-border">
                              <th className="px-10 py-6">Product Node</th>
                              <th className="px-10 py-6">Current Price</th>
                              <th className="px-10 py-6">Suggested Price</th>
                              <th className="px-10 py-6">AI Rationality</th>
                              <th className="px-10 py-6 text-right">Impact</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                           {pricingSuggestions.map(s => (
                             <tr key={s.id} className="hover:bg-background transition-all group">
                                <td className="px-10 py-8">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center border border-border group-hover:">
                                         <Box size={20} />
                                      </div>
                                      <p className="text-sm font-black text-foreground">{s.item}</p>
                                   </div>
                                </td>
                                <td className="px-10 py-8">
                                   <p className="text-xs font-bold text-zinc-500 dark:text-zinc-100 line-through  font-mono tabular-nums">{formatRupiah(s.current)}</p>
                                </td>
                                <td className="px-10 py-8">
                                   <p className={cn("text-base font-black font-mono tabular-nums", s.suggested > s.current ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                      {formatRupiah(s.suggested)}
                                   </p>
                                </td>
                                <td className="px-10 py-8">
                                   <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-100 leading-relaxed max-w-[200px]">
                                      {s.reason}
                                   </p>
                                </td>
                                <td className="px-10 py-8 text-right">
                                   <div className="inline-flex items-center gap-1.5 px-4 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
                                      <ArrowUpRight size={12} /> {s.impact}
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </CardContent>
               <CardFooter className="p-8 border-t border-border bg-background justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">Pricing data based on local market volatility index.</p>
                  <Button className="">APPLY ALL CHANGES</Button>
               </CardFooter>
            </Card>
         </div>

         {/* Margin Guard Sidebar */}
         <div className="xl:col-span-4 space-y-8">
            <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
               <CardHeader className="p-8 border-b border-border bg-rose-500/5">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-rose-500 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-lg shadow-rose-500/20">
                        <ShieldAlert size={24} />
                     </div>
                     <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tighter">Margin Guard</CardTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-widest text-rose-600">Cost Anomaly Detection</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg space-y-4">
                     <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black uppercase text-rose-700 tracking-widest">Raw Material Peak</p>
                        <AlertTriangle size={16} className="text-rose-600" />
                     </div>
                     <h4 className="text-xl font-black text-rose-950 dark:text-rose-600 dark:text-rose-400 uppercase">COFFEE BEANS +24%</h4>
                     <p className="text-xs font-medium text-rose-900/60 dark:text-rose-600 dark:text-rose-400/60 leading-relaxed">
                        Harga beli supplier "Global Bean Co." melonjak drastis pagi ini. Estimasi penurunan margin laba: <span className="font-black text-rose-600">8.2%</span>
                     </p>
                     <Button variant="outline" className="w-full border-rose-200 dark:border-rose-800 text-rose-600 font-black uppercase text-[9px] tracking-widest h-10 rounded-lg hover:bg-rose-50 dark:bg-rose-950/30">ADJUST MENU PRICE</Button>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest border-b border-border pb-2">Stable Materials</p>
                     <div className="space-y-3">
                        {['Milk & Cream', 'Sugar Syrup', 'Paper Cups'].map(item => (
                          <div key={item} className="flex justify-between items-center text-xs font-bold text-foreground">
                             <span>{item}</span>
                             <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-[9px] font-black">Normal</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-none ">
               <CardHeader className="p-8 pb-0">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Revenue Forecast</p>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mt-1">MONTHLY <span className="text-amber-500">OUTLOOK</span></h3>
               </CardHeader>
               <CardContent className="p-8 pt-6 space-y-8">
                  <div className="flex items-end gap-2">
                     <div className="flex-1 h-32 ">
                        <div className="absolute bottom-0 inset-x-0 bg-amber- h-[60%] group-hover:h-[65%] transition-all" />
                     </div>
                     <div className="flex-1 h-32 ">
                        <div className="absolute bottom-0 inset-x-0 bg-amber- h-[75%] group-hover:h-[80%] transition-all" />
                     </div>
                     <div className="flex-1 h-32 ">
                        <div className="absolute bottom-0 inset-x-0 " />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <TrendingUp size={24} className="text-zinc-950" />
                        </div>
                     </div>
                     <div className="flex-1 h-32 ">
                        <p className="text-[9px] font-black text-zinc-600 uppercase -rotate-90">Forecast</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Expected Rev</p>
                        <p className="text-lg font-black font-mono tabular-nums text-zinc-900 dark:text-zinc-100">Rp 1.42B</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Trend Logic</p>
                        <p className="text-lg font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">+12.4%</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>

      {/* Audit & Intelligence Note */}
      <div className="p-10 bg-background border border-border rounded-lg flex flex-col md:flex-row items-center gap-8 group">
         <div className="w-16 h-16 bg-card border border-border rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-100 group-hover:text-amber-500 transition-colors shrink-0">
            <Info size={32} />
         </div>
         <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100">Intelligence Transparency</p>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-100 leading-relaxed max-w-4xl">
               Semua rekomendasi harga dihasilkan melalui mesin simulasi Monte Carlo berbasis data historis 24 bulan terakhir. Perubahan harga akan dicatat secara otomatis dalam Audit Log Global untuk kebutuhan pelaporan fiskal dan kepatuhan manajerial.
            </p>
         </div>
      </div>
    </div>
  );
}
