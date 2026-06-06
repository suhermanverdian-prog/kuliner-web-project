import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { 
  Coffee, Menu, Moon, Sun, Bell
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/Sheet";
import Sidebar from "./Sidebar";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  
  // Theme Management (Internalized)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Dynamic Page Title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/kasir') return 'POS Kasir';
    if (path === '/kds') return 'Kitchen Display System';
    if (path === '/meja') return 'Manajemen Meja';
    
    return path
      .split('/')
      .filter(Boolean)
      .pop()
      ?.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'POS Client';
  };

  useEffect(() => {
    const title = getPageTitle();
    document.title = `${title} | BrewMaster POS`;
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col shrink-0 sticky top-0 h-screen transition-all duration-300",
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
      <div className="flex flex-col flex-1 min-h-screen min-w-0 transition-all duration-300">
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
              <SheetContent side="left" className="p-0 w-64 bg-zinc-950">
                <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                <SheetDescription className="sr-only">Akses cepat ke seluruh modul POS</SheetDescription>
                <Sidebar
                   isOpen={true}
                   onClose={() => {}}
                   isCollapsed={false}
                   onToggleCollapse={() => {}}
                />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-4">
              <h1 className="text-sm font-black text-foreground tracking-tight uppercase">
                {getPageTitle()}
              </h1>
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
              <span className="px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest">
                POS Terminal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
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

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto overflow-y-auto">
           <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                 <Outlet />
              </PageTransition>
           </AnimatePresence>
        </main>

        <footer className="px-6 py-2 border-t text-[10px] text-muted-foreground/40 flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Coffee size={10} /> BrewMaster ERP v5.0</span>
          <span>POS-CLIENT-TERMINAL</span>
        </footer>
      </div>
    </div>
  );
}
