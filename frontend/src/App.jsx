import React, { useState, useEffect } from 'react';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import KasirPage from './pages/KasirPage';
import MenuPage from './pages/MenuPage';
import InventoriPage from './pages/InventoriPage';
import LaporanPage from './pages/LaporanPage';
import PengaturanPage from './pages/PengaturanPage';
import KdsPage from './pages/KDSPage';
import PelangganPage from './pages/PelangganPage';
import TablePage from './pages/MejaPage';
import ShiftPage from './pages/ShiftPage';
import SuperAdminPage from './pages/SuperAdminPage';
import PembelianPage from './pages/PembelianPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import GuestMenuPage from './pages/GuestMenuPage';
import ActivityLogPage from './pages/ActivityLogPage';
import AkunPage from './pages/AkunPage';
import OutletPage from './pages/OutletPage';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-red-500 p-10 font-mono text-xs flex flex-col items-center justify-center">
          <div className="max-w-2xl w-full">
            <h1 className="text-2xl font-bold mb-4">CRITICAL SYSTEM ERROR</h1>
            <pre className="bg-red-500/10 p-6 rounded-xl border border-red-500/20 overflow-auto max-w-full text-[10px] leading-relaxed">
              {this.state.error?.stack || this.state.error?.message || 'Unknown Error'}
            </pre>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }} 
              className="mt-6 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
            >
              RESET & REBOOT SYSTEM
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/akuntansi') setActivePage('akuntansi');
      if (hash === '#/outlets') setActivePage('outlets');
      if (hash === '#/login') setActivePage('dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on mount
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setActivePage('dashboard');
    // Log Activity
    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
      ? 'http://localhost:3001/api' 
      : 'https://kuliner-web-project.vercel.app/api';
    fetch(`${API_BASE}/system-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: userData.name,
        role: userData.role,
        activityType: 'LOGIN',
        description: `User ${userData.name} berhasil login ke sistem.`
      })
    }).catch(e => console.error('Log failed', e));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const isGuestUrl = window.location.hash.includes('/guest');

  if (loading) return null;
  if (isGuestUrl) return <GuestMenuPage />;
  if (!user) return <LoginPage onLogin={handleLogin} />;

  if (user && user.role === 'customer') {
    return <CustomerPortalPage user={user} onLogout={handleLogout} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':  return <Dashboard user={user} onNavigate={setActivePage} />;
      case 'kasir':      return <KasirPage user={user} onNavigate={setActivePage} />;
      case 'menu':       return <MenuPage user={user} />;
      case 'inventori':  return <InventoriPage user={user} />;
      case 'laporan':    return <LaporanPage user={user} />;
      case 'pengaturan': return <PengaturanPage user={user} />;
      case 'kds':        return <KdsPage user={user} />;
      case 'pelanggan':  return <PelangganPage user={user} />;
      case 'meja':       return <TablePage user={user} />;
      case 'shift':      return <ShiftPage user={user} onNavigate={setActivePage} />;
      case 'superadmin': return <SuperAdminPage user={user} />;
      case 'activity-log': return <ActivityLogPage />;
      case 'pembelian':  return <PembelianPage user={user} />;
      case 'akuntansi':  return <AkunPage user={user} />;
      case 'outlets':    return <OutletPage user={user} />;
      default:           return <Dashboard user={user} />;
    }
  };

  return (
    <ErrorBoundary>
      <MainLayout 
        user={user} 
        activePage={activePage} 
        onNavigate={setActivePage}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      >
        {renderPage()}
      </MainLayout>
    </ErrorBoundary>
  );
}

export default App;
