export default function Sidebar({ user, activePage, onNavigate, onLogout, isOpen, onClose }) {
  const ROLE_LABELS = { admin:'Admin', owner:'Owner', kasir:'Kasir', koki:'Koki/Barista', gudang:'Gudang', akuntan:'Akuntan' };

  const allNav = [
    { group: 'Utama', items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard',      roles: ['admin','owner','akuntan'], perm: 'akses_keuangan', minTier: 'lite' },
      { id: 'kasir',     icon: '🧾', label: 'Kasir / POS',    roles: ['admin','kasir'],           perm: 'akses_kasir',    minTier: 'lite' },
      { id: 'meja',      icon: '🪑', label: 'Manajemen Meja', roles: ['admin','kasir','koki'],    perm: 'akses_kasir',    minTier: 'lite' },
      { id: 'kds',       icon: '👨‍🍳', label: 'Dapur (KDS)',   roles: ['admin','koki','kasir'],    perm: 'akses_dapur',    minTier: 'lite' },
      { id: 'shift',     icon: '🔄', label: 'Shift Kasir',    roles: ['admin','kasir','owner'],   perm: 'akses_kasir',    minTier: 'lite' },
    ]},
    { group: 'Produk & Stok', items: [
      { id: 'inventori', icon: '📦', label: 'Bahan Baku',     roles: ['admin','gudang','owner'],  perm: 'akses_gudang',   minTier: 'lite' },
      { id: 'pembelian', icon: '🛒', label: 'Pembelian (PO)', roles: ['admin','gudang','owner'],  perm: 'akses_gudang',   minTier: 'pro' },
      { id: 'menu',      icon: '☕', label: 'Menu & Produk',  roles: ['admin','owner'],           perm: 'akses_gudang',   minTier: 'pro' },
    ]},
    { group: 'Bisnis', items: [
      { id: 'laporan',   icon: '📈', label: 'Laporan',        roles: ['admin','owner','akuntan'], perm: 'lihat_laba',     minTier: 'pro' },
      { id: 'pelanggan', icon: '👥', label: 'Pelanggan',      roles: ['admin','owner'],           perm: 'atur_user',      minTier: 'pro' },
    ]},
    { group: 'Sistem', items: [
      { id: 'pengaturan', icon: '⚙️', label: 'Pengaturan',   roles: ['admin','owner'],           perm: 'atur_user',      minTier: 'pro' },
      { id: 'superadmin', icon: '🛡️', label: 'SuperAdmin',    roles: [],                          perm: 'superadmin',     minTier: 'franchise' },
    ]},
  ];

  const hasAccess = (item) => {
    // 1. Jika menu ini KHUSUS SuperAdmin, maka WAJIB punya flag is_superadmin
    if (item.perm === 'superadmin') {
      return user.is_superadmin === true;
    }

    // 2. SuperAdmin bisa melihat semua menu lainnya
    if (user.is_superadmin) return true;

    // 3. Cek Tier Pelanggan (Tenant) untuk menu biasa
    const tenantTier = user.tenant?.tier || 'lite';
    if (item.minTier === 'pro' && tenantTier === 'lite') return false;
    if (item.minTier === 'franchise' && (tenantTier === 'lite' || tenantTier === 'pro')) return false;

    // 4. Cek Role & Permission untuk level Toko
    if (user.role === 'admin' || user.permissions?.all) return true;
    if (item.perm && user.permissions?.[item.perm]) return true;
    return item.roles.includes(user.role);
  };

  const visibleNav = allNav.map(group => ({
    ...group,
    items: group.items.filter(hasAccess)
  })).filter(group => group.items.length > 0);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <h1>☕ BrewMaster</h1>
        <p>{user.tenant?.name || 'SaaS Management'}</p>
        {user.tenant?.tier && (
          <span className={`badge-tier ${user.tenant.tier}`}>
            {user.tenant.tier.toUpperCase()}
          </span>
        )}
      </div>
      <nav className="sidebar-nav">
        {visibleNav.map(group => (
          <div key={group.group}>
            <div className="nav-group-label">{group.group}</div>
            {group.items.map(item => (
              <div
                key={item.id}
                id={`nav-${item.id}`}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="user-avatar">{user.avatar}</div>
        <div className="user-info">
          <div className="user-name">{user.name}</div>
          <div className="user-role">{ROLE_LABELS[user.role]}</div>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Keluar">🚪</button>
      </div>
    </aside>
    </>
  );
}
