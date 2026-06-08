import React from 'react';
import { 
  MapPin, Clock, Camera, CheckCircle2, 
  AlertCircle, ShieldCheck, Map, Smartphone,
  ChevronRight, LogIn, LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { useAbsensiPage } from '../hooks/useAbsensiPage';

export default function AbsensiPage({ user }) {
  const {
    location,
    distance,
    loading,
    error,
    success, setSuccess,
    outletInfo,
    handleAbsen,
    isOutOfRange
  } = useAbsensiPage();

  if (success) {
    return (
      <div className="min-h-screen  font-mono tabular-nums">
        <div className="w-24 h-24 ">
           <CheckCircle2 size={48} />
        </div>
        <h1 className="text-3xl font-black mb-2">Absensi Berhasil!</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Data Anda telah tercatat di sistem pusat.</p>
        <Button className="mt-10 h-14 w-full max-w-xs " onClick={() => setSuccess(false)}>Selesai</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="p-8 space-y-8 max-w-md mx-auto">
        <header className="space-y-1">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">Employee Portal</p>
           <h1 className="text-3xl font-black tracking-tight">Presensi Kehadiran</h1>
        </header>

        {/* GPS Card */}
        <Card className="">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-amber- text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
                    <MapPin size={20} />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status Lokasi</p>
                    <p className="text-sm font-black">
                       {loading ? 'Mencari Sinyal...' : location ? 'Terdeteksi' : 'Menunggu GPS'}
                    </p>
                 </div>
              </div>
              {location && (
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-500">Akurasi</p>
                    <p className="text-xs font-black text-amber-600 dark:text-amber-400">{Math.round(location.acc)}m</p>
                 </div>
              )}
           </div>

           {distance !== null && (
              <div className="p-4 rounded-lg bg-background/5 border border-white/10 space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Jarak ke Outlet</span>
                    <span className={cn("text-lg font-black", distance <= (outletInfo?.geofence_radius || 100) ? "text-green-500" : "text-red-500")}>
                       {distance} Meter
                    </span>
                 </div>
                 <div className="h-2 w-full ">
                    <div 
                      className={cn("h-full transition-all duration-1000", distance <= (outletInfo?.geofence_radius || 100) ? "bg-green-500" : "bg-red-500")}
                      style={{ width: `${Math.min(100, (distance / (outletInfo?.geofence_radius || 100)) * 100)}%` }}
                    />
                 </div>
                 <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest text-center">
                    {distance <= (outletInfo?.geofence_radius || 100) ? 'Anda berada dalam area absensi' : 'Anda berada di luar jangkauan'}
                 </p>
              </div>
           )}

           {error && (
              <div className="flex gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                 <AlertCircle className="shrink-0" size={18} />
                 <p className="text-xs font-bold leading-relaxed">{error}</p>
              </div>
           )}
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
           <Button 
             className={cn(
                "h-24 rounded-lg flex-col gap-2 font-black transition-all",
                isOutOfRange ? "bg-zinc-200 text-zinc-400 cursor-not-allowed " : "bg-background text-zinc-950 hover:scale-105"
             )}
             disabled={loading || !location || isOutOfRange}
             onClick={() => handleAbsen('clock_in')}
           >
              <LogIn size={24} /> {isOutOfRange ? 'LUAR AREA' : 'MASUK'}
           </Button>
           <Button 
             className={cn(
                "h-24 rounded-lg flex-col gap-2 font-black transition-all",
                isOutOfRange ? "bg-zinc-200 text-zinc-400 cursor-not-allowed " : "bg-amber-500 text-white dark:text-zinc-100 hover:scale-105"
             )}
             disabled={loading || !location || isOutOfRange}
             onClick={() => handleAbsen('clock_out')}
           >
              <LogOut size={24} /> {isOutOfRange ? 'LUAR AREA' : 'PULANG'}
           </Button>
        </div>

        <p className="text-[10px] text-zinc-600 text-center font-bold uppercase tracking-widest leading-relaxed">
           Sistem menggunakan penguncian koordinat GPS tingkat tinggi. Segala bentuk manipulasi lokasi akan tercatat oleh sistem pusat.
        </p>
      </div>
    </div>
  );
}
