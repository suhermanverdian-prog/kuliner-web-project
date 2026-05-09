import { useState } from 'react';
import { api } from '../api';
import { 
  Coffee, Lock, User, Phone, 
  ShieldCheck, ArrowRight, Sparkles,
  ChevronLeft, Smartphone, Mail, 
  CheckCircle2, Star, Zap, Gift,
  Shield, Trophy, Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";

export default function RegisterPage({ onSuccess, onGoLogin }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone || !form.password)
      return setError('Nama, nomor HP, dan password wajib diisi!');
    if (form.password.length < 6)
      return setError('Password minimal 6 karakter!');
    if (form.password !== form.confirmPassword)
      return setError('Konfirmasi password tidak cocok!');

    setLoading(true);
    try {
      const newCustomer = await api.addCustomer({
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        role: 'customer',
        avatar: form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      });
      onSuccess({ ...newCustomer, role: 'customer' });
    } catch (err) {
      setError('Gagal mendaftar. Data mungkin sudah terdaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent blur-[120px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[1000px] flex flex-col lg:flex-row gap-0 lg:gap-12 p-4 relative z-10 items-center justify-center">
        
        {/* Left Side: Benefits (Desktop) */}
        <div className="hidden lg:flex flex-col flex-1 space-y-10 animate-in fade-in slide-in-from-left-12 duration-1000">
           <div className="space-y-4">
              <Button variant="ghost" className="p-0 h-auto hover:bg-transparent text-accent font-black tracking-widest flex items-center gap-2 group" onClick={onGoLogin}>
                 <ChevronLeft className="group-hover:-translate-x-1 transition-transform" /> KEMBALI KE LOGIN
              </Button>
              <h1 className="text-5xl font-black text-primary leading-tight">Bergabunglah dengan <span className="text-accent">Elite Club</span> Kami.</h1>
              <p className="text-lg text-muted-foreground font-medium">Dapatkan akses eksklusif ke promo, reward, dan fitur self-order tercepat.</p>
           </div>

           <div className="space-y-6">
              {[
                { icon: Trophy, title: 'Reward Loyalty', desc: 'Kumpulkan poin tiap pembelian dan tukar dengan menu favorit.' },
                { icon: Gift, title: 'Voucher Ulang Tahun', desc: 'Hadiah spesial khusus untuk Anda setiap tahunnya.' },
                { icon: Zap, title: 'Antrian Prioritas', desc: 'Pesan via QR & lewati antrian panjang di kasir.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-3xl bg-white/50 backdrop-blur-sm border shadow-sm transition-all hover:translate-x-2">
                   <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-accent/20">
                      <item.icon size={24} />
                   </div>
                   <div>
                      <p className="font-black text-sm uppercase tracking-wider">{item.title}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">{item.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Right Side: Form Card */}
        <Card className="w-full max-w-[480px] border-none shadow-[0_32px_128px_-32px_rgba(0,0,0,0.2)] bg-background/80 backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-12 duration-1000 rounded-[3rem] overflow-hidden">
           <CardHeader className="text-center pt-12 pb-8 space-y-2">
              <div className="w-16 h-16 bg-accent mx-auto rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 mb-4 lg:hidden">
                 <Coffee className="text-white" size={32} />
              </div>
              <CardTitle className="text-3xl font-black tracking-tight">Daftar Member</CardTitle>
              <CardDescription className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Mulai Perjalanan Anda</CardDescription>
           </CardHeader>

           <CardContent className="px-10 pb-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Nama Lengkap *</label>
                    <div className="relative group">
                       <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={18} />
                       <Input className="pl-12 h-12 bg-muted/20 border-transparent focus:bg-background rounded-2xl font-bold" placeholder="cth: Rina Amelia" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Nomor WhatsApp *</label>
                    <div className="relative group">
                       <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={18} />
                       <Input className="pl-12 h-12 bg-muted/20 border-transparent focus:bg-background rounded-2xl font-bold" placeholder="cth: 08123456789" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    </div>
                    <p className="text-[9px] text-muted-foreground px-2 italic">Digunakan untuk konfirmasi pesanan & login.</p>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Email (Opsional)</label>
                    <div className="relative group">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={18} />
                       <Input className="pl-12 h-12 bg-muted/20 border-transparent focus:bg-background rounded-2xl font-bold" placeholder="rina@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Password</label>
                       <Input type="password" className="h-12 bg-muted/20 border-transparent focus:bg-background rounded-2xl font-bold" placeholder="••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Konfirmasi</label>
                       <Input type="password" className="h-12 bg-muted/20 border-transparent focus:bg-background rounded-2xl font-bold" placeholder="••••••" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} />
                    </div>
                 </div>

                 {error && (
                   <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 text-destructive text-[11px] font-black flex items-center gap-3 animate-in fade-in zoom-in-95">
                      <Shield size={14} /> {error}
                   </div>
                 )}

                 <Button type="submit" disabled={loading} className="w-full h-14 text-md font-black shadow-xl shadow-accent/20 bg-accent hover:bg-accent/90 rounded-2xl group overflow-hidden relative">
                    <span className="relative z-10 flex items-center gap-2">
                       {loading ? 'Sedang Memproses...' : 'Daftar Sekarang'}
                       {!loading && <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-accent to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </Button>

                 <div className="text-center pt-2">
                    <p className="text-xs font-medium text-muted-foreground">
                       Sudah punya akun? 
                       <button type="button" onClick={onGoLogin} className="text-accent font-black ml-1 hover:underline uppercase tracking-widest">Login Disini</button>
                    </p>
                 </div>
              </form>
           </CardContent>

           <CardFooter className="bg-muted/10 p-8 flex flex-col items-center gap-4 border-t border-muted">
              <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                 <Heart className="text-destructive fill-destructive" size={14} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Bergabung dengan 2,400+ member aktif lainnya</span>
              </div>
           </CardFooter>
        </Card>
      </div>
    </div>
  );
}
