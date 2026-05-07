import { useState } from 'react';
import { api } from '../api';

export default function LoginPage({ onLogin, memberOnly = false, onGoRegister, onBack }) {
  const [selectedRole, setSelectedRole] = useState(memberOnly ? 'customer' : 'kasir');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const staffRoles = [
    { key: 'kasir',    label: 'Kasir',       icon: '💰' },
    { key: 'koki',     label: 'Koki/Barista', icon: '👨‍🍳' },
    { key: 'admin',    label: 'Admin',        icon: '⚙️' },
    { key: 'owner',    label: 'Owner',        icon: '👑' },
    { key: 'gudang',   label: 'Gudang',       icon: '📦' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return setError('Harap isi semua kolom!');
    setLoading(true); setError('');
    try {
      const res = await api.login(username, password, selectedRole);
      onLogin(res.user);
    } catch {
      setError('Username, password, atau role salah!');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    if (selectedRole === 'customer') { setUsername('08123456789'); setPassword('user123'); }
    else if (selectedRole === 'admin') { setUsername('admin'); setPassword('admin123'); }
    else { setUsername(selectedRole); setPassword(selectedRole + '123'); }
  };

  // ── Mode Member Only (dipanggil dari GuestMenuPage) ──────────
  if (memberOnly) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2C1810 0%, #4A3728 50%, #6F4E37 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(200,146,58,0.1)' }} />

        <div style={{
          background: 'rgba(255,255,255,0.97)', borderRadius: '28px',
          padding: '44px 40px', width: '100%', maxWidth: '420px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          animation: 'slideUp 0.4s ease', position: 'relative'
        }}>
          <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }`}</style>

          {onBack && (
            <button onClick={onBack} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.85rem', marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>← Kembali ke Menu</button>
          )}

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '64px', height: '64px', margin: '0 auto 14px',
              background: 'linear-gradient(135deg, #6F4E37, #C8923A)',
              borderRadius: '16px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.75rem',
              boxShadow: '0 8px 24px rgba(111,78,55,0.3)'
            }}>☕</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#4A3728', marginBottom: '4px' }}>
              Login Member
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Masuk untuk menikmati keuntungan member
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">📱 No. HP / Email</label>
              <input className="form-control" type="text"
                placeholder="cth: 081234567890"
                value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">🔒 Password</label>
              <input className="form-control" type="password"
                placeholder="Masukkan password"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && (
              <div style={{ background: '#FEF0EE', color: '#E85D4A', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '16px' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg"
              style={{ justifyContent: 'center', marginBottom: '10px' }}>
              {loading ? '⏳ Memproses...' : '🔐 Login'}
            </button>
            <button type="button" onClick={fillDemo} className="btn btn-outline w-full"
              style={{ justifyContent: 'center' }}>
              💡 Isi Demo Otomatis
            </button>
          </form>

          {onGoRegister && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Belum punya akun?{' '}
                <button onClick={onGoRegister} style={{
                  background: 'none', border: 'none', color: 'var(--primary)',
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline'
                }}>Daftar Member</button>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Mode Login Staf Normal ───────────────────────────────────
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">☕</div>
          <h1 className="login-title">BrewMaster</h1>
          <p className="login-subtitle">Sistem Manajemen Coffee Shop</p>
        </div>

        <p className="form-label" style={{ marginBottom: '10px', textAlign: 'center' }}>Pilih Role Anda</p>
        <div className="role-selector">
          <button
            className={`role-chip ${selectedRole === 'customer' ? 'selected' : ''}`}
            onClick={() => { setSelectedRole('customer'); setUsername(''); setPassword(''); }}
            type="button"
          >
            <span className="role-icon">👤</span>Member
          </button>
          {staffRoles.map(r => (
            <button key={r.key}
              className={`role-chip ${selectedRole === r.key ? 'selected' : ''}`}
              onClick={() => { setSelectedRole(r.key); setUsername(''); setPassword(''); }}
              type="button"
            >
              <span className="role-icon">{r.icon}</span>{r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">
              {selectedRole === 'customer' ? 'Email / No. HP' : 'Username'}
            </label>
            <input id="username" className="form-control" type="text"
              placeholder={selectedRole === 'customer' ? 'Masukkan Email atau No. HP' : 'Masukkan username'}
              value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="password" className="form-control" type="password"
              placeholder="Masukkan password"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && (
            <div style={{ background: '#FEF0EE', color: '#E85D4A', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}
          <button id="btn-login" className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}
            style={{ justifyContent: 'center' }}>
            {loading ? '⏳ Memproses...' : '🔐 Masuk'}
          </button>
          <button type="button" onClick={fillDemo} className="btn btn-outline w-full mt-2"
            style={{ justifyContent: 'center' }}>
            💡 Isi Demo Otomatis
          </button>
          {selectedRole === 'customer' && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Belum punya akun?{' '}
                <a href="#/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Daftar Member</a>
              </p>
            </div>
          )}
        </form>

        <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: '20px' }}>
          BrewMaster v1.0 · © 2026 Coffee Shop Management
        </p>
      </div>
    </div>
  );
}
