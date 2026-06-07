import React from 'react';
import { 
  Scale, TrendingUp, TrendingDown, 
  BarChart3, PieChart, LineChart, 
  RefreshCw, DollarSign, Box, 
  Calendar, Layers, Filter, 
  ArrowUpRight, ArrowDownRight, 
  ShieldCheck, Info, Download, 
  FileText, Landmark, Wallet,
  Sparkles, History, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "@/lib/utils";
import { formatRupiah } from '../utils/formatters';
import { useConsolidatedFinancePage } from '../hooks/useConsolidatedFinancePage';

export default function ConsolidatedFinancePage() {
  const {
    loading,
    period, setPeriod,
    summary,
    stats,
    outletPerformance
  } = useConsolidatedFinancePage();

  if (loading && !summary) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-mono tabular-nums">
      <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse tracking-[0.3em]">Consolidating Ledger Nodes...</p>
    </div>
  );

  const incomeStats = summary?.incomeStatement || {};
  const balanceData = summary?.balanceSheet || {};

  const metrics = [
    { label: 'Consolidated Revenue', val: incomeStats.revenue || 0, trend: '+0.0%', icon: Globe, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Cost of Goods Sold (HPP)', val: incomeStats.hpp || 0, trend: 'Ledger', icon: Box, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
    { label: 'Total Operating Cost', val: incomeStats.expenses || 0, trend: 'Real-time', icon: Wallet, color: 'text-foreground', bg: 'bg-background' },
    { label: 'Estimated Net Profit', val: incomeStats.netProfit || 0, trend: `${incomeStats.grossMargin?.toFixed(1) || 0}% Margin`, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  ];

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Enterprise Ledger</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">Real-time P&L Feed</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Global <span className="text-amber-500 italic">Consolidation</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">Unified financial performance across all physical & digital sales channels.</p>
        </div>
        <div className="flex gap-4 p-1 bg-background rounded-lg border">
           {[
             { id: 'today', label: 'Today' },
             { id: '7days', label: '7 Days' },
             { id: '30days', label: '30 Days' }
           ].map(p => (
             <button 
               key={p.id}
               className={cn("px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", period === p.id ? "bg-card text-foreground shadow-sm border border-border" : "text-zinc-500 dark:text-zinc-100 hover:text-foreground")}
               onClick={() => setPeriod(p.id)}
             >
               {p.label}
             </button>
           ))}
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((s, i) => (
          <Card key={i} className="group border-none bg-card shadow-sm hover:shadow-md transition-all rounded-lg overflow-hidden">
            <CardContent className="p-8 flex items-center justify-between">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">{s.label}</p>
                  <p className={cn("text-2xl font-black font-mono tabular-nums leading-none my-1", s.color)}>
                    {formatRupiah(s.val).replace(',00', '')}
                  </p>
                  <div className="flex items-center gap-1.5">
                     <ArrowUpRight size={12} className={cn(s.trend.startsWith('+') ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")} />
                     <span className={cn("text-[10px] font-black uppercase", s.trend.startsWith('+') ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>{s.trend}</span>
                  </div>
               </div>
               <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center border border-border group-hover:scale-110 transition-transform", s.bg)}>
                  <s.icon size={24} className={cn(s.color)} />
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
         {/* Main P&L Ledger */}
         <div className="xl:col-span-8 space-y-8">
            <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
               <CardHeader className="p-12 border-b border-border bg-background flex flex-row items-center justify-between">
                  <div className="space-y-1">
                     <CardTitle className="text-2xl font-black tracking-tighter uppercase leading-none">Consolidated P&L Statement</CardTitle>
                     <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">Unified ledger across {outletPerformance.length} active nodes</CardDescription>
                  </div>
                  <Button variant="outline" className="h-12 px-6 rounded-lg font-black uppercase tracking-widest text-[9px] border-border bg-card">
                     <Download size={16} className="mr-2" /> Export Statement
                  </Button>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 border-b border-border">
                              <th className="px-12 py-6">Outlet Node</th>
                              <th className="px-12 py-6">Gross Revenue</th>
                              <th className="px-12 py-6">Net Profit</th>
                              <th className="px-12 py-6 text-right">Growth Index</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                           {outletPerformance.map((o, i) => (
                             <tr key={i} className="hover:bg-background transition-all group">
                                <td className="px-12 py-8">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center border border-border font-black text-zinc-900 dark:text-zinc-100 group-hover:">
                                         0{i+1}
                                      </div>
                                      <p className="text-sm font-black text-foreground uppercase tracking-tight">{o.name}</p>
                                   </div>
                                </td>
                                <td className="px-12 py-8 text-sm font-bold font-mono tabular-nums">{formatRupiah(o.revenue)}</td>
                                <td className="px-12 py-8">
                                   <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{formatRupiah(o.profit)}</p>
                                   <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Margin: ~{((o.profit/o.revenue)*100).toFixed(1)}%</p>
                                </td>
                                <td className="px-12 py-8 text-right">
                                   <div className="inline-flex items-center gap-1.5 px-4 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
                                      <ArrowUpRight size={12} /> {o.growth}
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </CardContent>
               <CardFooter className="p-10 bg-background border-t border-border justify-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-100">End of Global Financial Ledger &bull; Secure Audit Verified</p>
               </CardFooter>
            </Card>

            {/* Neural Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="border border-border bg-card shadow-sm group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-amber-500/10 group-hover:scale-110 transition-transform duration-1000">
                     <Sparkles size={120} />
                  </div>
                  <div className="space-y-2 relative z-10 p-8">
                     <div className="inline-flex items-center gap-2 px-4 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-widest">AI Financial Insight</div>
                     <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Net Margin <span className="text-amber-500">Anomaly</span></h4>
                     <p className="text-zinc-500 text-xs font-medium leading-relaxed">
                        Outlet 'Surabaya Edge' menunjukkan efisiensi operasional tertinggi. Neural model menyarankan replikasi struktur biaya logistik ke Menteng Hub.
                     </p>
                  </div>
                  <div className="p-8 pt-0 relative z-10">
                     <Button variant="primary" className="w-full h-14 font-black uppercase tracking-widest text-[10px]">REPLICATE STRATEGY</Button>
                  </div>
               </Card>
               <Card className="border border-border bg-card shadow-sm group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-emerald-500/10 group-hover:rotate-12 transition-transform duration-1000">
                     <Landmark size={120} />
                  </div>
                  <div className="space-y-2 relative z-10 p-8">
                     <div className="inline-flex items-center gap-2 px-4 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Tax & Compliance</div>
                     <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Fiscal <span className="italic underline">Readiness</span></h4>
                     <p className="text-zinc-500 dark:text-zinc-100 text-xs font-bold leading-relaxed uppercase">
                        Laporan PPN terpusat untuk seluruh outlet periode {period} siap diaudit. Total kewajiban fiskal terhitung otomatis berdasarkan regulasi terbaru.
                     </p>
                  </div>
                  <div className="p-8 pt-0 relative z-10">
                     <Button variant="primary" className="w-full h-14 font-black uppercase tracking-widest text-[10px]">AUDIT REPORT</Button>
                  </div>
               </Card>
            </div>
         </div>

         {/* Side Widgets */}
         <div className="xl:col-span-4 space-y-8 sticky top-24">
            <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
               <CardHeader className="p-8 border-b border-border bg-background">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-background border border-border rounded-lg flex items-center justify-center">
                        <PieChart size={20} className="text-foreground" />
                     </div>
                     <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tighter">Revenue Split</CardTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">Channel Distribution</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  {[
                    { label: 'Walk-in / POS', val: '65%', color: 'bg-amber-500' },
                    { label: 'GoFood / External', val: '22%', color: 'bg-emerald-500' },
                    { label: 'GrabFood / External', val: '13%', color: 'bg-blue-500' },
                  ].map(c => (
                    <div key={c.label} className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-zinc-500 dark:text-zinc-100">{c.label}</span>
                          <span className="text-foreground">{c.val}</span>
                       </div>
                       <div className="h-2 bg-background rounded-lg overflow-hidden">
                          <div className={cn("h-full rounded-lg transition-all duration-1000", c.color)} style={{ width: c.val }} />
                       </div>
                    </div>
                  ))}
               </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm group relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
               <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between relative z-10">
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Historical Trend</p>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mt-1">REVENUE <span className="text-amber-500">CURVE</span></h3>
                  </div>
                  <LineChart className="text-zinc-400 group-hover:text-amber-500 transition-colors" size={32} />
               </CardHeader>
               <CardContent className="p-10 pt-6 space-y-8 relative z-10">
                  <div className="flex items-end gap-4 h-32">
                     {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 relative group/bar rounded-t-sm overflow-hidden bg-background">
                           <div className="absolute bottom-0 inset-x-0 bg-amber-500/20 group-hover/bar:bg-amber-500 transition-colors" style={{ height: `${h}%` }} />
                        </div>
                     ))}
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-6">
                     <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Growth Forecast</p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">+18.2%</p>
                     </div>
                     <Button variant="ghost" size="icon" className="h-12 w-12 rounded-lg hover:bg-background/5 text-zinc-900 dark:text-zinc-100">
                        <ArrowUpRight size={24} />
                     </Button>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
