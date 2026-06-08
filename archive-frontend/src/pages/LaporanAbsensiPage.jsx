import React from 'react';
import { 
  Users, MapPin, Clock, Search, Filter, 
  ArrowUpRight, ArrowDownRight, MoreVertical,
  Calendar, Map as MapIcon, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from "../lib/utils";
import { useLaporanAbsensiPage } from '../hooks/useLaporanAbsensiPage';

export default function LaporanAbsensiPage({ user }) {
  const {
    logs,
    loading,
    search, setSearch,
    outletInfo,
    fetchLogs,
    filteredLogs
  } = useLaporanAbsensiPage();

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-mono tabular-nums">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black tracking-tight">Rekap Absensi Pegawai</h1>
           <p className="text-zinc-500 dark:text-zinc-100 mt-1 font-medium">Monitoring kehadiran dan validasi lokasi GPS real-time.</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="rounded-lg font-bold" onClick={fetchLogs}>
              Refresh Data
           </Button>
           <Button className="">Ekspor Laporan</Button>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Total Hadir', value: logs.filter(l => l.type === 'clock_in').length, icon: Users, color: 'text-blue-500' },
           { label: 'Tepat Waktu', value: logs.length, icon: ShieldCheck, color: 'text-green-500' },
           { label: 'Luar Area', value: logs.filter(l => l.distance_from_outlet > (outletInfo?.geofence_radius || 100)).length, icon: AlertTriangle, color: 'text-red-500' },
           { label: 'Rata-rata Jarak', value: `${Math.round(logs.reduce((acc, curr) => acc + (curr.distance_from_outlet || 0), 0) / (logs.length || 1))}m`, icon: MapPin, color: 'text-amber-500' }
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-xl bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                 <div className={cn("w-12 h-12 rounded-lg bg-background flex items-center justify-center", stat.color)}>
                    <stat.icon size={24} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black">{stat.value}</p>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <Card className="border-none shadow-xl bg-card">
        <CardHeader className="border-b bg-background">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg">Log Aktivitas Presensi</CardTitle>
              <div className="relative w-full md:w-80">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-100" size={16} />
                 <Input 
                   placeholder="Cari nama pegawai..." 
                   className="pl-10 h-10 rounded-lg bg-background border-none font-bold"
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                 />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b bg-background">
                       <th className="p-4 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Pegawai</th>
                       <th className="p-4 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Tipe</th>
                       <th className="p-4 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Waktu</th>
                       <th className="p-4 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Jarak</th>
                       <th className="p-4 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Status Area</th>
                       <th className="p-4 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest text-right">Lokasi</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y">
                    {filteredLogs.map((log, i) => (
                       <tr key={i} className="hover:bg-background transition-colors group">
                          <td className="p-4">
                             <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg ">
                                   {log.employee_name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                   <p className="text-sm font-bold">{log.employee_name}</p>
                                   <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-bold uppercase tracking-tighter">ID: {log.employee_id?.split('-')[0]}</p>
                                </div>
                             </div>
                          </td>
                          <td className="p-4">
                             <span className={cn(
                               "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                               log.type === 'clock_in' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                             )}>
                                {log.type === 'clock_in' ? 'Check In' : 'Check Out'}
                             </span>
                          </td>
                          <td className="p-4">
                             <div className="space-y-0.5">
                                <p className="text-sm font-black font-mono tabular-nums">{new Date(log.timestamp).toLocaleTimeString('id-ID')}</p>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-bold">{new Date(log.timestamp).toLocaleDateString('id-ID')}</p>
                             </div>
                          </td>
                          <td className="p-4">
                             <p className={cn("text-sm font-black font-mono tabular-nums", log.distance_from_outlet > (outletInfo?.geofence_radius || 100) ? "text-red-500" : "text-zinc-400")}>
                                {log.distance_from_outlet}m
                             </p>
                          </td>
                          <td className="p-4">
                             <div className="flex items-center gap-2">
                                {log.distance_from_outlet <= (outletInfo?.geofence_radius || 100) ? (
                                   <>
                                      <div className="w-1.5 h-1.5 rounded-lg bg-green-500 animate-pulse" />
                                      <span className="text-[10px] font-black uppercase text-green-500">Inside Area</span>
                                   </>
                                ) : (
                                   <>
                                      <div className="w-1.5 h-1.5 rounded-lg bg-red-500" />
                                      <span className="text-[10px] font-black uppercase text-red-500">Outside Area</span>
                                   </>
                                )}
                             </div>
                          </td>
                          <td className="p-4 text-right">
                             <Button 
                               variant="ghost" size="sm" 
                               className="h-8 rounded-lg gap-2 text-[10px] font-black hover:bg-amber- hover:text-amber-600 dark:text-amber-400"
                               onClick={() => window.open(`https://www.google.com/maps?q=${log.latitude},${log.longitude}`, '_blank')}
                             >
                                <MapIcon size={14} /> LIHAT MAPS
                             </Button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
