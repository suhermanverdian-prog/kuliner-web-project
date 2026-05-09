import { 
  LayoutDashboard, ShoppingCart, Coffee, ChefHat, 
  Clock, PackageOpen, ShoppingBag, BarChart3, 
  Users, Settings, ShieldCheck, LogOut, Armchair,
  ChevronLeft, ChevronRight, Menu
} from 'lucide-react';

export default function Sidebar({ 
  user, activePage, onNavigate, onLogout, isOpen, onClose, 
  isCollapsed, onToggleCollapse 
}) {
  const ROLE_LABELS = { admin:'Admin', owner:'Owner', kasir:'Kasir', koki:'Koki/Barista', gudang:'Gudang', akuntan:'Akuntan' };

  const allNav = [
    { group: 'Utama', items: [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard',      roles: ['admin','owner','akuntan'], perm: 'akses_keuangan', minTier: 'lite' },
      { id: 'kasir',     icon: ShoppingCart,    label: 'Kasir / POS',    roles: ['admin','kasir'],           perm: 'akses_kasir',    minTier: 'lite' },
      { id: 'meja',      icon: Armchair,        label: 'Manajemen Meja', roles: ['admin','kasir','koki'],    perm: 'akses_kasir',    minTier: 'lite' },
      { id: 'kds',       icon: ChefHat,         label: 'Dapur (KDS)',    roles: ['admin','koki','kasir'],    perm: 'akses_dapur',    minTier: 'lite' },
      { id: 'shift',     icon: Clock,           label: 'Shift Kasir',    roles: ['admin','kasir','owner'],   perm: 'akses_kasir',    minTier: 'lite' },
    ]},
    { group: 'Produk & Stok', items: [
      { id: 'inventori', icon: PackageOpen,     label: 'Bahan Baku',     roles: ['admin','gudang','owner'],  perm: 'akses_gudang',   minTier: 'lite' },
      { id: 'pembelian', icon: ShoppingBag,     label: 'Pembelian (PO)', roles: ['admin','gudang','owner'],  perm: 'akses_gudang',   minTier: 'pro' },
      { id: 'menu',      icon: Coffee,          label: 'Menu & Produk',  roles: ['admin','owner'],           perm: 'akses_gudang',   minTier: 'pro' },
    ]},
    { group: 'Bisnis', items: [
      { id: 'laporan',   icon: BarChart3,       label: 'Laporan',        roles: ['admin','owner','akuntan'], perm: 'lihat_laba',     minTier: 'pro' },
      { id: 'pelanggan', icon: Users,           label: 'Pelanggan',      roles: ['admin','owner'],           perm: 'atur_user',      minTier: 'pro' },
    ]},
    { group: 'Sistem', items: [
      { id: 'pengaturan', icon: Settings,       label: 'Pengaturan',     roles: ['admin','owner'],           perm: 'atur_user',      minTier: 'pro' },
      { id: 'superadmin', icon: ShieldCheck,    label: 'SuperAdmin',     roles: [],                          perm: 'superadmin',     minTier: 'franchise' },
    ]},
  ];

  const hasAccess = (item) => {
    if (item.perm === 'superadmin') return user.is_superadmin === true;
    if (user.is_superadmin) return true;
    const tenantFeatures = user.tenant?.features || {};
    if (item.id === 'laporan' && tenantFeatures.accounting !== true) return false;
    if (item.id === 'pelanggan' && tenantFeatures.crm !== true) return false;
    if (user.permissions && user.permissions.all) return true; 
    if (item.roles.includes(user.role)) return true;
    if (user.permissions && user.permissions[item.perm]) return true;
    return false;
  };

  const navs = allNav.map(g => ({
    ...g,
    items: g.items.filter(hasAccess)
  })).filter(g => g.items.length > 0);

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Coffee size={24} />
            {!isCollapsed && <span>BrewMaster<span>.</span></span>}
          </div>
          <button className="toggle-sidebar-btn" onClick={onToggleCollapse}>
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        
        <div className="nav-section">
          {navs.map((group, i) => (
            <div key={i}>
              <div className="nav-group-title">{group.group}</div>
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <button 
                    key={item.id}
                    className={`nav-link ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="user-profile">
          <div className="avatar-circle">{user.name?.[0] || 'U'}</div>
          <div className="user-meta">
            <div className="user-meta-name">{user.name}</div>
            <div className="user-meta-role">
              {user.is_superadmin ? 'Super Admin' : ROLE_LABELS[user.role] || user.role}
            </div>
          </div>
          <button className="btn-new-ghost" style={{ padding: '8px' }} onClick={onLogout} title="Keluar">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
