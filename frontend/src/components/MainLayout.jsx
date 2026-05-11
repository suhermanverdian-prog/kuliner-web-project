import React, { useState } from "react";
import { 
  LayoutDashboard, ShoppingCart, Coffee, ChefHat, 
  Clock, PackageOpen, ShoppingBag, BarChart3, 
  Users, Settings, LogOut, Armchair, Menu,
  ChevronLeft, ChevronRight, Moon, Sun, Bell,
  ShieldCheck, Sparkles, Command, MoreVertical,
  BookOpen, Store
} from 'lucide-react';
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/Sheet";
import { hasFeature, PAGE_FEATURE_MAP } from '../lib/featureFlags';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard',    group: 'Utama' },
  { id: 'kasir',     icon: ShoppingCart,    label: 'Kasir / POS',  group: 'Utama' },
  { id: 'meja',      icon: Armchair,        label: 'Meja',         group: 'Utama' },
  { id: 'kds',       icon: ChefHat,         label: 'Dapur (KDS)',  group: 'Utama' },
  { id: 'shift',     icon: Clock,           label: 'Shift Kasir',  group: 'Utama' },
  { id: 'inventori', icon: PackageOpen,     label: 'Master Stok',  group: 'Gudang' },
  { id: 'menu',      icon: Coffee,          label: 'Menu Kopi',    group: 'Gudang' },
  { id: 'pembelian', icon: ShoppingBag,     label: 'Procurement',  group: 'Pengadaan' },
  { id: 'laporan',   icon: BarChart3,       label: 'Analitik',     group: 'Bisnis' },
  { id: 'pelanggan', icon: Users,           label: 'Loyalty CRM',  group: 'Bisnis' },
  { id: 'akuntansi', icon: BookOpen,        label: 'Akuntansi',    group: 'Enterprise' },
  { id: 'outlets',   icon: Store,           label: 'Multi-Outlet', group: 'Enterprise' },
  { id: 'pengaturan', icon: Settings,       label: 'Pengaturan',   group: 'Sistem' },
  { id: 'activity-log', icon: ShieldCheck,  label: 'Monitor Aktivitas', group: 'Sistem', role: 'superadmin' },
  { id: 'superadmin', icon: Command,        label: 'SuperAdmin',   group: 'Sistem', role: 'superadmin' },
];

// Komponen Sidebar dipisah dari MainLayout agar tidak menyebabkan infinite re-render
function Sidebar({ user, activePage, onNavigate, onLogout, isCollapsed, setIsCollapsed, isMobile }) {
  const visibleNavItems = navItems.filter(item => {
    // Role-based check (SuperAdmin only items)
    if (item.role && item.role !== user?.role && !user?.is_superadmin) return false;
    // Feature flag check
    const flag = PAGE_FEATURE_MAP[item.id];
    if (flag && !hasFeature(user, flag)) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Brand Header */}
      <div className={cn(
        "h-20 flex items-center px-4 border-b transition-all duration-300",
        isCollapsed && !isMobile ? "justify-center px-2" : "justify-between px-6"
      )}>
        <div className="flex items-center gap-3 px-4 py-6 border-b border-white/5">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/20 shrink-0">
            <span className="text-xl font-black text-slate-900">K</span>
          </div>
          <div className={cn("transition-all duration-300", isCollapsed ? "opacity-0 w-0" : "opacity-100")}>
            <h1 className="text-lg font-black tracking-tighter text-white leading-none">KEN</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Kitchen Enterprise</p>
          </div>
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-7 w-7 rounded-lg hover:bg-accent hover:text-white"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {['Utama', 'Gudang', 'Pengadaan', 'Bisnis', 'Enterprise', 'Sistem'].map(group => {
          const items = visibleNavItems.filter(item => item.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="space-y-1">
              {(!isCollapsed || isMobile) && (
                <h4 className="px-3 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
                  {group}
                </h4>
              )}
              {items.map(item => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={isCollapsed && !isMobile ? item.label : ''}
                    className={cn(
                      "w-full flex items-center gap-3 h-10 rounded-xl transition-all duration-200 px-3 text-left",
                      isActive
                        ? "bg-accent text-white font-bold shadow-md shadow-accent/20"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      isCollapsed && !isMobile && "justify-center px-0 w-10 mx-auto"
                    )}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} className="shrink-0" />
                    {(!isCollapsed || isMobile) && (
                      <span className="text-xs font-semibold truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="p-3 border-t">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all",
          isCollapsed && !isMobile && "justify-center"
        )}>
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-xs font-black">
              {user?.name?.[0] || 'U'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.name}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider truncate">{user?.role}</p>
            </div>
          )}
          {(!isCollapsed || isMobile) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onLogout}
            >
              <LogOut size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MainLayout({ children, user, activePage, onNavigate, onLogout, theme, onToggleTheme }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <Sidebar
          user={user}
          activePage={activePage}
          onNavigate={onNavigate}
          onLogout={onLogout}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobile={false}
        />
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex flex-col flex-1 min-h-screen transition-all duration-300",
        "lg:ml-64",
        isCollapsed && "lg:ml-16"
      )}>
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b">
          <div className="flex items-center gap-4">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                <SheetDescription className="sr-only">Akses cepat ke seluruh modul KEN</SheetDescription>
                <Sidebar
                  user={user}
                  activePage={activePage}
                  onNavigate={onNavigate}
                  onLogout={onLogout}
                  isCollapsed={false}
                  setIsCollapsed={() => {}}
                  isMobile={true}
                />
              </SheetContent>
            </Sheet>

            {/* Page title */}
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-muted-foreground capitalize tracking-wide">
                {activePage.replace('_', ' ')}
              </h1>
              <Sparkles size={12} className="text-accent" />
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* System status */}
            <div className="hidden md:flex items-center gap-2 text-xs text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Online
            </div>

            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent rounded-full border border-background" />
            </Button>

            <Button variant="ghost" size="icon" onClick={onToggleTheme} className="h-9 w-9 rounded-xl">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1800px] w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 border-t text-[10px] text-muted-foreground/40 flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Coffee size={10} /> KEN v1.0</span>
          <span>Build 2.0.4</span>
        </footer>
      </div>
    </div>
  );
}
