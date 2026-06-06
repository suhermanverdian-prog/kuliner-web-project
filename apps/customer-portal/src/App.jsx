import React from 'react';
import { useAppStore } from './store/useAppStore';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import GuestMenuPage from './pages/GuestMenuPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Guard checking if a customer is logged in
const AuthGuard = () => {
  const user = useAppStore(state => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  const user = useAppStore(state => state.user);
  const setUser = useAppStore(state => state.setUser);
  const logout = useAppStore(state => state.logout);
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/guest" element={<GuestMenuPage />} />
      <Route path="/guest-menu" element={<GuestMenuPage />} />
      <Route path="/order" element={<GuestMenuPage />} />
      <Route path="/store/:tenantId/:tableNumber" element={<GuestMenuPage />} />
      <Route path="/store/:tenantId" element={<GuestMenuPage />} />
      
      <Route path="/login" element={user ? <Navigate to="/customer" replace /> : <LoginPage onLogin={setUser} memberOnly={true} />} />
      <Route path="/register" element={user ? <Navigate to="/customer" replace /> : <RegisterPage />} />

      {/* Protected customer routes */}
      <Route element={<AuthGuard />}>
        <Route path="/customer" element={<CustomerPortalPage user={user} onLogout={logout} />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/guest" replace />} />
    </Routes>
  );
}

export default App;
