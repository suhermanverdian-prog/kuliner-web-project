import React from 'react';
import { useAppStore } from './store/useAppStore';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import KasirPage from './pages/KasirPage';
import KDSPage from './pages/KDSPage';
import MejaPage from './pages/MejaPage';
import ShiftPage from './pages/ShiftPage';
import LoginPage from './pages/LoginPage';

// Guard: jika belum login → redirect ke /login
const AuthGuard = () => {
  const user = useAppStore(state => state.user);
  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Guard: jika sudah login → jangan tampilkan halaman login lagi
const GuestGuard = () => {
  const user = useAppStore(state => state.user);
  if (user && user.token) {
    return <Navigate to="/kasir" replace />;
  }
  return <Outlet />;
};

function App() {
  const user = useAppStore(state => state.user);

  return (
    <Routes>
      {/* Route publik: halaman login */}
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Route terproteksi: harus login dulu */}
      <Route element={<AuthGuard />}>
        <Route element={<MainLayout />}>
          <Route path="/kasir"  element={<KasirPage user={user} />} />
          <Route path="/kds"    element={<KDSPage />} />
          <Route path="/meja"   element={<MejaPage />} />
          <Route path="/shifts" element={<ShiftPage user={user} />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="/"  element={<Navigate to="/kasir" replace />} />
      <Route path="*"  element={<Navigate to="/kasir" replace />} />
    </Routes>
  );
}

export default App;

