// Cleaned CustomerPortalPage.jsx — Mobile-First RWD Applied
import React from 'react';
import GuestMenuPage from './GuestMenuPage';
import { User, Ticket, LogOut, Star, ShoppingBag, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useCustomerPortalPage } from '../hooks/useCustomerPortalPage';
import AvatarUploader from '../components/AvatarUploader';
import OTPVerification from '../components/OTPVerification';

export default function CustomerPortalPage({ user, onLogout }) {
  const {
    view,
    setView,
    loading,
    points,
    visits,
    totalSpend,
    tier,
    nextTier,
    progressPercent,
    progressLabel,
    history,
    promos,
    profileState,
    setProfileState,
    handleAvatarUpload,
    handleSendOtp,
    handleVerifyOtp,
    handleSaveProfile,
    handleReorder,
    handleClaimPromo,
  } = useCustomerPortalPage(user);

  const { name, phone, newPhone, otpCode, isOtpSent, avatarUrl } = profileState;

  const [preset, setPreset] = React.useState(() => {
    return localStorage.getItem('ken_portal_preset') || (document.documentElement.classList.contains('dark') ? 'Default Dark' : 'Default Light');
  });

  const [isLiquidTheme, setIsLiquidTheme] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('ken_portal_preset', preset);
    
    // Toggle dark mode class
    if (preset.includes('Dark')) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Toggle liquid theme state
    if (preset.includes('Liquid Glass')) {
      setIsLiquidTheme(true);
      document.documentElement.classList.add('theme-liquid');
    } else {
      setIsLiquidTheme(false);
      document.documentElement.classList.remove('theme-liquid');
    }
  }, [preset]);

  // ── Tab definitions ───────────────────────────────────────
  const tabs = [
    { key: 'dashboard', icon: Award,       label: 'Dashboard' },
    { key: 'menu',      icon: ShoppingBag, label: 'Menu' },
    { key: 'profile',   icon: User,        label: 'Profil' },
    { key: 'history',   icon: Clock,       label: 'Riwayat' },
    { key: 'promo',     icon: Ticket,      label: 'Promo' },
  ];

  // Helper untuk generate SVG Barcode secara dinamis
  const renderBarcodeSVG = (val) => {
    const bars = [];
    const seed = val ? val.charCodeAt(0) + val.charCodeAt(val.length - 1) : 42;
    let x = 10;
    for (let i = 0; i < 24; i++) {
      const width = ((seed + i * 7) % 3) + 1; // 1, 2, atau 3 pixel
      const gap = ((seed + i * 13) % 3) + 1;
      bars.push(<rect key={i} x={x} y="5" width={width} height="40" fill="currentColor" />);
      x += width + gap;
    }
    return (
      <svg className="w-40 h-12 text-zinc-900 dark:text-zinc-100 opacity-80" viewBox="0 0 120 50">
        {bars}
        <text x="60" y="48" fontSize="6" fontFamily="monospace" textAnchor="middle" fill="currentColor" className="tracking-[0.2em] font-bold">
          {val || 'MEMBER-ID'}
        </text>
      </svg>
    );
  };

  return (
    <div className={`min-h-screen text-zinc-900 dark:text-zinc-100 pb-20 sm:pb-8 transition-colors duration-300 relative overflow-hidden ${isLiquidTheme ? '' : 'bg-zinc-50 dark:bg-zinc-900'}`}>
      
      {/* Ornamen Liquid Glass Ambient Blobs — warna selaras aurora */}
      {isLiquidTheme && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
          <div className="absolute top-[-5%] left-[-5%] w-[55vw] h-[55vw] max-w-[500px] max-h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'pulse 9s ease-in-out infinite' }} />
          <div className="absolute top-[10%] right-[-5%] w-[50vw] h-[50vw] max-w-[450px] max-h-[450px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)', filter: 'blur(70px)', animation: 'pulse 13s ease-in-out infinite 2s' }} />
          <div className="absolute bottom-[5%] left-[20%] w-[45vw] h-[45vw] max-w-[400px] max-h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'pulse 11s ease-in-out infinite 4s' }} />
          <div className="absolute bottom-[15%] right-[5%] w-[40vw] h-[40vw] max-w-[360px] max-h-[360px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.14) 0%, transparent 70%)', filter: 'blur(65px)', animation: 'pulse 15s ease-in-out infinite 1s' }} />
        </div>
      )}

      {/* ── Sticky Top Bar ─────────────────────────────────── */}
      <header className={`sticky top-0 z-[110] border-b shadow-sm transition-colors duration-200 ${
        isLiquidTheme
          ? 'border-transparent'
          : 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800'
      }`}>
        <div className="max-w-3xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">

          {/* Avatar + nama + poin */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center font-bold text-amber-500 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="text-sm font-sans">{user?.name?.[0] ?? '?'}</span>
              }
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate max-w-[120px] sm:max-w-none">
                {name ?? user?.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={11} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                <span className="text-[11px] font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                  {points} PTS
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="h-9 px-2 sm:px-3 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option value="Default Light">Default Light</option>
              <option value="Default Dark">Default Dark</option>
              <option value="Light Liquid Glass">Light Liquid Glass</option>
              <option value="Dark Liquid Glass">Dark Liquid Glass</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('profile')}
              className="h-9 px-2 sm:px-4 rounded-md text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
            >
              <User size={14} className="text-amber-500 sm:mr-2" />
              <span className="hidden sm:inline">Profil</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-9 w-9 p-0 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-zinc-200 dark:border-zinc-700 hover:border-rose-200 dark:hover:border-rose-800/50"
            >
              <LogOut size={15} />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Desktop Tab Nav (hidden on mobile) ────────────── */}
      <nav className="hidden sm:block bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-850 relative z-10">
        <ul className="max-w-3xl mx-auto flex justify-center gap-1 p-2">
          {tabs.map(({ key, icon: Icon, label }) => (
            <li key={key}>
              <button
                onClick={() => setView(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all active:scale-95 ${
                  view === key
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 dark:bg-amber-400 dark:text-zinc-900'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon size={15} className={view === key ? '' : 'text-zinc-500 dark:text-zinc-400'} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Page Content ───────────────────────────────────── */}
      <main className="max-w-3xl mx-auto relative z-10">

        {/* Dashboard Tab */}
        {view === 'dashboard' && (
          <section className="p-4 sm:p-6 space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Award className="text-amber-500" size={24} /> Dashboard Member
            </h2>

            {/* Member Card Glassmorphic */}
            <div className={`relative rounded-lg p-6 overflow-hidden shadow-2xl transition-all duration-300 font-mono tabular-nums select-none flex flex-col justify-between min-h-[200px] active:scale-[0.98] ${
              isLiquidTheme
                ? 'bg-gradient-to-br from-white/10 via-zinc-900/40 to-zinc-950/80 border border-white/20 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                : 'bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-100 border border-zinc-750'
            }`}>
              {/* Decorative radial gradients for glow/glassmorphism effect */}
              {isLiquidTheme ? (
                <>
                  <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-tr from-amber-500/25 to-orange-600/35 rounded-full blur-2xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
                  <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-gradient-to-br from-emerald-500/15 to-teal-500/25 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                </>
              ) : (
                <>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                </>
              )}

              <div className="flex justify-between items-start gap-4 z-10">
                <div>
                  <h3 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-sans">BREWMASTER CULINARY CRM</h3>
                  <p className="text-lg font-black tracking-tight text-white mt-1 uppercase drop-shadow-sm">
                    {name ?? user?.name}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-sm border text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                  tier === 'VIP' 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/35'
                    : tier === 'Member'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/35'
                      : 'bg-zinc-700/30 text-zinc-300 border-zinc-650'
                }`}>
                  {tier} STATUS
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-sans font-bold">Loyalty Balance</div>
                  <div className="text-2xl font-black text-amber-400 font-mono tabular-nums drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
                    {points.toLocaleString('id-ID')} <span className="text-xs font-sans text-zinc-300">PTS</span>
                  </div>
                  <div className="text-[9px] text-zinc-500 font-sans font-bold uppercase tracking-wider">
                    ID: {phone || user?.phone || 'MEMBER-PORTAL'}
                  </div>
                </div>

                <div className="bg-white/95 dark:bg-white p-2 rounded-sm shadow-md flex-shrink-0 self-start sm:self-auto">
                  {renderBarcodeSVG(phone || user?.phone || 'MEMBER-ID')}
                </div>
              </div>
            </div>

            {/* CRM Status & Progress Info */}
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 transition-colors duration-200 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-zinc-850 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                  <Star size={16} className="text-amber-500 fill-amber-500" /> Detail Kunjungan &amp; Belanja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 font-mono tabular-nums">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-zinc-200 dark:border-zinc-800 text-center">
                    <div className="text-[10px] text-zinc-400 uppercase font-sans font-bold">Total Kunjungan</div>
                    <div className="text-lg font-black text-zinc-905 dark:text-zinc-100 mt-1">{visits}x</div>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-zinc-200 dark:border-zinc-800 text-center">
                    <div className="text-[10px] text-zinc-400 uppercase font-sans font-bold">Total Belanja</div>
                    <div className="text-lg font-black text-zinc-905 dark:text-zinc-100 mt-1">
                      Rp {totalSpend.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Progress bar to next level */}
                {nextTier && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Progres Ke Level {nextTier}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono tabular-nums">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-850">
                      <div 
                        className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold italic mt-1 leading-normal">
                      {progressLabel}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Menu tab */}
        {view === 'menu' && <GuestMenuPage user={{ ...user, points }} />}

        {/* Profile tab */}
        {view === 'profile' && (
          <section className="p-4 sm:p-6 space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">Profil Saya</h2>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <AvatarUploader
                  currentUrl={avatarUrl || user?.avatar}
                  onUpload={handleAvatarUpload}
                />
              </div>
              {/* Fields */}
              <div className="w-full space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase tracking-wider">Nama</label>
                  <p className="w-full p-3 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-850 dark:text-zinc-100 text-sm font-semibold">{name ?? user?.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase tracking-wider">Nomor HP</label>
                  <input
                    type="tel"
                    value={newPhone ?? phone ?? user?.phone ?? ''}
                    onChange={e => setProfileState(prev => ({ ...prev, newPhone: e.target.value }))}
                    placeholder="Masukkan nomor HP"
                    className="w-full p-3 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-850 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-semibold"
                  />
                  {!isOtpSent && (
                    <Button
                      className="mt-2 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-md shadow-amber-500/10 active:scale-95 transition-all h-9 px-4 rounded-md"
                      onClick={handleSendOtp}
                    >
                      Kirim OTP
                    </Button>
                  )}
                  {isOtpSent && (
                    <OTPVerification
                      code={otpCode}
                      onChange={code => setProfileState(prev => ({ ...prev, otpCode: code }))}
                      onVerify={handleVerifyOtp}
                    />
                  )}
                </div>
                <Button
                  className="w-full sm:w-auto bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-md shadow-amber-500/10 active:scale-95 transition-all h-10 px-6 rounded-md font-bold text-xs"
                  onClick={handleSaveProfile}
                >
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* History tab */}
        {view === 'history' && (
          <section className="p-4 sm:p-6 space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">Riwayat Pesanan</h2>
            {loading ? (
              <div className="text-center py-12 text-sm text-zinc-400 animate-pulse font-bold">Memuat riwayat transaksi…</div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-sm text-zinc-400">
                <Clock size={32} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                Belum ada riwayat transaksi.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(tx => (
                  <Card key={tx.id} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 transition-colors duration-200">
                    <CardContent className="p-4 flex items-center justify-between gap-3 font-mono tabular-nums">
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{tx.order_number}</p>
                        <p className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">
                          Rp {Number(tx.total || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <Button
                        className="flex-shrink-0 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-md shadow-amber-500/10 active:scale-95 transition-all h-9 px-4 rounded-md"
                        onClick={() => handleReorder(tx.id)}
                      >
                        Pesan Lagi
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Promo tab */}
        {view === 'promo' && (
          <section className="p-4 sm:p-6 space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Ticket className="text-amber-500" size={24} /> Promo &amp; Voucher Tersedia
            </h2>
            {loading ? (
              <div className="text-center py-12 text-sm text-zinc-400 animate-pulse font-bold">Memuat promo…</div>
            ) : promos.length === 0 ? (
              <div className="text-center py-12 text-sm text-zinc-400 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10">
                <Ticket size={32} className="mx-auto mb-3 text-zinc-350 dark:text-zinc-700" />
                Semua voucher telah digunakan atau ditukar. Kembali lagi nanti!
              </div>
            ) : (
              /* Grid 1 kolom di mobile, 2 kolom di tablet ke atas */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {promos.map(p => (
                  <div 
                    key={p.id} 
                    className="relative bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 flex flex-col justify-between min-h-[160px] overflow-hidden shadow-md group transition-all duration-200 font-mono tabular-nums"
                  >
                    {/* Lubang robekan tiket sebelah kiri */}
                    <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-205 dark:border-zinc-705 -translate-y-1/2 pointer-events-none" />
                    {/* Lubang robekan tiket sebelah kanan */}
                    <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-205 dark:border-zinc-705 -translate-y-1/2 pointer-events-none" />
                    
                    {/* Garis batas robekan tiket */}
                    <div className="absolute top-1/2 left-3 right-3 border-t border-dashed border-zinc-200 dark:border-zinc-700 -translate-y-1/2 pointer-events-none opacity-60" />

                    <div className="pb-8 space-y-1 z-10 pr-2 pl-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-black text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-sm border border-amber-500/10 uppercase">
                          {p.code}
                        </span>
                        {p.type && (
                          <span className="text-[10px] font-sans font-bold text-zinc-400 uppercase tracking-widest">
                            {p.type === 'percent' || p.type === 'percentage' ? `${p.value}% OFF` : `Rp ${Number(p.value).toLocaleString('id-ID')} OFF`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-sans font-bold text-zinc-800 dark:text-zinc-200 pt-2 line-clamp-2 leading-relaxed">
                        {p.desc || 'Diskon spesial untuk transaksi Anda'}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-4 z-10 pl-2 pr-2">
                      <div className="text-[9px] font-sans text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                        {p.min_order_amount > 0 ? `Min: Rp ${Number(p.min_order_amount).toLocaleString('id-ID')}` : 'Tanpa Min. Belanja'}
                      </div>
                      <Button
                        onClick={() => handleClaimPromo(p.code)}
                        className="text-[10px] font-black h-8 px-4 rounded-md bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 active:scale-95 transition-all shadow-md shadow-amber-500/10 uppercase tracking-wider"
                      >
                        Gunakan
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ── Mobile Bottom Navigation (visible only on mobile) ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] transition-colors duration-200">
        <ul className="flex justify-around">
          {tabs.map(({ key, icon: Icon, label }) => (
            <li key={key} className="flex-1 relative">
              <button
                onClick={() => setView(key)}
                className={`w-full flex flex-col items-center justify-center gap-0.5 py-2.5 transition-all active:scale-95 ${
                  view === key ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-400'
                }`}
              >
                <Icon
                  size={20}
                  className={view === key ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-400'}
                  strokeWidth={view === key ? 2.5 : 1.75}
                />
                <span className={`text-[10px] font-bold ${view === key ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-400'}`}>
                  {label}
                </span>
                {view === key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-500 dark:bg-amber-400 rounded-full" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

    </div>
  );
}
