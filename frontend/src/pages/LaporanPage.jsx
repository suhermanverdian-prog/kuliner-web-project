import React from 'react';
import { printReport } from '../utils/reportPrinter';
import { useLaporan } from '../hooks/useLaporan';
import { 
  BarChart3, TrendingUp, TrendingDown, Package, 
  ShoppingCart, Wallet, DollarSign, PieChart,
  Calendar, Download, Printer, Filter,
  AlertTriangle, CheckCircle2, ChevronRight,
  ShoppingBag, Trash2, Lightbulb, ArrowUpRight,
  ArrowDownRight, RefreshCw, FileText, ChevronDown, ClipboardCheck, Lock, Zap
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
    <Card className="border-none shadow-2xl  font-mono tabular-nums">
      <CardContent className="p-8 relative">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber- blur-3xl rounded-lg  group-hover: transition-opacity duration-700" />
        
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">{label}</p>
            <h3 className="text-2xl font-black tracking-tight font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{value}</h3>
            {sub && <p className="text-[10px] text-zinc-500 font-bold tracking-tight  uppercase">{sub}</p>}
          </div>
          <div className={cn(
            "w-14 h-14 rounded-lg flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-110",
            colorClass.includes('amber') ? "bg-amber-500 text-zinc-950" : "bg-amber-500 text-amber-500"
          )}>
            <Icon size={28} strokeWidth={2.5} />
          </div>
        </div>
        
        {delta !== undefined && (
          <div className="mt-6 flex items-center gap-4 relative z-10">
            <div className={cn(
              "flex items-center gap-1.5 px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
              isUp ? "bg-amber- text-amber-500" : "bg-amber-500 text-zinc-400"
            )}>
              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span className="font-mono tabular-nums">{Math.abs(delta)}%</span>
            </div>
            <span className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] ">vs benchmark</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniChart({ data, prev }) {
  const W = 800, H = 220, PAD = 50;
  const maxV = Math.max(...data.map(d => d.value), ...prev.map(d => d.value), 1);
  const xScale = i => PAD + (i / 23) * (W - PAD * 2);
  const yScale = v => H - PAD - (v / maxV) * (H - PAD * 2);

  const toPath = (arr) => arr.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.hour)},${yScale(d.value)}`).join(' ');
  const currentPath = toPath(data);
  const prevPath = toPath(prev);

  return (
    <div className="relative w-full overflow-hidden group">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible drop-shadow-2xl">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
             <feGaussianBlur stdDeviation="3" result="blur" />
             <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Grids */}
        {[0, 0.5, 1].map(v => (
          <line key={v} x1={PAD} y1={yScale(maxV * v)} x2={W - PAD} y2={yScale(maxV * v)} stroke="currentColor" className="text-border/30" strokeDasharray="8,8" />
        ))}
        
        {/* Previous Period - Shadowy */}
        <path d={prevPath} fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="2" strokeDasharray="8,6" />
        
        {/* Current Period - Glowing Amber */}
        <path d={currentPath} fill="none" stroke="var(--amber)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" className="animate-in fade-in duration-1000" />
        <path d={`${currentPath} L ${xScale(23)},${H - PAD} L ${xScale(0)},${H - PAD} Z`} fill="url(#chartGrad)" />
        
        {/* Interactive Points */}
        {data.map((d, i) => d.value > 0 && (
          <g key={i} className="hover:scale-150 transition-transform origin-center cursor-pointer">
            <circle cx={xScale(d.hour)} cy={yScale(d.value)} r="6" className="fill-amber-500 stroke-background" strokeWidth="3" />
          </g>
        ))}
      </svg>
      
      <div className="flex gap-8 mt-8 justify-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-1.5 " />
          <span className="text-[11px] font-black text-foreground uppercase tracking-[0.2em]">Live Revenue</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-1.5 bg-background rounded-lg border-b-2 border-dashed border-muted-foreground " />
          <span className="text-[11px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-[0.2em]">Previous Benchmark</span>
        </div>
      </div>
    </div>
  );
}

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
    <div className="space-y-16 pb-20 animate-quantum-fade quantum-noise min-h-screen">
      {/* Header & Filter - Enterprise Grade */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-6">
             <div className="w-2.5 h-12 " />
             <h2 className="text-6xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase italic leading-none">Data Analytics</h2>
          </div>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.5em] max-w-lg leading-loose ">Quantum Financial Intelligence & Velocity Matrix</p>
        </div>
        <div className="flex flex-wrap items-center gap-6 glass-quantum p-4 rounded-lg border border-white/10 shadow-2xl">
          <div className="flex p-1 gap-1">
            {PERIODS.map(p => (
              <button 
                key={p.key} 
                className={cn(
                  "h-10 px-6 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all duration-300", 
                  period === p.key ? "active-state shadow-lg" : "text-zinc-500 dark:text-zinc-100 hover:bg-background/5"
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
               <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-40 h-10 rounded-lg bg-background/50 border-white/10 font-bold" />
               <div className="w-2 h-px bg-background-foreground/30" />
               <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-40 h-10 rounded-lg bg-background/50 border-white/10 font-bold" />
             </div>
          )}
          
          <div className="relative">
            <Button className="h-12 px-8 font-black gap-4 " onClick={() => setShowExport(!showExport)}>
              <Download size={18} /> EXPORT CENTER
            </Button>
            {showExport && (
              <Card className="absolute top-16 right-0 z-[100] w-80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] animate-in zoom-in-95 border-white/10 bg-card backdrop-blur-2xl rounded-lg overflow-hidden">
                <CardHeader className="p-6 border-b border-white/5 bg-background/5">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Production Reports</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {REPORT_TYPES.map(rt => (
                    <div key={rt.key} className="p-4 rounded-lg hover:bg-background/5 transition-all group">
                      <p className="text-xs font-black mb-4 group-hover:text-amber-500 transition-colors">{rt.label}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-white font-black bg-background/5 border-white/10 hover:" onClick={() => handleExcel(rt.key)}>EXCEL</Button>
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-[9px] font-black bg-background/5 border-white/10 hover:bg-rose-500 hover:text-zinc-900 dark:text-zinc-100 rounded-lg" onClick={() => handlePDF(rt.key)}>PDF</Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background/10" onClick={() => printReport(rt.key, period, customStart, customEnd)}><Printer size={14} /></Button>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-amber- rounded-lg mt-2">
                    <Button className="w-full h-12 font-black " onClick={() => handleExcel('all')}>
                       DOWNLOAD ALL DATA
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8">
            <KPICard label="Revenue" value={formatRupiah(summary.totalRevenue)} sub="Gross Income" icon={DollarSign} delta={summary.vsYesterday?.revenue} colorClass="bg-amber-500" />
            <KPICard label="Spending" value={formatRupiah(summary.totalPurchasing)} sub="Inventory Cost" icon={ShoppingBag} colorClass="bg-amber-500" />
            <KPICard label="Gross Profit" value={formatRupiah(summary.grossProfit)} sub={`${summary.marginPct || 0}% Margin`} icon={TrendingUp} delta={12} colorClass="bg-amber-500" />
            <KPICard label="Liabilities" value={formatRupiah(summary.totalDebt)} sub="Unpaid Bills" icon={AlertTriangle} colorClass="bg-amber-500" />
            <KPICard label="HPP / COGS" value={formatRupiah(summary.totalHPP)} sub="Cost of Goods" icon={Package} colorClass="bg-amber-500" />
            <KPICard label="Total Sales" value={<span className="font-mono tabular-nums">{summary.totalTransactions || 0}</span>} sub="Closed Deals" icon={ShoppingCart} delta={summary.vsYesterday?.transactions} colorClass="bg-amber-500" />
          </div>

          {/* Executive Predictive Cockpit - Phase 4 Elite Feature */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <Card className="lg:col-span-12 border-none glass-quantum rounded-lg overflow-hidden group relative">
                <div className="absolute top-0 right-0 w-[70%] h-full bg-amber- blur-[150px] rounded-lg pointer-events-none" />
                <CardContent className="p-12 relative z-10">
                   <div className="flex flex-col md:flex-row items-center gap-16">
                      <div className="flex-1 space-y-8">
                         <div className="inline-flex items-center gap-4 px-4 py-2 bg-amber- rounded-lg border border-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
                            <Zap size={16} className="text-amber-500 fill-amber-500/20 animate-pulse" />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Quantum Intelligence v5.0</span>
                         </div>
                         <h2 className="text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter leading-none italic uppercase">Predictive <span className="text-amber-500">Revenue</span> Exposition</h2>
                         <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium max-w-2xl leading-relaxed">Neural supply-chain audit detects a stable growth trajectory. Projections indicate a <span className="text-amber-500 font-black">12.4% yield increase</span> based on seven-day velocity analysis.</p>
                         
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                            <div className="space-y-1">
                               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Proj. Weekly Rev</p>
                               <p className="text-2xl font-black text-amber-500 font-mono tabular-nums">{formatRupiah(summary.totalRevenue * 7.2)}</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Growth Factor</p>
                               <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">+12.4%</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Peak Hour Proj.</p>
                               <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">15:00 - 18:00</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">System Confidence</p>
                               <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">94%</p>
                            </div>
                         </div>
                      </div>
                      <div className="w-full md:w-[320px] ">
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recommended Action</p>
                            <Lightbulb size={16} className="text-amber-500" />
                         </div>
                         <div className="p-4 rounded-lg ">
                            <p className="text-xs font-black uppercase">Stok Optimized</p>
                            <p className="text-[11px] font-bold leading-relaxed">Naikkan stok Biji Kopi Arabica sebesar 15% untuk mengantisipasi kenaikan pesanan akhir pekan.</p>
                         </div>
                         <Button variant="ghost" className="w-full h-10 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-100">Apply Optimization</Button>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>

          {/* Charts Row - Premium Visualization */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <Card className="xl:col-span-8 border-none shadow-2xl ">
              <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tighter">Hourly Performance Matrix</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest  mt-1">Real-time revenue density distribution.</CardDescription>
                </div>
                <div className="w-14 h-14 bg-amber- rounded-lg flex items-center justify-center text-amber-500 group-hover:rotate-12 transition-transform">
                   <TrendingUp size={28} />
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <MiniChart data={trend.current || []} prev={trend.previous || []} />
              </CardContent>
            </Card>

            <Card className="xl:col-span-4 border-none shadow-2xl ">
              <CardHeader className="p-10 pb-0">
                <CardTitle className="text-2xl font-black uppercase tracking-tighter">Settlement Channels</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest  mt-1">Payment preference analytics.</CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                <div className="space-y-8">
                  {payment.methods?.map((m, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 mb-1">{m.name}</p>
                           <p className="text-lg font-black text-foreground font-mono tabular-nums">{formatRupiah(m.amount)}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xl font-black text-amber-500 font-mono tabular-nums">{m.pct}%</p>
                        </div>
                      </div>
                      <div className="h-3 bg-background/5 rounded-lg overflow-hidden p-0.5 border border-white/5">
                        <div className="h-full " style={{ width: `${m.pct}%` }} />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Products */}
            <Card className="border-none shadow-2xl ">
              <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-4">
                   <div className="w-8 h-8 ">
                      <TrendingUp size={16} />
                   </div>
                   Elite Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {topProducts.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center gap-6 group hover:translate-x-2 transition-transform cursor-default">
                      <div className="w-14 h-14 bg-background/5 rounded-lg flex items-center justify-center text-white shrink-0 group-hover:">
                        {p.icon || '☕'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black truncate leading-tight mb-1">{p.name}</p>
                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest font-mono tabular-nums">{formatRupiah(p.revenue)} revenue</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-foreground font-mono tabular-nums">{p.qty}</p>
                        <p className="text-[9px] text-zinc-500 dark:text-zinc-100 font-black uppercase tracking-[0.2em]">units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stock Alert - Critical */}
            <Card className="border-none shadow-2xl ">
              <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-4 text-rose-600 dark:text-rose-400">
                   <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                      <AlertTriangle size={16} />
                   </div>
                   Stock Depletion
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {criticalStock.length === 0 ? (
                    <div className="py-20 text-center space-y-6 ">
                      <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                         <CheckCircle2 size={48} strokeWidth={1.5} />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest">Inventory Fully Stocked</p>
                    </div>
                  ) : criticalStock.map((b, i) => (
                    <div key={i} className="p-4 rounded-lg bg-background/5 border border-white/5 flex items-center justify-between group hover:border-rose-200 dark:border-rose-800 transition-all">
                      <div className="space-y-1">
                        <p className="text-sm font-black">{b.name}</p>
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest font-mono tabular-nums">{b.stock} {b.unit} Left</p>
                      </div>
                      <div className={cn(
                        "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg",
                        (b.status === 'kritis' || b.status === 'habis') ? "bg-rose-500 text-zinc-900 dark:text-zinc-100" : "bg-amber-500 text-zinc-950"
                      )}>
                        {b.status}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Waste & AI Insight Mini */}
            <div className="space-y-8">
               <Card className="border-none shadow-2xl ">
                 <CardHeader className="p-8 pb-4">
                   <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-4 text-rose-600 dark:text-rose-400">
                      <Trash2 size={20} /> Operational Waste
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 pt-0">
                    <div className="flex items-center justify-between mb-8">
                       <div className="space-y-1">
                         <p className="text-4xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums tracking-tighter">{formatRupiah(waste.totalWaste)}</p>
                         <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-black uppercase tracking-[0.2em]">Financial Loss</p>
                       </div>
                       <div className="relative group">
                          <svg className="w-20 h-20 -rotate-90">
                             <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-900 dark:text-zinc-100/5" />
                             <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                className="text-rose-600 dark:text-rose-400 transition-all duration-1000"
                                strokeDasharray={213}
                                strokeDashoffset={213 - (213 * (waste.wasteRatio || 0)) / 100}
                                strokeLinecap="round"
                             />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-black font-mono tabular-nums text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                             {waste.wasteRatio || 0}%
                          </div>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                       {waste.categories?.map((c, i) => (
                         <div key={i} className="flex justify-between p-4 rounded-lg bg-background/5 text-[10px] font-black uppercase tracking-widest group hover:bg-background/10 transition-all">
                            <span className="text-zinc-500 dark:text-zinc-100 group-hover:text-foreground">{c.name}</span>
                            <span className="text-rose-600 dark:text-rose-400 font-mono tabular-nums">{formatRupiah(c.amount)}</span>
                         </div>
                       ))}
                    </div>
                 </CardContent>
               </Card>

               <Card className="border-none shadow-2xl ">
                  <div className="">
                    <div className="flex items-center justify-between">
                       <CardTitle className="text-xs font-black uppercase tracking-[0.4em] text-amber-500">Live Insights</CardTitle>
                       <Lightbulb size={18} className="text-amber-500 animate-pulse" />
                    </div>
                    <div className="space-y-4">
                       {insights.map((ins, i) => (
                         <div key={i} className="p-4 rounded-lg bg-background/5 border-l-4 border-amber-500 space-y-2 group hover:bg-background/10 transition-all">
                           <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{ins.title}</p>
                           <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium group-hover:text-zinc-200">{ins.body}</p>
                         </div>
                       ))}
                    </div>
                  </div>
               </Card>
            </div>
          </div>

          {/* Inventory Mutation Log - Data Rich */}
          <Card className="border-none shadow-2xl ">
            <CardHeader className="p-12 pb-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                  <ClipboardCheck size={28} className="text-amber-500" /> Stock Audit Ledger
                </CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest ">Immutable audit trail of all manual inventory adjustments.</CardDescription>
              </div>
              <div className="flex items-center gap-4 bg-background/5 p-2 rounded-lg border border-white/5">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:" onClick={() => printReport('stock-mutation', period, customStart, customEnd)}>
                  <Printer size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 px-8 pb-12">
              <div className="overflow-x-auto rounded-lg border border-white/5">
                <table className="w-full text-left border-collapse overflow-hidden">
                  <thead>
                    <tr className="bg-background/5 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-100 border-b border-white/5">
                      <th className="px-8 py-6">Timestamp</th>
                      <th className="px-8 py-6">Material</th>
                      <th className="px-8 py-6">Category</th>
                      <th className="px-8 py-6 text-center">Impact</th>
                      <th className="px-8 py-6">Balance Delta</th>
                      <th className="px-8 py-6">Operator</th>
                      <th className="px-8 py-6">Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono tabular-nums text-[11px]">
                    {inventoryLogs.map(log => (
                      <tr key={log.id} className="group hover:bg-background/5 transition-colors">
                        <td className="px-10 py-8 text-zinc-500 dark:text-zinc-100">{new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()}</td>
                        <td className="px-10 py-8 font-black text-foreground font-sans text-sm">{log.bahan_name}</td>
                        <td className="px-10 py-8">
                          <span className={cn(
                            "px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest font-sans",
                            log.type === 'Waste' || log.type === 'Adjustment' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                          )}>
                            {log.type}
                          </span>
                        </td>
                        <td className={cn("px-10 py-8 text-center font-black text-lg", log.change_qty > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                          {log.change_qty > 0 ? '+' : ''}{log.change_qty}
                        </td>
                        <td className="px-10 py-8 text-zinc-500 dark:text-zinc-100">{log.prev_stock} <span className="mx-2 ">→</span> <span className="font-black text-foreground">{log.next_stock}</span></td>
                        <td className="px-10 py-8 font-black text-amber-500 font-sans">{log.user_name}</td>
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-2 font-sans">
                              <FileText size={12} className="" />
                              <span className="text-[10px] italic font-medium text-zinc-500 dark:text-zinc-100 truncate max-w-[150px]">{log.reason}</span>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {inventoryLogs.length === 0 && (
                      <tr><td colSpan="7" className="py-20 text-center text-xs font-black uppercase tracking-[0.5em] ">No mutation records</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Comprehensive Financial Summary */}
          <Card className="border-none shadow-2xl ">
            <CardContent className="p-0">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 divide-x divide-white/5">
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
           <Card className="border-none shadow-2xl ">
             <CardHeader className="p-12 pb-8 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="space-y-1">
                 <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                   <ShoppingBag size={28} className="text-amber-500" /> Transaction Ledger
                 </CardTitle>
                 <CardDescription className="text-xs font-bold uppercase tracking-widest ">Global transaction history with pagination for millions of records.</CardDescription>
               </div>
               <div className="flex items-center gap-4">
                  <div className="bg-background/5 p-2 rounded-lg flex items-center gap-2 border border-white/5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-lg" 
                      disabled={currentPage === 1 || loadingTrx}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <ChevronDown className="rotate-90" size={18} />
                    </Button>
                    <div className="px-4 text-xs font-black font-mono tabular-nums">
                       PAGE {currentPage} <span className=" mx-2">/</span> {totalPages}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-lg" 
                      disabled={currentPage === totalPages || loadingTrx}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <ChevronRight size={18} />
                    </Button>
                  </div>
               </div>
             </CardHeader>
             <CardContent className="p-0 px-8 pb-12">
                <div className="overflow-x-auto rounded-lg border border-white/5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-background/5 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-100 border-b border-white/5">
                        <th className="px-8 py-6">Reference</th>
                        <th className="px-8 py-6">Timestamp</th>
                        <th className="px-8 py-6">Customer</th>
                        <th className="px-8 py-6">Method</th>
                        <th className="px-8 py-6 text-right">Amount</th>
                        <th className="px-8 py-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loadingTrx ? (
                        <tr><td colSpan="6" className="py-20 text-center"><RefreshCw className="animate-spin mx-auto text-amber-500" /></td></tr>
                      ) : transactions.map(tx => (
                        <tr key={tx.id} className="group hover:bg-background/5 transition-colors">
                          <td className="px-8 py-6 font-black font-mono tabular-nums text-amber-500 uppercase tracking-tighter">{tx.order_number}</td>
                          <td className="px-8 py-6 text-[10px] font-bold text-zinc-500 dark:text-zinc-100 font-mono tabular-nums">
                            {new Date(tx.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                          </td>
                          <td className="px-8 py-6 font-bold text-foreground">{tx.customer_name || 'Tamu'}</td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2">
                                <Wallet size={12} className="text-zinc-500 dark:text-zinc-100" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{tx.payment_method}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right font-black font-mono tabular-nums text-lg">{formatRupiah(tx.total)}</td>
                          <td className="px-8 py-6 text-center">
                            <span className={cn(
                              "px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                              tx.payment_status === 'paid' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-amber- text-amber-500"
                            )}>
                              {tx.payment_status}
                            </span>
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
                  <div className="w-32 h-32 rounded-lg bg-amber- flex items-center justify-center text-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.2)] border border-amber-500/20 rotate-12">
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
                  <Button className="h-14 px-10 rounded-lg font-black ">
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
                      <Button variant="ghost" className="w-full h-12 rounded-lg font-black text-white tracking-widest bg-background/5 hover:" onClick={() => onNavigate?.(ins.action)}>
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
                       ].map((item, i) => (
                          <div key={i} className="flex items-start gap-8 p-10 rounded-lg bg-background/5 border border-white/5 group hover:border-amber-500/30 transition-all">
                            <div className="w-16 h-16 rounded-lg ">
                               <item.icon size={28} />
                            </div>
                            <div className="space-y-3">
                               <h4 className="text-xl font-black uppercase tracking-tight">{item.title}</h4>
                               <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium leading-relaxed">{item.desc}</p>
                               <Button variant="link" className="p-0 h-auto text-amber-500 font-black text-[10px] uppercase tracking-[0.3em] mt-4 flex items-center gap-2 group-hover:gap-4 transition-all" onClick={() => onNavigate?.(item.action)}>
                                  INITIATE STRATEGY <ChevronRight size={14} />
                                </Button>
                            </div>
                          </div>
                       ))}
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
