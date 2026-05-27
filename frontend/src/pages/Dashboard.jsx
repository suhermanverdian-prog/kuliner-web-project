import { formatRupiah } from '../utils/formatters';
import { 
  DollarSign, ReceiptText, Box, Armchair, 
  TrendingUp, TrendingDown, Package, Activity,
  Star, Puzzle, Carrot, SearchX, BarChart3,
  Trophy, Zap, Users, Bookmark, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, ChevronRight, AlertTriangle, BrainCircuit, Bot, Command, Coffee
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { cn } from "../lib/utils";
import { Skeleton } from "../components/ui/Skeleton";
import { ChartWrapper } from "../components/charts/ChartWrapper";
import { useNavigate, Navigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useAppStore } from '../store/useAppStore';


/* ── Komponen Donat Mini (KEN Enterprise Style) ─────────────────────────────────────────── */
function DonutChart({ pct, label, subLabel, color = "var(--amber)" }) {
  const R = 45, C = 2 * Math.PI * R;
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative flex items-center justify-center w-28 h-28">
        <svg width="112" height="112" viewBox="0 0 104 104" className="w-full h-full">
          <circle cx="52" cy="52" r={R} fill="none" className="stroke-zinc-100 dark:stroke-zinc-800/80" strokeWidth="8" />
          <circle cx="52" cy="52" r={R} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${C * pct / 100} ${C}`}
            strokeLinecap="round"
            className="transition-all duration-1000 -rotate-90 origin-center"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-lg font-black font-mono tabular-nums text-foreground">{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-black text-foreground mt-0.5">{subLabel}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-12 w-32 rounded-md" />
          <Skeleton className="h-12 w-48 rounded-md" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
        <Skeleton className="lg:col-span-8 h-[400px] rounded-lg" />
        <Skeleton className="lg:col-span-4 h-[400px] rounded-lg" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAppStore(state => state.user);
  
  if (user?.role === 'staff') return <Navigate to="/kasir" replace />;
  if (user?.role === 'chef') return <Navigate to="/kds" replace />;
  if (user?.role === 'hrd') return <Navigate to="/hrd" replace />;

  const {
    loading,
    aiInsights,
    lowStockItems,
    tenant,
    trendData,
    safeTransactions,
    safeMenu,
    todayRevenue,
    is,
    totalUnpaid,
    totalSpendMonth,
    occupiedTables,
    totalTables,
    tableOccupancyPct,
    activeOrdersCount,
    kitchenLoadPct
  } = useDashboard();

  const stats = [
    { label: 'Revenue (Today)', value: formatRupiah(todayRevenue), icon: DollarSign, trend: '+12.5%', isUp: true },
    { label: 'Net Profit (30d)', value: formatRupiah(is.netProfit !== undefined ? is.netProfit : todayRevenue), icon: is.netProfit >= 0 ? TrendingUp : TrendingDown, trend: `Margin ${Number(is.grossMargin || 0).toFixed(1)}%`, isUp: (is.netProfit !== undefined ? is.netProfit : todayRevenue) >= 0 },
    (tenant?.tier === 'enterprise') && { label: 'Account Payables', value: formatRupiah(totalUnpaid), icon: AlertTriangle, trend: 'Unpaid', isUp: false },
    (tenant?.tier === 'enterprise') && { label: 'Procurement (30d)', value: formatRupiah(totalSpendMonth), icon: Package, trend: 'Active', isUp: true },
  ].filter(Boolean);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 pb-16 overflow-x-hidden max-w-full">
      {/* Header Section - Sleek Premium Omnichannel Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-4">
        <div>
             <Badge variant="primary" className="text-[9px] font-black uppercase tracking-widest">
              Tier: {tenant?.tier?.toUpperCase() || 'ENTERPRISE'}
            </Badge>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">System Status: Active</span>
              </div>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium uppercase font-mono tabular-nums tracking-widest mt-1">
             {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
           </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <Button className="flex-1 md:flex-none" variant="primary" aria-label="Export data" onClick={() => navigate('/reports')}>Export Data</Button>
          <Button className="flex-1 md:flex-none" variant="primary" aria-label="New transaction" onClick={() => navigate('/kasir')}>New Transaction</Button>
        </div>
      </div>

      {/* AI Insights Bar */}
      {aiInsights.length > 0 && (
        <div className="mx-4 mb-6 p-4 ">
           <BrainCircuit size={20} className="animate-pulse" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em]">{aiInsights[0].message}</p>
        </div>
      )}

      {/* Critical Alert */}
      {lowStockItems.length > 0 && (
        <div className="mx-4 p-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
                <AlertTriangle size={24} />
              </div>
              <div>
                 <p className="text-lg font-black text-foreground uppercase tracking-tighter">Stock Shortage Detected</p>
                 <p className="text-xs text-zinc-500 dark:text-zinc-100 font-bold uppercase tracking-widest">{lowStockItems.length} items require attention.</p>
              </div>
           </div>
            <Button variant="primary" size="sm" onClick={() => navigate('/inventory-intel')}>Audit Stock</Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="p-6" variant="premium">
              <div className="flex justify-between items-center mb-4">
                 <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{s.label}</p>
                 <Icon size={18} className="text-amber-500 group-hover:text-amber-500 transition-colors" />
              </div>
              <div className="text-2xl font-black font-mono tabular-nums tracking-tighter mb-4 text-foreground">{s.value}</div>
              <div className={s.isUp ? "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"}>
                {s.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{s.trend}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
        <Card className="lg:col-span-8 p-8" variant="premium">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">Market Trajectory</h3>
              <BarChart3 className="text-amber-500 " size={20} aria-label="Market Trajectory chart" role="img" />
           </div>
           <div className="w-full min-w-0 overflow-hidden">
             <ChartWrapper 
               data={trendData.length > 0 ? trendData : Array.from({ length: 7 }, (_, i) => ({ label: ['S','M','T','W','T','F','S'][i], value: 0 }))} 
               height={200}
               valueFormatter={(val) => formatRupiah(val)}
               className="mt-6"
             />
           </div>
        </Card>

        <Card className="lg:col-span-4 p-8 space-y-6" variant="premium">
           <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">Live Activity</h3>
           <div className="space-y-4">
            {safeTransactions.slice(-4).reverse().map((tx, i) => (
              <div key={i} className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4 last:border-0">
                  <div>
                    <p className="text-xs font-black font-mono tabular-nums text-foreground">TX-{tx?.id?.slice(-4).toUpperCase() || 'NODE'}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-bold uppercase tracking-widest">{tx?.payment_method || 'CASH'}</p>
                  </div>
                  <p className="text-sm font-black font-mono tabular-nums text-amber-500">{formatRupiah(tx?.total || 0)}</p>
              </div>
            ))}
           </div>
           <Button variant="ghost" className="w-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 font-black text-[10px] uppercase tracking-widest" onClick={() => navigate('/activity-log')}>View Audit Log</Button>
        </Card>
      </div>

      {/* Node Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4">
        <Card className="p-8" variant="premium">
           <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 mb-8 text-center lg:text-left">Node Occupancy</h3>
           <div className="flex flex-col sm:flex-row justify-center gap-10 sm:gap-16 py-4">
              <DonutChart 
                pct={tableOccupancyPct} 
                label="Meja Terisi" 
                subLabel={`${occupiedTables} dari ${totalTables} Meja`} 
                color="var(--amber)" 
              />
              <DonutChart 
                pct={kitchenLoadPct} 
                label="Beban Dapur" 
                subLabel={`${activeOrdersCount} Pesanan Aktif`} 
                color={kitchenLoadPct > 70 ? "var(--error)" : "var(--success)"} 
              />
           </div>
        </Card>

        <Card className="p-8" variant="premium">
           <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 mb-8">Peak Performance</h3>
           <div className="space-y-6">
            {safeMenu.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Coffee size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1.5">
                        <p className="text-xs font-black text-zinc-900 dark:text-zinc-50">{item?.name}</p>
                        <p className="text-xs font-mono tabular-nums text-amber-500">85%</p>
                    </div>
                    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[85%] rounded-full" />
                    </div>
                  </div>
              </div>
            ))}
           </div>
        </Card>
      </div>
    </div>
  );
}
