import { useState, useEffect } from 'react';
import { formatRupiah } from '../data';
import { api } from '../api';
import { 
  DollarSign, ReceiptText, Coffee, Armchair, 
  TrendingUp, TrendingDown, Package, Activity,
  Star, Puzzle, Carrot, SearchX, BarChart3,
  Trophy, Zap, Users, Bookmark, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";

/* ── Komponen Grafik Bar SVG ─────────────────────────────── */
function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const W = 500, H = 150, BAR_W = 32, GAP = (W - data.length * BAR_W) / (data.length + 1);

  return (
    <div className="w-full h-[200px] mt-4">
      <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full h-full overflow-visible">
        {data.map((d, i) => {
          const x = GAP + i * (BAR_W + GAP);
          const barH = maxVal > 0 ? (d.value / maxVal) * H : 4;
          const y = H - barH;
          const isToday = i === data.length - 1;
          return (
            <g key={i} className="group">
              <rect 
                x={x} y={y} width={BAR_W} height={barH} rx="4"
                className={cn(
                  "transition-all duration-500 ease-out",
                  isToday ? "fill-accent" : "fill-muted hover:fill-muted-foreground/30"
                )}
              />
              <text 
                x={x + BAR_W / 2} y={H + 20} textAnchor="middle" 
                className={cn(
                  "text-[10px] font-medium",
                  isToday ? "fill-accent font-bold" : "fill-muted-foreground"
                )}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Komponen Donat Mini ─────────────────────────────────────────── */
function DonutMini({ pct, color }) {
  const R = 20, C = 2 * Math.PI * R;
  return (
    <svg width="44" height="44" viewBox="0 0 52 52" className="drop-shadow-sm">
      <circle cx="26" cy="26" r={R} fill="none" className="stroke-muted" strokeWidth="6" />
      <circle cx="26" cy="26" r={R} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${C * pct / 100} ${C}`}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-in-out -rotate-90 origin-center"
      />
    </svg>
  );
}

export default function Dashboard({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [financialAnalytics, setFinancialAnalytics] = useState(null);
  const [inventoryAnalytics, setInventoryAnalytics] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getTransactions(), api.getMenu(), api.getTables(),
      api.getAnalyticsSales('month').catch(() => null),
      api.getAnalyticsFinancial('month').catch(() => null),
      api.getAnalyticsInventory('month').catch(() => null)
    ]).then(([txData, menuData, tblData, salesData, finData, invData]) => {
      setTransactions(txData);
      setMenu(menuData);
      setTables(tblData);
      if (salesData) setSalesAnalytics(salesData);
      if (finData) setFinancialAnalytics(finData);
      if (invData) setInventoryAnalytics(invData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayTx = transactions.filter(t => t.createdAt?.startsWith(today));
  const todayRevenue = todayTx.reduce((s, t) => s + (t.total || 0), 0);
  const totalTx = transactions.length;
  const activeTables = tables.filter(t => t.status === 'occupied').length;

  const stats = [
    { label: 'Pendapatan Hari Ini', value: formatRupiah(todayRevenue), icon: DollarSign, trend: '+12.5%', isUp: true, description: 'vs kemarin' },
    { label: 'Total Transaksi', value: todayTx.length.toString(), icon: ReceiptText, trend: '+4', isUp: true, description: 'pesanan baru' },
    { label: 'Okupansi Meja', value: `${activeTables}/${tables.length}`, icon: Armchair, trend: 'Sibuk', isUp: true, description: 'sesi aktif' },
    { label: 'Perputaran Stok', value: `${inventoryAnalytics?.turnover_ratio || 0}x`, icon: Package, trend: '-2%', isUp: false, description: 'bulan ini' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground font-medium animate-pulse">Menyiapkan dashboard Anda...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} · Selamat datang kembali, {user.name.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Unduh Laporan</Button>
          <Button size="sm">Transaksi Baru</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {s.isUp ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
                  <span className={cn("text-xs font-bold", s.isUp ? "text-emerald-500" : "text-destructive")}>{s.trend}</span>
                  <span className="text-xs text-muted-foreground">{s.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Sales Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Ikhtisar Penjualan</CardTitle>
            <CardDescription>Visualisasi pendapatan harian dalam 7 hari terakhir.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={Array.from({ length: 7 }, (_, i) => {
              const d = new Date(); d.setDate(d.getDate() - (6 - i));
              const key = d.toISOString().split('T')[0];
              const rev = transactions.filter(t => t.createdAt?.startsWith(key)).reduce((s, t) => s + (t.total || 0), 0);
              return { label: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()], value: rev };
            })} />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Pesanan terbaru dan pembaruan status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {transactions.slice(-5).reverse().map((tx, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                  <Clock className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">Pesanan #{tx.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">{tx.tableType} · {tx.items?.length} item</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatRupiah(tx.total)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-xs h-8 text-muted-foreground hover:text-accent" onClick={() => window.location.hash = '#/laporan'}>
              Lihat Semua Transaksi <ChevronRight size={14} className="ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Table Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status Meja Live</CardTitle>
            <CardDescription>Okupansi waktu-nyata di seluruh area.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <DonutMini pct={(activeTables / (tables.length || 1)) * 100} color="hsl(var(--accent))" />
                <p className="mt-2 text-xl font-bold">{activeTables}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Terisi</p>
              </div>
              <div className="text-center">
                <DonutMini pct={((tables.length - activeTables) / (tables.length || 1)) * 100} color="hsl(var(--muted))" />
                <p className="mt-2 text-xl font-bold">{tables.length - activeTables}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tersedia</p>
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-6">
              {tables.slice(0, 12).map((t, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center gap-1 border transition-all",
                    t.status === 'occupied' ? "bg-accent/5 border-accent/20 text-accent" : "bg-muted/30 border-transparent text-muted-foreground"
                  )}
                >
                  <Armchair size={14} />
                  <span className="text-[10px] font-bold">{t.name.split(' ')[1]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
            <CardDescription>Item paling populer minggu ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {menu.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                  {item.icon || '☕'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-medium">Terjual {42 - i * 5}</p>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all duration-1000" 
                      style={{ width: `${85 - i * 15}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
