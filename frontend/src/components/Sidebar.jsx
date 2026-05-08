export default function Sidebar({ user, activePage, onNavigate, onLogout, isOpen, onClose }) {
  const ROLE_LABELS = { admin:'Admin', owner:'Owner', kasir:'Kasir', koki:'Koki/Barista', gudang:'Gudang', akuntan:'Akuntan' };

  const allNav = [
    { group: 'Utama', items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard',      roles: ['admin','owner','akuntan'], perm: 'akses_keuangan' },
      { id: 'kasir',     icon: '🧾', label: 'Kasir / POS',    roles: ['admin','kasir'],           perm: 'akses_kasir' },
      { id: 'meja',      icon: '🪑', label: 'Manajemen Meja', roles: ['admin','kasir','koki'],    perm: 'akses_kasir' },
      { id: 'kds',       icon: '👨‍🍳', label: 'Dapur (KDS)',   roles: ['admin','koki','kasir'],    perm: 'akses_dapur' },
      { id: 'shift',     icon: '🔄', label: 'Shift Kasir',    roles: ['admin','kasir','owner'],   perm: 'akses_kasir' },
    ]},
    { group: 'Produk & Stok', items: [
      { id: 'inventori', icon: '📦', label: 'Bahan Baku',     roles: ['admin','gudang','owner'],  perm: 'akses_gudang' },
      { id: 'pembelian', icon: '🛒', label: 'Pembelian (PO)', roles: ['admin','gudang','owner'],  perm: 'akses_gudang' },
      { id: 'menu',      icon: '☕', label: 'Menu & Produk',  roles: ['admin','owner'],           perm: 'akses_gudang' },
    ]},
    { group: 'Bisnis', items: [
      { id: 'laporan',   icon: '📈', label: 'Laporan',        roles: ['admin','owner','akuntan'], perm: 'lihat_laba' },
      { id: 'pelanggan', icon: '👥', label: 'Pelanggan',      roles: ['admin','owner'],           perm: 'atur_user' },
    ]},
    { group: 'Sistem', items: [
      { id: 'pengaturan', icon: '⚙️', label: 'Pengaturan',   roles: ['admin','owner'],           perm: 'atur_user' },
    ]},
  ];

  const hasAccess = (item) => {
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
        <p>Coffee Shop Management</p>
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
