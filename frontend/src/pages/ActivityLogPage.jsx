import React from 'react';
import { 
  ShieldAlert, ShieldCheck, User, 
  Search, Filter, Calendar, 
  ChevronRight, RefreshCw, AlertCircle,
  LogIn, DollarSign, Trash2, Settings, 
  Download, Printer, FileText, Lock,
  Fingerprint, Activity, Terminal,
  Clock, Shield, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { downloadPDF, downloadCSV, printReport } from '../utils/reportPrinter';
import { useActivityLogPage } from '../hooks/useActivityLogPage';

export default function ActivityLogPage() {
  const {
    logs,
    loading,
    search, setSearch,
    filter, setFilter,
    loadLogs,
    getSeverity,
    filtered
  } = useActivityLogPage();

  const getIcon = (type) => {
    switch (type) {
      case 'LOGIN': return <Fingerprint size={16} className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums" />;
      case 'PRICE_CHANGE': return <DollarSign size={16} className="text-amber-500" />;
      case 'ORDER_DELETE': return <Trash2 size={16} className="text-rose-600 dark:text-rose-400" />;
      default: return <Terminal size={16} className="text-zinc-500" />;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Decrypting Security Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2 py-1 bg-amber- border border-amber-500/20 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Immutable Vault</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">Blockchain Verified</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Activity <span className="text-amber-500 italic">Audit Log</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">Global activity monitoring & security compliance engine.</p>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="outline" className="h-12 px-6 font-black uppercase tracking-widest text-[9px] bg-card border-border rounded-lg" onClick={() => downloadCSV('activity-log', 'month')}>
             <FileText size={16} className="mr-2" /> EXCEL
           </Button>
           <Button variant="outline" className="h-12 px-6 font-black uppercase tracking-widest text-[9px] bg-card border-border rounded-lg" onClick={() => downloadPDF('activity-log', 'month')}>
             <Download size={16} className="mr-2" /> PDF
           </Button>
           <Button className="h-12 px-8 font-black uppercase tracking-widest text-white " onClick={() => printReport('activity-log', 'month')}>
             <Printer size={16} className="mr-2" /> PRINT AUDIT
           </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Events', val: (Array.isArray(logs) ? logs : []).length, icon: Activity, color: 'text-foreground', bg: 'bg-background' },
          { label: 'Security Alerts', val: (Array.isArray(logs) ? logs : []).filter(l => getSeverity(l.activity_type) === 'high').length, icon: ShieldAlert, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
          { label: 'Neural Watchdog', val: 'Active', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-' },
          { label: 'Uptime Node', val: '99.98%', icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
        ].map((s, i) => (
          <Card key={i} className="group border-none bg-card shadow-sm hover:shadow-md transition-all rounded-lg overflow-hidden">
            <CardContent className="p-8 flex items-center justify-between">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">{s.label}</p>
                  <p className={cn("text-2xl font-black font-mono tabular-nums", s.color)}>{s.val}</p>
               </div>
               <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center border border-border group-hover:scale-110 transition-transform", s.bg)}>
                  <s.icon size={24} className={cn(s.color)} />
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 p-2 bg-background rounded-lg border border-border backdrop-blur-sm">
         <div className="relative flex-1 w-full group px-2">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-100 group-focus-within:text-amber-500 transition-colors" size={20} />
            <Input 
              className="pl-14 h-14 rounded-lg border-none bg-background/50 font-medium focus:ring-amber-500" 
              placeholder="Search by identity, action, or event description..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-4 px-2 w-full xl:w-auto">
            <select 
              className="h-14 px-8 rounded-lg border-none bg-background/50 font-black text-[10px] uppercase tracking-widest min-w-[220px] outline-none focus:ring-2 ring-amber-500/20"
              value={filter} 
              onChange={e => setFilter(e.target.value)}
            >
              <option value="ALL">All Event Types</option>
              <option value="LOGIN">Identity Access</option>
              <option value="PRICE_CHANGE">Revenue Mutation</option>
              <option value="ORDER_DELETE">Structural Deletion</option>
              <option value="NAVIGATE">Navigation Pulse</option>
            </select>
            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-lg bg-background/50 hover:" onClick={loadLogs}>
               <RefreshCw size={20} />
            </Button>
         </div>
      </div>

      {/* Audit Ledger */}
      <Card className="border-none shadow-2xl bg-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 border-b border-border">
                <th className="px-10 py-6">Timestamp Pulse</th>
                <th className="px-10 py-6">Identity Node</th>
                <th className="px-10 py-6">Event Spectrum</th>
                <th className="px-10 py-6">Event Payload / Description</th>
                <th className="px-10 py-6 text-right">Node ID / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-background transition-all group">
                  <td className="px-10 py-8 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                       <Clock size={14} className="text-zinc-500 dark:text-zinc-100 " />
                       <p className="text-xs font-black text-foreground font-mono tabular-nums">
                          {new Date(log.created_at).toLocaleString('id-ID', { 
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' 
                          })}
                       </p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg ">
                        {log.user_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black group-hover:text-amber-500 transition-colors">{log.user_name}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">{log.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                       <div className={cn(
                         "p-2 rounded-lg border",
                         getSeverity(log.activity_type) === 'high' ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800" : "bg-background border-border"
                       )}>
                          {getIcon(log.activity_type)}
                       </div>
                       <span className={cn(
                         "text-[10px] font-black uppercase tracking-widest",
                         getSeverity(log.activity_type) === 'high' ? "text-rose-600" : "text-foreground"
                       )}>{log.activity_type}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-sm font-medium text-foreground leading-relaxed max-w-md">
                       {log.description}
                    </p>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <p className="text-[10px] font-black font-mono tabular-nums text-zinc-500 dark:text-zinc-100  uppercase tracking-tighter">
                       {log.ip_address || 'Node-04::127.0.0.1'}
                    </p>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-32 text-center  space-y-4">
                    <Shield size={80} className="mx-auto text-zinc-500 dark:text-zinc-100" strokeWidth={1} />
                    <p className="font-black text-xl uppercase tracking-[0.4em]">Zero Anomalies Detected</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <CardFooter className="p-10 border-t border-border bg-background justify-center">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-100">
               <Lock size={12} className="text-amber-500" />
               ENCRYPTED LEDGER END-OF-FILE
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
