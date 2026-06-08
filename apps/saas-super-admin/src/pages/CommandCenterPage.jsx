import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Activity, Globe, Zap, 
  TrendingUp, Users, AlertTriangle, 
  RefreshCw, Server, Database, HardDrive, Cpu, 
  Terminal, Lock, BarChart3, Clock, ChevronRight,
  TrendingDown, Info, ShoppingBag, Store
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { useCommandCenterPage } from '../hooks/useCommandCenterPage';

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const {
    stats,
    liveFeed,
    loading,
    fetchGlobalData
  } = useCommandCenterPage();

  const [activeChart, setActiveChart] = useState('revenue'); // 'revenue' | 'brands' | 'modules'

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4 bg-background text-foreground font-mono tabular-nums">
      <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Command Center Nodes...</p>
    </div>
  );

  // Dynamic values from backend stats with fallbacks
  const systemHealth = stats.systemHealth || { cpuUsage: 12, memoryUsage: 45, dbConnections: 18 };
  const brandGrowthData = stats.brandGrowthChart || [];
  const revenueGrowthData = stats.revenueGrowthChart || [];
  const moduleUsageData = stats.moduleUsageChart || [];

  // Safe helper to format IDR Currency
  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Helper to generate custom SVG Line Chart path
  const getLineChartPath = (data, dataKey, width, height, padding = 40) => {
    if (!data || data.length === 0) return '';
    const maxVal = Math.max(...data.map(d => Number(d[dataKey] || 0)), 1);
    const minVal = 0;
    const points = data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((Number(d[dataKey] || 0) - minVal) / (maxVal - minVal)) * (height - padding * 2);
      return { x, y };
    });

    return points.reduce((path, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`, '');
  };

  // Helper to generate custom SVG Line Chart area path
  const getLineChartAreaPath = (data, dataKey, width, height, padding = 40) => {
    const linePath = getLineChartPath(data, dataKey, width, height, padding);
    if (!linePath) return '';
    const startX = padding;
    const endX = width - padding;
    const baseY = height - padding;
    return `${linePath} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
  };

  return (
    <div className="space-y-8 pb-10 min-h-screen transition-colors duration-300 bg-background text-foreground animate-in fade-in duration-500">
      {/* Top Header - Glassmorphic */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Master Control Node</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Global Network Online</span>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-4">
            COMMAND <span className="text-amber-500 italic">CENTER</span>
            <Activity className="text-zinc-500 dark:text-zinc-400/30 animate-pulse" size={32} />
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-1">Real-time SaaS Monitoring, Transaction Ledger & System Health Matrix.</p>
        </div>
        <div className="flex items-center gap-4 bg-background p-2 rounded-lg border border-border">
            <div className="px-4 py-2 text-center border-r border-border">
                <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Uptime</p>
                <p className="text-lg font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{stats.serverUptime || '99.99%'}</p>
            </div>
            <div className="px-4 py-2 text-center">
                <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Network Latency</p>
                <p className="text-lg font-black font-mono tabular-nums text-amber-500">{stats.latency || '45ms'}</p>
            </div>
            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-lg bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all" onClick={fetchGlobalData}><RefreshCw size={20} className="text-amber-500" /></Button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Tenant / Brand', val: stats.totalTenants, sub: `${stats.activeTenants} Active Nodes`, icon: Globe, color: 'text-foreground' },
          { label: 'Cabang / Outlet Aktif', val: stats.totalOutlets || 0, sub: 'Tersebar di Indonesia', icon: Store, color: 'text-amber-500' },
          { label: 'Total Omzet Bisnis', val: `Rp ${(stats.globalRevenue / 1000000).toFixed(1)}M`, sub: 'Akumulasi Semua Toko', icon: TrendingUp, color: 'text-amber-500' },
          { label: 'Pengguna Aktif', val: stats.onlineUsers, sub: 'Akun Terdaftar di Ledger', icon: Users, color: 'text-zinc-500 dark:text-zinc-400' },
        ].map((m, i) => (
          <Card key={i} className="bg-card border-border hover:border-amber-500/30 transition-all shadow-xl overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <m.icon size={110} />
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg bg-background border border-border", m.color)}>
                  <m.icon size={20} />
                </div>
                <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest italic">Live Monitor</div>
              </div>
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">{m.label}</p>
              <h3 className={cn("text-3xl font-black font-mono tabular-nums", m.color)}>{m.val}</h3>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-1.5">
                <Zap size={12} className="text-amber-500" /> {m.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction Aggregate Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Transaksi Global Hari Ini</p>
              <h4 className="text-2xl font-black font-mono tabular-nums text-foreground">{stats.transactionsTodayCount || 0} Trx</h4>
              <p className="text-xs font-mono tabular-nums text-amber-500 font-bold">Volume: {formatIDR(stats.transactionsTodayVolume || 0)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <ShoppingBag size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Transaksi Global Bulan Ini</p>
              <h4 className="text-2xl font-black font-mono tabular-nums text-foreground">{stats.transactionsThisMonthCount || 0} Trx</h4>
              <p className="text-xs font-mono tabular-nums text-amber-500 font-bold">Volume: {formatIDR(stats.transactionsThisMonthVolume || 0)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <TrendingUp size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Charts, Performance, Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Visual Growth Charts */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="bg-card border-border shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="bg-background/50 border-b border-border p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-tighter text-foreground">Grafik Analitik Platform</CardTitle>
                  <CardDescription className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Perkembangan Keuangan, Brand & Penggunaan Modul</CardDescription>
                </div>
                {/* Chart Selector Buttons */}
                <div className="flex gap-2 bg-background p-1 rounded-md border border-border self-start sm:self-auto">
                  {[
                    { id: 'revenue', label: 'Pendapatan platform' },
                    { id: 'brands', label: 'Brand Terdaftar' },
                    { id: 'modules', label: 'Penggunaan Modul' }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => setActiveChart(btn.id)}
                      className={cn(
                        "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded transition-all",
                        activeChart === btn.id
                          ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900"
                          : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {/* RENDER CUSTOM SVG CHART BASED ON SELECTOR */}
              {activeChart === 'revenue' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Histori Pendapatan Bulanan Platform (SaaS Subscriptions)</span>
                    <span className="text-xs font-mono font-black text-foreground">Total: {formatIDR(revenueGrowthData.reduce((sum, r) => sum + r.revenue, 0))}</span>
                  </div>
                  
                  {/* SVG Line Chart */}
                  <div className="relative w-full h-[320px] bg-background/30 rounded-lg border border-border p-4">
                    <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="40" y1="40" x2="560" y2="40" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="40" y1="100" x2="560" y2="100" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="40" y1="160" x2="560" y2="160" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="40" y1="200" x2="560" y2="200" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1" />
                      
                      {/* Chart Area Fill */}
                      {revenueGrowthData.length > 0 && (
                        <path
                          d={getLineChartAreaPath(revenueGrowthData, 'revenue', 600, 240, 40)}
                          fill="url(#revenueGrad)"
                        />
                      )}
                      
                      {/* Chart Line */}
                      {revenueGrowthData.length > 0 && (
                        <path
                          d={getLineChartPath(revenueGrowthData, 'revenue', 600, 240, 40)}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Data Dots & Tooltips */}
                      {revenueGrowthData.map((d, idx) => {
                        const maxVal = Math.max(...revenueGrowthData.map(r => r.revenue), 1);
                        const x = 40 + (idx / (revenueGrowthData.length - 1)) * 520;
                        const y = 200 - (d.revenue / maxVal) * 120;
                        return (
                          <g key={idx} className="group/dot cursor-pointer">
                            <circle cx={x} cy={y} r="5" fill="#f59e0b" stroke="currentColor" className="text-background" strokeWidth="2" />
                            <circle cx={x} cy={y} r="10" fill="#f59e0b" className="opacity-0 group-hover/dot:opacity-20 transition-opacity" />
                            
                            {/* Hover label */}
                            <foreignObject x={x - 60} y={y - 35} width="120" height="25" className="opacity-0 group-hover/dot:opacity-100 transition-all pointer-events-none">
                              <div className="bg-zinc-900 text-white text-[8px] font-black rounded px-1 py-0.5 text-center shadow-lg border border-zinc-700 font-mono">
                                Rp {(d.revenue / 1000).toFixed(0)}K
                              </div>
                            </foreignObject>
                          </g>
                        );
                      })}
                    </svg>
                    
                    {/* X Axis labels */}
                    <div className="absolute bottom-2 left-10 right-10 flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                      {revenueGrowthData.map((d, i) => (
                        <span key={i}>{d.month}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeChart === 'brands' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Histori Registrasi Brand Baru (6 Bulan Terakhir)</span>
                    <span className="text-xs font-mono font-black text-foreground">Total: {brandGrowthData.reduce((sum, r) => sum + r.count, 0)} Brand</span>
                  </div>

                  {/* SVG Bar Chart for brand registrations */}
                  <div className="relative w-full h-[320px] bg-background/30 rounded-lg border border-border p-4">
                    <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="40" y1="40" x2="560" y2="40" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="40" y1="120" x2="560" y2="120" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="40" y1="200" x2="560" y2="200" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1" />

                      {/* Render Bars */}
                      {brandGrowthData.map((d, idx) => {
                        const maxVal = Math.max(...brandGrowthData.map(r => r.count), 1);
                        const barWidth = 35;
                        const x = 40 + (idx / (brandGrowthData.length - 1)) * 480 + 10;
                        const barHeight = (d.count / maxVal) * 140;
                        const y = 200 - barHeight;
                        
                        return (
                          <g key={idx} className="group/bar cursor-pointer">
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              fill="#f59e0b"
                              rx="3"
                              className="fill-amber-500/80 hover:fill-amber-500 dark:fill-amber-400/80 dark:hover:fill-amber-400 transition-colors"
                            />
                            {/* Hover count */}
                            <text
                              x={x + barWidth / 2}
                              y={y - 8}
                              textAnchor="middle"
                              className="text-[10px] font-mono font-black fill-foreground opacity-0 group-hover/bar:opacity-100 transition-opacity"
                            >
                              {d.count}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* X Axis Labels */}
                    <div className="absolute bottom-2 left-12 right-12 flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                      {brandGrowthData.map((d, i) => (
                        <span key={i} className="w-12 text-center">{d.month}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeChart === 'modules' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">Popularitas Modul Terpopuler (Frekuensi Aktivasi)</span>
                  
                  {/* Horizontal Bar Chart */}
                  <div className="space-y-4 p-4 rounded-lg bg-background/30 border border-border">
                    {moduleUsageData.map((m, idx) => {
                      const total = stats.totalTenants || 1;
                      const pct = Math.round((m.activeCount / total) * 100);
                      
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-end text-[10px]">
                            <span className="font-black text-foreground">{m.group} Management</span>
                            <span className="font-mono tabular-nums font-black text-amber-500">{m.activeCount} Brand ({pct}%)</span>
                          </div>
                          <div className="h-2.5 bg-background rounded border border-border overflow-hidden">
                            <div
                              className="h-full bg-amber-500 dark:bg-amber-400 rounded-r transition-all duration-1000"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Infrastructure & Logs */}
        <div className="lg:col-span-4 space-y-8">
          {/* Health metrics */}
          <Card className="bg-card border-border shadow-xl">
             <CardHeader className="border-b border-border">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                   <Activity size={16} className="text-amber-500 animate-pulse" /> Infrastructure Node Health
                </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                {[
                  { label: 'CPU Usage', val: systemHealth.cpuUsage, icon: Cpu, color: 'bg-amber-500', alertThreshold: 85 },
                  { label: 'RAM / Memory Allocation', val: systemHealth.memoryUsage, icon: HardDrive, color: 'bg-zinc-700 dark:bg-zinc-400', alertThreshold: 90 },
                  { label: 'Active DB Pool Nodes', val: systemHealth.dbConnections, icon: Database, color: 'bg-emerald-500', maxVal: 100, alertThreshold: 80 },
                ].map((s, i) => {
                  const pct = s.maxVal ? Math.round((s.val / s.maxVal) * 100) : s.val;
                  const isAlert = pct >= s.alertThreshold;
                  
                  return (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2">
                             <s.icon size={14} className={cn("text-zinc-500 dark:text-zinc-400", isAlert && "text-rose-500 animate-bounce")} />
                             <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{s.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             {isAlert && <span className="px-1 py-0.2 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[8px] font-black uppercase rounded">Critical</span>}
                             <span className="text-xs font-black font-mono tabular-nums text-foreground">{s.val}{s.maxVal ? '' : '%'}</span>
                          </div>
                       </div>
                       <div className="h-2 bg-background border border-border rounded-md overflow-hidden">
                          <div className={cn("h-full rounded-r transition-all duration-1000", isAlert ? "bg-rose-500" : s.color)} style={{ width: `${pct}%` }} />
                       </div>
                    </div>
                  );
                })}
             </CardContent>
          </Card>

          {/* Live System Alerts ticker */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-500" /> Platform Peringatan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {systemHealth.cpuUsage > 85 || systemHealth.memoryUsage > 90 ? (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-start gap-3">
                  <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                  <div className="text-[10px]">
                    <p className="font-black uppercase tracking-wider">Node Overload Alert</p>
                    <p className="font-medium mt-1">Penggunaan resource server super admin melebihi batas wajar. Segera optimasi database query pool.</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-start gap-3">
                  <Shield className="shrink-0 mt-0.5" size={16} />
                  <div className="text-[10px]">
                    <p className="font-black uppercase tracking-wider">Server Health Normal</p>
                    <p className="font-medium mt-1">Sistem berjalan dengan performa penuh. Tidak ada indikasi kebocoran memori atau deadlock query.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Traffic Feed Section */}
      <Card className="bg-card border-border shadow-xl">
         <CardHeader className="border-b border-border flex flex-row items-center justify-between p-6">
            <div>
               <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Aktivitas & Traffic Terkini</CardTitle>
               <CardDescription className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">Log Event Keamanan, Transaksi & Sistem Secara Real-time</CardDescription>
            </div>
            <Button 
               variant="outline" 
               className="text-[10px] font-black uppercase tracking-widest border-border text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 h-9"
               onClick={() => navigate('/activity-log')}
            >
               View All Audit Logs <ChevronRight size={14} className="ml-1" />
            </Button>
         </CardHeader>
         <CardContent className="p-0">
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto no-scrollbar">
               {liveFeed.map((item) => (
                 <div key={item.id} className="p-4 hover:bg-background/50 transition-colors flex gap-4">
                    <div className={cn("w-10 h-10 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border", item.color)}>
                       <item.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest", item.color)}>{item.type}</span>
                          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">{item.time}</span>
                       </div>
                       <p className="text-xs font-bold text-foreground truncate">{item.msg}</p>
                    </div>
                 </div>
               ))}
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
