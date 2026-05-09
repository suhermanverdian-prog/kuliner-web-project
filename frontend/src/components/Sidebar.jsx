import { 
  LayoutDashboard, ShoppingCart, Coffee, ChefHat, 
  Clock, PackageOpen, ShoppingBag, BookOpen, 
  Users, Settings, ShieldCheck, LogOut 
} from 'lucide-react';

export default function Sidebar({ user, activePage, onNavigate, onLogout, isOpen, onClose }) {
  const ROLE_LABELS = { admin:'Admin', owner:'Owner', kasir:'Kasir', koki:'Koki/Barista', gudang:'Gudang', akuntan:'Akuntan' };

  const allNav = [
    { group: 'Utama', items: [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard',      roles: ['admin','owner','akuntan'], perm: 'akses_keuangan', minTier: 'lite' },
      { id: 'kasir',     icon: ShoppingCart,    label: 'Kasir / POS',    roles: ['admin','kasir'],           perm: 'akses_kasir',    minTier: 'lite' },
      { id: 'meja',      icon: Coffee,          label: 'Manajemen Meja', roles: ['admin','kasir','koki'],    perm: 'akses_kasir',    minTier: 'lite' },
      { id: 'kds',       icon: ChefHat,         label: 'Dapur (KDS)',    roles: ['admin','koki','kasir'],    perm: 'akses_dapur',    minTier: 'lite' },
      { id: 'shift',     icon: Clock,           label: 'Shift Kasir',    roles: ['admin','kasir','owner'],   perm: 'akses_kasir',    minTier: 'lite' },
    ]},
    { group: 'Produk & Stok', items: [
      { id: 'inventori', icon: PackageOpen,     label: 'Bahan Baku',     roles: ['admin','gudang','owner'],  perm: 'akses_gudang',   minTier: 'lite' },
      { id: 'pembelian', icon: ShoppingBag,     label: 'Pembelian (PO)', roles: ['admin','gudang','owner'],  perm: 'akses_gudang',   minTier: 'pro' },
      { id: 'menu',      icon: Coffee,          label: 'Menu & Produk',  roles: ['admin','owner'],           perm: 'akses_gudang',   minTier: 'pro' },
    ]},
    { group: 'Bisnis', items: [
      { id: 'laporan',   icon: BookOpen,        label: 'Laporan',        roles: ['admin','owner','akuntan'], perm: 'lihat_laba',     minTier: 'pro' },
      { id: 'pelanggan', icon: Users,           label: 'Pelanggan',      roles: ['admin','owner'],           perm: 'atur_user',      minTier: 'pro' },
    ]},
    { group: 'Sistem', items: [
      { id: 'pengaturan', icon: Settings,       label: 'Pengaturan',     roles: ['admin','owner'],           perm: 'atur_user',      minTier: 'pro' },
      { id: 'superadmin', icon: ShieldCheck,    label: 'SuperAdmin',     roles: [],                          perm: 'superadmin',     minTier: 'franchise' },
    ]},
  ];

  const hasAccess = (item) => {
    // 1. Jika menu ini KHUSUS SuperAdmin, maka WAJIB punya flag is_superadmin
    if (item.perm === 'superadmin') {
      return user.is_superadmin === true;
    }

    // 2. Jika user adalah SuperAdmin, beri akses ke SEMUA menu (kecuali yang dilarang eksplisit jika ada)
    if (user.is_superadmin) return true;

    // 3. FASE 7: Feature-Locked Access (Periksa fitur tenant)
    const tenantFeatures = user.tenant?.features || {};
    
    if (item.id === 'laporan' && tenantFeatures.accounting !== true) return false;
    if (item.id === 'pelanggan' && tenantFeatures.crm !== true) return false;

    // 4. Validasi Role Base Access Control (RBAC) Biasa
    if (user.permissions && user.permissions.all) return true; // Owner/Admin bypass
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
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>BrewMaster<span style={{ color: 'var(--accent)' }}>.</span></h1>
          <p>Tenant: {user.tenant?.name || 'Sistem Pusat'}</p>
        </div>
        
        <nav className="sidebar-nav">
          {navs.map((group, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div className="nav-group-label">{group.group}</div>
              {group.items.map(item => {
                const IconComponent = item.icon;
                return (
                  <button 
                    key={item.id}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                  >
                    <IconComponent size={18} className="nav-icon" />
                    <span style={{ flex: 1, textAlign: 'left', marginLeft: '6px' }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{user.avatar || 'U'}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">
              {user.is_superadmin ? 'Super Admin' : ROLE_LABELS[user.role] || user.role}
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Keluar">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
