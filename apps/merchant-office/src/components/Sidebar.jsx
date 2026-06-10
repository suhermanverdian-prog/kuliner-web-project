import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { 
  LayoutDashboard, ShoppingCart, Box, ChefHat, 
  Clock, Layers, ShoppingBag, BarChart3, 
  Users, Settings, Lock, LogOut, Armchair,
  ChevronLeft, ChevronRight, Scale, Building2,
  BrainCircuit, Command, TrendingUp, FileStack, Landmark, 
  Trash2, Truck, ClipboardList, ShieldCheck, Settings2, Sparkles, ClipboardCheck, Coffee
} from 'lucide-react';
import { hasFeature, PAGE_FEATURE_MAP } from '../lib/featureFlags';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import SyncIndicator from './SyncIndicator';

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const rawUser = useAppStore(state => state.user);
  const user = (rawUser && rawUser.user && rawUser.token) ? rawUser.user : rawUser;
  const logout = useAppStore(state => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const [settingsExpanded, setSettingsExpanded] = useState(() => {
    return location.pathname.includes('/settings');
  });

  // Sync expanded state when pathname changes
  useEffect(() => {
    if (location.pathname.includes('/settings')) {
      setSettingsExpanded(true);
    }
  }, [location.pathname]);

  const allNav = [
    { group: 'Utama', items: [
      { id: '/',     icon: LayoutDashboard, label: 'Dashboard',      roles: ['owner','manager','accounting','hrd'], perm: 'akses_keuangan' },
      { id: '/kasir',     icon: ShoppingCart,    label: 'Kasir / POS',    roles: ['owner','manager','staff'],           perm: 'akses_kasir' },
      { id: '/tables',    icon: Armchair,        label: 'Meja',           roles: ['owner','manager','staff','chef'],    perm: 'akses_kasir' },
      { id: '/kds',       icon: ChefHat,         label: 'Dapur (KDS)',    roles: ['owner','manager','chef'],            perm: 'akses_dapur' },
      { id: '/shifts',    icon: Clock,           label: 'Shift Kasir',    roles: ['owner','manager','staff'],           perm: 'akses_kasir' },
    ]},
    { group: 'Produk & Stok', items: [
      { id: '/inventory', icon: Layers,          label: 'Bahan Baku',     roles: ['owner','manager','chef','accounting','staff'],            perm: 'akses_gudang' },
      { id: '/opname',    icon: ClipboardList,   label: 'Stok Opname',    roles: ['owner','manager','chef','accounting','staff'],            perm: 'akses_gudang' },
      { id: '/inventory-intel', icon: BrainCircuit, label: 'Stock Intelligence', roles: ['owner','manager','chef','accounting'], perm: 'akses_gudang' },
      { id: '/waste-monitoring', icon: Trash2,   label: 'Zero-Waste',     roles: ['owner','manager','chef'],            perm: 'akses_gudang' },
      { id: '/logistics-hub',    icon: Truck,    label: 'Logistics Hub',  roles: ['owner','manager'],                   perm: 'akses_gudang' },
      { id: '/procurement', icon: ShoppingBag,    label: 'Pengadaan',      roles: ['owner','manager','accounting','chef'],  perm: 'akses_gudang' },
      { id: '/menu',      icon: Box,             label: 'Menu Produk',    roles: ['owner','manager'],                   perm: 'akses_gudang' },
    ]},
    { group: 'Bisnis', items: [
      { id: '/marketplace', icon: ShoppingBag,    label: 'Omnichannel',   roles: ['owner','manager'],                   perm: 'akses_gudang' },
      { id: '/reports',   icon: BarChart3,  label: 'Laporan',       roles: ['owner','manager','accounting'],      perm: 'lihat_laba' },
      { id: '/budget',    icon: Landmark,   label: 'Anggaran / Budget', roles: ['owner','manager','accounting'],      perm: 'lihat_laba' },
      { id: '/revenue-intel', icon: TrendingUp, label: 'Revenue Intel', roles: ['owner','manager'],                   perm: 'lihat_laba' },
      { id: '/tax-report', icon: Landmark,      label: 'Laporan Pajak', roles: ['owner','manager','accounting'],      perm: 'lihat_laba' },
      { id: '/report-builder', icon: FileStack, label: 'FlexReport',   roles: ['owner','manager'],                   perm: 'lihat_laba' },
      { id: '/consolidated-finance', icon: Landmark, label: 'Global Finance', roles: ['owner','manager'],             perm: 'lihat_laba', feature: 'multi_outlet' },
      { id: '/accounting',icon: Scale,      label: 'Akuntansi',     roles: ['owner','manager','accounting'],      perm: 'lihat_laba',  feature: 'accounting' },
      { id: '/outlets',   icon: Building2,  label: 'Multi-Outlet',  roles: ['owner','manager'],                   perm: 'atur_user',   feature: 'multi_outlet' },
      { id: '/customers', icon: Users,      label: 'Pelanggan',     roles: ['owner','manager'],                   perm: 'atur_user' },
    ]},
    { group: 'Sistem', items: [
      { id: '/settings',  icon: Settings,       label: 'Pengaturan',     roles: ['owner','manager'],                   perm: 'atur_user' },
      { id: '/hrd',       icon: Users,          label: 'HRD Portal',     roles: ['owner','hrd'],                       perm: 'atur_user' },
      { id: '/ai-assistant', icon: BrainCircuit, label: 'AI Assistant',   roles: ['owner','manager'],                   perm: 'akses_keuangan' },
      { id: '/command-center', icon: Command,    label: 'Command Center', roles: [],                                    perm: 'superadmin' },
      { id: '/superadmin', icon: Lock,           label: 'SuperAdmin',     roles: [],                                    perm: 'superadmin' },
    ]},
  ];

  const settingsSubmenu = [
    { id: '/settings?tab=users&standalone=true',          label: 'Pengguna & Hak Akses', icon: ShieldCheck, roles: ['owner','manager'], perm: 'atur_user' },
    { id: '/settings?tab=customization&standalone=true',   label: 'Kustomisasi POS & Dosis', icon: Coffee,   roles: ['owner','manager'], perm: 'akses_kasir' },
    { id: '/settings?tab=security&standalone=true',       label: 'Kebijakan Approval',   icon: ClipboardCheck, roles: ['owner'],         perm: 'atur_user' },
    { id: '/settings?tab=system&standalone=true',          label: 'Profil Outlet & Gerai', icon: Building2,  roles: ['owner','manager'], perm: 'atur_user' },
    { id: '/settings?tab=payment&standalone=true',         label: 'Aturan Keuangan & Pajak', icon: Scale,      roles: ['owner','manager','accounting'], perm: 'lihat_laba' },
    { id: '/settings?tab=ai&standalone=true',              label: 'Modul AI & API',       icon: BrainCircuit,roles: ['owner'],           perm: 'atur_user' },
    { id: '/settings?tab=promo&standalone=true',           label: 'Promo & Diskon',       icon: Sparkles,  roles: ['owner','manager'], perm: 'atur_user' },
  ];

  const hasAccess = (item) => {
    if (!user) return false;
    if (user.role === 'superadmin' || user.is_superadmin === true) return true;
    if (item.perm === 'superadmin') return false;
    
    const requiredFlag = PAGE_FEATURE_MAP[item.id.replace('/', '').split('?')[0]];
    if (requiredFlag && !hasFeature(user, requiredFlag)) return false;
    if (user.permissions && user.permissions.all) return true;
    if (item.roles.includes(user.role)) return true;
    if (user.permissions && user.permissions[item.perm]) return true;
    return false;
  };

  const navs = allNav.map(g => ({
    ...g,
    items: g.items.filter(hasAccess)
  })).filter(g => g.items.length > 0);

  const allowedSubmenu = settingsSubmenu.filter(hasAccess);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={cn(
      "h-full flex flex-col transition-all duration-300",
      "bg-background border-r border-border", 
      "dark:bg-zinc-950 dark:border-zinc-900",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Brand */}
      <div className={cn(
        "h-16 flex items-center shrink-0 px-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center font-black text-lg">K</div>
            <span className="font-black text-lg tracking-tighter text-foreground uppercase">Enterprise</span>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="xs" 
            onClick={onToggleCollapse} 
            className="w-8 h-8 bg-amber-500 text-zinc-950 hover:bg-amber-600 rounded-lg flex items-center justify-center font-black text-lg shadow-sm transition-all active:scale-95"
            title="Expand Sidebar"
          >
            K
          </Button>
        )}
        {!isCollapsed && (
          <Button variant="ghost" size="xs" onClick={onToggleCollapse} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft size={16} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 custom-scrollbar">
        {!isCollapsed && (
          <div className="px-4 pb-2">
            <SyncIndicator />
          </div>
        )}
        {navs.map((group, i) => (
          <div key={i} className="space-y-1">
            {!isCollapsed && (
              <p className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{group.group}</p>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              
              // Custom interactive settings menu
              if (item.id === '/settings') {
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => {
                        if (isCollapsed) {
                          navigate('/settings');
                        } else {
                          setSettingsExpanded(!settingsExpanded);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center transition-all duration-300 group",
                        isCollapsed 
                          ? "justify-center w-10 h-10 mx-auto px-0 rounded-lg" 
                          : "gap-4 px-4 py-2.5 rounded-lg justify-between text-left",
                        location.pathname.includes('/settings')
                          ? "bg-amber-50 text-amber-600 dark:bg-zinc-800 dark:text-amber-400 font-bold border border-amber-500/20 dark:border-zinc-700/50"
                          : "text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:-translate-y-[1px]"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <Icon size={20} className={cn("flex-shrink-0 transition-transform duration-300", settingsExpanded && !isCollapsed && "rotate-45")} />
                        {!isCollapsed && <span className="text-sm tracking-tight">{item.label}</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronLeft size={14} className={cn("transition-transform duration-300 text-muted-foreground group-hover:text-foreground", settingsExpanded && "-rotate-90")} />
                      )}
                    </button>
                    
                    {settingsExpanded && !isCollapsed && (
                      <div className="pl-6 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300 border-l border-zinc-200 dark:border-zinc-800 ml-6">
                        {allowedSubmenu.map(sub => {
                          const SubIcon = sub.icon;
                          const isSubActive = (location.pathname + location.search).includes(sub.id.split('&')[0]);
                          return (
                            <NavLink
                              key={sub.id}
                              to={sub.id}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-bold transition-all duration-200",
                                isSubActive
                                  ? "text-amber-600 dark:text-amber-400 bg-amber-500/5 font-black border-l-2 border-amber-500 rounded-l-none pl-2"
                                  : "text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900"
                              )}
                              onClick={onClose}
                            >
                              <SubIcon size={14} className="flex-shrink-0 text-zinc-400 group-hover:text-amber-500" />
                              <span>{sub.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink 
                  key={item.id}
                  to={item.id}
                  className={({ isActive }) => cn(
                    "flex items-center transition-all duration-300 group",
                    isCollapsed 
                      ? "justify-center w-10 h-10 mx-auto px-0 rounded-lg" 
                      : "gap-4 px-4 py-2.5 rounded-lg",
                    isActive
                      ? "bg-amber-50 text-amber-600 dark:bg-zinc-800 dark:text-amber-400 font-bold shadow-sm border border-amber-500/20 dark:border-zinc-700/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:-translate-y-[1px]"
                  )}
                  onClick={onClose}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm tracking-tight">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border bg-background/50 dark:bg-zinc-950/50 dark:border-zinc-900">
        {!isCollapsed ? (
          <div className="flex items-center gap-4 p-2 rounded-lg bg-muted/50 border border-border dark:bg-zinc-900/50 dark:border-zinc-900">
             <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground font-black dark:bg-zinc-800">
                {user?.name?.[0] || 'U'}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-foreground truncate">{user?.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{user?.role}</p>
             </div>
             <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-muted-foreground hover:text-rose-600 dark:text-rose-400">
                <LogOut size={16} />
              </Button>
          </div>
        ) : (
          <Button variant="ghost" size="xs" onClick={onToggleCollapse} className="w-full h-10 text-muted-foreground hover:text-foreground">
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
