import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { 
  Coffee, Menu, Moon, Sun, Bell
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/Sheet";
import Sidebar from "@/components/Sidebar";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const user = useAppStore(state => state.user);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = [
    { id: 1, type: 'error', title: 'Stok Kritis Terdeteksi', desc: 'Biji Arabica Toraja tersisa 1.5 kg (Batas: 5 kg)', time: '5m ago' },
    { id: 2, type: 'success', title: 'Shift Kasir Berhasil Dibuka', desc: 'Sesi Shift Pagi telah diverifikasi dan dibuka oleh Suherman.', time: '1h ago' },
    { id: 3, type: 'info', title: 'Sinkronisasi Node Selesai', desc: '42 jurnal akuntansi berhasil dicadangkan ke Supabase.', time: 'Just now' }
  ];
  
  // Theme Management (Internalized)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Dynamic Page Title - Elite Detection
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Executive Dashboard';
    
    return path
      .split('/')
      .filter(Boolean)
      .pop()
      ?.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'KEN Enterprise';
  };

  // Sync Browser Title (SEO & UX)
  useEffect(() => {
    const title = getPageTitle();
    document.title = `${title} | KEN Enterprise`;
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <Sidebar
          isOpen={true}
          onClose={() => {}}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex flex-col flex-1 min-h-screen transition-all duration-300",
        isCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-[60] bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-4">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                <SheetDescription className="sr-only">Akses cepat ke seluruh modul KEN</SheetDescription>
                <Sidebar
                   isOpen={true}
                   onClose={() => {}}
                   isCollapsed={false}
                   onToggleCollapse={() => {}}
                />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-4">
              <h1 className="text-lg font-black text-foreground tracking-tight uppercase">
                {getPageTitle()}
              </h1>
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
              <span className="px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest">
                Node-01
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/5 rounded-sm border border-emerald-200 dark:border-emerald-800/80 text-[9px] text-emerald-600 font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Enterprise Nodes Active
            </div>

            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative h-8 w-8 rounded-lg border border-transparent hover:border-border hover:bg-muted"
              >
                <Bell size={18} className="text-muted-foreground" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full border border-background" />
              </Button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl p-4 z-[70] animate-quantum-fade">
                    <div className="flex justify-between items-center pb-2 border-b border-border mb-3">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pemberitahuan Sistem</span>
                      <span className="text-[9px] font-black text-primary cursor-pointer hover:underline" onClick={() => setShowNotifications(false)}>TUTUP</span>
                    </div>
                    <div className="space-y-3 max-h-[280px] overflow-y-auto no-scrollbar">
                      {notifications.map(n => (
                        <div key={n.id} className="flex gap-4 text-left border-b border-border/40 pb-2.5 last:border-0 last:pb-0">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            n.type === 'error' && "bg-rose-600",
                            n.type === 'success' && "bg-emerald-600",
                            n.type === 'info' && "bg-sky-500"
                          )} />
                          <div className="space-y-0.5">
                            <p className="text-xs font-black text-foreground leading-snug">{n.title}</p>
                            <p className="text-[10px] text-muted-foreground leading-normal">{n.desc}</p>
                            <span className="text-[8px] font-bold text-muted-foreground/60 block pt-0.5 font-mono">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button 
               variant="ghost" 
               size="icon" 
               onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
               className="h-8 w-8 rounded-lg border border-transparent hover:border-border hover:bg-muted"
            >
              {theme === 'light' ? <Moon size={18} className="text-muted-foreground" /> : <Sun size={18} className="text-muted-foreground" />}
            </Button>
          </div>
        </header>

        {/* Page Content injected by Router with Premium Transitions */}
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
           <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                 <Outlet />
              </PageTransition>
           </AnimatePresence>
        </main>

        <footer className="px-6 py-2 border-t text-[10px] text-muted-foreground/40 flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Coffee size={10} /> KEN ENTERPRISE v4.0</span>
          <span>BUILD-ELITE-NODE-01</span>
        </footer>
      </div>
    </div>
  );
}
