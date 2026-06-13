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
import { useRevenueIntelligencePage } from '../hooks/useRevenueIntelligencePage';

export default function RevenueIntelligencePage() {
  const {
    loading,
    analysisMode, setAnalysisMode,
    pricingSuggestions,
    handleApplyChanges,
    fetchPricingModel
  } = useRevenueIntelligencePage();

  const [showAlert, setShowAlert] = React.useState(true);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-mono tabular-nums">
      <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse text-zinc-500 dark:text-zinc-400">Running Neural Pricing Models...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-sm text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Enterprise Intelligence</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">Live Neural Feed</span>
              </div>
           </div>
           <h2 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase leading-none">Revenue <span className="text-amber-500 italic">Intelligence</span></h2>
           <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Predictive pricing models & automated margin protection system.</p>
        </div>
        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700">
           <button 
             className={cn("px-4 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all active:scale-95", analysisMode === 'optimization' ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-foreground")}
             onClick={() => setAnalysisMode('optimization')}
           >
             Optimization
           </button>
           <button 
             className={cn("px-4 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all active:scale-95", analysisMode === 'forecasting' ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-foreground")}
             onClick={() => setAnalysisMode('forecasting')}
           >
             Forecasting
           </button>
        </div>
      </div>

      {/* Hero Analytics Card */}
      {showAlert && (
        <Card className="border border-zinc-200 dark:border-zinc-850 relative overflow-hidden bg-card text-card-foreground shadow-lg rounded-lg">
           <div className="absolute top-0 right-0 p-6 opacity-10 dark:opacity-5 text-zinc-300 dark:text-zinc-750 pointer-events-none">
              <LineChart size={200} />
           </div>
           <CardContent className="p-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-6">
                 <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-sm bg-amber-500/10 border border-amber-500/25 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                       AI Insight: Price Adjustments
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase leading-tight text-zinc-900 dark:text-white">
                       Potential <span className="text-amber-500">Revenue Growth</span> Identified: Rp 45.2M
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium max-w-md">
                       Neural models menyarankan penyesuaian harga pada beberapa menu untuk mengimbangi kenaikan biaya logistik global.
                    </p>
                 </div>
                 <div className="flex gap-4">
                    <Button 
                      className="bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 font-bold text-xs h-10 px-4 active:scale-95 transition-all shadow-md rounded-md"
                      onClick={() => document.getElementById('pricing-table')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                       VIEW RECOMMENDATIONS
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="h-10 px-4 font-black uppercase tracking-widest text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                      onClick={() => setShowAlert(false)}
                    >
                       DISMISS ALERT
                    </Button>
                 </div>
              </div>
              <div className="lg:col-span-5 grid grid-cols-2 gap-4 items-center">
                 <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-md border border-zinc-200/50 dark:border-zinc-800 space-y-1">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Confidence Score</p>
                    <p className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">98.2%</p>
                 </div>
                 <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-md border border-zinc-200/50 dark:border-zinc-800 space-y-1">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Market Stability</p>
                    <p className="text-2xl font-black font-mono tabular-nums text-amber-500">High</p>
                 </div>
                 <div className="col-span-2 p-4 bg-amber-500/10 dark:bg-amber-950/20 rounded-md border border-amber-500/20 flex items-center justify-between">
                    <div>
                       <p className="text-[9px] font-black text-amber-600 dark:text-amber-400/70 uppercase tracking-widest">Last Sync</p>
                       <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">2 minutes ago</p>
                    </div>
                    <button 
                      onClick={fetchPricingModel} 
                      className="p-2 rounded-md text-amber-500 hover:bg-amber-500/10 active:scale-90 transition-all cursor-pointer"
                      title="Refresh model"
                    >
                      <RefreshCw size={18} className="hover:rotate-180 transition-transform duration-500" />
                    </button>
                 </div>
              </div>
           </CardContent>
        </Card>
      )}

      {/* Main Analysis Engine */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
         {/* Optimization List */}
         <div className="xl:col-span-8 space-y-6" id="pricing-table">
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-card shadow-lg rounded-lg overflow-hidden">
               <CardHeader className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex flex-row items-center justify-between">
                  <div>
                     <CardTitle className="text-lg font-black tracking-tighter uppercase text-zinc-900 dark:text-white">Smart Pricing Optimization</CardTitle>
                     <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Real-time dynamic price adjustments</CardDescription>
                  </div>
                  <Sparkles className="text-amber-500" size={20} />
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                               <th className="px-6 py-4">Product Node</th>
                               <th className="px-6 py-4">Current Price</th>
                               <th className="px-6 py-4">Suggested Price</th>
                               <th className="px-6 py-4">AI Rationality</th>
                               <th className="px-6 py-4 text-right">Impact</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {pricingSuggestions.map(s => (
                              <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-all group">
                                 <td className="px-6 py-3">
                                    <div className="flex items-center gap-3">
                                       <div className="w-9 h-9 bg-zinc-50 dark:bg-zinc-900 rounded-md flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group-hover:border-amber-500/30 transition-colors">
                                          <Box size={16} className="text-zinc-500 dark:text-zinc-400" />
                                       </div>
                                       <p className="text-xs font-black text-zinc-900 dark:text-white">{s.item}</p>
                                    </div>
                                 </td>
                                 <td className="px-6 py-3">
                                    <p className="text-xs font-bold text-zinc-400 line-through font-mono tabular-nums">{formatRupiah(s.current)}</p>
                                 </td>
                                 <td className="px-6 py-3">
                                    <p className={cn("text-sm font-black font-mono tabular-nums", s.suggested > s.current ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                       {formatRupiah(s.suggested)}
                                    </p>
                                 </td>
                                 <td className="px-6 py-3">
                                    <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[200px]">
                                       {s.reason}
                                    </p>
                                 </td>
                                 <td className="px-6 py-3 text-right">
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-sm text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
                                       <ArrowUpRight size={10} /> {s.impact}
                                    </div>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                       </table>
                    </div>
               </CardContent>
               <CardFooter className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Pricing data based on local market volatility index.</p>
                  <Button 
                    className="bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 font-bold text-xs h-10 px-6 active:scale-95 transition-all shadow-md w-full sm:w-auto rounded-md"
                    onClick={handleApplyChanges}
                  >
                    APPLY ALL CHANGES
                  </Button>
               </CardFooter>
            </Card>
         </div>

         {/* Margin Guard Sidebar */}
         <div className="xl:col-span-4 space-y-6">
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-card shadow-lg rounded-lg overflow-hidden">
               <CardHeader className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-rose-500/5">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-rose-500 rounded-md flex items-center justify-center text-white dark:text-zinc-900 shadow-md shadow-rose-500/20">
                        <ShieldAlert size={20} />
                     </div>
                     <div>
                        <CardTitle className="text-base font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Margin Guard</CardTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Cost Anomaly Detection</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-6 space-y-6">
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-md space-y-3">
                     <div className="flex justify-between items-start">
                        <p className="text-[9px] font-black uppercase text-rose-700 dark:text-rose-400/70 tracking-widest">Raw Material Peak</p>
                        <AlertTriangle size={14} className="text-rose-600" />
                     </div>
                     <h4 className="text-base font-black text-rose-950 dark:text-rose-400 uppercase">COFFEE BEANS +24%</h4>
                     <p className="text-[11px] font-medium text-rose-900/60 dark:text-rose-400/60 leading-relaxed">
                        Harga beli supplier "Global Bean Co." melonjak drastis pagi ini. Estimasi penurunan margin laba: <span className="font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums">8.2%</span>
                     </p>
                     <Button 
                       variant="outline" 
                       className="w-full border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 font-bold uppercase text-[9px] tracking-widest h-9 rounded-md hover:bg-rose-50 dark:bg-rose-950/20 active:scale-95 transition-all"
                       onClick={handleApplyChanges}
                     >
                       ADJUST MENU PRICE
                     </Button>
                  </div>

                  <div className="space-y-3">
                     <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800 pb-1.5">Stable Materials</p>
                     <div className="space-y-2">
                        {['Milk & Cream', 'Sugar Syrup', 'Paper Cups'].map(item => (
                          <div key={item} className="flex justify-between items-center text-xs font-bold text-zinc-800 dark:text-zinc-200">
                             <span>{item}</span>
                             <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-[9px] font-black">Normal</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 bg-card shadow-lg rounded-lg overflow-hidden">
               <CardHeader className="p-6 pb-2">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Revenue Forecast</p>
                  <h3 className="text-lg font-black uppercase tracking-tighter mt-1 text-zinc-900 dark:text-white">MONTHLY <span className="text-amber-500">OUTLOOK</span></h3>
               </CardHeader>
               <CardContent className="p-6 pt-4 space-y-6">
                  <div className="flex items-end gap-2 h-24">
                     <div className="flex-1 h-full bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200/50 dark:border-zinc-800 relative overflow-hidden group">
                        <div className="absolute bottom-0 inset-x-0 bg-amber-500/20 h-[60%] group-hover:h-[65%] transition-all" />
                     </div>
                     <div className="flex-1 h-full bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200/50 dark:border-zinc-800 relative overflow-hidden group">
                        <div className="absolute bottom-0 inset-x-0 bg-amber-500/30 h-[75%] group-hover:h-[80%] transition-all" />
                     </div>
                     <div className="flex-1 h-full bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200/50 dark:border-zinc-800 relative flex items-center justify-center">
                        <TrendingUp size={18} className="text-amber-500" />
                     </div>
                     <div className="flex-1 h-full flex items-center justify-center">
                        <p className="text-[9px] font-black text-zinc-500 uppercase -rotate-90">Forecast</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Expected Rev</p>
                        <p className="text-sm font-black font-mono tabular-nums text-zinc-900 dark:text-white">Rp 1.42B</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Trend Logic</p>
                        <p className="text-sm font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">+12.4%</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>

      {/* Audit & Intelligence Note */}
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col md:flex-row items-center gap-4 group">
         <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-amber-500 transition-colors shrink-0">
            <Info size={24} />
         </div>
         <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Intelligence Transparency</p>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
               Semua rekomendasi harga dihasilkan melalui mesin simulasi Monte Carlo berbasis data historis 24 bulan terakhir. Perubahan harga akan dicatat secara otomatis dalam Audit Log Global untuk kebutuhan pelaporan fiskal dan kepatuhan manajerial.
            </p>
         </div>
      </div>
    </div>
  );
}
