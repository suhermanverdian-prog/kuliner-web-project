import React from 'react';
import { 
  Command, Lock, User, Phone, 
  ShieldCheck, ArrowRight, Sparkles,
  ChevronRight, Laptop, UserCircle, Briefcase,
  Smartphone, Mail, CheckCircle2, Star,
  Zap, LayoutDashboard, Globe
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
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans font-mono tabular-nums">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] bg-amber- blur-[150px] rounded-lg animate-pulse duration-[10s]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] " />
      </div>

      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-0 lg:gap-16 p-8 lg:p-16 relative z-10 items-center justify-center">
        
        {/* Brand Side (Visible on Desktop) */}
        <div className="hidden lg:flex flex-col flex-1 space-y-12 animate-in fade-in slide-in-from-left-12 duration-1000">
           <div className="w-24 h-24 ">
              <Command className="text-zinc-950" size={48} />
           </div>
           <div className="space-y-6">
              <h1 className="text-8xl font-black tracking-tighter text-zinc-950 leading-none">KEN <span className="text-amber-500">ENTERPRISE</span></h1>
              <p className="text-xl font-medium text-zinc-500 dark:text-zinc-100 max-w-md leading-relaxed ">Antarmuka ERP premium untuk manajemen operasional berskala global yang lebih cerdas, cepat, dan modern.</p>
           </div>
           
           <div className="grid grid-cols-2 gap-10 pt-10">
              <div className="flex items-center gap-4 group">
                 <div className="w-16 h-16 rounded-lg bg-background flex items-center justify-center group-hover:bg-amber- group-hover:text-amber-500 transition-all border border-white/5">
                    <Zap size={28} />
                 </div>
                 <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em]">Ultra Fast</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-100 font-bold ">High-Performance Cloud Nodes.</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 group">
                 <div className="w-16 h-16 rounded-lg bg-background flex items-center justify-center group-hover:bg-amber- group-hover:text-amber-600 transition-all border border-white/5">
                    <Star size={28} />
                 </div>
                 <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em]">SaaS Elite</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-100 font-bold ">Premium Enterprise Interface.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-[480px] border-none shadow-[0_32px_128px_-32px_rgba(0,0,0,0.2)] bg-background/80 backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-12 duration-1000 relative overflow-hidden rounded-lg">
          <div className="absolute top-0 left-0 w-full h-2.5 " />
          
          <CardHeader className="text-center pt-8 pb-4 space-y-4">
            <div className="lg:hidden w-16 h-16 ">
              <Command className="text-zinc-950" size={32} />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-black tracking-tighter text-zinc-950">AUTHENTICATION</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 dark:text-zinc-100 mt-4">Secure Gateway Access</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8 space-y-8">
            {/* Role Switcher */}
            {!memberOnly && (
              <div className="space-y-4">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-500 dark:text-zinc-100 text-center ">Select Operational Role</p>
                <div className="flex bg-background p-2.5 rounded-lg border border-white/5 overflow-x-auto no-scrollbar gap-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedRole('customer'); setError(''); }}
                    className={cn(
                      "flex-1 px-8 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      selectedRole === 'customer' 
                        ? "bg-zinc-950 text-amber-500 shadow-2xl" 
                        : "text-zinc-500 dark:text-zinc-100 hover:text-foreground"
                    )}
                  >
                    Customer
                  </button>
                  <div className="flex-1 flex gap-2">
                    {staffRoles.map(role => (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => { setSelectedRole(role.key); setError(''); }}
                        className={cn(
                          "px-2 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex-1 text-center whitespace-nowrap overflow-hidden",
                          selectedRole === role.key 
                            ? "bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30" 
                            : "text-zinc-500 dark:text-zinc-100 hover:bg-background/5"
                        )}
                      >
                        {role.key === 'superadmin' ? 'SYS' : role.key === 'owner' ? 'OWN' : role.key === 'manager' ? 'MGR' : role.key === 'accounting' ? 'ACC' : role.key === 'chef' ? 'KDS' : role.key === 'staff' ? 'POS' : 'HRD'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-[0.4em] px-4">
                  {selectedRole === 'customer' ? 'Identity Reference' : 'Operator Access Code'}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-background flex items-center justify-center group-focus-within:bg-amber- group-focus-within:text-amber-500 transition-all text-zinc-500 dark:text-zinc-100">
                    {selectedRole === 'customer' ? <Smartphone size={16} /> : <User size={16} />}
                  </div>
                  <Input 
                    placeholder={selectedRole === 'customer' ? '0812xxxx' : 'Username'}
                    className="pl-14 h-14 bg-background border-none rounded-lg focus:bg-background focus:ring-2 focus:ring-amber-500/20 transition-all font-black text-base tracking-tight"
                    value={username} onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-4">
                   <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-[0.4em]">Credentials</label>
                   <button type="button" className="text-[9px] font-black text-amber-500 hover:text-amber-600 uppercase tracking-widest transition-colors">Reset Password?</button>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-background flex items-center justify-center group-focus-within:bg-amber- group-focus-within:text-amber-500 transition-all text-zinc-500 dark:text-zinc-100">
                    <Lock size={16} />
                  </div>
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    className="pl-14 h-14 bg-background border-none rounded-lg focus:bg-background focus:ring-2 focus:ring-amber-500/20 transition-all font-black text-xl tracking-widest"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-[11px] font-black flex items-center gap-4 animate-in shake-in duration-500">
                  <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">!</div>
                  {error}
                </div>
              )}

              <div className="pt-2 flex flex-col gap-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-16 text-white font-black shadow-xl shadow-amber-500/40 rounded-lg group relative overflow-hidden "
                >
                  <span className="relative z-10 flex items-center justify-center gap-4">
                    {loading ? 'INITIALIZING...' : 'AUTHORIZE ACCESS'}
                    {!loading && <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform duration-300" />}
                  </span>
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={fillDemo}
                  className="w-full h-12 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-100 hover:bg-background/5 rounded-lg border border-white/5"
                >
                  <Zap size={14} className="mr-2 text-amber-500" /> Bypass Credentials (Demo)
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="bg-background p-8 flex flex-col items-center gap-6 border-t border-white/5">
            {selectedRole === 'customer' ? (
              <div className="text-center space-y-8 w-full">
                 <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-[0.4em] ">Join the Global Enterprise Network</p>
                 <Button variant="outline" className="w-full h-16 border-amber-500 text-white font-black uppercase tracking-[0.3em] rounded-lg hover:" onClick={onGoRegister}>Initialize Membership</Button>
              </div>
            ) : (
              <div className="flex items-center gap-6 py-4 px-8 ">
                 <ShieldCheck size={20} className="text-amber-500 group-hover:scale-125 transition-transform" />
                 <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-[0.4em]">Encrypted AES-256 Protocol</span>
              </div>
            )}
            <div className="flex gap-10  grayscale hover:grayscale-0 transition-all cursor-pointer">
               <LayoutDashboard size={24} /> <Globe size={24} /> <Mail size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100/30">KEN ENTERPRISE NODES (v4.0) • GLOBAL CLOUD ACTIVE</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
