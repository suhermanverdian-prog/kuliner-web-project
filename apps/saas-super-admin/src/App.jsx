import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import MainLayout from '@/components/MainLayout';

const LoginPage        = lazy(() => import('@/pages/LoginPage'));
const SuperAdminPage   = lazy(() => import('@/pages/SuperAdminPage'));
const ActivityLogPage  = lazy(() => import('@/pages/ActivityLogPage'));
const CommandCenterPage = lazy(() => import('@/pages/CommandCenterPage'));
// Finance & Billing consolidated hub
const BillingPage        = lazy(() => import('@/pages/BillingPage'));
const PolicySettingsPage = lazy(() => import('@/pages/PolicySettingsPage'));
const APIWebhookPage     = lazy(() => import('@/pages/APIWebhookPage'));

const PageLoader = () => (
  <div className="fixed inset-0 bg-background flex items-center justify-center">
    <div className="w-16 h-16 bg-amber-50 border border-amber-500/30 rounded-lg flex items-center justify-center text-zinc-950 font-black text-3xl animate-pulse">K</div>
  </div>
);

// Hanya superadmin yang boleh akses
const SuperAdminGuard = ({ children }) => {
  const user = useAppStore(state => state.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'superadmin' && !user.is_superadmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl font-black text-foreground">🔒 Akses Ditolak</p>
          <p className="text-sm text-muted-foreground">Halaman ini hanya untuk Super Administrator.</p>
        </div>
      </div>
    );
  }
  return children;
};

function App() {
  const user    = useAppStore(state => state.user);
  const setUser = useAppStore(state => state.setUser);

  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/login"
            element={
              !user
                ? <LoginPage onLogin={setUser} />
                : <Navigate to="/superadmin" replace />
            }
          />

          {/* Wrap SuperAdmin routes inside MainLayout */}
          <Route element={<SuperAdminGuard><MainLayout /></SuperAdminGuard>}>
            <Route path="/superadmin" element={<SuperAdminPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/command-center" element={<CommandCenterPage />} />
            <Route path="/activity-log" element={<ActivityLogPage />} />
            <Route path="/policy-settings" element={<PolicySettingsPage />} />
            <Route path="/api-webhook" element={<APIWebhookPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to={user ? '/superadmin' : '/login'} replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;
