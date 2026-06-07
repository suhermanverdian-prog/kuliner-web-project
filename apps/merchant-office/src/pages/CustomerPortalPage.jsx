import React from 'react';
import GuestMenuPage from './GuestMenuPage';
import { 
  User, 
  Award, 
  Ticket, 
  History, 
  ArrowLeft, 
  LogOut, 
  Star,
  Coffee,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { useCustomerPortalPage } from '../hooks/useCustomerPortalPage';

export default function CustomerPortalPage({ user, onLogout }) {
  const { 
    view, 
    setView, 
    loading, 
    points, 
    visits, 
    history, 
    error 
  } = useCustomerPortalPage(user);

  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-background font-mono tabular-nums">
        {/* Member Info Floating Bar */}
        <div className="sticky top-0 z-[110] bg-zinc-900 text-zinc-100 shadow-xl border-b border-zinc-800">
          <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-amber-500 border border-zinc-700">
                {user.avatar || user.name[0]}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold text-zinc-100">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star size={12} className="text-amber-500 fill-amber-500" />
                  <span className="text-[11px] font-mono tabular-nums font-bold text-amber-400">{points} PTS</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setView('profile')}
                className="h-9 px-4 rounded-md text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
              >
                <History size={14} className="mr-2 text-amber-500" /> Profil & Poin
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout}
                className="h-9 w-9 p-0 rounded-md bg-zinc-800 hover:bg-rose-950/30 hover:text-rose-400 border border-zinc-700 hover:border-rose-900/50"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Reuse the standardized GuestMenuPage */}
        <GuestMenuPage user={{ ...user, points }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-12">
      {/* Header Profile */}
      <div className="bg-zinc-900 border-b border-zinc-800 pt-10 pb-20 px-6 rounded-b-[2rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 text-zinc-800/20 rotate-12">
            <User size={180} />
        </div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <Button 
            variant="ghost" 
            onClick={() => setView('menu')}
            className="mb-8 text-zinc-400 hover:text-white hover:bg-zinc-800 px-3 h-8 text-xs font-bold border border-zinc-800 rounded-md"
          >
            <ArrowLeft size={14} className="mr-2" /> Kembali Belanja
          </Button>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-3xl text-amber-500 border border-zinc-700">
              {user.avatar || user.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-1">{user.name}</h1>
              <p className="text-sm text-zinc-400 font-medium">{user.phone || user.email || 'Member Premium'}</p>
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400">
                 <Award size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Enterprise Member</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-10 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Poin Anda', value: points, icon: Star, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'Voucher Aktif', value: '2', icon: Ticket, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Kunjungan', value: visits, icon: Coffee, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
          ].map((m, i) => (
            <Card key={i} className="border border-zinc-800 bg-zinc-900 overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-all">
              <CardContent className="p-6 text-center">
                <div className={cn("w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center border", m.color)}>
                  <m.icon size={20} />
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums leading-none text-white">{m.value}</p>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-2 leading-none">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <Button 
          onClick={() => setView('menu')}
          className="w-full h-14 rounded-lg bg-amber-400 text-zinc-950 hover:bg-amber-500 font-bold active:scale-95 shadow-lg shadow-amber-500/10 border-none transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" /> Mulai Pesan Sekarang
        </Button>

        {/* Loyalty Program Section */}
        <Card className="border border-zinc-800 bg-zinc-900 overflow-hidden">
          <CardHeader className="border-b border-zinc-800 bg-zinc-900/50 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-md font-bold text-white">Program Reward Pelanggan</CardTitle>
                <CardDescription className="text-zinc-400">Kumpulkan poin belanja dan klaim diskon belanja.</CardDescription>
              </div>
              <Award className="text-amber-400" size={24} />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
               <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Progress Voucher Berikutnya</p>
                    <p className="text-sm font-bold text-amber-400 font-mono tabular-nums">{points} / 100 PTS</p>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min((points / 100) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400 font-medium text-center">
                    Kumpulkan <span className="font-mono tabular-nums font-bold text-amber-400">{Math.max(0, 100 - points)} PTS</span> lagi untuk voucher diskon Rp 10.000!
                  </p>
               </div>

               <div className="grid grid-cols-1 gap-3 pt-4 border-t border-zinc-800 border-dashed">
                  {[
                    { text: 'Setiap Rp 10.000 transaksi = 1 poin loyalty', icon: '💰' },
                    { text: '100 poin reward = kupon diskon Rp 10.000', icon: '🎫' },
                    { text: 'Tukarkan voucher langsung di POS Kasir / Self-Order', icon: '⚡' },
                  ].map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-md bg-zinc-950 text-xs font-bold border border-zinc-800/50">
                       <span className="text-md">{rule.icon}</span>
                       <span className="text-zinc-300 font-medium">{rule.text}</span>
                    </div>
                  ))}
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Riwayat Transaksi Section */}
        <Card className="border border-zinc-800 bg-zinc-900 overflow-hidden">
          <CardHeader className="border-b border-zinc-800 bg-zinc-900/50 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-md font-bold text-white">Riwayat Pembelian Terbaru</CardTitle>
                <CardDescription className="text-zinc-400">Daftar 5 transaksi terakhir Anda di gerai kami.</CardDescription>
              </div>
              <Clock className="text-zinc-400" size={20} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-sm text-zinc-500 font-bold animate-pulse">Memuat riwayat transaksi...</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500 font-medium">Belum ada riwayat transaksi tercatat.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {history.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-zinc-300 font-mono tabular-nums">{tx.order_number}</p>
                      <p className="text-[11px] text-zinc-500 mt-1 font-mono tabular-nums">
                        {new Date(tx.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-400 font-mono tabular-nums">
                        Rp {Number(tx.total || 0).toLocaleString('id-ID')}
                      </p>
                      <span className={cn(
                        "inline-block text-[9px] font-bold px-2 py-0.5 rounded-sm mt-1 uppercase tracking-wider",
                        tx.payment_status === 'paid' 
                          ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800/50" 
                          : "bg-rose-950/30 text-rose-400 border border-rose-800/50"
                      )}>
                        {tx.payment_status === 'paid' ? 'Lunas' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          onClick={onLogout}
          className="w-full h-12 rounded-lg border-zinc-850 bg-transparent text-zinc-400 font-bold text-xs uppercase tracking-widest hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-905/30 transition-colors"
        >
          <LogOut size={14} className="mr-2" /> Keluar dari Sistem
        </Button>
      </div>
    </div>
  );
}
