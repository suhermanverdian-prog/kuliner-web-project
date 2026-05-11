import { useState, useEffect, useCallback } from 'react';
import { printReport, downloadPDF, downloadCSV } from '../utils/reportPrinter';
import { 
  BarChart3, TrendingUp, TrendingDown, Package, 
  ShoppingCart, Wallet, DollarSign, PieChart,
  Calendar, Download, Printer, Filter,
  AlertTriangle, CheckCircle2, ChevronRight,
  ShoppingBag, Trash2, Lightbulb, ArrowUpRight,
  ArrowDownRight, RefreshCw, FileText, ChevronDown, ClipboardCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? 'http://localhost:3001/api' 
  : 'https://kuliner-web-project.vercel.app/api';
const fetch2 = (url) => fetch(url).then(r => r.json());

const formatCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const formatShort = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}jt` : n >= 1000 ? `${(n/1000).toFixed(0)}rb` : String(n||0);

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
    <Card className="border-none shadow-xl bg-card overflow-hidden group">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
            <h3 className="text-xl font-black tracking-tight">{value}</h3>
            {sub && <p className="text-[9px] text-muted-foreground font-bold">{sub}</p>}
          </div>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", colorClass)}>
            <Icon size={20} />
          </div>
        </div>
        {delta !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
              isUp ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
            )}>
              {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              {Math.abs(delta)}%
            </div>
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">vs periode lalu</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniChart({ data, prev }) {
  const W = 600, H = 180, PAD = 40;
  const maxV = Math.max(...data.map(d => d.value), ...prev.map(d => d.value), 1);
  const xScale = i => PAD + (i / 23) * (W - PAD * 2);
  const yScale = v => H - PAD - (v / maxV) * (H - PAD * 2);

  const toPath = (arr) => arr.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.hour)},${yScale(d.value)}`).join(' ');
  const currentPath = toPath(data);
  const prevPath = toPath(prev);

  return (
    <div className="relative w-full overflow-hidden">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Grids */}
        {[0, 0.5, 1].map(v => (
          <line key={v} x1={PAD} y1={yScale(maxV * v)} x2={W - PAD} y2={yScale(maxV * v)} stroke="currentColor" className="text-muted/30" strokeDasharray="4,4" />
        ))}
        {/* Previous Period */}
        <path d={prevPath} fill="none" stroke="currentColor" className="text-muted/40" strokeWidth="2" strokeDasharray="6,4" />
        {/* Current Period */}
        <path d={currentPath} fill="none" stroke="currentColor" className="text-accent" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Area Gradient */}
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
           <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.15" />
           <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
        <path d={`${currentPath} L ${xScale(23)},${H - PAD} L ${xScale(0)},${H - PAD} Z`} fill="url(#areaGrad)" />
        
        {/* Dots */}
        {data.map((d, i) => d.value > 0 && (
          <circle key={i} cx={xScale(d.hour)} cy={yScale(d.value)} r="4" className="fill-accent stroke-background" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex gap-6 mt-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-accent rounded-full" />
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Periode Ini</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-muted rounded-full border-b border-dashed border-muted-foreground" />
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Periode Lalu</span>
        </div>
      </div>
    </div>
  );
}

export default function LaporanPage() {
  const [period, setPeriod] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [trend, setTrend] = useState({ current: [], previous: [] });
  const [payment, setPayment] = useState({ methods: [], total: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [criticalStock, setCriticalStock] = useState([]);
  const [waste, setWaste] = useState({});
  const [insights, setInsights] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      let q = `period=${period}`;
      if (period === 'custom') q += `&customStart=${customStart}&customEnd=${customEnd}`;
      const [s, t, p, tp, cs, w, ins, il] = await Promise.all([
        fetch2(`${API_URL}/laporan/summary?${q}`),
        fetch2(`${API_URL}/laporan/trend?${q}`),
        fetch2(`${API_URL}/laporan/payment-methods?${q}`),
        fetch2(`${API_URL}/laporan/top-products?${q}`),
        fetch2(`${API_URL}/laporan/critical-stock`),
        fetch2(`${API_URL}/laporan/waste?${q}`),
        fetch2(`${API_URL}/laporan/insights?${q}`),
        fetch2(`${API_URL}/inventory/logs`),
      ]);
      setSummary(s); setTrend(t); setPayment(p); setTopProducts(tp);
      setCriticalStock(cs); setWaste(w); setInsights(ins);
      setInventoryLogs(il);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [period, customStart, customEnd]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const REPORT_TYPES = [
    { key: 'penjualan-harian', label: 'Penjualan Harian' },
    { key: 'penjualan-periode', label: 'Penjualan Periode' },
    { key: 'inventaris', label: 'Stok Barang' },
    { key: 'waste', label: 'Kerugian (Waste)' },
    { key: 'hpp', label: 'HPP (COGS)' },
    { key: 'laba-rugi', label: 'Laba Rugi' },
  ];

  const handleExcel = async (type) => {
    setExporting(true);
    try {
      let q = `type=${type}&period=${period}`;
      if (period === 'custom') q += `&customStart=${customStart}&customEnd=${customEnd}`;
      const res = await fetch(`${API_URL}/report/excel?${q}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-${type}-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
    } finally { setExporting(false); setShowExport(false); }
  };

  const handlePDF = async (type) => {
    setExporting(true);
    try { await downloadPDF(type, period, customStart, customEnd); }
    finally { setExporting(false); setShowExport(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse font-medium">Menganalisis data bisnis...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-500">
      {/* Header & Filter */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laporan & Analitik</h2>
          <p className="text-muted-foreground mt-1">Pantau performa finansial dan efisiensi operasional.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-muted/20 p-1 rounded-2xl border shrink-0">
            {PERIODS.map(p => (
              <Button 
                key={p.key} variant={period === p.key ? "secondary" : "ghost"} 
                className={cn("h-10 px-4 font-bold rounded-xl", period === p.key && "bg-background shadow-sm")}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          {period === 'custom' && (
             <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
               <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-36 h-10" />
               <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-36 h-10" />
             </div>
          )}
          
          <div className="relative">
            <Button className="h-12 px-6 font-black gap-2 bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20" onClick={() => setShowExport(!showExport)}>
              <Download size={20} /> Ekspor Laporan <ChevronDown size={16} />
            </Button>
            {showExport && (
              <Card className="absolute top-14 right-0 z-50 w-72 shadow-2xl animate-in zoom-in-95 border-accent/20">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-xs uppercase tracking-widest">Pilih Format Laporan</CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1 max-h-80 overflow-y-auto">
                  {REPORT_TYPES.map(rt => (
                    <div key={rt.key} className="p-3 rounded-xl hover:bg-muted/50 transition-colors">
                      <p className="text-xs font-bold mb-2">{rt.label}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-[10px] font-black bg-emerald-500/5 text-emerald-600 border-emerald-500/20" onClick={() => handleExcel(rt.key)}>EXCEL</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] font-black bg-destructive/5 text-destructive border-destructive/20" onClick={() => handlePDF(rt.key)}>PDF</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printReport(rt.key, period, customStart, customEnd)}><Printer size={12} /></Button>
                      </div>
                    </div>
                  ))}
                  <div className="p-2 border-t mt-2">
                    <Button className="w-full h-10 font-black bg-emerald-600 hover:bg-emerald-700" onClick={() => handleExcel('all')}>
                      📊 Download Semua (Excel)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Pendapatan" value={formatCurrency(summary.totalRevenue)} sub="Total Sales" icon={DollarSign} delta={summary.vsYesterday?.revenue} colorClass="bg-emerald-500" />
        <KPICard label="Total Belanja" value={formatCurrency(summary.totalPurchasing)} sub="Procurement" icon={ShoppingBag} colorClass="bg-blue-500" />
        <KPICard label="Laba Kotor" value={formatCurrency(summary.grossProfit)} sub={`${summary.marginPct || 0}% Margin`} icon={TrendingUp} colorClass="bg-indigo-600" />
        <KPICard label="Hutang" value={formatCurrency(summary.totalDebt)} sub="Unpaid Invoices" icon={AlertTriangle} colorClass="bg-rose-500" />
        <KPICard label="HPP (COGS)" value={formatCurrency(summary.totalHPP)} sub="Bahan Terpakai" icon={Package} colorClass="bg-amber-500" />
        <KPICard label="Transaksi" value={summary.totalTransactions || 0} sub="Closed Orders" icon={ShoppingCart} delta={summary.vsYesterday?.transactions} colorClass="bg-purple-600" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 border-none shadow-xl bg-card overflow-hidden">
          <CardHeader className="border-b bg-muted/10 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Tren Penjualan Per Jam</CardTitle>
                <CardDescription>Visualisasi volume transaksi sepanjang hari.</CardDescription>
              </div>
              <TrendingUp className="text-accent" />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <MiniChart data={trend.current || []} prev={trend.previous || []} />
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-card overflow-hidden">
          <CardHeader className="border-b bg-muted/10 pb-6">
            <CardTitle className="text-xl">Metode Pembayaran</CardTitle>
            <CardDescription>Distribusi transaksi per channel.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {payment.methods?.map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent" /> {m.name}
                    </p>
                    <p className="text-sm font-black">{m.pct}%</p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${m.pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold text-right">{formatCurrency(m.amount)}</p>
                </div>
              ))}
              {!payment.methods?.length && (
                <div className="h-full flex items-center justify-center p-10 text-center opacity-30">
                  <PieChart size={48} strokeWidth={1} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Products */}
        <Card className="border-none shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500" /> Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="divide-y">
              {topProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="py-4 flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                    {p.icon || '☕'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate leading-none">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">{formatCurrency(p.revenue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-accent">{p.qty}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Qty</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stock Alert */}
        <Card className="border-none shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="text-lg flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> Stok Kritis</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="divide-y">
              {criticalStock.length === 0 ? (
                <div className="py-20 text-center space-y-4 opacity-40 grayscale">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-bold uppercase tracking-widest">Semua Stok Aman</p>
                </div>
              ) : criticalStock.map((b, i) => (
                <div key={i} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{b.name}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{b.stock} {b.unit} tersisa</p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    (b.status === 'kritis' || b.status === 'habis') ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights & Waste */}
        <div className="space-y-8">
           <Card className="border-none shadow-xl bg-card">
             <CardHeader className="border-b bg-muted/10">
               <CardTitle className="text-lg flex items-center gap-2"><Trash2 size={18} className="text-destructive" /> Waste & Kerugian</CardTitle>
             </CardHeader>
             <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                   <div>
                     <p className="text-3xl font-black text-destructive">{formatCurrency(waste.totalWaste)}</p>
                     <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Estimasi Kerugian</p>
                   </div>
                   <div className="w-16 h-16 rounded-full border-4 border-destructive/20 flex items-center justify-center text-xs font-black text-destructive">
                      {waste.wasteRatio || 0}%
                   </div>
                </div>
                <div className="space-y-2">
                   {waste.categories?.map((c, i) => (
                     <div key={i} className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                        <span>• {c.name}</span>
                        <span>{formatCurrency(c.amount)}</span>
                     </div>
                   ))}
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-xl bg-card border-l-4 border-l-accent">
             <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Lightbulb size={16} className="text-accent" /> Insight Bisnis</CardTitle>
             </CardHeader>
             <CardContent className="p-6 pt-0 space-y-4">
                {insights.map((ins, i) => (
                  <div key={i} className="p-3 rounded-xl bg-accent/5 border border-accent/10 space-y-1">
                    <p className="text-xs font-black text-accent uppercase tracking-widest">{ins.title}</p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground font-medium">{ins.body}</p>
                  </div>
                ))}
             </CardContent>
           </Card>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card overflow-hidden">
        <CardHeader className="border-b bg-muted/10 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck size={20} className="text-accent" /> Log Mutasi & Penyesuaian Stok
            </CardTitle>
            <CardDescription>Jejak audit permanen untuk seluruh perubahan stok manual.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="font-bold gap-2 text-muted-foreground" onClick={() => downloadCSV('stock-mutation', period, customStart, customEnd)}>
              <FileText size={14} /> Excel
            </Button>
            <Button variant="ghost" size="sm" className="font-bold gap-2 text-muted-foreground" onClick={() => downloadPDF('stock-mutation', period, customStart, customEnd)}>
              <Download size={14} /> PDF
            </Button>
            <Button variant="ghost" size="sm" className="font-bold gap-2 text-muted-foreground" onClick={() => printReport('stock-mutation', period, customStart, customEnd)}>
              <Printer size={14} /> Print
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b">
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Nama Bahan</th>
                  <th className="px-6 py-4">Tipe</th>
                  <th className="px-6 py-4">Perubahan</th>
                  <th className="px-6 py-4">Saldo Stok</th>
                  <th className="px-6 py-4">PIC / Pelaku</th>
                  <th className="px-6 py-4">Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inventoryLogs.map(log => (
                  <tr key={log.id} className="text-sm hover:bg-muted/5">
                    <td className="px-6 py-4 text-muted-foreground font-medium">{new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4 font-bold">{log.bahan_name}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                        log.type === 'Waste' || log.type === 'Adjustment' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {log.type}
                      </span>
                    </td>
                    <td className={cn("px-6 py-4 font-black", log.change_qty > 0 ? "text-emerald-600" : "text-destructive")}>
                      {log.change_qty > 0 ? '+' : ''}{log.change_qty}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{log.prev_stock} → <span className="font-bold text-primary">{log.next_stock}</span></td>
                    <td className="px-6 py-4 font-bold">{log.user_name}</td>
                    <td className="px-6 py-4 italic text-xs text-muted-foreground">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Summary Footer */}
      <Card className="border-none shadow-xl bg-card overflow-hidden border-t-4 border-t-accent">
        <CardContent className="p-0">
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0">
              {[
                { label: 'Penjualan Kotor', value: formatCurrency(summary.totalRevenue) },
                { label: 'Total Diskon', value: formatCurrency(0) },
                { label: 'Penjualan Bersih', value: formatCurrency(summary.totalRevenue) },
                { label: 'HPP (Total)', value: formatCurrency(summary.totalHPP) },
                { label: 'Laba Kotor', value: formatCurrency(summary.grossProfit) },
                { label: 'Margin Aktual', value: `${summary.marginPct || 0}%`, highlight: true },
              ].map((item, i) => (
                <div key={i} className="p-6 text-center space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                  <p className={cn("text-lg font-black", item.highlight ? "text-accent" : "text-primary")}>{item.value}</p>
                </div>
              ))}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
