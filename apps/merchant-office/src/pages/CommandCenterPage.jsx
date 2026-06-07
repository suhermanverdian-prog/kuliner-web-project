import React from 'react';
import { 
  Shield, Activity, Globe, Zap, 
  TrendingUp, Users, AlertTriangle, 
  CheckCircle2, RefreshCw, Server, 
  Database, HardDrive, Cpu, 
  Map as MapIcon, Terminal, 
  Eye, Lock, BarChart3, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { useCommandCenterPage } from '../hooks/useCommandCenterPage';

export default function CommandCenterPage() {
  const {
    stats,
    liveFeed,
    loading,
    fetchGlobalData
  } = useCommandCenterPage();

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4 bg-background text-foreground font-mono tabular-nums">
      <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Command Center Nodes...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 min-h-screen transition-colors duration-300 bg-background text-foreground">
      {/* Top Header - Glassmorphic */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Master Node</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-lg " />
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">Global Network Online</span>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-4">
            COMMAND <span className="text-amber-500 italic">CENTER</span>
            <Activity className="text-zinc-500 dark:text-zinc-100/30 animate-pulse" size={32} />
          </h1>
          <p className="text-zinc-500 dark:text-zinc-100 text-sm font-medium mt-1">Real-time Enterprise Oversight & Global Node Analytics.</p>
        </div>
        <div className="flex items-center gap-4 bg-background p-2 rounded-lg border border-border">
            <div className="px-4 py-2 text-center border-r border-border">
                <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Uptime</p>
                <p className="text-lg font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{stats.serverUptime}</p>
            </div>
            <div className="px-4 py-2 text-center">
                <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Latency</p>
                <p className="text-lg font-black font-mono tabular-nums text-amber-500">{stats.latency}</p>
            </div>
            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-lg bg-background hover:bg-background active:scale-95 transition-all" onClick={fetchGlobalData}><RefreshCw size={20} className="text-amber-500" /></Button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Enterprise Nodes', val: stats.totalTenants, sub: `${stats.activeTenants} Active Nodes`, icon: Globe, color: 'text-foreground' },
          { label: 'Active Concurrent Users', val: stats.onlineUsers, sub: 'Real-time Sessions', icon: Users, color: 'text-amber-500' },
          { label: 'Global Gross Revenue', val: `Rp ${(stats.globalRevenue / 1000000).toFixed(1)}M`, sub: '+12.5% from last month', icon: TrendingUp, color: 'text-amber-500' },
          { label: 'Security Protocols', val: 'Active', sub: 'AI Face Match: 100%', icon: Shield, color: 'text-zinc-500 dark:text-zinc-100' },
        ].map((m, i) => (
          <Card key={i} className="bg-card border-border hover:border-amber-500/30 transition-all shadow-2xl overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <m.icon size={120} />
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg bg-background border border-border", m.color)}>
                  <m.icon size={20} />
                </div>
                <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest italic">Live Monitor</div>
              </div>
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-widest mb-1">{m.label}</p>
              <h3 className={cn("text-3xl font-black font-mono tabular-nums", m.color)}>{m.val}</h3>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-100 mt-2 flex items-center gap-1.5">
                <Zap size={12} className="text-amber-500" /> {m.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Live Feed - Ticker Style */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="bg-card border-border shadow-2xl h-[600px] flex flex-col">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Live Traffic Feed</CardTitle>
                    <CardDescription className="text-[10px] text-zinc-500 dark:text-zinc-100 font-bold">System, Security & Sales Events</CardDescription>
                  </div>
                  <div className="w-2 h-2 rounded-lg " />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0 no-scrollbar">
                <div className="divide-y divide-border">
                   {liveFeed.map((item) => (
                     <div key={item.id} className="p-4 hover:bg-background transition-colors flex gap-4 animate-in slide-in-from-top-4 duration-500">
                        <div className={cn("w-10 h-10 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border", item.color)}>
                           <item.icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={cn("text-[9px] font-black uppercase tracking-widest", item.color)}>{item.type}</span>
                              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-100 font-mono tabular-nums">{item.time}</span>
                           </div>
                           <p className="text-xs font-bold text-foreground truncate">{item.msg}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </CardContent>
              <div className="p-4 border-t border-border bg-background">
                  <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest border-border hover:bg-background h-8">View All Audit Logs</Button>
              </div>
           </Card>
        </div>

        {/* Global Analytics Drills */}
        <div className="lg:col-span-8 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-card border-border shadow-2xl">
                 <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Infra Performance</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-6">
                    {[
                      { label: 'CPU Usage', val: 12, icon: Cpu, color: 'bg-amber-500' },
                      { label: 'Memory Usage', val: 45, icon: HardDrive, color: 'bg-zinc-500' },
                      { label: 'DB Connections', val: 78, icon: Database, color: 'bg-emerald-500' },
                    ].map((s, i) => (
                      <div key={i} className="space-y-2">
                         <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                               <s.icon size={14} className="text-zinc-500 dark:text-zinc-100" />
                               <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">{s.label}</span>
                            </div>
                            <span className="text-xs font-black font-mono tabular-nums text-foreground">{s.val}%</span>
                         </div>
                         <div className="h-1.5 bg-background rounded-lg overflow-hidden">
                            <div className={cn("h-full rounded-lg transition-all duration-1000", s.color)} style={{ width: `${s.val}%` }} />
                         </div>
                      </div>
                    ))}
                 </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-2xl">
                 <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Revenue Growth</CardTitle>
                 </CardHeader>
                 <CardContent className="flex flex-col items-center justify-center py-10">
                    <div className="relative w-32 h-32">
                       <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path className="text-muted/20" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                          <path className="text-amber-500" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-black font-mono tabular-nums">75%</span>
                          <span className="text-[8px] font-black uppercase text-zinc-500 dark:text-zinc-100">Target</span>
                       </div>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 mt-6 uppercase tracking-widest text-center">Annual Recurring Revenue Goal</p>
                 </CardContent>
              </Card>
           </div>

           {/* Security Feed Summary */}
           <Card className="bg-card border-border shadow-2xl">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Global Security Matrix</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-border divide-y md:divide-y-0">
                    {[
                      { label: 'AI Verifications', val: '14,205', status: 'Optimal', icon: Shield, color: 'text-emerald-600 dark:text-emerald-400' },
                      { label: 'Failed Attempts', val: '12', status: 'Blocked', icon: Lock, color: 'text-rose-600 dark:text-rose-400' },
                      { label: 'Audit Logs', val: '2.5M+', status: 'Archived', icon: Terminal, color: 'text-zinc-500' },
                    ].map((m, i) => (
                      <div key={i} className="p-6 space-y-4">
                         <div className="flex items-center justify-between">
                            <m.icon size={20} className={m.color} />
                            <div className="px-2 py-0.5 bg-background text-[8px] font-black uppercase text-zinc-500 dark:text-zinc-100 rounded tracking-widest">{m.status}</div>
                         </div>
                         <div>
                            <h4 className="text-2xl font-black font-mono tabular-nums">{m.val}</h4>
                            <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-widest mt-1">{m.label}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
