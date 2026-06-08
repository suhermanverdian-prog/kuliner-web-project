import React from 'react';
import { 
  Command, Lock, User,
  ShieldCheck, ArrowRight,
  Smartphone, Mail,
  Star, Zap, LayoutDashboard, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { useLoginPage } from '../hooks/useLoginPage';

export default function LoginPage({ onLogin, memberOnly = false, onGoRegister, onBack }) {
  const {
    selectedRole, setSelectedRole,
    username, setUsername,
    password, setPassword,
    error, setError,
    loading,
    staffRoles,
    handleLogin,
    fillDemo
  } = useLoginPage(onLogin, memberOnly);

  return (
    /* h-screen + overflow-hidden → konten tidak pernah melebihi viewport */
    <div className="h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans tabular-nums">

      {/* Dekorasi latar — pointer-events-none agar tidak mengganggu klik */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Wrapper dua-kolom — tidak pernah lebih tinggi dari layar */}
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 px-4 sm:px-8 lg:px-12 relative z-10">

        {/* ───── Brand Side (desktop only) ───── */}
        <div className="hidden lg:flex flex-col flex-1 gap-6 animate-in fade-in slide-in-from-left-8 duration-700">
          <Command className="text-zinc-900 dark:text-zinc-100" size={36} />

          <div className="space-y-3">
            <h1 className="text-5xl xl:text-6xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 leading-none">
              KEN <span className="text-amber-500">ENTERPRISE</span>
            </h1>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
              Antarmuka ERP premium untuk manajemen operasional berskala global yang lebih cerdas, cepat, dan modern.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { icon: <Zap size={18} />, title: 'Ultra Fast', desc: 'High-Performance Cloud.' },
              { icon: <Star size={18} />, title: 'SaaS Elite', desc: 'Premium Enterprise Interface.' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 group-hover:text-amber-500 transition-colors border border-zinc-200 dark:border-zinc-700 shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-900 dark:text-zinc-100">{f.title}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ───── Login Card ───── */}
        <Card className="w-full max-w-sm lg:max-w-[420px] border border-zinc-200 dark:border-zinc-700 shadow-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 rounded-lg overflow-hidden">

          {/* Amber accent stripe */}
          <div className="h-1 w-full bg-amber-500" />

          {/* Header */}
          <CardHeader className="text-center px-6 pt-5 pb-3 space-y-1">
            {/* Logo mobile */}
            <div className="lg:hidden flex justify-center mb-1">
              <Command className="text-zinc-900 dark:text-zinc-100" size={24} />
            </div>
            <CardTitle className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
              AUTHENTICATION
            </CardTitle>
            <CardDescription className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-400">
              Secure Gateway Access
            </CardDescription>
          </CardHeader>

          {/* Content */}
          <CardContent className="px-6 pb-4 space-y-4">

            {/* Role Switcher */}
            {!memberOnly && (
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-400 text-center">
                  Select Operational Role
                </p>
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg gap-1 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => { setSelectedRole('customer'); setError(''); }}
                    className={cn(
                      "shrink-0 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                      selectedRole === 'customer'
                        ? "bg-zinc-900 dark:bg-zinc-950 text-amber-400 shadow-md"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    )}
                  >
                    Customer
                  </button>
                  {staffRoles.map(role => (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => { setSelectedRole(role.key); setError(''); }}
                      className={cn(
                        "shrink-0 px-2.5 py-1.5 rounded-md text-[9px] font-black uppercase transition-all text-center whitespace-nowrap",
                        selectedRole === role.key
                          ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      )}
                    >
                      {role.key === 'superadmin' ? 'SYS'
                        : role.key === 'owner' ? 'OWN'
                        : role.key === 'manager' ? 'MGR'
                        : role.key === 'accounting' ? 'ACC'
                        : role.key === 'chef' ? 'KDS'
                        : role.key === 'staff' ? 'POS'
                        : 'HRD'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-3">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] px-1">
                  {selectedRole === 'customer' ? 'Identity Reference' : 'Operator Access Code'}
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-amber-500 transition-colors">
                    {selectedRole === 'customer' ? <Smartphone size={14} /> : <User size={14} />}
                  </div>
                  <Input
                    placeholder={selectedRole === 'customer' ? '0812xxxx' : 'Username'}
                    className="pl-9 h-10 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-amber-500/20 font-black text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em]">Credentials</label>
                  <button type="button" className="text-[9px] font-black text-amber-500 hover:text-amber-600 uppercase tracking-wider transition-colors">
                    Reset Password?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-amber-500 transition-colors">
                    <Lock size={14} />
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 h-10 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-amber-500/20 font-black text-base tracking-widest text-zinc-900 dark:text-zinc-100"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-[10px] font-black flex items-center gap-3">
                  <div className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0 text-rose-500">!</div>
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 font-black rounded-lg group active:scale-[0.98] transition-all bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                >
                  <span className="flex items-center justify-center gap-3 text-[11px] tracking-[0.3em] uppercase">
                    {loading ? 'INITIALIZING...' : 'AUTHORIZE ACCESS'}
                    {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />}
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={fillDemo}
                  className="w-full h-9 text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                >
                  <Zap size={12} className="mr-1.5 text-amber-500" /> Bypass Credentials (Demo)
                </Button>
              </div>
            </form>
          </CardContent>

          {/* Footer */}
          <CardFooter className="px-6 py-3 flex flex-col items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            {selectedRole === 'customer' ? (
              <div className="w-full text-center space-y-2">
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.4em]">Join the Global Enterprise Network</p>
                <Button
                  variant="outline"
                  className="w-full h-9 border-amber-500 text-amber-600 dark:text-amber-400 font-black uppercase tracking-[0.25em] text-[9px] rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all"
                  onClick={onGoRegister}
                >
                  Initialize Membership
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-amber-500" />
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.35em]">Encrypted AES-256 Protocol</span>
              </div>
            )}

            <div className="flex gap-4 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 transition-colors cursor-pointer">
              <LayoutDashboard size={16} />
              <Globe size={16} />
              <Mail size={16} />
            </div>

            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-300 dark:text-zinc-600">
              KEN ENTERPRISE v4.0 • GLOBAL CLOUD ACTIVE
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
