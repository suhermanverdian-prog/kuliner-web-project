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

const EVENT_COLOR = {
  LOGIN:        'text-emerald-600 dark:text-emerald-400',
  DELETE:       'text-rose-600 dark:text-rose-400',
  ORDER_DELETE: 'text-rose-600 dark:text-rose-400',
  PUT:          'text-amber-500',
  PRICE_CHANGE: 'text-amber-500',
  POST:         'text-sky-500',
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
      case 'LOGIN':        return <Fingerprint size={14} className="text-emerald-600 dark:text-emerald-400" />;
      case 'DELETE':
      case 'ORDER_DELETE': return <Trash2 size={14} className="text-rose-600 dark:text-rose-400" />;
      case 'PRICE_CHANGE': return <DollarSign size={14} className="text-amber-500" />;
      default:             return <Terminal size={14} className="text-zinc-500" />;
    }
  };

  const getSeverityBadge = (type) => {
    const sev = getSeverity(type);
    if (sev === 'high') return 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    if (sev === 'low')  return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    return 'bg-background text-foreground border-border';
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Decrypting Security Ledger...</p>
    </div>
  );

  const uniqueTenants = [...new Set((Array.isArray(logs) ? logs : []).map(l => l.tenant_name).filter(Boolean))];

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">

      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumb row */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/command-center')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black text-zinc-500 dark:text-zinc-400 hover:text-amber-500 transition-colors uppercase tracking-widest"
          >
            <ChevronLeft size={11} /> Command Center
          </button>
          <span className="px-2 py-1 bg-card border border-border rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Immutable Vault</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">Live</span>
          </div>
        </div>

        {/* Title + action row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground uppercase leading-none">
              Activity <span className="text-amber-500 italic">Audit Log</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              Global monitoring & security compliance — all tenants.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="h-9 px-4 font-black uppercase tracking-widest text-[9px] bg-card border-border text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg" onClick={() => downloadCSV('activity-log', 'month')}>
              <FileText size={14} className="mr-1.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 font-black uppercase tracking-widest text-[9px] bg-card border-border text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg" onClick={() => downloadPDF('activity-log', 'month')}>
              <Download size={14} className="mr-1.5" /> PDF
            </Button>
            <Button size="sm" className="h-9 px-4 font-black uppercase tracking-widest text-[9px] text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900" onClick={() => printReport('activity-log', 'month')}>
              <Printer size={14} className="mr-1.5" /> Print
            </Button>
          </div>
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events',    val: (Array.isArray(logs) ? logs : []).length,                                                      icon: Activity,    color: 'text-foreground',                          bg: 'bg-background' },
          { label: 'Security Alerts', val: (Array.isArray(logs) ? logs : []).filter(l => getSeverity(l.activity_type) === 'high').length, icon: ShieldAlert, color: 'text-rose-600 dark:text-rose-400',         bg: 'bg-rose-50 dark:bg-rose-950/30' },
          { label: 'Active Tenants',  val: uniqueTenants.length || '—',                                                                   icon: Building2,   color: 'text-amber-500',                           bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Uptime Node',     val: '99.98%',                                                                                      icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400',   bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
        ].map((s, i) => (
          <Card key={i} className="group border-none bg-card shadow-sm hover:shadow-md transition-all rounded-lg overflow-hidden">
            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{s.label}</p>
                <p className={cn("text-xl font-black font-mono tabular-nums", s.color)}>{s.val}</p>
              </div>
              <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center border border-border group-hover:scale-110 transition-transform shrink-0", s.bg)}>
                <s.icon size={20} className={cn(s.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── CONTROL BAR ── */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-background rounded-lg border border-border">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-amber-500 transition-colors" size={16} />
          <Input
            className="pl-10 h-10 rounded-lg border border-border bg-card font-medium text-sm text-foreground placeholder:text-zinc-400 focus-visible:ring-amber-500/20"
            placeholder="Cari identitas, tenant, atau deskripsi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            className="h-10 px-3 rounded-lg border border-border bg-card text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-amber-500/20 flex-1 sm:flex-none sm:w-44"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="ALL">Semua Tipe</option>
            <option value="LOGIN">Login</option>
            <option value="POST">POST (Create)</option>
            <option value="PUT">PUT (Update)</option>
            <option value="DELETE">DELETE</option>
            <option value="PRICE_CHANGE">Price Change</option>
            <option value="ORDER_DELETE">Order Delete</option>
          </select>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg bg-card border border-border hover:bg-zinc-50 dark:hover:bg-zinc-800 shrink-0" onClick={loadLogs}>
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      {/* ── AUDIT LEDGER ── */}
      <Card className="border-none shadow-xl bg-card rounded-lg overflow-hidden">

        {/* MOBILE / TABLET  → stacked card list (hidden on xl+) */}
        <div className="xl:hidden divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Shield size={48} className="mx-auto text-zinc-300 dark:text-zinc-700" strokeWidth={1} />
              <p className="font-black text-sm uppercase tracking-[0.3em] text-zinc-500">Zero Anomalies Detected</p>
            </div>
          ) : (
            filtered.map((log) => {
              const { name: parsedName, outlet: parsedOutlet } = parseUserName(log.user_name);
              const isHigh = getSeverity(log.activity_type) === 'high';
              return (
                <div key={log.id} className={cn(
                  "p-4 space-y-3 hover:bg-background/50 transition-colors",
                  isHigh && "border-l-2 border-rose-500"
                )}>
                  {/* Top row: avatar + name + timestamp */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-foreground border border-border shrink-0">
                        {parsedName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-foreground truncate">{parsedName}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{log.role}</p>
                      </div>
                    </div>
                    <p className="text-[9px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Middle row: event badge + tenant/outlet */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest",
                      getSeverityBadge(log.activity_type)
                    )}>
                      {getIcon(log.activity_type)}
                      {log.activity_type}
                    </span>
                    {log.tenant_name && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase">
                        <Building2 size={10} /> {log.tenant_name}
                      </span>
                    )}
                    {parsedOutlet && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                        <MapPin size={10} /> {parsedOutlet}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-foreground/80 leading-relaxed">{log.description}</p>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP → compact table (shown on xl+) */}
        <div className="hidden xl:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 border-b border-border">
                <th className="px-4 py-4 w-36">Waktu</th>
                <th className="px-4 py-4">Identitas</th>
                <th className="px-4 py-4">Lokasi / Tenant</th>
                <th className="px-4 py-4 w-36">Event</th>
                <th className="px-4 py-4">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log) => {
                const { name: parsedName, outlet: parsedOutlet } = parseUserName(log.user_name);
                const isHigh = getSeverity(log.activity_type) === 'high';
                return (
                  <tr key={log.id} className={cn(
                    "hover:bg-background transition-all group",
                    isHigh && "border-l-2 border-rose-500"
                  )}>
                    {/* Timestamp */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-zinc-400 shrink-0" />
                        <span className="text-[10px] font-black font-mono tabular-nums text-foreground">
                          {new Date(log.created_at).toLocaleString('id-ID', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Identity */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-foreground border border-border shrink-0">
                          {parsedName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-xs font-black group-hover:text-amber-500 transition-colors leading-none">{parsedName}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-0.5">{log.role}</p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-4">
                      <div className="space-y-0.5">
                        {log.tenant_name && (
                          <div className="flex items-center gap-1">
                            <Building2 size={10} className="text-amber-500 shrink-0" />
                            <span className="text-[10px] font-black text-foreground uppercase tracking-wider truncate max-w-[140px]">{log.tenant_name}</span>
                          </div>
                        )}
                        {parsedOutlet && (
                          <div className="flex items-center gap-1">
                            <MapPin size={10} className="text-emerald-500 shrink-0" />
                            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase truncate max-w-[140px]">{parsedOutlet}</span>
                          </div>
                        )}
                        {!log.tenant_name && !parsedOutlet && (
                          <span className="text-[9px] text-zinc-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* Event */}
                    <td className="px-4 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] font-black uppercase tracking-widest",
                        getSeverityBadge(log.activity_type)
                      )}>
                        {getIcon(log.activity_type)}
                        {log.activity_type}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-4">
                      <p className="text-xs font-medium text-foreground leading-relaxed line-clamp-2 max-w-sm">
                        {log.description}
                      </p>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-24 text-center">
                    <Shield size={56} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" strokeWidth={1} />
                    <p className="font-black text-sm uppercase tracking-[0.3em] text-zinc-500">Zero Anomalies Detected</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <CardFooter className="px-4 py-4 border-t border-border bg-background justify-between">
          <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
            {filtered.length} / {logs.length} entries
          </span>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            <Lock size={10} className="text-amber-500" />
            Encrypted Ledger
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
