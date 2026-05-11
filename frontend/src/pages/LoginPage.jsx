import { useState } from 'react';
import { api } from '../api';
import { 
  Coffee, Lock, User, Phone, 
  ShieldCheck, ArrowRight, Sparkles,
  ChevronRight, Laptop, UserCircle, Briefcase,
  Smartphone, Mail, CheckCircle2, Star,
  Zap, LayoutDashboard, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";

export default function LoginPage({ onLogin, memberOnly = false, onGoRegister, onBack }) {
  const [selectedRole, setSelectedRole] = useState(memberOnly ? 'customer' : 'kasir');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const staffRoles = [
    { key: 'kasir', label: 'Kasir', icon: '💰' },
    { key: 'admin', label: 'Manajer', icon: '⚙️' },
    { key: 'owner', label: 'Owner', icon: '👑' },
    { key: 'superadmin', label: 'SuperAdmin', icon: '🛡️' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return setError('Harap isi semua kolom');
    setLoading(true); setError('');
    try {
      const res = await api.login(username, password, selectedRole);
      onLogin(res.user);
    } catch {
      setError('Kredensial atau role tidak valid');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    if (selectedRole === 'customer') { setUsername('08123456789'); setPassword('user123'); }
    else { setUsername(selectedRole); setPassword('password123'); }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] bg-accent/20 blur-[150px] rounded-full animate-pulse duration-[10s]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] bg-primary/10 blur-[150px] rounded-full animate-pulse duration-[8s] delay-1000" />
        <div className="absolute top-[30%] right-[10%] w-[10%] h-[10%] bg-emerald-500/10 blur-[80px] rounded-full" />
      </div>

      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-0 lg:gap-8 p-4 lg:p-10 relative z-10 items-center justify-center">
        
        {/* Brand Side (Visible on Desktop) */}
        <div className="hidden lg:flex flex-col flex-1 space-y-8 animate-in fade-in slide-in-from-left-12 duration-1000">
           <div className="w-20 h-20 bg-accent rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-accent/40 rotate-6 hover:rotate-0 transition-all duration-700">
              <Coffee className="text-white" size={42} />
           </div>
           <div className="space-y-4">
              <h1 className="text-7xl font-black tracking-tighter text-primary leading-none">KEN <span className="text-accent">ERP</span></h1>
              <p className="text-xl font-medium text-muted-foreground max-w-md leading-relaxed">Antarmuka ERP premium untuk operasional coffee shop yang lebih cerdas, cepat, dan modern.</p>
           </div>
           
           <div className="grid grid-cols-2 gap-6 pt-10">
              <div className="flex items-center gap-4 group">
                 <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:bg-accent/10 group-hover:text-accent transition-all">
                    <Zap size={24} />
                 </div>
                 <div>
                    <p className="text-sm font-black uppercase tracking-widest">Ultra Fast</p>
                    <p className="text-xs text-muted-foreground font-medium">Optimasi performa cloud.</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 group">
                 <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:bg-accent/10 group-hover:text-accent transition-all">
                    <Star size={24} />
                 </div>
                 <div>
                    <p className="text-sm font-black uppercase tracking-widest">Premium UI</p>
                    <p className="text-xs text-muted-foreground font-medium">Desain kelas dunia.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-[480px] border-none shadow-[0_32px_128px_-32px_rgba(0,0,0,0.15)] bg-background/70 backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-12 duration-1000 relative overflow-hidden rounded-[3rem]">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent via-amber-400 to-accent animate-gradient-x" />
          
          <CardHeader className="text-center pt-12 pb-8 space-y-4">
            <div className="lg:hidden w-16 h-16 bg-accent mx-auto rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 mb-4">
              <Coffee className="text-white" size={32} />
            </div>
            <div>
              <CardTitle className="text-4xl font-black tracking-tight text-primary">Selamat Datang</CardTitle>
              <CardDescription className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mt-2">Pintu Masuk Digital Anda</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="px-10 pb-8 space-y-8">
            {/* Role Switcher */}
            {!memberOnly && (
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Pilih Mode Akses</p>
                <div className="flex bg-muted/30 p-1.5 rounded-2xl border border-muted/50 overflow-x-auto no-scrollbar gap-1">
                  <button
                    type="button"
                    onClick={() => { setSelectedRole('customer'); setError(''); }}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap",
                      selectedRole === 'customer' 
                        ? "bg-background text-accent shadow-xl border border-muted" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Pelanggan
                  </button>
                  <div className="w-px h-4 bg-muted-foreground/10 my-auto mx-1" />
                  <div className="flex-1 flex gap-1">
                    {staffRoles.map(role => (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => { setSelectedRole(role.key); setError(''); }}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex-1",
                          selectedRole === role.key 
                            ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105 z-10" 
                            : "text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        {role.key === 'kasir' ? 'Staff' : role.key === 'admin' ? 'Mgr' : role.key === 'owner' ? 'Own' : 'Sys'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">
                  {selectedRole === 'customer' ? 'Email / Nomor HP' : 'ID Pengguna'}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-focus-within:bg-accent/10 group-focus-within:text-accent transition-all text-muted-foreground">
                    {selectedRole === 'customer' ? <Smartphone size={16} /> : <UserCircle size={16} />}
                  </div>
                  <Input 
                    placeholder={selectedRole === 'customer' ? '08123456789' : 'Username'}
                    className="pl-14 h-14 bg-muted/20 border-none rounded-2xl focus:bg-background focus:ring-2 focus:ring-accent/20 transition-all font-bold"
                    value={username} onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-2">
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Kata Sandi</label>
                   <button type="button" className="text-[9px] font-black text-accent hover:text-accent/80 uppercase tracking-widest transition-colors">Lupa Sandi?</button>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-focus-within:bg-accent/10 group-focus-within:text-accent transition-all text-muted-foreground">
                    <Lock size={16} />
                  </div>
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    className="pl-14 h-14 bg-muted/20 border-none rounded-2xl focus:bg-background focus:ring-2 focus:ring-accent/20 transition-all font-bold"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 text-destructive text-[11px] font-black flex items-center gap-3 animate-in shake-in duration-500">
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">!</div>
                  {error}
                </div>
              )}

              <div className="pt-4 flex flex-col gap-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-16 text-lg font-black shadow-2xl shadow-accent/30 rounded-2xl group relative overflow-hidden bg-accent hover:bg-accent/90"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? 'Memvalidasi...' : 'Masuk Ke Sistem'}
                    {!loading && <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-300" />}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={fillDemo}
                  className="w-full h-12 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/30 rounded-xl"
                >
                  <Zap size={14} className="mr-2 text-amber-500" /> Akses Demo Otomatis
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="bg-muted/10 p-10 flex flex-col items-center gap-6 border-t border-muted">
            {selectedRole === 'customer' ? (
              <div className="text-center space-y-4">
                 <p className="text-xs font-bold text-muted-foreground">Belum bergabung dengan loyalti kami?</p>
                 <Button variant="outline" className="w-full h-11 border-accent text-accent font-black uppercase tracking-widest rounded-xl hover:bg-accent hover:text-white transition-all" onClick={onGoRegister}>Daftar Member Baru</Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-2 px-4 bg-background/50 rounded-full border shadow-sm group hover:border-accent transition-all cursor-default">
                 <ShieldCheck size={14} className="text-accent group-hover:scale-125 transition-transform" />
                 <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Enkripsi AES-256 Terlindungi</span>
              </div>
            )}
            <div className="flex gap-4 opacity-30 grayscale hover:grayscale-0 transition-all">
               <LayoutDashboard size={16} /> <Globe size={16} /> <Mail size={16} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/50">Kitchen Enterprise Nodes (KEN) v1.0 &copy; 2025</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
