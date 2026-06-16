import React, { Suspense, lazy } from 'react';
import { useAppStore } from './store/useAppStore';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// LAZY LOADING — setiap halaman dimuat hanya saat dibutuhkan.
// ─────────────────────────────────────────────────────────────────────────────
const GuestMenuPage      = lazy(() => import('./pages/GuestMenuPage'));
const CustomerPortalPage = lazy(() => import('./pages/CustomerPortalPage'));

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON — Zinc + Amber shimmer
// ─────────────────────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center w-16 h-16">
        <span className="absolute inline-flex w-full h-full rounded-full bg-amber-400 opacity-30 animate-ping" />
        <span className="relative flex w-10 h-10 rounded-full bg-amber-500 items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-zinc-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707"
            />
          </svg>
        </span>
      </div>
      <div className="w-56 space-y-3 mt-2">
        <div className="h-2.5 bg-zinc-700 rounded animate-pulse" />
        <div className="h-2 bg-zinc-800 rounded animate-pulse w-4/5 mx-auto" />
        <div className="h-2 bg-zinc-800 rounded animate-pulse w-3/5 mx-auto" />
      </div>
      <p className="text-xs text-zinc-500 font-mono mt-1 animate-pulse">Memuat halaman…</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH GUARD
// Jika belum login sebagai member → kembali ke GuestMenuPage.
// Login member dilakukan melalui modal di GuestMenuPage (cukup nomor HP).
// ─────────────────────────────────────────────────────────────────────────────
const AuthGuard = () => {
  const user = useAppStore(state => state.user);
  if (!user) return <Navigate to="/guest" replace />;
  return <Outlet />;
};

// ─────────────────────────────────────────────────────────────────────────────
// APP ROUTES
//
// Alur Customer Portal:
//  • Guest  → /guest atau /store/:tenantId/:tableNumber  (tanpa login)
//  • Member → login via modal di GuestMenuPage (nomor HP) → /customer
//
// Route /login dan /register DIHAPUS — tidak diperlukan di customer portal.
// Login staff/admin ada di aplikasi terpisah (pos-client / merchant-office).
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  const user   = useAppStore(state => state.user);
  const logout = useAppStore(state => state.logout);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public routes — akses bebas tanpa login ─── */}
        <Route path="/guest"                              element={<GuestMenuPage />} />
        <Route path="/guest-menu"                        element={<GuestMenuPage />} />
        <Route path="/order"                             element={<GuestMenuPage />} />
        <Route path="/store/:tenantId/:tableNumber"      element={<GuestMenuPage />} />
        <Route path="/store/:tenantId"                   element={<GuestMenuPage />} />

        {/* ── Protected member routes ────────────────── */}
        <Route element={<AuthGuard />}>
          <Route
            path="/customer"
            element={<CustomerPortalPage user={user} onLogout={logout} />}
          />
        </Route>

        {/* ── Fallback & redirect lama ───────────────── */}
        {/* /login dan /register diarahkan ke /guest — login ada di modal HP */}
        <Route path="/login"    element={<Navigate to="/guest" replace />} />
        <Route path="/register" element={<Navigate to="/guest" replace />} />
        <Route path="*"         element={<Navigate to="/guest" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
