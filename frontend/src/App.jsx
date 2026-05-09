import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import KasirPage from './pages/KasirPage';
import MenuPage from './pages/MenuPage';
import InventoriPage from './pages/InventoriPage';
import LaporanPage from './pages/LaporanPage';
import PengaturanPage from './pages/PengaturanPage';
import KdsPage from './pages/KdsPage';
import PelangganPage from './pages/PelangganPage';
import TablePage from './pages/TablePage';
import ShiftPage from './pages/ShiftPage';
import SuperAdminPage from './pages/SuperAdminPage';
import PembelianPage from './pages/PembelianPage';

import { api } from './api';
import { Menu, Moon, Sun, Bell } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  if (loading) return null;
  if (!user) return <LoginPage onLogin={handleLogin} />;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':  return <Dashboard user={user} />;
      case 'kasir':      return <KasirPage user={user} />;
      case 'menu':       return <MenuPage user={user} />;
      case 'inventori':  return <InventoriPage user={user} />;
      case 'laporan':    return <LaporanPage user={user} />;
      case 'pengaturan': return <PengaturanPage user={user} />;
      case 'kds':        return <KdsPage user={user} />;
      case 'pelanggan':  return <PelangganPage user={user} />;
      case 'meja':       return <TablePage user={user} />;
      case 'shift':      return <ShiftPage user={user} />;
      case 'superadmin': return <SuperAdminPage user={user} />;
      case 'pembelian':  return <PembelianPage user={user} />;
      default:           return <Dashboard user={user} />;
    }
  };

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        user={user} 
        activePage={activePage} 
        onNavigate={(p) => { setActivePage(p); setIsMobileOpen(false); }}
        onLogout={handleLogout}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="main-wrapper">
        <header className="top-nav">
          <div className="flex items-center gap-2">
            <button className="btn-new-ghost md:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-bold" style={{ textTransform: 'capitalize' }}>
              {activePage.replace('_', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-new-ghost" title="Notifikasi">
              <Bell size={18} />
            </button>
            <button className="btn-new-ghost" onClick={toggleTheme} title="Ganti Tema">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        <main className="content-area">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
