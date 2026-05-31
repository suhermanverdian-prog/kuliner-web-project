import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Simulasikan autosync saat kembali online
      setSyncing(true);
      setTimeout(() => setSyncing(false), 2000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-md border font-mono tabular-nums text-[10px] font-black uppercase tracking-wider transition-all duration-300",
      !isOnline 
        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800 animate-pulse"
        : syncing 
          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
          : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
    )}>
      {syncing ? (
        <RefreshCw size={12} className="animate-spin text-amber-500" />
      ) : isOnline ? (
        <Wifi size={12} className="text-emerald-500" />
      ) : (
        <WifiOff size={12} className="text-rose-500" />
      )}
      <span>
        {syncing ? "SINKRONISASI..." : isOnline ? "SISTEM ONLINE" : "MODE OFFLINE"}
      </span>
    </div>
  );
}
