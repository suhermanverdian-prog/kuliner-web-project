import React from 'react';
import { printReport } from '../utils/reportPrinter';
import { useLaporan } from '../hooks/useLaporan';
import api from '../api';
import { 
  BarChart3, TrendingUp, TrendingDown, Package, 
  ShoppingCart, Wallet, DollarSign, PieChart,
  Calendar, Download, Printer, Filter,
  AlertTriangle, CheckCircle2, ChevronRight,
  ShoppingBag, Trash2, Lightbulb, ArrowUpRight,
  ArrowDownRight, RefreshCw, FileText, ChevronDown, ClipboardCheck, Lock, Zap, Coffee
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { formatRupiah } from '../utils/formatters';

const PERIODS = [
  { key: 'today', label: 'Hari Ini' },
  { key: '7days', label: '7 Hari' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'year', label: 'Tahun Ini' },
  { key: 'custom', label: 'Kustom' },
];

function KPICard({ label, value, sub, icon: Icon, delta, colorClass }) {
  const isUp = delta >= 0;
  return (
    <Card className="bg-card border border-border shadow-sm font-mono tabular-nums relative overflow-hidden rounded-md">
      <CardContent className="p-4 relative">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 blur-2xl rounded-lg pointer-events-none" />
        
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-[8px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest truncate">{label}</p>
            <h3 className="text-lg font-black tracking-tight font-mono tabular-nums text-zinc-900 dark:text-zinc-100 truncate">{value}</h3>
            {sub && <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase truncate">{sub}</p>}
          </div>
          <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40 flex items-center justify-center shrink-0 ml-2 shadow-sm transition-all duration-350">
            <Icon size={14} strokeWidth={2.5} />
          </div>
        </div>
        
        {delta !== undefined && (
          <div className="mt-3 flex items-center gap-2 relative z-10">
            <div className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
              isUp ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50" : "bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50"
            )}>
              {isUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
              <span className="font-mono tabular-nums">{Math.abs(delta)}%</span>
            </div>
            <span className="text-[8px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-wider">vs benchmark</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniChart({ data, prev }) {
  const W = 800, H = 220, PAD = 65;
  const maxV = Math.max(...data.map(d => d.value), ...prev.map(d => d.value), 1);
  const xScale = i => PAD + (i / 23) * (W - PAD * 2);
  const yScale = v => H - PAD - (v / maxV) * (H - PAD * 2);

  const toPath = (arr) => arr.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.hour)},${yScale(d.value)}`).join(' ');
  const currentPath = toPath(data);
  const prevPath = toPath(prev);

  const formatCompact = (val) => {
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`;
    return `Rp ${val}`;
  };

  return (
    <div className="relative w-full overflow-hidden group">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--amber)" floodOpacity="0.4" />
          </filter>
        </defs>
        
        {/* Grids and Y Axis Labels */}
        {[0, 0.5, 1].map(v => (
          <g key={v}>
            <line x1={PAD} y1={yScale(maxV * v)} x2={W - PAD} y2={yScale(maxV * v)} stroke="currentColor" className="text-zinc-200 dark:text-zinc-805" strokeDasharray="4,4" />
            <text x={PAD - 8} y={yScale(maxV * v) + 3} className="text-[9px] font-mono tabular-nums font-bold fill-zinc-400 dark:fill-zinc-500" textAnchor="end">
              {formatCompact(maxV * v)}
            </text>
          </g>
        ))}
        
        {/* X Axis Labels */}
        {[0, 4, 8, 12, 16, 20, 23].map(h => (
          <text key={h} x={xScale(h)} y={H - PAD + 16} className="text-[9px] font-mono font-bold fill-zinc-400 dark:fill-zinc-500" textAnchor="middle">
            {String(h).padStart(2, '0')}:00
          </text>
        ))}

        {/* Previous Period - Shadowy */}
        <path d={prevPath} fill="none" stroke="currentColor" className="text-zinc-300 dark:text-zinc-700/60" strokeWidth="2" strokeDasharray="4,4" />
        
        {/* Current Period - Glowing Amber */}
        <path
          d={currentPath}
          fill="none"
          stroke="var(--amber)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          className="animate-in fade-in duration-1000 dark:stroke-amber-400"
        />
        <path d={`${currentPath} L ${xScale(23)},${H - PAD} L ${xScale(0)},${H - PAD} Z`} fill="url(#chartGrad)" />
        
        {/* Interactive Points */}
        {data.map((d, i) => d.value > 0 && (
          <g key={i} className="hover:scale-120 transition-transform origin-center cursor-pointer">
            <circle cx={xScale(d.hour)} cy={yScale(d.value)} r="4" className="fill-amber-500 stroke-background" strokeWidth="2" />
          </g>
        ))}
      </svg>
      
      <div className="flex gap-6 mt-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-amber-500 dark:bg-amber-400 rounded-sm" />
          <span className="text-[9px] font-black text-zinc-650 dark:text-zinc-350 uppercase tracking-widest">Live Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 border-b-2 border-dashed border-zinc-350 dark:border-zinc-700" />
          <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Previous Benchmark</span>
        </div>
      </div>
    </div>
  );
}

const mapEmojiToLucide = (iconString) => {
  if (!iconString || typeof iconString !== 'string') {
    return <Coffee size={16} className="text-amber-500" />;
  }
  const icon = iconString.trim();
  if (icon === '☕' || icon.toLowerCase().includes('kopi')) {
    return <Coffee size={16} className="text-amber-500" />;
  }
  return <Coffee size={16} className="text-amber-500" />;
};

export default function LaporanPage({ onNavigate }) {
  const {
    period, setPeriod,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    loading,
    summary,
    trend,
    payment,
    topProducts,
    criticalStock,
    waste,
    insights,
    inventoryLogs,
    showExport, setShowExport,
    exporting,
    activeTab, setActiveTab,
    aiInsights,
    features,
    transactions, setTransactions,
    currentPage, setCurrentPage,
    totalPages, setTotalPages,
    totalTrx, setTotalTrx,
    loadingTrx, setLoadingTrx,
    handleExcel,
    handlePDF
  } = useLaporan();

  const REPORT_TYPES = [
    { key: 'penjualan-harian', label: 'Penjualan Harian' },
    { key: 'penjualan-periode', label: 'Penjualan Periode' },
    { key: 'inventaris', label: 'Stok Barang' },
    { key: 'waste', label: 'Kerugian (Waste)' },
    { key: 'hpp', label: 'HPP (COGS)' },
    { key: 'laba-rugi', label: 'Laba Rugi' },
  ];

  const handleApproveVoid = async (txId) => {
      if (!window.confirm("Setujui pembatalan (VOID) transaksi ini? Stok dan jurnal akan dikembalikan otomatis.")) return;
      try {
          await api.approveVoid(txId);
          setTransactions(prev => prev.map(t => t.id === txId ? {...t, payment_status: 'void'} : t));
          // Update total kalau mau lebih sinkron, tapi biasanya refresh halaman cukup
      } catch (e) {
          alert(e.message || "Gagal menyetujui void. Pastikan Anda memiliki otoritas yang tepat di Pengaturan.");
      }
  };


  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-8">
      <div className="relative">
         <div className="w-16 h-16 border-4 border-amber-500/20 rounded-lg animate-pulse" />
         <div className="absolute inset-0 w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-lg animate-spin" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-xl font-black uppercase tracking-[0.3em] text-foreground">KEN Intelligence</p>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-black uppercase tracking-widest animate-pulse">Synchronizing Global Nodes...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 min-h-screen w-full max-w-full overflow-x-hidden px-1">
      {/* Export Center Modal - Rendered at root level for global viewport centering */}
      {showExport && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[99] backdrop-blur-sm transition-opacity" 
            onClick={() => setShowExport(false)} 
          />
          {/* Centered Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 pointer-events-none">
            <Card className="pointer-events-auto w-full max-w-sm border border-zinc-200 dark:border-zinc-700 bg-card rounded-lg overflow-hidden shadow-lg dark:shadow-none animate-in zoom-in-95 duration-200">
              <CardHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-amber-500 rounded-sm" />
                   <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Export Center</CardTitle>
                </div>
                <button 
                  onClick={() => setShowExport(false)}
                  className="w-6 h-6 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors text-xs font-bold font-mono"
                >
                  ✕
                </button>
              </CardHeader>
              <CardContent className="p-3 space-y-1.5">
                {REPORT_TYPES.map(rt => (
                  <div key={rt.key} className="p-1.5 px-2.5 rounded-md border border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{rt.label}</span>
                    <div className="flex gap-1.5 shrink-0 items-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-[9px] font-black text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700" 
                        onClick={() => handleExcel(rt.key)}
                      >
                        EXCEL
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-[9px] font-black text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700" 
                        onClick={() => handlePDF(rt.key)}
                      >
                        PDF
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-450 flex items-center justify-center" 
                        onClick={() => printReport(rt.key, period, customStart, customEnd)}
                      >
                        <Printer size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="p-1 bg-amber-500/10 rounded-md mt-2">
                  <Button variant="primary" className="w-full h-9 text-[10px] font-black tracking-wider" onClick={() => handleExcel('all')}>
                     DOWNLOAD ALL DATA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Header - Enterprise Grade */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
           <div className="w-2 h-8 bg-amber-500 rounded-sm" />
           <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase italic leading-none">Data Analytics</h2>
        </div>
        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.4em] max-w-lg leading-loose ">Quantum Financial Intelligence & Velocity Matrix</p>
      </div>

      {/* Filter Row - Moved below Header */}
      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm w-full md:w-fit max-w-full overflow-hidden">
          <div className="flex flex-wrap p-1 gap-1">
            {PERIODS.map(p => (
              <button 
                key={p.key} 
                className={cn(
                  "h-10 px-6 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all duration-300", 
                  period === p.key ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 shadow-lg shadow-amber-500/20" : "text-zinc-500 dark:text-zinc-100 hover:bg-background/50"
                )}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          
          <div className="h-8 w-px bg-background/10 mx-2" />

          {period === 'custom' && (
             <div className="flex items-center gap-4 animate-in slide-in-from-right-8 duration-500">
               <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-40 h-10 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold" />
               <div className="w-2 h-px bg-zinc-350 dark:bg-zinc-700" />
               <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-40 h-10 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold" />
             </div>
          )}
          
          <div className="relative">
            <Button variant="primary" className="h-12 px-8 font-black gap-4 " onClick={() => setShowExport(!showExport)}>
              <Download size={18} /> EXPORT CENTER
            </Button>
          </div>
        </div>

      {/* Tab Switcher - Elite Style */}
      <div className="flex gap-12 border-b border-white/5 relative">
        <button 
          onClick={() => setActiveTab('summary')}
          className={cn(
            "pb-6 px-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative group",
            activeTab === 'summary' ? "text-amber-500" : "text-zinc-500 dark:text-zinc-100/60 hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-4">
             <BarChart3 size={16} /> Financial Overview
          </div>
          {activeTab === 'summary' && <div className="absolute bottom-0 left-0 w-full h-1 " />}
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={cn(
            "pb-6 px-4 text-xs font-black uppercase tracking-[0.25em] transition-all relative flex items-center gap-4 group",
            activeTab === 'ai' ? "text-amber-500" : "text-zinc-500 dark:text-zinc-100/60 hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-4">
             <Lightbulb size={16} className={cn("transition-colors", activeTab === 'ai' ? "text-amber-500" : "group-hover:text-amber-500")} /> 
             AI Intelligence
          </div>
          {activeTab === 'ai' && <div className="absolute bottom-0 left-0 w-full h-1 " />}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "pb-6 px-4 text-xs font-black uppercase tracking-[0.25em] transition-all relative flex items-center gap-4 group",
            activeTab === 'history' ? "text-amber-500" : "text-zinc-500 dark:text-zinc-100/60 hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-4">
             <FileText size={16} className={cn("transition-colors", activeTab === 'history' ? "text-amber-500" : "group-hover:text-amber-500")} /> 
             Transaction History
          </div>
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-1 " />}
        </button>
      </div>

      {activeTab === 'summary' ? (
        <div className="space-y-12">
          {/* KPI Cards - Elite Adaptive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard label="Revenue" value={formatRupiah(summary.totalRevenue)} sub="Gross Income" icon={DollarSign} delta={summary.vsYesterday?.revenue} colorClass="bg-amber-500" />
            <KPICard label="Spending" value={formatRupiah(summary.totalPurchasing)} sub="Inventory Cost" icon={ShoppingBag} colorClass="bg-amber-500" />
            <KPICard label="Gross Profit" value={formatRupiah(summary.grossProfit)} sub={`${summary.marginPct || 0}% Margin`} icon={TrendingUp} delta={12} colorClass="bg-amber-500" />
            <KPICard label="Liabilities" value={formatRupiah(summary.totalDebt)} sub="Unpaid Bills" icon={AlertTriangle} colorClass="bg-amber-500" />
            <KPICard label="HPP / COGS" value={formatRupiah(summary.totalHPP)} sub="Cost of Goods" icon={Package} colorClass="bg-amber-500" />
            <KPICard label="Total Sales" value={<span className="font-mono tabular-nums">{summary.totalTransactions || 0}</span>} sub="Closed Deals" icon={ShoppingCart} delta={summary.vsYesterday?.transactions} colorClass="bg-amber-500" />
          </div>

          {/* Executive Predictive Cockpit - Phase 4 Elite Feature */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
             <Card className="lg:col-span-12 border-none glass-quantum rounded-lg overflow-hidden group relative">
                <div className="absolute top-0 right-0 w-[70%] h-full bg-amber-500/5 blur-[150px] rounded-lg pointer-events-none" />
                <CardContent className="p-6 md:p-8 relative z-10">
                   <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                      <div className="flex-1 space-y-6">
                         <div className="inline-flex items-center gap-3 px-3 py-1.5 bg-amber-500/10 rounded-md border border-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.05)]">
                            <Zap size={14} className="text-amber-500 fill-amber-500/20 animate-pulse" />
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.25em]">Quantum Intelligence v5.0</span>
                         </div>
                         <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter leading-tight uppercase">Predictive <span className="text-amber-500">Revenue</span> Exposition</h2>
                         <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium max-w-2xl leading-relaxed">Neural supply-chain audit detects a stable growth trajectory. Projections indicate a <span className="text-amber-500 font-black">12.4% yield increase</span> based on seven-day velocity analysis.</p>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                            <div className="space-y-1">
                               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Proj. Weekly Rev</p>
                               <p className="text-lg md:text-xl font-black text-amber-500 font-mono tabular-nums">{formatRupiah(summary.totalRevenue * 7.2)}</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Growth Factor</p>
                               <p className="text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">+12.4%</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Peak Hour Proj.</p>
                               <p className="text-lg md:text-xl font-black text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">15:00 - 18:00</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">System Confidence</p>
                               <p className="text-lg md:text-xl font-black text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">94%</p>
                            </div>
                         </div>
                      </div>
                      <div className="w-full md:w-[280px] shrink-0 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 pt-6 md:pt-0 md:pl-8 space-y-4">
                         <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-widest">Recommended Action</p>
                            <Lightbulb size={14} className="text-amber-500" />
                         </div>
                         <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-zinc-850 dark:text-zinc-250">Stok Optimized</p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">Naikkan stok Biji Kopi Arabica sebesar 15% untuk mengantisipasi kenaikan pesanan akhir pekan.</p>
                         </div>
                         <Button variant="ghost" className="w-full h-9 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">Apply Optimization</Button>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>
          {/* Charts & Mini Widgets Row */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-8 flex flex-col gap-5 h-full">
              {/* Chart */}
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-card rounded-lg shadow-sm">
                <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-black uppercase tracking-tighter">Hourly Performance Matrix</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-0.5">Real-time revenue density distribution.</CardDescription>
                  </div>
                  <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 group-hover:rotate-12 transition-transform">
                     <TrendingUp size={20} />
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <MiniChart data={trend.current || []} prev={trend.previous || []} />
                </CardContent>
              </Card>
 
              {/* Nested Operational Waste & Live Insights side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch flex-1">
                 {/* Operational Waste */}
                 <Card className="h-full border border-zinc-200 dark:border-zinc-800 bg-card rounded-lg shadow-sm flex flex-col justify-between">
                   <CardHeader className="p-4 pb-2">
                     <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <Trash2 size={16} /> Operational Waste
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4">
                         <div className="space-y-0.5">
                           <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums tracking-tighter">{formatRupiah(waste.totalWaste)}</p>
                           <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-[0.2em]">Financial Loss</p>
                         </div>
                         <div className="relative group">
                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                               <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-zinc-100 dark:text-zinc-800/50" />
                               <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="5" fill="transparent" 
                                  className="text-rose-600 dark:text-rose-400 transition-all duration-1000"
                                  strokeDasharray={138}
                                  strokeDashoffset={138 - (138 * (waste.wasteRatio || 0)) / 100}
                                  strokeLinecap="round"
                               />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black font-mono tabular-nums text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                               {waste.wasteRatio || 0}%
                            </div>
                         </div>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                         {waste.categories?.map((c, i) => (
                           <div key={i} className="flex justify-between p-2.5 rounded-lg bg-background/5 text-[9px] font-black uppercase tracking-widest group hover:bg-background/10 transition-all">
                              <span className="text-zinc-500 dark:text-zinc-400 group-hover:text-foreground">{c.name}</span>
                              <span className="text-rose-600 dark:text-rose-400 font-mono tabular-nums">{formatRupiah(c.amount)}</span>
                           </div>
                         ))}
                      </div>
                   </CardContent>
                 </Card>
 
                 {/* Live Insights */}
                 <Card className="h-full border border-zinc-200 dark:border-zinc-800 bg-card rounded-lg shadow-sm flex flex-col">
                    <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                       <div className="flex items-center justify-between">
                          <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">Live Insights</CardTitle>
                          <Lightbulb size={14} className="text-amber-500 animate-pulse" />
                       </div>
                       <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                          {insights.map((ins, i) => (
                            <div key={i} className="p-3 rounded-lg bg-background/5 border-l-4 border-amber-500 space-y-1 group hover:bg-background/10 transition-all">
                              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{ins.title}</p>
                              <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium group-hover:text-zinc-200">{ins.body}</p>
                            </div>
                          ))}
                       </div>
                    </CardContent>
                 </Card>
              </div>
            </div>
 
            <Card className="xl:col-span-4 border border-zinc-200 dark:border-zinc-800 bg-card rounded-lg shadow-sm h-full flex flex-col justify-between">
              <CardHeader className="p-5 pb-0">
                <CardTitle className="text-base font-black uppercase tracking-tighter">Settlement Channels</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-0.5">Payment preference analytics.</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-3">
                  {payment.methods?.map((m, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-zinc-550 dark:text-zinc-400 mb-0.5">{m.name}</p>
                           <p className="text-sm font-black text-foreground font-mono tabular-nums">{formatRupiah(m.amount)}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-amber-550 dark:text-amber-400 font-mono tabular-nums">{m.pct}%</p>
                        </div>
                      </div>
                      <div className="h-2.5 bg-background/5 rounded-lg overflow-hidden p-0.5 border border-white/5">
                        <div className="h-full bg-amber-500 dark:bg-amber-400 rounded-sm" style={{ width: `${m.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  {!payment.methods?.length && (
                    <div className="py-20 text-center space-y-6 ">
                      <PieChart size={64} strokeWidth={1} className="mx-auto" />
                      <p className="text-xs font-black uppercase tracking-widest">No transaction data</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Analytics Row - Detail Oriented */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* Top Products */}
            <Card className="h-full border border-zinc-200 dark:border-zinc-800 bg-card rounded-lg shadow-sm flex flex-col">
              <CardHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                   <div className="w-6 h-6 flex items-center justify-center text-amber-500">
                      <TrendingUp size={14} />
                   </div>
                   Elite Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <div className="space-y-4">
                  {topProducts.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center gap-4 group hover:translate-x-1 transition-transform cursor-default">
                      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700">
                        {mapEmojiToLucide(p.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate leading-tight mb-0.5">{p.name}</p>
                        <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest font-mono tabular-nums">{formatRupiah(p.revenue)} revenue</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-foreground font-mono tabular-nums">{p.qty}</p>
                        <p className="text-[8px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-[0.2em]">units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
 
            {/* Stock Alert - Critical */}
            <Card className="h-full border border-zinc-200 dark:border-zinc-800 bg-card rounded-lg shadow-sm flex flex-col">
              <CardHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-rose-600 dark:text-rose-400">
                   <div className="w-6 h-6 flex items-center justify-center text-rose-500">
                      <AlertTriangle size={14} />
                   </div>
                   Stock Depletion
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <div className="space-y-2.5">
                  {criticalStock.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                         <CheckCircle2 size={24} strokeWidth={1.5} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Inventory Fully Stocked</p>
                    </div>
                  ) : criticalStock.map((b, i) => (
                    <div key={i} className="p-3 rounded-lg bg-background/5 border border-zinc-150 dark:border-zinc-800/80 flex items-center justify-between group hover:border-rose-200 dark:hover:border-rose-800 transition-all">
                      <div className="space-y-0.5">
                        <p className="text-xs font-black">{b.name}</p>
                        <p className="text-[9px] text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest font-mono tabular-nums">{b.stock} {b.unit} Left</p>
                      </div>
                      <div className={cn(
                        "px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest shadow-sm",
                        (b.status === 'kritis' || b.status === 'habis') ? "bg-rose-500 text-white" : "bg-amber-500 text-zinc-900"
                      )}>
                        {b.status}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Mutation Log - Data Rich */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-card rounded-lg shadow-sm">
            <CardHeader className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-amber-500" /> Stock Audit Ledger
                </CardTitle>
                <CardDescription className="text-[9px] font-bold uppercase tracking-widest mt-0.5">Immutable audit trail of all manual inventory adjustments.</CardDescription>
              </div>
              <div className="flex items-center gap-4 bg-background/5 p-1 rounded-md border border-zinc-200 dark:border-zinc-800">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => printReport('stock-mutation', period, customStart, customEnd)}>
                  <Printer size={12} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 px-4 pb-4">
              <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-850 custom-scrollbar">
                <table className="w-full text-left border-collapse overflow-hidden">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Material</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-center">Impact</th>
                      <th className="px-4 py-3">Balance Delta</th>
                      <th className="px-4 py-3">Operator</th>
                      <th className="px-4 py-3">Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 font-mono tabular-nums text-[11px]">
                    {inventoryLogs.map(log => (
                      <tr key={log.id} className="group hover:bg-background/5 transition-colors">
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-450">{new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()}</td>
                        <td className="px-4 py-3 font-bold text-foreground font-sans text-xs">{log.bahan_name}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-sans",
                            log.type === 'Waste' || log.type === 'Adjustment' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                          )}>
                            {log.type}
                          </span>
                        </td>
                        <td className={cn("px-4 py-3 text-center font-bold text-sm", log.change_qty > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                          {log.change_qty > 0 ? '+' : ''}{log.change_qty}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-450">{log.prev_stock} <span className="mx-1.5">→</span> <span className="font-bold text-foreground">{log.next_stock}</span></td>
                        <td className="px-4 py-3 font-bold text-amber-500 font-sans text-xs">{log.user_name}</td>
                        <td className="px-4 py-3">
                           <div className="flex items-center gap-1.5 font-sans">
                              <FileText size={10} className="text-zinc-400 dark:text-zinc-500" />
                              <span className="text-[9px] italic font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">{log.reason}</span>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {inventoryLogs.length === 0 && (
                      <tr><td colSpan="7" className="py-10 text-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-450">No mutation records</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Comprehensive Financial Summary */}
          <Card className="border-none shadow-2xl ">
            <CardContent className="p-0">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-px bg-zinc-200 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800/80 rounded-lg overflow-hidden">
                  {[
                    { label: 'Gross Sales', value: formatRupiah(summary.totalRevenue) },
                    { label: 'Applied Discounts', value: formatRupiah(0), color: 'text-rose-600 dark:text-rose-400' },
                    { label: 'Net Revenue', value: formatRupiah(summary.totalRevenue) },
                    { label: 'Production Cost (HPP)', value: formatRupiah(summary.totalHPP), color: 'text-amber-500' },
                    { label: 'Gross Earnings', value: formatRupiah(summary.grossProfit) },
                    { label: 'Performance Margin', value: `${summary.marginPct || 0}%`, highlight: true },
                  ].map((item, i) => (
                    <div key={i} className="p-10 text-center space-y-2 group hover:bg-background/5 transition-all">
                      <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-[0.3em] group-hover:text-amber-500 transition-colors">{item.label}</p>
                      <p className={cn("text-xl font-black font-mono tabular-nums tracking-tighter", item.highlight ? "text-amber-500 scale-110" : item.color || "text-foreground")}>{item.value}</p>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>
      ) : activeTab === 'history' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-card rounded-lg shadow-sm">
              <CardHeader className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <ShoppingBag size={18} className="text-amber-500" /> Transaction Ledger
                  </CardTitle>
                  <CardDescription className="text-[9px] font-bold uppercase tracking-widest mt-0.5">Global transaction history with pagination for millions of records.</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                   <div className="bg-background/5 p-1 rounded-md flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-8 w-8 rounded-lg" 
                       disabled={currentPage === 1 || loadingTrx}
                       onClick={() => setCurrentPage(p => p - 1)}
                     >
                       <ChevronDown className="rotate-90" size={12} />
                     </Button>
                     <div className="px-3 text-[10px] font-black font-mono tabular-nums">
                        PAGE {currentPage} <span className=" mx-1.5">/</span> {totalPages}
                     </div>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-8 w-8 rounded-lg" 
                       disabled={currentPage === totalPages || loadingTrx}
                       onClick={() => setCurrentPage(p => p + 1)}
                     >
                       <ChevronRight size={12} />
                     </Button>
                   </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 px-4 pb-4">
                 <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-850 custom-scrollbar">
                   <table className="w-full text-left border-collapse overflow-hidden">
                     <thead>
                       <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                         <th className="px-4 py-3">Reference</th>
                         <th className="px-4 py-3">Timestamp</th>
                         <th className="px-4 py-3">Customer</th>
                         <th className="px-4 py-3">Method</th>
                         <th className="px-4 py-3 text-right">Amount</th>
                         <th className="px-4 py-3 text-center">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 font-mono tabular-nums text-[11px]">
                       {loadingTrx ? (
                         <tr><td colSpan="6" className="py-20 text-center"><RefreshCw className="animate-spin mx-auto text-amber-500" /></td></tr>
                       ) : transactions.map(tx => (
                         <tr key={tx.id} className="group hover:bg-background/5 transition-colors">
                           <td className="px-4 py-3 font-bold text-amber-500 font-sans text-xs uppercase">{tx.order_number}</td>
                           <td className="px-4 py-3 text-zinc-500 dark:text-zinc-450">
                             {new Date(tx.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                           </td>
                           <td className="px-4 py-3">
                             <div className="font-bold text-foreground font-sans text-xs">
                               {tx.customer_name || 'Tamu'}
                             </div>
                             {(tx.payment_method === 'Complimentary' || tx.payment_method === 'Staff Benefit') && (
                               <div className="mt-1 flex items-center gap-1">
                                 <span className="inline-block px-1 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400 border border-amber-500/30">
                                   GRATIS
                                 </span>
                                 <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider">
                                   Non-Sales
                                 </span>
                               </div>
                             )}
                           </td>
                           <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                 <Wallet size={10} className="text-zinc-400 dark:text-zinc-500" />
                                 <span className="text-[9px] font-black uppercase tracking-widest">{tx.payment_method}</span>
                              </div>
                           </td>
                           <td className="px-4 py-3 text-right font-bold text-foreground">{formatRupiah(tx.total)}</td>
                           <td className="px-4 py-3 text-center">
                             <span className={cn(
                               "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                               tx.payment_status === 'paid' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" :
                               tx.payment_status === 'pending_void_approval' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400" : 
                               tx.payment_status === 'void' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400" : "bg-amber-50 text-amber-500"
                             )}>
                               {tx.payment_status === 'pending_void_approval' ? 'Void Tertunda' : tx.payment_status}
                             </span>
                             {tx.payment_status === 'pending_void_approval' && (
                                <div className="mt-1.5">
                                   <Button 
                                     size="sm" 
                                     variant="outline" 
                                     className="h-6 text-[9px] px-2 border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/20 font-bold" 
                                     onClick={() => handleApproveVoid(tx.id)}>
                                     Approve Void
                                   </Button>
                                </div>
                             )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </CardContent>
            </Card>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {!features.ai_insights ? (
            <div className="py-32 flex flex-col items-center justify-center text-center space-y-10">
               <div className="relative">
                  <div className="w-32 h-32 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.2)] border border-amber-500/20 rotate-12">
                     <Lock size={64} strokeWidth={2.5} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 border-4 border-background">
                     <AlertTriangle size={16} />
                  </div>
               </div>
               <div className="max-w-xl space-y-4">
                  <h3 className="text-4xl font-black tracking-tighter uppercase">Intelligence Locked</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium leading-relaxed">Advanced behavioral analytics, Star/Deadwood classification, and predictive forecasting require the **BrewMaster Enterprise** computational engine.</p>
               </div>
               <div className="flex gap-4">
                  <Button variant="primary" className="h-14 px-10 rounded-lg font-black ">
                     UPGRADE TO ENTERPRISE
                  </Button>
                  <Button variant="ghost" className="h-14 px-10 rounded-lg font-black border border-white/5 hover:bg-background/5 text-xs tracking-widest">
                     VIEW PRICING
                  </Button>
               </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {aiInsights.map((ins, i) => (
                  <Card key={i} className="border-none shadow-2xl ">
                    <CardHeader className="p-8 bg-background/5 flex flex-row items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-lg flex items-center justify-center text-zinc-950 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-6",
                          ins.type === 'warning' ? "bg-amber-500 shadow-amber-500/20" : "bg-emerald-500 shadow-emerald-500/20"
                        )}>
                          {ins.type === 'warning' ? <AlertTriangle size={24} /> : <Lightbulb size={24} />}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-black uppercase tracking-tight">{ins.title}</CardTitle>
                          <p className="text-[9px] font-black uppercase text-amber-500 tracking-[0.2em] mt-1">Automated AI Feedback</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      <p className="text-sm font-medium leading-relaxed text-zinc-500 dark:text-zinc-100 group-hover:text-foreground transition-colors">{ins.message}</p>
                    </CardContent>
                    <CardFooter className="p-8 pt-0">
                      <Button variant="outline" className="w-full h-12 rounded-lg font-black text-zinc-900 dark:text-zinc-100 tracking-widest bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all" onClick={() => onNavigate?.(ins.action)}>
                        ACTION REQUIRED <ChevronRight size={14} />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              <Card className="border-none shadow-2xl ">
                 <div className="">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                       <div className="space-y-2">
                          <CardTitle className="text-3xl font-black uppercase tracking-tighter">Executive Decision Board</CardTitle>
                          <CardDescription className="text-xs font-bold uppercase tracking-widest text-amber-500">Critical AI recommendations for high-impact growth.</CardDescription>
                       </div>
                       <div className="h-12 w-12 ">
                          <ClipboardCheck size={24} />
                       </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       {[
                         { title: 'Inventory Optimization', desc: 'Demand forecasting indicates a 22% spike in Coffee-based beverage consumption next weekend. AI suggests increasing Arabica stock levels by 15kg before Thursday.', action: 'inventori', icon: ShoppingBag },
                         { title: 'Pricing Architecture', desc: 'Profitability audit found 3 items with high elasticity. A strategic price adjustment of 4.5% is projected to increase net profit by Rp 2.4jt/mo without volume loss.', action: 'menu', icon: DollarSign }
                       ].map((item, i) => {
                           const IconComponent = item.icon;
                           return (
                             <div key={i} className="flex items-start gap-8 p-10 rounded-lg bg-background/5 border border-white/5 group hover:border-amber-500/30 transition-all">
                               <div className="w-16 h-16 rounded-lg ">
                                  <IconComponent size={28} />
                               </div>
                               <div className="space-y-3">
                                  <h4 className="text-xl font-black uppercase tracking-tight">{item.title}</h4>
                                  <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium leading-relaxed">{item.desc}</p>
                                  <Button variant="link" className="p-0 h-auto text-amber-500 font-black text-[10px] uppercase tracking-[0.3em] mt-4 flex items-center gap-2 group-hover:gap-4 transition-all" onClick={() => onNavigate?.(item.action)}>
                                     INITIATE STRATEGY <ChevronRight size={14} />
                                   </Button>
                               </div>
                             </div>
                           );
                        })}
                    </div>
                 </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
