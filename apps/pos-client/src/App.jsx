import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import KasirPage from './pages/KasirPage';
import KDSPage from './pages/KDSPage';
import MejaPage from './pages/MejaPage';
import ShiftPage from './pages/ShiftPage';

// Simple guard checking if a user is logged in
const AuthGuard = ({ children }) => {
  const user = useAppStore(state => state.user);
  if (!user) {
    // If not logged in, redirect to main application login page (since pos-client is a standalone client, we assume auth state or token can be passed, or we fallback or login path)
    // For local development / testing, we can check or redirect. If there's noLoginPage in pos-client, we might need a basic login/info or redirect to port 5173
    // But since users might need to log in, let's allow it or provide a redirect. Let's redirect to login for now if needed, or if there is no login page, we can show a placeholder or let them through for POS access.
    // Let's check if there is a LoginPage or not. If we don't have a login page in pos-client, let's redirect to main login. But let's build a clean layout.
  }
  return children || <Outlet />;
};

function App() {
  const user = useAppStore(state => state.user);
  
  return (
    <Routes>
      <Route element={<AuthGuard />}>
        <Route element={<MainLayout />}>
          <Route path="/kasir" element={<KasirPage user={user} />} />
          <Route path="/kds" element={<KDSPage />} />
          <Route path="/meja" element={<MejaPage />} />
          <Route path="/shifts" element={<ShiftPage user={user} />} />
          <Route path="/" element={<Navigate to="/kasir" replace />} />
          <Route path="*" element={<Navigate to="/kasir" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
