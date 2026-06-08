import React from 'react';
import { 
  ShoppingBag, Zap, RefreshCw, CheckCircle2, 
  ExternalLink, ArrowUpRight, BarChart3, 
  Store, Smartphone, Info, AlertTriangle,
  ChevronRight, MoreVertical, Search, Filter,
  History, Globe, Box, Truck, Timer, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "@/lib/utils";
import { useMarketplacePage, MARKETPLACE_SOURCES } from '../hooks/useMarketplacePage';

export default function MarketplacePage() {
  const {
    user,
    syncing,
    liveOrders,
    recentSyncs,
    handleSync
  } = useMarketplacePage();

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-700 font-mono tabular-nums">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2 py-1 bg-amber- border border-amber-500/20 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Omnichannel Hub</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">Gateway Online</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Omnichannel <span className="text-amber-500 italic">Marketplace</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">Real-time external order ingestion & cross-platform stock orchestration.</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-14 px-8 font-black uppercase tracking-widest text-[10px] bg-card border-border rounded-lg">
              <Settings size={18} className="mr-2" /> Global Config
           </Button>
           <Button 
             onClick={handleSync} 
             disabled={syncing}
             className="h-14 px-10 font-black uppercase tracking-widest text-white "
           >
             <RefreshCw size={18} className={cn(syncing && "animate-spin")} />
             {syncing ? 'SYNCING DATA...' : 'FORCE SYNC ENGINE'}
           </Button>
        </div>
      </div>

      {/* Advanced Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'External Reach', val: '269', sub: 'Total Platform Orders', icon: Globe, color: 'text-foreground', bg: 'bg-background' },
          { label: 'Marketplace Rev', val: 'Rp 10.2M', sub: 'Gross Online Sales', icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-' },
          { label: 'Avg Logistics', val: '14m', sub: 'Pickup Readiness', icon: Truck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Fulfillment Rate', val: '98.4%', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        ].map((s, i) => (
          <Card key={i} className="group border-none bg-card shadow-sm hover:shadow-md transition-all rounded-lg overflow-hidden">
            <CardContent className="p-8 flex items-center justify-between">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">{s.label}</p>
                  <p className={cn("text-2xl font-black font-mono tabular-nums", s.color)}>{s.val}</p>
                  {s.sub && <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100  uppercase">{s.sub}</p>}
               </div>
               <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center border border-border group-hover:scale-110 transition-transform", s.bg)}>
                  <s.icon size={24} className={cn(s.color)} />
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
         {/* Marketplace Status Hub */}
         <div className="xl:col-span-8 space-y-8">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-4">
                  <Zap size={16} className="text-amber-500" /> Active Platform Connectors
               </h3>
               <Button variant="ghost" size="sm" className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Add Connection</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MARKETPLACE_SOURCES.map(source => (
                <Card key={source.id} className="border-none shadow-xl bg-card rounded-lg overflow-hidden relative group hover-lift">
                  <CardContent className="p-10 flex flex-col justify-between gap-8 h-full">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-background rounded-lg flex items-center justify-center text-4xl shadow-inner group-hover:rotate-6 transition-transform border border-border">
                          {source.icon}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black tracking-tighter uppercase">{source.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={cn("w-1.5 h-1.5 rounded-lg", source.status === 'connected' ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">{source.status}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background"><MoreVertical size={18} /></Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-background rounded-lg border border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 mb-1">Vol / Month</p>
                        <p className="text-xl font-black font-mono tabular-nums">{source.orders} TX</p>
                      </div>
                      <div className="p-6 bg-amber- rounded-lg border border-amber-500/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Avg Margin</p>
                        <p className="text-xl font-black text-amber-500 font-mono tabular-nums">{source.margin}</p>
                      </div>
                    </div>

                    <Button 
                      variant={source.status === 'connected' ? "outline" : "default"}
                      className={cn("w-full h-14 rounded-lg font-black text-[10px] uppercase tracking-[0.3em] transition-all", source.status === 'connected' ? "border-border hover:bg-background" : "bg-zinc-950 text-zinc-900 dark:text-zinc-100 dark:bg-amber-500 dark:text-zinc-950 shadow-lg")}
                    >
                      {source.status === 'connected' ? 'MANAGE GATEWAY' : 'AUTHENTICATE NODE'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Live Order Feed Simulation */}
            <Card className="border-none ">
               <div className="absolute top-0 right-0 p-12  pointer-events-none">
                  <Timer size={160} />
               </div>
               <CardHeader className="p-12 pb-0 relative z-10">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter">Live Order <span className="text-amber-500 italic">Feed</span></CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Real-time external ingestion pulse</CardDescription>
                     </div>
                     <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Listening...</span>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-12 relative z-10 space-y-6">
                  {liveOrders.map(order => (
                     <div key={order.id} className="flex flex-col md:flex-row items-center justify-between p-8 bg-background/5 border border-white/5 rounded-lg group hover:border-amber-500/30 transition-all gap-6">
                        <div className="flex items-center gap-8">
                           <div className="w-16 h-16 ">
                              {order.source === 'GoFood' ? '🛵' : '🚴'}
                           </div>
                           <div>
                              <p className="text-xl font-black tracking-tight uppercase">{order.id}</p>
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{order.source} &bull; {order.time}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-10">
                           <div className="text-right">
                              <p className="text-sm font-black font-mono tabular-nums text-amber-500">Rp {order.total.toLocaleString('id-ID')}</p>
                              <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Paid-External</span>
                           </div>
                           <div className={cn(
                             "px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                             order.status === 'preparing' ? "bg-amber- text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                           )}>
                              {order.status}
                           </div>
                           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background/10 text-zinc-900 dark:text-zinc-100">
                              <ChevronRight size={20} />
                           </Button>
                        </div>
                     </div>
                  ))}
               </CardContent>
            </Card>
         </div>

         {/* Side Activity & Insights */}
         <div className="xl:col-span-4 space-y-8 sticky top-24">
            <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
               <CardHeader className="p-8 border-b border-border bg-background">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-background border border-border rounded-lg flex items-center justify-center">
                        <History size={20} className="text-foreground" />
                     </div>
                     <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tighter">Sync Archive</CardTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">Log Connectivity Events</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-8">
                  <div className="space-y-8">
                    {recentSyncs.map((sync, i) => (
                      <div key={sync.id} className="flex gap-4 group relative">
                        {i !== recentSyncs.length - 1 && <div className="absolute left-6 top-10 bottom-[-32px] w-0.5 bg-border/50 group-last:hidden" />}
                        <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center shrink-0 z-10 border border-border group-hover:">
                           {sync.source === 'GoFood' ? '🛵' : sync.source === 'GrabFood' ? '🚴' : '🧡'}
                        </div>
                        <div className="flex-1 pt-1">
                           <div className="flex justify-between items-start">
                              <p className="text-sm font-black uppercase tracking-tight">{sync.source}</p>
                              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100">{sync.time}</span>
                           </div>
                           <p className="text-[11px] text-zinc-500 dark:text-zinc-100 mt-1 font-medium italic">Ingestion of {sync.items} external nodes successful.</p>
                           <div className="mt-2 flex items-center gap-2">
                              <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">NODE_ACKNOWLEDGED</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </CardContent>
               <CardFooter className="p-8 bg-background border-t border-border justify-center">
                  <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 hover:text-foreground">VIEW EXTENDED LOGS</Button>
               </CardFooter>
            </Card>

            <div className="p-10 ">
               <div className="absolute top-0 right-0 p-8  group-hover/promo:rotate-12 transition-transform duration-500">
                  <Sparkles size={120} />
               </div>
               <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1 ">AI Suggestion</div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Optimize <span className="italic">Menu Mapping</span></h4>
                  <p className="text-sm font-bold  leading-relaxed uppercase">
                    Terdeteksi perbedaan penamaan menu antara GoFood & BrewMaster. Klik untuk sinkronisasi otomatis menggunakan Neural Mapping.
                  </p>
               </div>
               <Button className="w-full h-14 ">
                  AUTO-MAP NOW
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}

function Settings({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}
