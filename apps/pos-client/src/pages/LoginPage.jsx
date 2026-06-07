import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api';
import { Coffee, Eye, EyeOff, LogIn, Loader2, ShieldAlert } from 'lucide-react';

const STAFF_ROLES = [
  { key: 'staff',      label: 'Kasir / Staff',  icon: '💰', desc: 'Akses kasir & pesanan' },
  { key: 'manager',   label: 'Manager',         icon: '⚙️', desc: 'Manajemen operasional' },
  { key: 'chef',      label: 'Chef / KDS',      icon: '👨‍🍳', desc: 'Akses dapur & KDS' },
  { key: 'owner',     label: 'Owner',           icon: '👑', desc: 'Akses penuh bisnis' },
  { key: 'superadmin',label: 'Super Admin',     icon: '🛡️', desc: 'Akses sistem penuh' },
  { key: 'accounting',label: 'Accounting',      icon: '📊', desc: 'Laporan keuangan' },
  { key: 'hrd',       label: 'HRD',             icon: '👥', desc: 'Manajemen SDM' },
];

const DEMO_CREDENTIALS = {
  superadmin: { username: 'messi',       password: 'goal10' },
  owner:      { username: 'beckham',     password: 'owner7' },
  manager:    { username: 'ronaldo',     password: 'siuuu7' },
  accounting: { username: 'debruyne',   password: 'assist17' },
  chef:       { username: 'lewandowski',password: 'finisher9' },
  staff:      { username: 'haaland',    password: 'robot9' },
  hrd:        { username: 'vandijk',    password: 'wall4' },
};

export default function LoginPage() {
  const setUser    = useAppStore(state => state.setUser);
  const navigate   = useNavigate();

  const [selectedRole, setSelectedRole] = useState('staff');
  const [username,     setUsername]     = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      return setError('Harap isi username dan password.');
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.login({ username: username.trim(), password, role: selectedRole });
      setUser(res);
      navigate('/kasir', { replace: true });
    } catch {
      setError('Kredensial atau role tidak valid. Periksa kembali data login Anda.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    const cred = DEMO_CREDENTIALS[selectedRole];
    if (cred) { setUsername(cred.username); setPassword(cred.password); setError(''); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 text-zinc-950 rounded-2xl mb-4 shadow-lg shadow-amber-500/30">
            <Coffee size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-zinc-50 tracking-tight">KEN POS Client</h1>
          <p className="text-sm text-zinc-500 mt-1">Masuk untuk memulai sesi kasir</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">

          {/* Role selector */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Pilih Jabatan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STAFF_ROLES.map(r => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => { setSelectedRole(r.key); setError(''); }}
                  className={[
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-150 active:scale-[0.97]',
                    selectedRole === r.key
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                  ].join(' ')}
                >
                  <span className="text-base leading-none">{r.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{r.label}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                autoComplete="username"
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-rose-950/30 border border-rose-800 text-rose-400 text-xs">
                <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-950 rounded-lg font-bold text-sm hover:bg-amber-400 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</>
              ) : (
                <><LogIn size={16} /> Masuk ke POS</>
              )}
            </button>
          </form>

          {/* Demo fill button */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={fillDemo}
              className="w-full text-xs text-zinc-500 hover:text-amber-400 transition-colors py-1.5 font-mono"
            >
              ✨ Isi Demo: {DEMO_CREDENTIALS[selectedRole]?.username} ({selectedRole})
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          KEN Enterprise POS · v3.0
        </p>
      </div>
    </div>
  );
}
