import { useState, useEffect } from 'react';
import { CreditCard, Receipt, Gauge, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { useSuperAdminPage } from '../hooks/useSuperAdminPage';

/* ─────────────────────────────────────────────────────────────────
   BILLING MODAL
   Muncul ketika tombol "KELOLA BILLING" diklik.
   Backdrop-click atau tombol X menutup modal.
───────────────────────────────────────────────────────────────── */
function BillingModal({ tenant, onClose, onConfirmPayment, getDaysRemaining }) {
  const [amount, setAmount]       = useState('');
  const [method, setMethod]       = useState('QRIS');
  const [duration, setDuration]   = useState('30');
  const [success, setSuccess]     = useState(false);

  // Tutup dengan Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Cegah scroll background
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleConfirm = () => {
    const num = Number(amount);
    if (!num || num <= 0) { alert('Masukkan nominal pembayaran yang valid.'); return; }
    onConfirmPayment(tenant.id, num, method, duration);
    setAmount('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  const sub      = tenant.feature_overrides?.subscription || {};
  const daysLeft = getDaysRemaining(sub.expires_at);
  const history  = tenant.feature_overrides?.billing_history || [];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal panel — stopPropagation agar klik di dalam tidak tutup */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-lg shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 bg-zinc-50 dark:bg-zinc-900/80 backdrop-blur border-b border-border">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Kelola Billing</p>
            <h3 className="text-xl font-black uppercase tracking-tighter text-foreground mt-0.5">
              {tenant.name}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                {tenant.tier?.toUpperCase() || 'N/A'}
              </span>
              <span className={cn(
                'text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                sub.payment_status === 'paid'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800'
              )}>
                {sub.payment_status || 'unpaid'}
              </span>
              <span className={cn(
                'text-[9px] font-mono tabular-nums font-bold',
                daysLeft === 'Expired' ? 'text-rose-500' : 'text-zinc-500'
              )}>
                {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('id-ID') : 'N/A'}
                {' '}({daysLeft})
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <X size={18} />
          </Button>
        </div>

        {/* ── Body */}
        <div className="p-8 space-y-8">

          {/* Form: Catat Pembayaran Baru */}
          <div className="space-y-5 bg-background/60 border border-border rounded-lg p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
              <CreditCard size={14} />
              Catat Pembayaran Baru
            </h4>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                Nominal Pembayaran (Rp)
              </label>
              <Input
                type="number"
                placeholder="Contoh: 250000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 text-sm font-mono tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                  Metode Bayar
                </label>
                <select
                  className="w-full h-11 px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground font-black uppercase"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="QRIS">QRIS</option>
                  <option value="Transfer">Transfer Bank</option>
                  <option value="Cash">Cash</option>
                  <option value="Kartu">Kartu Kredit/Debit</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                  Perpanjang Masa Aktif
                </label>
                <select
                  className="w-full h-11 px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground font-black"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="30">30 Hari (Bulanan)</option>
                  <option value="90">90 Hari (Triwulan)</option>
                  <option value="180">180 Hari (Semesteran)</option>
                  <option value="365">365 Hari (Tahunan)</option>
                </select>
              </div>
            </div>

            <Button
              className={cn(
                'w-full h-12 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-[0.98]',
                success
                  ? 'bg-emerald-500 text-white hover:bg-emerald-500'
                  : 'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-lg shadow-amber-500/20'
              )}
              onClick={handleConfirm}
            >
              {success
                ? <><CheckCircle2 size={16} className="mr-2" /> Pembayaran Dikonfirmasi!</>
                : 'Konfirmasi Pembayaran'}
            </Button>
          </div>

          {/* Riwayat Invoice */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-border pb-3">
              <Receipt size={12} className="inline mr-2" />
              Riwayat Invoice ({history.length})
            </h4>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-400">
                <Receipt size={32} className="text-zinc-300 dark:text-zinc-700" />
                <p className="text-[10px] font-black uppercase tracking-widest">Belum ada riwayat transaksi.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {history.map((inv, idx) => (
                  <div
                    key={inv.id || idx}
                    className="p-4 bg-background rounded-lg border border-border flex justify-between items-center gap-4"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-mono font-black text-sm text-foreground tabular-nums truncate">
                        {inv.invoice_number}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-mono tabular-nums">
                        {new Date(inv.payment_date).toLocaleDateString('id-ID')} &bull; {inv.payment_method}
                      </p>
                      {inv.expiry_date && (
                        <p className="text-[9px] text-zinc-400">
                          Aktif hingga: <span className="font-black text-amber-500">{new Date(inv.expiry_date).toLocaleDateString('id-ID')}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono font-black text-base text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap">
                        Rp {inv.amount?.toLocaleString('id-ID')}
                      </p>
                      <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 uppercase font-black px-2 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800">
                        LUNAS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   BILLING PAGE
───────────────────────────────────────────────────────────────── */
export default function BillingPage() {
  const {
    tenants,
    loading,
    filtered,
    fetchTenants,
    selectedTenantForBilling,
    setSelectedTenantForBilling,
    updateSubscriptionSettings,
    getDaysRemaining,
  } = useSuperAdminPage();

  const [activeTab, setActiveTab] = useState('subscription');

  // Dipanggil dari dalam modal
  const handleConfirmPayment = (tenantId, amount, method, duration) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant) return;

    const currentExpiry = tenant.feature_overrides?.subscription?.expires_at;
    const baseDate =
      currentExpiry && new Date(currentExpiry) > new Date()
        ? new Date(currentExpiry)
        : new Date();
    const expiryDate = new Date(
      baseDate.getTime() + Number(duration) * 24 * 60 * 60 * 1000
    );
    const invoiceNumber = `INV-${tenant.name.substring(0, 3).toUpperCase()}-${Date.now()
      .toString()
      .slice(-6)}`;

    const newInvoice = {
      id: Date.now(),
      invoice_number: invoiceNumber,
      amount,
      payment_method: method,
      payment_date: new Date().toISOString(),
      expiry_date: expiryDate.toISOString(),
      status: 'success',
    };

    updateSubscriptionSettings(
      tenantId,
      {
        expires_at: expiryDate.toISOString(),
        payment_status: 'paid',
        billing_cycle: Number(duration) === 365 ? 'yearly' : 'monthly',
      },
      newInvoice
    );
  };

  // Semua invoice untuk tab Invoices
  const allInvoices = filtered.flatMap((t) =>
    (t.feature_overrides?.billing_history || []).map((inv) => ({
      ...inv,
      clientName: t.name,
    }))
  );

  const tabs = [
    { id: 'subscription', label: 'Subskripsi', icon: CreditCard },
    { id: 'invoices',     label: 'Invoices',   icon: Receipt },
    { id: 'quota',        label: 'Quota',       icon: Gauge },
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">

      {/* ── BILLING MODAL (portal-style, muncul di atas semua konten) */}
      {selectedTenantForBilling && (
        <BillingModal
          tenant={selectedTenantForBilling}
          onClose={() => setSelectedTenantForBilling(null)}
          onConfirmPayment={handleConfirmPayment}
          getDaysRemaining={getDaysRemaining}
        />
      )}

      {/* ── Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider rounded border border-amber-500/20">
            Finance &amp; Billing Hub
          </span>
          <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">
            Finance &amp; Billing
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Kelola subskripsi, catat pembayaran, pantau invoice &amp; kuota semua tenant dalam satu tempat.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTenants}
          className="h-10 px-6 font-black uppercase tracking-widest text-[10px] rounded-lg border-border"
        >
          <RefreshCw className="mr-2 h-3 w-3" /> Sinkronisasi
        </Button>
      </div>

      {/* ── Tab Selector */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-6 py-3 border-b-2 font-black text-xs uppercase tracking-widest transition-all',
              activeTab === tab.id
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: SUBSKRIPSI ─────────────────────────────────── */}
      {activeTab === 'subscription' && (
        <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
          <CardHeader className="p-8 border-b border-border bg-background">
            <CardTitle className="text-xl font-black uppercase tracking-tighter">
              Status Subskripsi Client
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-zinc-500">
              Pantau masa aktif &amp; siklus billing — klik <strong>"Kelola Billing"</strong> untuk catat pembayaran
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-border">
                    <th className="px-6 py-4">Nama Client</th>
                    <th className="px-6 py-4">Paket</th>
                    <th className="px-6 py-4">Siklus Billing</th>
                    <th className="px-6 py-4">Masa Aktif</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((t) => {
                    const sub = t.feature_overrides?.subscription || {};
                    const daysLeft = getDaysRemaining(sub.expires_at);
                    return (
                      <tr key={t.id} className="hover:bg-background/50 transition-colors">
                        <td className="px-6 py-5 font-black text-sm text-foreground">{t.name}</td>
                        <td className="px-6 py-5 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                          {t.tier?.toUpperCase() || 'N/A'}
                        </td>
                        <td className="px-6 py-5 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">
                          {sub.billing_cycle || 'monthly'}
                        </td>
                        <td className="px-6 py-5 text-xs font-mono tabular-nums font-bold text-foreground">
                          {sub.expires_at
                            ? new Date(sub.expires_at).toLocaleDateString('id-ID')
                            : 'N/A'}
                          <span
                            className={cn(
                              'text-[10px] ml-2 font-black',
                              daysLeft === 'Expired' ? 'text-rose-500' : 'text-amber-500'
                            )}
                          >
                            ({daysLeft})
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border',
                              sub.payment_status === 'paid'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 border-rose-200 dark:border-rose-800'
                            )}
                          >
                            {sub.payment_status || 'unpaid'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          {/* ── TOMBOL AKSI → membuka MODAL */}
                          <Button
                            size="sm"
                            className="h-8 px-4 text-[9px] font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 active:scale-95 transition-all"
                            onClick={() => setSelectedTenantForBilling(t)}
                          >
                            Kelola Billing
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* ── TAB 2: INVOICES ─────────────────────────────────────── */}
      {activeTab === 'invoices' && (
        <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
          <CardHeader className="p-8 border-b border-border bg-background">
            <CardTitle className="text-xl font-black uppercase tracking-tighter">
              Riwayat Invoice Semua Tenant
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-zinc-500">
              Daftar semua invoice yang tercatat lintas tenant, termasuk status pembayaran.
            </CardDescription>
          </CardHeader>
          {allInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Receipt size={48} className="text-zinc-300 dark:text-zinc-600" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Belum ada data invoice.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-border">
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Nominal (Rp)</th>
                    <th className="px-6 py-4">Metode</th>
                    <th className="px-6 py-4">Tanggal Bayar</th>
                    <th className="px-6 py-4">Aktif Hingga</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allInvoices.map((inv, idx) => (
                    <tr key={inv.id || idx} className="hover:bg-background transition-colors">
                      <td className="px-6 py-4 font-black text-sm text-foreground font-mono tabular-nums">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">
                        {inv.clientName}
                      </td>
                      <td className="px-6 py-4 font-mono tabular-nums font-black text-amber-600 dark:text-amber-400">
                        Rp {inv.amount?.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">
                        {inv.payment_method}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                        {new Date(inv.payment_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                        {inv.expiry_date
                          ? new Date(inv.expiry_date).toLocaleDateString('id-ID')
                          : '–'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border',
                            inv.status === 'success'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800'
                          )}
                        >
                          {inv.status === 'success' ? 'LUNAS' : 'BELUM'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 3: QUOTA ────────────────────────────────────────── */}
      {activeTab === 'quota' && (
        <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
          <CardHeader className="p-8 border-b border-border bg-background">
            <CardTitle className="text-xl font-black uppercase tracking-tighter">
              Monitoring Kuota Tenant
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-zinc-500">
              Pantau penggunaan sumber daya per client — hijau aman, merah mendekati batas.
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-border">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Paket</th>
                  <th className="px-6 py-4">Max Outlet</th>
                  <th className="px-6 py-4">Max User</th>
                  <th className="px-6 py-4">Storage</th>
                  <th className="px-6 py-4">Status Kuota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => {
                  const quota = t.quota || {};
                  const usedOutlets = quota.used_outlets ?? '–';
                  const maxOutlets =
                    t.max_outlets ??
                    (t.tier === 'enterprise' ? 50 : t.tier === 'pro' ? 10 : 1);
                  const usedUsers = quota.used_users ?? '–';
                  const maxUsers =
                    t.max_users ??
                    (t.tier === 'enterprise' ? 200 : t.tier === 'pro' ? 30 : 10);
                  const storageMb = quota.storage_used_mb ?? 0;
                  const storageLimit =
                    t.storage_limit_mb ??
                    (t.tier === 'enterprise' ? 5120 : t.tier === 'pro' ? 1024 : 256);
                  const pct =
                    storageLimit > 0 ? Math.round((storageMb / storageLimit) * 100) : 0;
                  const isWarning = pct >= 80;

                  return (
                    <tr key={t.id} className="hover:bg-background transition-colors">
                      <td className="px-6 py-5 font-black text-sm text-foreground">{t.name}</td>
                      <td className="px-6 py-5 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                        {t.tier?.toUpperCase() || 'N/A'}
                      </td>
                      <td className="px-6 py-5 font-mono tabular-nums text-sm text-foreground">
                        <span className="font-black">{usedOutlets}</span>
                        <span className="text-zinc-400 dark:text-zinc-500 text-[10px]"> / {maxOutlets}</span>
                      </td>
                      <td className="px-6 py-5 font-mono tabular-nums text-sm text-foreground">
                        <span className="font-black">{usedUsers}</span>
                        <span className="text-zinc-400 dark:text-zinc-500 text-[10px]"> / {maxUsers}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono tabular-nums">
                            <span className="font-black text-foreground">{storageMb} MB</span>
                            <span className="text-zinc-400 dark:text-zinc-500">/ {storageLimit} MB</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-sm h-1.5">
                            <div
                              className={cn(
                                'h-1.5 rounded-sm transition-all',
                                isWarning ? 'bg-rose-500' : 'bg-emerald-500'
                              )}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border',
                            isWarning
                              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                          )}
                        >
                          {isWarning ? `${pct}% — HAMPIR PENUH` : `${pct}% — AMAN`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
