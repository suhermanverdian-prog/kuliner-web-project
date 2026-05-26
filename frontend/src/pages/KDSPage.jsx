import React, { useState, useEffect } from 'react';
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
import { useKDSPage } from '../hooks/useKDSPage';

const STATUS_CONFIG = {
  new:     { 
    label: 'Pesanan Baru', 
    color: 'text-amber-500 dark:text-amber-400', 
    bg: 'bg-amber-50 dark:bg-amber-950/30', 
    border: 'border-amber-200 dark:border-amber-800', 
    icon: Bell, 
    btnLabel: 'Mulai Masak', 
    btnIcon: Flame, 
    next: 'cooking' 
  },
  cooking: { 
    label: 'Sedang Dimasak', 
    color: 'text-amber-600 dark:text-amber-400', 
    bg: 'bg-amber-50 dark:bg-amber-950/30', 
    border: 'border-amber-200 dark:border-amber-800', 
    icon: Flame, 
    btnLabel: 'Selesaikan', 
    btnIcon: CheckCircle2, 
    next: 'ready' 
  },
  ready:   { 
    label: 'Siap Saji', 
    color: 'text-emerald-600 dark:text-emerald-400', 
    bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
    border: 'border-emerald-200 dark:border-emerald-800', 
    icon: CheckCircle2, 
    btnLabel: 'Sudah Disajikan', 
    btnIcon: Utensils, 
    next: 'served' 
  },
};

