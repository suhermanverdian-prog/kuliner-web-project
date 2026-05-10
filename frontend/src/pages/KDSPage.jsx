import { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  ChefHat, Clock, CheckCircle2, Flame, 
  Utensils, ClipboardList, AlertCircle, 
  Search, Filter, MoreHorizontal, Timer,
  User, CreditCard, Ticket, ArrowRight,
  Bell, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";

const STATUS_CONFIG = {
  new:     { label: 'Pesanan Baru', color: 'text-blue-600', bg: 'bg-blue-600/10', border: 'border-blue-600/20', icon: Bell, btnLabel: 'Mulai Masak', btnIcon: Flame, next: 'cooking' },
  cooking: { label: 'Sedang Dimasak', color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/20', icon: Flame, btnLabel: 'Selesaikan', btnIcon: CheckCircle2, next: 'ready' },
  ready:   { label: 'Siap Saji', color: 'text-emerald-600', bg: 'bg-emerald-600/10', border: 'border-emerald-600/20', icon: CheckCircle2, btnLabel: 'Sudah Disajikan', btnIcon: Utensils, next: 'served' },
};

function WaitTime({ since }) {
  const [mins, setMins] = useState(0);
  useEffect(() => {
    const calc = () => setMins(Math.floor((Date.now() - new Date(since).getTime()) / 60000));
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [since]);
  
  const color = mins < 5 ? "text-emerald-500" : mins < 10 ? "text-amber-500" : "text-destructive";
  
  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/50 border backdrop-blur-sm", color)}>
      <Timer size={12} className="animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest">{mins}m</span>
    </div>
  );
}

export default function KDSPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const txData = await api.getTransactions().catch(() => []);
      const tx = Array.isArray(txData) ? txData : [];
      const activeOrders = tx
        .filter(t => t && t.kdsStatus && t.kdsStatus !== 'served' && t.items && t.items.length > 0)
        .sort((a, b) => new Date(a.paidAt || a.createdAt) - new Date(b.paidAt || b.createdAt));
      setOrders(activeOrders);
    } finally {
      setLoading(false);
    }
  };

  const advance = async (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const next = STATUS_CONFIG[order.kdsStatus]?.next;
    
    // Optimistic UI
    setOrders(prev => (Array.isArray(prev) ? prev : []).map(o => {
      if (o?.id !== id) return o;
      if (next === 'served') return null;
      return { ...o, kdsStatus: next };
    }).filter(Boolean));
    
    await api.updateKdsStatus(id, next);
  };

  const safeOrders = Array.isArray(orders) ? orders : [];
  const filtered = filter === 'all' ? safeOrders : safeOrders.filter(o => o?.kdsStatus === filter);
  const counts = {
    new:     safeOrders.filter(o => o?.kdsStatus === 'new').length,
    cooking: safeOrders.filter(o => o?.kdsStatus === 'cooking').length,
    ready:   safeOrders.filter(o => o?.kdsStatus === 'ready').length
  };

  if (loading && safeOrders.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse font-medium">Sinkronisasi pesanan dapur...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kitchen Display System</h2>
          <p className="text-muted-foreground mt-1">Monitor antrian pesanan & efisiensi penyajian · FIFO.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-muted/20 p-1 rounded-2xl border w-fit">
          {[
            { key: 'all', label: `Semua`, count: orders.length },
            { key: 'new', label: `🆕 Baru`, count: counts.new, color: 'text-blue-600' },
            { key: 'cooking', label: `🔥 Masak`, count: counts.cooking, color: 'text-amber-600' },
            { key: 'ready', label: `✅ Siap`, count: counts.ready, color: 'text-emerald-600' },
          ].map(f => (
            <Button 
              key={f.key} variant={filter === f.key ? "secondary" : "ghost"} 
              className={cn("h-10 px-4 font-bold rounded-xl", filter === f.key && "bg-background shadow-sm")}
              onClick={() => setFilter(f.key)}
            >
              {f.label} <span className={cn("ml-2 px-2 py-0.5 rounded-full bg-muted text-[10px]", f.color)}>{f.count}</span>
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-40">
           <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-4xl">🎉</div>
           <div>
              <p className="text-2xl font-black">Antrian Bersih!</p>
              <p className="text-sm font-medium">Semua pesanan telah disajikan kepada pelanggan.</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.kdsStatus];
            if (!cfg) return null;
            const Icon = cfg.icon;
            const BtnIcon = cfg.btnIcon;
            
            return (
              <Card key={order.id} className={cn(
                "border-none shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02]",
                order.kdsStatus === 'new' ? "bg-card ring-2 ring-blue-500/20" : "bg-card"
              )}>
                {/* Status Header */}
                <div className={cn("p-4 flex items-center justify-between border-b", cfg.bg)}>
                   <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-lg bg-background/80 shadow-sm", cfg.color)}>
                         <Icon size={16} />
                      </div>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", cfg.color)}>{cfg.label}</span>
                   </div>
                   <WaitTime since={order.paidAt || order.createdAt} />
                </div>

                {/* Order Meta */}
                <div className="p-4 border-b bg-muted/5 space-y-3">
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none">Order ID</p>
                         <h4 className="text-lg font-black mt-1">#{order.id.toString().slice(-4)}</h4>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none">Lokasi</p>
                         <h4 className="text-lg font-black mt-1 text-accent">{order.tableType || 'T. Away'}</h4>
                      </div>
                   </div>
                   
                   <div className="flex items-center justify-between p-2 rounded-xl bg-background border shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                         <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User size={12} className="text-muted-foreground" />
                         </div>
                         <p className="text-xs font-bold truncate">{order.customerName || 'Pelanggan'}</p>
                      </div>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-muted uppercase text-muted-foreground tracking-tighter shrink-0">
                         {order.type === 'Self Order' ? 'Ditempat' : 'Kasir'}
                      </span>
                   </div>
                </div>

                {/* Items List */}
                <CardContent className="p-4 flex-1 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                   {order.items.map((item, i) => (
                     <div key={i} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="w-6 h-6 rounded-lg bg-accent text-white flex items-center justify-center text-xs font-black shrink-0">
                           {item.qty}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-black leading-tight text-primary">{item.name}</p>
                           {item.note && (
                             <p className="text-[10px] text-amber-600 font-bold italic mt-1 flex items-center gap-1 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                <ClipboardList size={10} /> {item.note}
                             </p>
                           )}
                        </div>
                     </div>
                   ))}

                   {order.note && (
                      <div className="mt-4 p-3 rounded-2xl bg-muted/40 border border-dashed border-muted-foreground/20">
                         <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Catatan Pesanan</p>
                         <p className="text-[11px] font-bold italic text-primary leading-relaxed">{order.note}</p>
                      </div>
                   )}
                </CardContent>

                {/* Action Footer */}
                <CardFooter className="p-4 border-t bg-muted/5">
                   <Button 
                    className={cn(
                      "w-full h-11 font-black shadow-lg transition-all active:scale-95 gap-2",
                      order.kdsStatus === 'new' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20" :
                      order.kdsStatus === 'cooking' ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white" :
                      "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                    )}
                    onClick={() => advance(order.id)}
                   >
                     <BtnIcon size={18} /> {cfg.btnLabel}
                   </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
