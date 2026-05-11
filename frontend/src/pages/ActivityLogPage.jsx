import { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, User, 
  Search, Filter, Calendar, 
  ChevronRight, RefreshCw, AlertCircle,
  LogIn, DollarSign, Trash2, Settings, Download, Printer, FileText
} from 'lucide-react';
import { printReport, downloadPDF, downloadCSV } from '../utils/reportPrinter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetch(`${API_BASE}/system-logs`).then(r => r.json());
      setLogs(data || []);
    } catch (e) {
      console.error('Failed to load logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'LOGIN': return <LogIn size={16} className="text-emerald-500" />;
      case 'PRICE_CHANGE': return <DollarSign size={16} className="text-amber-500" />;
      case 'ORDER_DELETE': return <Trash2 size={16} className="text-destructive" />;
      default: return <Settings size={16} className="text-primary" />;
    }
  };

  const filtered = logs.filter(log => {
    const matchSearch = log.user_name?.toLowerCase().includes(search.toLowerCase()) || 
                      log.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || log.activity_type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitor Aktivitas</h2>
          <p className="text-muted-foreground mt-1 text-sm">Pusat audit keamanan dan pemantauan tindakan user secara real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-11 font-bold gap-2" onClick={() => downloadCSV('activity-log', 'month')}>
            <FileText size={18} /> Excel
          </Button>
          <Button variant="outline" className="h-11 font-bold gap-2" onClick={() => downloadPDF('activity-log', 'month')}>
            <Download size={18} /> PDF
          </Button>
          <Button className="h-11 font-bold gap-2 bg-accent shadow-lg" onClick={() => printReport('activity-log', 'month')}>
            <Printer size={18} /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Log', value: logs.length, icon: ShieldCheck, color: 'text-primary' },
          { label: 'Security Alerts', value: logs.filter(l => l.activity_type === 'ORDER_DELETE').length, icon: ShieldAlert, color: 'text-destructive' },
          { label: 'Login Hari Ini', value: logs.filter(l => l.activity_type === 'LOGIN' && new Date(l.created_at).toDateString() === new Date().toDateString()).length, icon: User, color: 'text-emerald-600' },
          { label: 'Perubahan Harga', value: logs.filter(l => l.activity_type === 'PRICE_CHANGE').length, icon: DollarSign, color: 'text-amber-600' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-md">
            <CardContent className="p-6 flex items-center gap-4">
               <div className={cn("w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center", stat.color)}>
                  <stat.icon size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value}</p>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl shadow-sm border border-muted/20">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              className="pl-12 h-12 rounded-xl border-none bg-muted/20 focus:ring-accent" 
              placeholder="Cari user atau aktivitas..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <select 
          className="h-12 px-4 rounded-xl border-none bg-muted/20 font-bold text-sm min-w-[180px] w-full sm:w-auto"
          value={filter} 
          onChange={e => setFilter(e.target.value)}
         >
           <option value="ALL">Semua Aktivitas</option>
           <option value="LOGIN">Login / Akses</option>
           <option value="PRICE_CHANGE">Perubahan Harga</option>
           <option value="ORDER_DELETE">Hapus Transaksi</option>
         </select>
      </div>

      <Card className="border-none shadow-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b">
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Tipe Aktivitas</th>
                <th className="px-6 py-4">Deskripsi Kejadian</th>
                <th className="px-6 py-4">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((log, i) => (
                <tr key={log.id} className="hover:bg-muted/10 transition-colors group">
                  <td className="px-6 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('id-ID', { 
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' 
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-black text-[10px]">
                        {log.user_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{log.user_name}</p>
                        <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{log.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {getIcon(log.activity_type)}
                       <span className="text-[10px] font-black uppercase tracking-widest">{log.activity_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-sm text-primary/80">
                    {log.description}
                  </td>
                  <td className="px-6 py-4 text-[10px] font-mono text-muted-foreground">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-24 text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="font-black text-xl opacity-20">Belum Ada Aktivitas Terdeteksi</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
