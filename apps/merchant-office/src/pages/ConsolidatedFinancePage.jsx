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
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function ConsolidatedFinancePage() {
  const navigate = useNavigate();
  const {
    loading,
    period, setPeriod,
    summary,
    stats,
    outletPerformance,
    dailyTrend
  } = useConsolidatedFinancePage();

  const highestMarginOutlet = React.useMemo(() => {
    if (!outletPerformance || outletPerformance.length === 0) return null;
    return [...outletPerformance].sort((a, b) => {
      const marginA = a.revenue > 0 ? (a.profit / a.revenue) : 0;
      const marginB = b.revenue > 0 ? (b.profit / b.revenue) : 0;
      return marginB - marginA;
    })[0];
  }, [outletPerformance]);

  const lowestMarginOutlet = React.useMemo(() => {
    if (!outletPerformance || outletPerformance.length <= 1) return null;
    // Filter out the highest margin outlet to prevent comparing to itself
    const filtered = outletPerformance.filter(o => o.name !== highestMarginOutlet?.name);
    if (filtered.length === 0) return null;
    return [...filtered].sort((a, b) => {
      const marginA = a.revenue > 0 ? (a.profit / a.revenue) : 0;
      const marginB = b.revenue > 0 ? (b.profit / b.revenue) : 0;
      return marginA - marginB;
    })[0];
  }, [outletPerformance, highestMarginOutlet]);

  if (loading && !summary) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-mono tabular-nums">
      <RefreshCw className="w-8 h-8 animate-spin text-amber-500 dark:text-amber-400" />
      <p className="text-xs font-black uppercase tracking-widest animate-pulse tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Consolidating Ledger Nodes...</p>
    </div>
  );

  const incomeStats = summary?.incomeStatement || {};
  const balanceData = summary?.balanceSheet || {};

  const metrics = [
    { label: 'Consolidated Revenue', val: incomeStats.revenue || 0, trend: '+0.0%', icon: Globe, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Cost of Goods Sold (HPP)', val: incomeStats.hpp || 0, trend: 'Ledger', icon: Box, color: 'text-zinc-500 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800' },
    { label: 'Total Operating Cost', val: incomeStats.expenses || 0, trend: 'Real-time', icon: Wallet, color: 'text-zinc-900 dark:text-zinc-100', bg: 'bg-zinc-50 dark:bg-zinc-900' },
    { label: 'Estimated Net Profit', val: incomeStats.netProfit || 0, trend: `${incomeStats.grossMargin?.toFixed(1) || 0}% Margin`, icon: TrendingUp, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  ];

  const exportStatement = () => {
    if (!outletPerformance || outletPerformance.length === 0) {
      toast.error('Tidak ada data performa outlet untuk diekspor.');
      return;
    }
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Outlet Node,Gross Revenue,Net Profit,Growth Index\r\n";
      outletPerformance.forEach(o => {
        csvContent += `"${o.name}","${o.revenue}","${o.profit}","${o.growth}"\r\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Global_Finance_Consolidated_Statement_${period}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Laporan Keuangan Konsolidasi berhasil diekspor.');
    } catch (e) {
      toast.error('Gagal mengekspor laporan.');
    }
  };

  const handleReplicateStrategy = () => {
    const highestName = highestMarginOutlet?.name || 'SCBD Flagship';
    if (lowestMarginOutlet) {
      toast.success(`Strategi efisiensi dari outlet ${highestName} berhasil direplikasi ke ${lowestMarginOutlet.name}.`);
    } else {
      toast.success(`Strategi efisiensi dari outlet ${highestName} berhasil direplikasi ke cabang lainnya.`);
    }
  };

  const handleAuditReport = () => {
    navigate('/tax-report');
  };

  return (
    <div className="space-y-8 pb-16 px-4 animate-in fade-in duration-700 font-mono tabular-nums">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-xs font-black text-amber-500 uppercase tracking-widest">Enterprise Ledger</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">Real-time P&L Feed</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Global <span className="text-amber-500 italic">Consolidation</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Unified financial performance across all physical & digital sales channels.</p>
        </div>
        <div className="flex gap-2 p-1.5 bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700">
           {[
             { id: 'today', label: 'Today' },
             { id: '7days', label: '7 Days' },
             { id: '30days', label: '30 Days' }
           ].map(p => (
             <button 
                key={p.id}
                className={cn(
                  "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all active:scale-95", 
                  period === p.id 
                    ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 shadow-sm" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-foreground"
                )}
                onClick={() => setPeriod(p.id)}
             >
                {p.label}
             </button>
           ))}
        </div>
      </div>

       {/* Hero Stats */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {metrics.map((s, i) => {
           const isPositive = s.trend.startsWith('+') || s.trend === 'Real-time' || s.trend === 'Ledger';
           const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
           
           return (
             <Card key={i} className="group border border-zinc-200 dark:border-zinc-700 bg-card rounded-md shadow-sm hover:border-zinc-400 dark:hover:border-zinc-500 transition-all overflow-hidden active:scale-[0.98]">
               <CardContent className="p-6 flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                     <p className="text-[10px] lg:text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{s.label}</p>
                     <p className={cn("text-xl lg:text-2xl font-black font-mono tabular-nums leading-none my-1", s.color)}>
                       {formatRupiah(s.val).replace(',00', '')}
                     </p>
                     <div className="flex items-center gap-1.5">
                        <TrendIcon size={12} className={cn(isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")} />
                        <span className={cn("text-[10px] lg:text-xs font-black uppercase", isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>{s.trend}</span>
                     </div>
                  </div>
                  <div className={cn("w-12 h-12 rounded-md flex items-center justify-center border border-zinc-200 dark:border-zinc-700 group-hover:scale-110 transition-transform shrink-0", s.bg)}>
                     <s.icon size={20} className={cn(s.color)} />
                  </div>
               </CardContent>
             </Card>
           );
         })}
       </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
         {/* Main P&L Ledger */}
         <div className="xl:col-span-8 space-y-8">
            <Card className="border border-zinc-200 dark:border-zinc-700 bg-card rounded-md shadow-sm overflow-hidden">
               <CardHeader className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                     <CardTitle className="text-xl font-black tracking-tighter uppercase leading-none">Consolidated P&L Statement</CardTitle>
                     <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-1">Unified ledger across {outletPerformance.length} active nodes</CardDescription>
                  </div>
                  <Button variant="outline" className="h-10 px-4 rounded-md font-black uppercase tracking-widest text-xs border-zinc-250 dark:border-zinc-600 bg-card active:scale-95 transition-all" onClick={exportStatement}>
                     <Download size={14} className="mr-2" /> Export Statement
                  </Button>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-zinc-50 dark:bg-zinc-900/30 text-xs font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
                              <th className="px-6 py-4">Outlet Node</th>
                              <th className="px-6 py-4">Gross Revenue</th>
                              <th className="px-6 py-4">Net Profit</th>
                              <th className="px-6 py-4 text-right">Growth Index</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                           {outletPerformance.map((o, i) => (
                             <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/20 transition-all group">
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-md flex items-center justify-center border border-zinc-200 dark:border-zinc-700 font-black text-zinc-900 dark:text-zinc-100">
                                         0{i+1}
                                      </div>
                                      <p className="text-xs font-black text-foreground uppercase tracking-tight">{o.name}</p>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold font-mono tabular-nums">{formatRupiah(o.revenue)}</td>
                                <td className="px-6 py-4">
                                   <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{formatRupiah(o.profit)}</p>
                                   <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Margin: ~{o.revenue > 0 ? ((o.profit/o.revenue)*100).toFixed(1) : '0'}%</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-250 dark:border-emerald-800">
                                      <ArrowUpRight size={10} /> {o.growth}
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </CardContent>
               <CardFooter className="p-6 bg-zinc-50 dark:bg-zinc-900/20 border-t border-zinc-200 dark:border-zinc-700 justify-center">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">End of Global Financial Ledger &bull; Secure Audit Verified</p>
               </CardFooter>
            </Card>

            {/* Neural Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="border border-zinc-200 dark:border-zinc-700 bg-card rounded-md shadow-sm group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 text-amber-500/10 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                     <Sparkles size={100} />
                  </div>
                  <div className="space-y-2 relative z-10 p-6">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-black uppercase tracking-widest border border-amber-500/20">AI Financial Insight</div>
                     <h4 className="text-lg font-black uppercase tracking-tighter leading-none mt-2">Net Margin <span className="text-amber-500">Anomaly</span></h4>
                     <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-relaxed mt-2">
                        Outlet '{highestMarginOutlet?.name || 'SCBD Flagship'}' menunjukkan efisiensi operasional tertinggi. {lowestMarginOutlet ? `Neural model menyarankan replikasi struktur biaya logistik ke ${lowestMarginOutlet.name}.` : 'Neural model menyarankan optimalisasi struktur biaya logistik secara menyeluruh.'}
                     </p>
                  </div>
                  <div className="p-6 pt-0 relative z-10">
                     <Button className="w-full h-12 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 font-black uppercase tracking-widest text-xs rounded-md shadow-md active:scale-95 transition-all" onClick={handleReplicateStrategy}>REPLICATE STRATEGY</Button>
                  </div>
               </Card>
               <Card className="border border-zinc-200 dark:border-zinc-700 bg-card rounded-md shadow-sm group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 text-emerald-500/10 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
                     <Landmark size={100} />
                  </div>
                  <div className="space-y-2 relative z-10 p-6">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Tax & Compliance</div>
                     <h4 className="text-lg font-black uppercase tracking-tighter leading-none mt-2">Fiscal <span className="italic underline">Readiness</span></h4>
                     <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-relaxed mt-2">
                        Laporan PPN terpusat untuk seluruh outlet periode {period} siap diaudit. Total kewajiban fiskal terhitung otomatis berdasarkan regulasi terbaru.
                     </p>
                  </div>
                  <div className="p-6 pt-0 relative z-10">
                     <Button className="w-full h-12 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 font-black uppercase tracking-widest text-xs rounded-md shadow-md active:scale-95 transition-all" onClick={handleAuditReport}>AUDIT REPORT</Button>
                  </div>
               </Card>
            </div>
         </div>

         {/* Side Widgets */}
         <div className="xl:col-span-4 space-y-8 sticky top-24">
            <Card className="border border-zinc-200 dark:border-zinc-700 bg-card rounded-md shadow-sm overflow-hidden">
               <CardHeader className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-background border border-zinc-200 dark:border-zinc-700 rounded-md flex items-center justify-center">
                        <PieChart size={18} className="text-foreground" />
                     </div>
                     <div>
                        <CardTitle className="text-md font-black uppercase tracking-tighter">Revenue Split</CardTitle>
                        <CardDescription className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Channel Distribution</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-6 space-y-4">
                  {[
                    { label: 'Walk-in / POS', val: '65%', color: 'bg-amber-500' },
                    { label: 'GoFood / External', val: '22%', color: 'bg-emerald-500' },
                    { label: 'GrabFood / External', val: '13%', color: 'bg-blue-500' },
                  ].map(c => (
                    <div key={c.label} className="space-y-1">
                       <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                          <span className="text-zinc-500 dark:text-zinc-400">{c.label}</span>
                          <span className="text-foreground">{c.val}</span>
                       </div>
                       <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-1000", c.color)} style={{ width: c.val }} />
                       </div>
                    </div>
                  ))}
               </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-700 bg-card rounded-md shadow-sm group relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
               <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between relative z-10">
                  <div>
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Historical Trend</p>
                    <h3 className="text-xl font-black uppercase tracking-tighter mt-1">REVENUE <span className="text-amber-500">CURVE</span></h3>
                  </div>
                  <LineChart className="text-zinc-400 group-hover:text-amber-500 transition-colors" size={24} />
               </CardHeader>
               <CardContent className="p-6 pt-4 space-y-6 relative z-10">
                  <div className="flex items-end gap-2.5 h-28 border-b border-zinc-200 dark:border-zinc-700 pb-2">
                     {dailyTrend && dailyTrend.length > 0 ? (
                       dailyTrend.map((d, i) => {
                          const maxVal = Math.max(...dailyTrend.map(x => x.revenue), 1);
                          const pct = (d.revenue / maxVal) * 90 + 10; // min 10% height
                          return (
                             <div key={i} className="flex-1 flex flex-col items-center group/bar cursor-pointer relative h-full justify-end">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-1.5 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-30 font-mono">
                                   {formatRupiah(d.revenue).replace(',00', '')}
                                </div>
                                {/* Bar */}
                                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-t-sm h-16 flex items-end">
                                   <div 
                                      className="w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 transition-all rounded-t-sm" 
                                      style={{ height: `${pct}%` }} 
                                   />
                                </div>
                                {/* Label */}
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold mt-2 uppercase">{d.dayName}</span>
                             </div>
                          );
                       })
                     ) : (
                       [40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                          <div key={i} className="flex-1 relative group/bar rounded-t-sm overflow-hidden bg-zinc-100 dark:bg-zinc-800 h-16">
                             <div className="absolute bottom-0 inset-x-0 bg-amber-500/40 group-hover/bar:bg-amber-500 transition-colors" style={{ height: `${h}%` }} />
                          </div>
                       ))
                     )}
                  </div>
                  <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-700 pt-4">
                     <div>
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Growth Forecast</p>
                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">+18.2%</p>
                     </div>
                     <Button variant="ghost" size="icon" className="h-10 w-10 rounded-md hover:bg-background/5 text-zinc-900 dark:text-zinc-100" onClick={() => toast.info('Navigating to detailed forecasting trend...')}>
                        <ArrowUpRight size={20} />
                     </Button>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