function WaitTime({ since }) {
  const [mins, setMins] = useState(0);
  useEffect(() => {
    const calc = () => setMins(Math.floor((Date.now() - new Date(since).getTime()) / 60000));
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [since]);
  
  const color = mins < 5 ? "text-amber-500 dark:text-amber-400" : mins < 10 ? "text-amber-600 dark:text-amber-500" : "text-rose-600 dark:text-rose-400 dark:text-rose-400";
  
  return (
    <div className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg bg-card border border-border shadow-lg", color)}>
      <Timer size={14} className="animate-pulse font-mono tabular-nums" />
      <span className="font-mono tabular-nums text-[11px] font-black uppercase tracking-[0.2em]">{mins}m</span>
    </div>
  );
}

export default function KDSPage() {
  const {
    orders: safeOrders,
    filter, setFilter,
    loading,
    filtered,
    counts,
    advance
  } = useKDSPage();

  if (loading && safeOrders.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-amber-500 dark:border-amber-400 border-t-transparent rounded-lg animate-spin" />
      <p className="text-zinc-500 dark:text-zinc-100 animate-pulse font-medium">Sinkronisasi pesanan dapur...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 min-h-screen">
      {/* Header - Sleek Premium Omnichannel Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2.5 py-1 bg-card border border-border rounded-sm text-[9px] font-black text-amber-500 uppercase tracking-widest">Kitchen Operations</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">FIFO Engine Active</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Kitchen <span className="text-amber-500 italic">Display</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">High-velocity preparation matrix & real-time FIFO culinary orchestration.</p>
        </div>
      </div>
      
      {/* Filter Navigation Row - Full Width with Horizontal Scroll Prevention */}
      <div className="flex flex-row items-center justify-start overflow-x-auto flex-nowrap gap-2 bg-background p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 backdrop-blur-2xl custom-scrollbar">
        {[
          { key: 'all', label: 'Semua', count: safeOrders.length, icon: ClipboardList, color: 'text-zinc-500 dark:text-zinc-400' },
          { key: 'new', label: 'Baru', count: counts.new, icon: Bell, color: 'text-amber-500 dark:text-amber-400' },
          { key: 'cooking', label: 'Masak', count: counts.cooking, icon: Flame, color: 'text-amber-600 dark:text-amber-400' },
          { key: 'ready', label: 'Siap', count: counts.ready, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(f => {
          const Icon = f.icon;
          const isSelected = filter === f.key;
          return (
            <Button 
              key={f.key}
              variant="ghost"
              className={cn(
                "h-10 px-4 font-bold rounded-md transition-all shrink-0 active:scale-95 flex items-center gap-2",
                isSelected 
                  ? "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-md" 
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
              onClick={() => setFilter(f.key)}
            >
              <Icon size={14} className={cn("transition-colors", isSelected ? "text-white dark:text-zinc-900" : f.color)} />
              <span>{f.label}</span>
              <span className={cn(
                "ml-1 px-2 py-0.5 rounded-lg text-[10px] font-black font-mono tabular-nums transition-colors",
                isSelected
                  ? "bg-white/20 text-white dark:bg-zinc-900/15 dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800/80 " + f.color
              )}>
                {f.count}
              </span>
            </Button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 ">
           <div className="w-24 h-24 bg-background border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center text-amber-500">
             <ChefHat size={48} strokeWidth={1.5} />
           </div>
           <div>
              <p className="text-2xl font-black animate-pulse">Antrian Dapur Bersih!</p>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Semua pesanan telah disajikan kepada pelanggan.</p>
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
                "border border-border shadow-xl overflow-hidden flex flex-col transition-all duration-300 rounded-lg hover:scale-[1.02] active:scale-[0.98]",
                order.kdsStatus === 'new' ? "bg-card ring-2 ring-primary/20" : "bg-card"
              )}>
                {/* Status Header */}
                <div className={cn("p-4 flex items-center justify-between border-b", cfg.bg)}>
                   <div className="flex items-center gap-2">
                      <div className={cn("p-2 rounded-md bg-background/80 shadow-sm", cfg.color)}>
                         <Icon size={16} />
                      </div>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", cfg.color)}>{cfg.label}</span>
                   </div>
                   <WaitTime since={order.paidAt || order.createdAt} />
                </div>

                {/* Order Meta */}
                <div className="p-4 border-b bg-background space-y-3">
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-[9px] text-zinc-500 dark:text-zinc-100 font-black uppercase tracking-widest leading-none">Order Reference</p>
                         <h4 className="font-mono tabular-nums text-xl font-black mt-2 text-zinc-900 dark:text-zinc-100 uppercase italic">#{order.id.toString().slice(-4)}</h4>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] text-zinc-500 dark:text-zinc-100 font-black uppercase tracking-widest leading-none">Zone</p>
                         <h4 className="text-xl font-black mt-2 text-primary uppercase italic tracking-tighter">{order.tableType || 'T. Away'}</h4>
                      </div>
                   </div>
                   
                   <div className="flex items-center justify-between p-2 rounded-lg bg-background border shadow-inner">
                      <div className="flex items-center gap-2 min-w-0">
                         <div className="w-6 h-6 rounded-lg bg-background flex items-center justify-center shrink-0">
                            <User size={12} className="text-zinc-500 dark:text-zinc-100" />
                         </div>
                         <p className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">{order.customerName || 'Pelanggan'}</p>
                      </div>
                      <span className="font-mono tabular-nums text-[8px] font-black px-2.5 py-1 rounded-sm bg-background uppercase text-zinc-500 dark:text-zinc-100 tracking-tighter shrink-0">
                         {order.type === 'Self Order' ? 'Ditempat' : 'Kasir'}
                      </span>
                   </div>
                </div>

                {/* Items List */}
                <CardContent className="p-4 flex-1 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                   {order.items.map((item, i) => (
                     <div key={i} className="flex gap-4 items-start animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="font-mono tabular-nums w-6 h-6 rounded-md bg-primary text-zinc-900 dark:text-zinc-100 dark:text-zinc-950 flex items-center justify-center text-xs font-black shrink-0">
                           {item.qty}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-black leading-tight text-zinc-900 dark:text-zinc-100">{item.name}</p>
                           {item.note && (
                             <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold italic mt-1 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded border border-amber-500/10">
                                <ClipboardList size={10} /> {item.note}
                             </p>
                           )}
                        </div>
                     </div>
                   ))}

                   {order.note && (
                      <div className="mt-4 p-4 rounded-lg bg-background border border-dashed border-border">
                         <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest mb-1">Catatan Pesanan</p>
                         <p className="text-[11px] font-bold italic text-zinc-900 dark:text-zinc-100 leading-relaxed">{order.note}</p>
                      </div>
                   )}
                </CardContent>

                {/* Action Footer */}
                <CardFooter className="p-4 border-t bg-background">
                   <Button 
                    className={cn(
                      "w-full h-12 font-black shadow-lg transition-all active:scale-95 gap-2 rounded-lg",
                      order.kdsStatus === 'new' && "bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-zinc-900 shadow-amber-500/20",
                      order.kdsStatus === 'cooking' && "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-zinc-900 shadow-emerald-500/20",
                      order.kdsStatus === 'ready' && "bg-zinc-900 hover:bg-amber-500 text-white dark:bg-zinc-100 dark:hover:bg-amber-400 dark:text-zinc-900 shadow-zinc-900/20"
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
