import { useState, useEffect } from 'react';
import GuestMenuPage from './GuestMenuPage';
import { 
  User, 
  Award, 
  Ticket, 
  History, 
  ArrowLeft, 
  LogOut, 
  ChevronRight, 
  Star,
  Coffee,
  ShoppingBag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

export default function CustomerPortalPage({ user, onLogout }) {
  const [view, setView] = useState('menu'); // 'menu' | 'profile'

  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-background">
        {/* Member Info Floating Bar */}
        <div className="sticky top-0 z-[110] bg-primary text-primary-foreground shadow-xl border-b border-white/10">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center font-black text-xs shadow-lg shadow-black/20">
                {user.avatar || user.name[0]}
              </div>
              <div className="leading-none">
                <p className="text-sm font-black tracking-tight">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star size={10} className="text-accent fill-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent data-mono">{user.points || 0} PTS</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setView('profile')}
                className="h-9 px-4 rounded-xl text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 border-none"
              >
                <History size={14} className="mr-2" /> Profil
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout}
                className="h-9 w-9 p-0 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 border-none"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Reuse the standardized GuestMenuPage */}
        <GuestMenuPage user={user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header Profile */}
      <div className="bg-primary text-primary-foreground pt-12 pb-24 px-6 rounded-b-[4rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
            <User size={200} />
        </div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <Button 
            variant="ghost" 
            onClick={() => setView('menu')}
            className="mb-8 text-white/70 hover:text-white hover:bg-white/10 p-0 h-auto font-black uppercase tracking-widest text-[10px]"
          >
            <ArrowLeft size={14} className="mr-2" /> Kembali ke Menu
          </Button>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-accent text-accent-foreground flex items-center justify-center font-black text-3xl shadow-2xl shadow-black/40 ring-4 ring-white/10">
              {user.avatar || user.name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter mb-1">{user.name}</h1>
              <p className="opacity-60 text-sm font-medium tracking-wide">{user.phone || user.email || 'Member Premium'}</p>
              <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-white/10 rounded-full border border-white/5">
                 <Award size={14} className="text-accent" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Gold Member</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-12 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Poin Anda', value: user.points || 0, icon: Star, color: 'text-amber-500' },
            { label: 'Voucher', value: '2', icon: Ticket, color: 'text-indigo-500' },
            { label: 'Kunjungan', value: '14', icon: Coffee, color: 'text-emerald-500' },
          ].map((m, i) => (
            <Card key={i} className="border-none shadow-xl bg-card overflow-hidden group hover:scale-[1.02] transition-transform">
              <CardContent className="p-6 text-center">
                <div className={cn("w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center bg-muted/50", m.color)}>
                  <m.icon size={20} />
                </div>
                <p className="text-2xl font-black data-mono leading-none">{m.value}</p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-2 leading-none">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <Button 
          onClick={() => setView('menu')}
          className="w-full h-16 rounded-[2rem] bg-accent hover:bg-accent/90 text-accent-foreground font-black text-lg shadow-2xl shadow-accent/20 active-state group"
        >
          <ShoppingBag className="mr-2 group-hover:scale-110 transition-transform" /> Pesan Menu Sekarang
        </Button>

        {/* Loyalty Program Section */}
        <Card className="border-none shadow-xl bg-card overflow-hidden">
          <CardHeader className="border-b bg-muted/10 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Program Reward KEN</CardTitle>
                <CardDescription>Kumpulkan poin dan tukarkan dengan menu favorit.</CardDescription>
              </div>
              <Award className="text-accent" size={24} />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Progress Hadiah Berikutnya</p>
                    <p className="text-sm font-black text-primary data-mono">{user.points || 0} / 100 PTS</p>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-accent rounded-full shadow-sm transition-all duration-1000" 
                      style={{ width: `${Math.min(((user.points || 0) / 100) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium text-center">
                    Tinggal <span className="data-mono font-black text-primary">{Math.max(0, 100 - (user.points || 0))} poin</span> lagi untuk voucher diskon Rp 10.000!
                  </p>
               </div>

               <div className="grid grid-cols-1 gap-3 pt-4 border-t border-dashed">
                  {[
                    { text: 'Setiap Rp 10.000 pembelian = 1 poin', icon: '💰' },
                    { text: '100 poin = diskon Rp 10.000', icon: '🎫' },
                    { text: 'Poin berlaku selama 1 tahun', icon: '⏳' },
                  ].map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 text-xs font-bold">
                       <span className="text-lg">{rule.icon}</span>
                       <span className="text-muted-foreground">{rule.text}</span>
                    </div>
                  ))}
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          onClick={onLogout}
          className="w-full h-12 rounded-2xl border-muted text-muted-foreground font-black text-xs uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
        >
          <LogOut size={14} className="mr-2" /> Keluar dari Sistem
        </Button>
      </div>
    </div>
  );
}
