import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import KasirPage from './pages/KasirPage';
import InventoriPage from './pages/InventoriPage';
import KDSPage from './pages/KDSPage';
import MejaPage from './pages/MejaPage';
import LaporanPage from './pages/LaporanPage';
import PengaturanPage from './pages/PengaturanPage';
import MenuPage from './pages/MenuPage';
import PelangganPage from './pages/PelangganPage';
import ShiftPage from './pages/ShiftPage';
import GuestMenuPage from './pages/GuestMenuPage';
import PembelianPage from './pages/PembelianPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import RegisterPage from './pages/RegisterPage';
import SuperAdminPage from './pages/SuperAdminPage';
import Sidebar from './components/Sidebar';

const PAGE_TITLES = {
  dashboard:  { title: 'Dashboard',             subtitle: 'Ringkasan bisnis hari ini' },
  kasir:      { title: 'Kasir / POS',            subtitle: 'Proses transaksi penjualan' },
  inventori:  { title: 'Inventori Bahan Baku',   subtitle: 'Kelola stok dan bahan baku' },
  pembelian:  { title: 'Manajemen Pembelian',    subtitle: 'Kelola pesanan dan stok masuk' },
  kds:        { title: 'Kitchen Display System', subtitle: 'Monitor pesanan dapur' },
  meja:       { title: 'Manajemen Meja',         subtitle: 'Pantau status meja restaurant' },
  laporan:    { title: 'Laporan & Analitik',     subtitle: 'Data keuangan dan performa bisnis' },
  pengaturan: { title: 'Pengaturan Sistem',      subtitle: 'Konfigurasi dan manajemen akses' },
  menu:       { title: 'Menu & Produk',          subtitle: 'Kelola menu, harga, dan resep BOM' },
  pelanggan:  { title: 'Data Pelanggan',         subtitle: 'Kelola member dan loyalty program' },
  shift:      { title: 'Manajemen Shift',        subtitle: 'Buka & tutup shift kasir' },
  superadmin: { title: 'SuperAdmin Dashboard',   subtitle: 'Kelola seluruh platform SaaS' },
};

const DEFAULT_PAGE = {
  admin: 'dashboard', owner: 'dashboard', kasir: 'kasir',
  koki: 'kds', gudang: 'inventori', akuntan: 'laporan', customer: 'menu'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hash, setHash] = useState(window.location.hash);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  // Pantau dan terapkan perubahan tema
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);


  // Pantau perubahan hash URL
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Pantau koneksi jaringan (Offline Mode)
  useEffect(() => {
    import('./api').then(({ api }) => {
      const updateCount = () => {
        const q = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        setOfflineCount(q.length);
      };
      const handleOnline = () => {
        setIsOffline(false);
        api.syncOfflineQueue().then(() => updateCount());
      };
      const handleOffline = () => setIsOffline(true);
      
      updateCount();
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('offlineRequestQueued', updateCount);
      
      // Auto-sync on mount just in case
      if (navigator.onLine) api.syncOfflineQueue().then(() => updateCount());
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('offlineRequestQueued', updateCount);
      };
    });
  }, []);

  // ── Public routes berdasarkan hash/search ──────────────────
  // Support: /#/guest, /#/guest?table=3, ?mode=guest
  const hashPath = hash.split('?')[0];
  const hashParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const tableFromQR = hashParams.get('table') || new URLSearchParams(window.location.search).get('table');

  const isGuestMode = window.location.search.includes('mode=guest') || hashPath === '#/guest';
  const isRegisterMode = hashPath === '#/register';
  const isMemberLoginMode = hashPath === '#/member-login';

  if (isGuestMode) return <GuestMenuPage user={user} tableFromQR={tableFromQR} />;

  if (isRegisterMode) {
    return (
      <RegisterPage
        onSuccess={(newUser) => {
          window.location.hash = '';
          setUser(newUser);
          setActivePage('menu');
        }}
        onGoLogin={() => { window.location.hash = '#/member-login'; }}
      />
    );
  }

  if (isMemberLoginMode && !user) {
    return (
      <LoginPage
        memberOnly={true}
        onLogin={(u) => {
          window.location.hash = '';
          setUser(u);
          setActivePage('menu');
        }}
        onGoRegister={() => { window.location.hash = '#/register'; }}
        onBack={() => { window.location.hash = '#/guest'; }}
      />
    );
  }

  // ── Login biasa (staf) ──────────────────────────────────────
  if (!user) return <LoginPage onLogin={(u) => { setUser(u); setActivePage(DEFAULT_PAGE[u.role] || 'dashboard'); }} />;

  const handleLogout = () => { setUser(null); setActivePage('dashboard'); window.location.hash = ''; setIsSidebarOpen(false); };
  const handleNavigate = (page) => { setActivePage(page); setIsSidebarOpen(false); };

  // ── Customer yang sudah login → langsung ke menu ordering ──
  if (user.role === 'customer') {
    return <CustomerPortalPage user={user} onLogout={handleLogout} />;
  }

  // ── Staf ────────────────────────────────────────────────────
  const pageInfo = PAGE_TITLES[activePage] || { title: activePage, subtitle: '' };
  const isFullWidth = activePage === 'kasir';

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar user={user} activePage={activePage} onNavigate={handleNavigate} onLogout={handleLogout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? '✕' : '☰'}
            </button>
            <div className="topbar-title">
              <h2>{pageInfo.title}</h2>
              <p>{pageInfo.subtitle}</p>
            </div>
          </div>
          <div className="topbar-actions">
            {isOffline ? (
              <div className="badge badge-danger" style={{gap: '6px', padding: '6px 12px'}}>
                <span>🔴</span> Offline {offlineCount > 0 && `(${offlineCount} antrean)`}
              </div>
            ) : offlineCount > 0 ? (
              <div className="badge badge-warning" style={{gap: '6px', padding: '6px 12px'}}>
                <span>⏳</span> Menyinkronkan...
              </div>
            ) : null}
            <button className="icon-btn" title="Notifikasi">🔔</button>
            <button className="icon-btn" title={isDarkMode ? "Mode Terang" : "Mode Gelap"} onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <div className="user-avatar" style={{width:'36px', height:'36px', fontSize:'0.8rem'}}>{user.avatar}</div>
          </div>
        </header>

        {isFullWidth ? (
          <KasirPage user={user} />
        ) : (
          <div className="page-content">
            {activePage === 'dashboard'  && <Dashboard user={user} />}
            {activePage === 'inventori'  && <InventoriPage />}
            {activePage === 'pembelian'  && <PembelianPage />}
            {activePage === 'kds'        && <KDSPage />}
            {activePage === 'meja'       && <MejaPage />}
            {activePage === 'laporan'    && <LaporanPage />}
            {activePage === 'pengaturan' && <PengaturanPage />}
            {activePage === 'menu'       && <MenuPage />}
            {activePage === 'pelanggan'  && <PelangganPage />}
            {activePage === 'shift'      && <ShiftPage user={user} />}
            {activePage === 'superadmin' && <SuperAdminPage />}
          </div>
        )}
      </div>
    </div>
  );
}
