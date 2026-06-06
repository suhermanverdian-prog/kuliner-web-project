import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

// Components (Direct imports only for core layout)
import MainLayout from '@/components/MainLayout';
import PageTransition from '@/components/PageTransition';
import { hasFeature } from '@/lib/featureFlags';

// Lazy Loaded Pages (Performance Optimization)
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const KasirPage = lazy(() => import('@/pages/KasirPage'));
const MenuPage = lazy(() => import('@/pages/MenuPage'));
const InventoriPage = lazy(() => import('@/pages/InventoriPage'));
const LaporanPage = lazy(() => import('@/pages/LaporanPage'));
const PengaturanPage = lazy(() => import('@/pages/PengaturanPage'));
const KdsPage = lazy(() => import('@/pages/KDSPage'));
const PelangganPage = lazy(() => import('@/pages/PelangganPage'));
const TablePage = lazy(() => import('@/pages/MejaPage'));
const ShiftPage = lazy(() => import('@/pages/ShiftPage'));
const SuperAdminPage = lazy(() => import('@/pages/SuperAdminPage'));
const CustomerPortalPage = lazy(() => import('@/pages/CustomerPortalPage'));
const GuestMenuPage = lazy(() => import('@/pages/GuestMenuPage'));
const ActivityLogPage = lazy(() => import('@/pages/ActivityLogPage'));
const AIAssistantPage = lazy(() => import('@/pages/AIAssistantPage'));
const AkunPage = lazy(() => import('@/pages/AkunPage'));
const OutletPage = lazy(() => import('@/pages/OutletPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const AbsensiPage = lazy(() => import('@/pages/AbsensiPage'));
const LaporanAbsensiPage = lazy(() => import('@/pages/LaporanAbsensiPage'));
const LaporanHRDPage = lazy(() => import('@/pages/LaporanHRDPage'));
const MarketplacePage = lazy(() => import('@/pages/MarketplacePage'));
const CommandCenterPage = lazy(() => import('@/pages/CommandCenterPage'));
const RevenueIntelligencePage = lazy(() => import('@/pages/RevenueIntelligencePage'));
const ReportBuilderPage = lazy(() => import('@/pages/ReportBuilderPage'));
const ConsolidatedFinancePage = lazy(() => import('@/pages/ConsolidatedFinancePage'));
const WasteMonitoringPage = lazy(() => import('@/pages/WasteMonitoringPage'));
const LogisticsHubPage = lazy(() => import('@/pages/LogisticsHubPage'));
const ProcurementPage = lazy(() => import('@/pages/ProcurementPage'));
const TaxReportPage = lazy(() => import('@/pages/TaxReportPage'));
const InventoryIntelligencePage = lazy(() => import('@/pages/InventoryIntelligencePage'));
const BudgetPage = lazy(() => import('@/pages/BudgetPage'));
const BukuBesarPage = lazy(() => import('@/pages/BukuBesarPage'));
const StokOpnamePage = lazy(() => import('@/pages/StokOpnamePage'));

// Elite Loading Component
const PageLoader = () => (
  <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[9999] animate-in fade-in duration-500">
    <div className="relative">
      <div className="w-20 h-20 bg-amber-50 rounded-lg border border-amber-500/30 flex items-center justify-center text-zinc-950 font-black text-4xl shadow-2xl shadow-amber-500/20 animate-pulse">
        K
      </div>
      <div className="absolute -inset-4 border-2 border-amber-500/20 rounded-[2.5rem] animate-ping duration-[3s]" />
    </div>
    <div className="mt-8 space-y-2 text-center">
      <p className="text-sm font-black uppercase tracking-[0.4em] text-foreground">KEN Enterprise</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Neural Nodes...</p>
    </div>
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-rose-50 dark:bg-rose-950/30 rounded-[2.5rem] flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <AlertTriangle size={48} strokeWidth={2.5} />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">System Interrupt</h1>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Terjadi kendala teknis saat memuat modul ini. <br/>
                Jangan khawatir, data Anda tetap aman.
              </p>
            </div>
            <div className="flex flex-col gap-4 pt-4">
              <PrimaryButton
  onClick={() => window.location.reload()}
>
  MULAI ULANG SISTEM
</PrimaryButton>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route Wrapper
const ProtectedRoute = () => {
  const user = useAppStore(state => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return <MainLayout />;
};

// Feature Route Guard
const FeatureGuard = ({ feature, children }) => {
  const rawUser = useAppStore(state => state.user);
  const user = (rawUser && rawUser.user && rawUser.token) ? rawUser.user : rawUser;
  if (feature && !hasFeature(user, feature)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  const user = useAppStore(state => state.user);
  const setUser = useAppStore(state => state.setUser);
  const location = useLocation();

  useEffect(() => {
    if (user && location.pathname !== '/login') {
      // STEALTH MODE: Do not log SuperAdmin navigation
      if (user.role === 'superadmin') return;

      const silentLog = () => {
        // FIRE AND FORGET: Don't await, don't block the UI
        fetch(`${api.url}/system-logs`, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: user.name,
            role: user.role,
            activityType: 'NAVIGATE',
            description: `Access: ${location.pathname}`,
            outletId: useAppStore.getState().currentOutletId
          })
        }).catch(() => {}); // Silently ignore errors
      };
      silentLog();
    }
  }, [location.pathname, user]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes - Accessible without Login */}
        <Route path="/login" element={
          !user ? <LoginPage onLogin={setUser} /> : 
          <Navigate to={
            user.role === 'staff' ? "/kasir" : 
            user.role === 'chef' ? "/kds" : 
            user.role === 'hrd' ? "/hrd" : 
            user.role === 'accounting' ? "/accounting" :
            user.role === 'customer' ? "/customer" :
            user.role === 'superadmin' ? "/superadmin" :
            "/"
          } replace />
        } />
        <Route path="/register" element={<RegisterPage onSuccess={setUser} />} />
        <Route path="/guest/*" element={<GuestMenuPage />} />
        <Route path="/guest-menu" element={<GuestMenuPage />} />
        <Route path="/order" element={<GuestMenuPage />} />
        <Route path="/store/:tenantId/:tableNumber" element={<GuestMenuPage />} />
        <Route path="/store/:tenantId" element={<GuestMenuPage />} />
        <Route path="/absensi" element={<AbsensiPage />} />

        {/* Enterprise Layout (Protected) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/kasir" element={<FeatureGuard feature="pos"><KasirPage user={user} /></FeatureGuard>} />
          <Route path="/menu" element={<FeatureGuard feature="recipe_bom"><MenuPage user={user} /></FeatureGuard>} />
          <Route path="/inventory" element={<FeatureGuard feature="inventory"><InventoriPage user={user} /></FeatureGuard>} />
          <Route path="/reports" element={<FeatureGuard feature="reporting_pdf"><LaporanPage /></FeatureGuard>} />
          <Route path="/budget" element={<FeatureGuard feature="accounting"><BudgetPage /></FeatureGuard>} />
          <Route path="/settings" element={<PengaturanPage />} />
          <Route path="/kds" element={<FeatureGuard feature="kds"><KdsPage /></FeatureGuard>} />
          <Route path="/customers" element={<FeatureGuard feature="crm"><PelangganPage /></FeatureGuard>} />
          <Route path="/tables" element={<FeatureGuard feature="table_management"><TablePage /></FeatureGuard>} />
          <Route path="/shifts" element={<FeatureGuard feature="shift"><ShiftPage user={user} /></FeatureGuard>} />
          <Route path="/superadmin" element={<FeatureGuard feature="superadmin"><SuperAdminPage /></FeatureGuard>} />
          <Route path="/activity-log" element={<FeatureGuard feature="superadmin"><ActivityLogPage /></FeatureGuard>} />
          <Route path="/procurement" element={<FeatureGuard feature="procurement"><ProcurementPage /></FeatureGuard>} />
          <Route path="/pembelian" element={<Navigate to="/procurement" replace />} />
          <Route path="/ai-assistant" element={<FeatureGuard feature="ai_insights"><AIAssistantPage /></FeatureGuard>} />
          <Route path="/accounting" element={<FeatureGuard feature="accounting"><AkunPage /></FeatureGuard>} />
          <Route path="/buku-besar" element={<FeatureGuard feature="accounting"><BukuBesarPage /></FeatureGuard>} />
          <Route path="/command-center" element={<FeatureGuard feature="superadmin"><CommandCenterPage /></FeatureGuard>} />
          <Route path="/revenue-intel" element={<FeatureGuard feature="ai_insights"><RevenueIntelligencePage /></FeatureGuard>} />
          <Route path="/report-builder" element={<FeatureGuard feature="reporting_excel"><ReportBuilderPage /></FeatureGuard>} />
          <Route path="/consolidated-finance" element={<FeatureGuard feature="multi_outlet"><ConsolidatedFinancePage /></FeatureGuard>} />
          <Route path="/waste-monitoring" element={<FeatureGuard feature="waste_management"><WasteMonitoringPage /></FeatureGuard>} />
          <Route path="/logistics-hub" element={<FeatureGuard feature="stock_transfer"><LogisticsHubPage /></FeatureGuard>} />
          <Route path="/outlets" element={<FeatureGuard feature="multi_outlet"><OutletPage /></FeatureGuard>} />
          <Route path="/tax-report" element={<FeatureGuard feature="accounting"><TaxReportPage /></FeatureGuard>} />
          <Route path="/inventory-intel" element={<FeatureGuard feature="ai_insights"><InventoryIntelligencePage /></FeatureGuard>} />
          <Route path="/laporan-absensi" element={<FeatureGuard feature="hrd"><LaporanAbsensiPage /></FeatureGuard>} />
          <Route path="/hrd" element={<FeatureGuard feature="hrd"><LaporanHRDPage /></FeatureGuard>} />
          <Route path="/marketplace" element={<FeatureGuard feature="omnichannel"><MarketplacePage /></FeatureGuard>} />
          <Route path="/opname" element={<FeatureGuard feature="inventory"><StokOpnamePage /></FeatureGuard>} />
          <Route path="/customer" element={user?.role === 'customer' ? <CustomerPortalPage user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
