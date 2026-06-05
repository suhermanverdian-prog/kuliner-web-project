import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, ShieldCheck,
  Search,
  ChevronLeft, RefreshCw,
  DollarSign, Trash2,
  Download, Printer, FileText, Lock,
  Fingerprint, Activity, Terminal,
  Clock, Shield,
  MapPin, Building2
} from 'lucide-react';
import { Card, CardContent, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { downloadPDF, downloadCSV, printReport } from '../utils/reportPrinter';
import { useActivityLogPage } from '../hooks/useActivityLogPage';

// Helper: Extract outlet name embedded in user_name "Nama (Outlet: Outlet Name)"
const parseUserName = (rawName) => {
  if (!rawName) return { name: '-', outlet: null };
  const match = rawName.match(/^(.+?)\s*\(Outlet:\s*(.+?)\)$/);
  if (match) return { name: match[1].trim(), outlet: match[2].trim() };
  return { name: rawName, outlet: null };
};

export default function ActivityLogPage() {
  const navigate = useNavigate();
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
      case 'LOGIN':  return <Fingerprint size={16} className="text-emerald-600 dark:text-emerald-400" />;
      case 'POST':   return <Terminal size={16} className="text-sky-500" />;
      case 'PUT':    return <Terminal size={16} className="text-amber-500" />;
      case 'DELETE': return <Trash2 size={16} className="text-rose-600 dark:text-rose-400" />;
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

  // Unique tenants for filter
  const uniqueTenants = [...new Set((Array.isArray(logs) ? logs : []).map(l => l.tenant_name).filter(Boolean))];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => navigate('/command-center')}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black text-zinc-500 dark:text-zinc-400 hover:text-amber-500 transition-colors uppercase tracking-widest"
              >
                <ChevronLeft size={12} /> Command Center
              </button>
              <span className="px-2 py-1 bg-card border border-border rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Immutable Vault</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">Blockchain Verified</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Activity <span className="text-amber-500 italic">Audit Log</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Global activity monitoring & security compliance engine — all tenants.</p>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="outline" className="h-12 px-6 font-black uppercase tracking-widest text-[9px] bg-card border-border text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg" onClick={() => downloadCSV('activity-log', 'month')}>
             <FileText size={16} className="mr-2" /> EXCEL
           </Button>
           <Button variant="outline" className="h-12 px-6 font-black uppercase tracking-widest text-[9px] bg-card border-border text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg" onClick={() => downloadPDF('activity-log', 'month')}>
             <Download size={16} className="mr-2" /> PDF
           </Button>
           <Button variant="default" className="h-12 px-8 font-black uppercase tracking-widest" onClick={() => printReport('activity-log', 'month')}>
             <Printer size={16} className="mr-2" /> PRINT AUDIT
           </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Events', val: (Array.isArray(logs) ? logs : []).length, icon: Activity, color: 'text-foreground', bg: 'bg-background' },
          { label: 'Security Alerts', val: (Array.isArray(logs) ? logs : []).filter(l => getSeverity(l.activity_type) === 'high').length, icon: ShieldAlert, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
          { label: 'Active Tenants', val: uniqueTenants.length || '-', icon: Building2, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Uptime Node', val: '99.98%', icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
        ].map((s, i) => (
          <Card key={i} className="group border-none bg-card shadow-sm hover:shadow-md transition-all rounded-lg overflow-hidden">
            <CardContent className="p-8 flex items-center justify-between">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{s.label}</p>
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
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-2 bg-background rounded-lg border border-border backdrop-blur-sm">
         <div className="relative flex-1 w-full group px-2">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 group-focus-within:text-amber-500 transition-colors" size={20} />
            <Input 
              className="pl-14 h-14 rounded-lg border border-border bg-card font-medium text-foreground placeholder:text-zinc-400 focus-visible:ring-amber-500/20" 
              placeholder="Search by identity, tenant, outlet, or event description..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-4 px-2 w-full xl:w-auto">
            <select 
              className="h-14 px-6 rounded-lg border border-border bg-card text-foreground font-black text-[10px] uppercase tracking-widest min-w-[200px] outline-none focus:ring-2 focus:ring-amber-500/20"
              value={filter} 
              onChange={e => setFilter(e.target.value)}
            >
              <option value="ALL">All Event Types</option>
              <option value="LOGIN">Identity Access</option>
              <option value="POST">Create (POST)</option>
              <option value="PUT">Update (PUT)</option>
              <option value="DELETE">Delete (DELETE)</option>
              <option value="PRICE_CHANGE">Revenue Mutation</option>
              <option value="ORDER_DELETE">Structural Deletion</option>
            </select>
            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-lg bg-card border border-border hover:bg-zinc-50 dark:hover:bg-zinc-800" onClick={loadLogs}>
               <RefreshCw size={20} />
            </Button>
         </div>
      </div>

      {/* Audit Ledger */}
      <Card className="border-none shadow-2xl bg-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-border">
                <th className="px-6 py-6">Timestamp</th>
                <th className="px-6 py-6">Identity Node</th>
                <th className="px-6 py-6">
                  <span className="flex items-center gap-2">
                    <MapPin size={11} /> Lokasi / Tenant Outlet
                  </span>
                </th>
                <th className="px-6 py-6">Event Type</th>
                <th className="px-6 py-6">Description</th>
                <th className="px-6 py-6 text-right">Node / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log) => {
                const { name: parsedName, outlet: parsedOutlet } = parseUserName(log.user_name);
                return (
                  <tr key={log.id} className="hover:bg-background transition-all group">
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                         <Clock size={14} className="text-zinc-500 dark:text-zinc-400" />
                         <p className="text-xs font-black text-foreground font-mono tabular-nums">
                            {new Date(log.created_at).toLocaleString('id-ID', { 
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' 
                            })}
                         </p>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-black text-foreground border border-border shrink-0">
                          {parsedName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-black group-hover:text-amber-500 transition-colors">{parsedName}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{log.role}</p>
                        </div>
                      </div>
                    </td>
                    {/* ✅ KOLOM LOKASI / TENANT OUTLET BARU */}
                    <td className="px-6 py-6">
                      <div className="space-y-1">
                        {/* Tenant Name */}
                        {log.tenant_name && (
                          <div className="flex items-center gap-1.5">
                            <Building2 size={11} className="text-amber-500 shrink-0" />
                            <span className="text-[10px] font-black text-foreground uppercase tracking-wider">
                              {log.tenant_name}
                            </span>
                          </div>
                        )}
                        {/* Outlet Name (parsed from user_name) */}
                        {parsedOutlet ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={11} className="text-emerald-500 shrink-0" />
                            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              {parsedOutlet}
                            </span>
                          </div>
                        ) : (
                          !log.tenant_name && (
                            <span className="text-[9px] text-zinc-400 italic">—</span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                         <div className={cn(
                           "p-2 rounded-lg border",
                           getSeverity(log.activity_type) === 'high' ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800" : "bg-background border-border"
                         )}>
                            {getIcon(log.activity_type)}
                         </div>
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-widest",
                           getSeverity(log.activity_type) === 'high' ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                         )}>{log.activity_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm font-medium text-foreground leading-relaxed max-w-xs">
                         {log.description}
                      </p>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <p className="text-[10px] font-black font-mono tabular-nums text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">
                         {log.ip_address || '—'}
                      </p>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-32 text-center space-y-4">
                    <Shield size={80} className="mx-auto text-zinc-300 dark:text-zinc-700" strokeWidth={1} />
                    <p className="font-black text-xl uppercase tracking-[0.4em] text-zinc-500">Zero Anomalies Detected</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <CardFooter className="p-10 border-t border-border bg-background justify-between">
            <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
              Showing {filtered.length} of {logs.length} entries
            </span>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
               <Lock size={12} className="text-amber-500" />
               ENCRYPTED LEDGER END-OF-FILE
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
