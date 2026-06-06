import { useState } from 'react';
import { CreditCard, Receipt, Gauge, X, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { useSuperAdminPage } from '../hooks/useSuperAdminPage';

export default function BillingPage() {
  const {
    tenants,
    loading,
    filtered,
    fetchTenants,
    selectedTenantForBilling, setSelectedTenantForBilling,
    updateSubscriptionSettings,
    getDaysRemaining,
  } = useSuperAdminPage();

  const [activeTab, setActiveTab] = useState('subscription');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  const [newInvoiceMethod, setNewInvoiceMethod] = useState('QRIS');
  const [newInvoiceDuration, setNewInvoiceDuration] = useState('30');

  const recordPayment = (tenantId) => {
    const amount = Number(newInvoiceAmount);
    if (!amount || amount <= 0) {
      alert('Masukkan nominal pembayaran yang valid.');
      return;
    }
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const currentExpiry = tenant.feature_overrides?.subscription?.expires_at;
    const baseDate = currentExpiry && new Date(currentExpiry) > new Date()
      ? new Date(currentExpiry) : new Date();
    const expiryDate = new Date(baseDate.getTime() + Number(newInvoiceDuration) * 24 * 60 * 60 * 1000);
    const invoiceNumber = `INV-${tenant.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const newInvoice = {
      id: Date.now(),
      invoice_number: invoiceNumber,
      amount,
      payment_method: newInvoiceMethod,
      payment_date: new Date().toISOString(),
      expiry_date: expiryDate.toISOString(),
      status: 'success',
    };

    updateSubscriptionSettings(tenantId, {
      expires_at: expiryDate.toISOString(),
      payment_status: 'paid',
      billing_cycle: Number(newInvoiceDuration) === 365 ? 'yearly' : 'monthly',
    }, newInvoice);
    setNewInvoiceAmount('');
  };

  // Collect all invoices across all tenants for the Invoices tab
  const allInvoices = filtered.flatMap(t =>
    (t.feature_overrides?.billing_history || []).map(inv => ({ ...inv, clientName: t.name }))
  );

  const tabs = [
    { id: 'subscription', label: 'Subskripsi', icon: CreditCard },
    { id: 'invoices',     label: 'Invoices',   icon: Receipt },
    { id: 'quota',        label: 'Quota',       icon: Gauge },
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider rounded border border-amber-500/20">
            Finance &amp; Billing Hub
          </span>
          <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Finance &amp; Billing</h2>
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

      {/* Tab Selector */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        {tabs.map(tab => (
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

      {/* ── TAB 1: SUBSKRIPSI ────────────────────────────────────────── */}
      {activeTab === 'subscription' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Subscription Table */}
          <Card className="lg:col-span-2 border-none bg-card shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="p-8 border-b border-border bg-background">
              <CardTitle className="text-xl font-black uppercase tracking-tighter">Status Subskripsi Client</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase text-zinc-500">
                Pantau masa aktif &amp; siklus billing — klik "Kelola Billing" untuk catat pembayaran
              </CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
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
                  {filtered.map(t => {
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
                          {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('id-ID') : 'N/A'}
                          <span className={cn(
                            'text-[10px] ml-2 font-black',
                            daysLeft === 'Expired' ? 'text-rose-500' : 'text-amber-500'
                          )}>({daysLeft})</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={cn(
                            'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border',
                            sub.payment_status === 'paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 border-rose-200 dark:border-rose-800'
                          )}>
                            {sub.payment_status || 'unpaid'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[9px] font-black uppercase tracking-widest hover:bg-background"
                            onClick={() => setSelectedTenantForBilling(
                              selectedTenantForBilling?.id === t.id ? null : t
                            )}
                          >
                            {selectedTenantForBilling?.id === t.id ? 'Tutup' : 'Kelola Billing'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Right: Billing Management Panel */}
          <div>
            {selectedTenantForBilling ? (
              <Card className="bg-card border-border shadow-xl rounded-lg overflow-hidden flex flex-col">
                <CardHeader className="bg-zinc-50 dark:bg-zinc-900/30 p-6 border-b border-border flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-base font-black text-foreground uppercase">
                      {selectedTenantForBilling.name}
                    </CardTitle>
                    <CardDescription className="text-[9px] font-bold text-zinc-500 uppercase">
                      Input Pembayaran &amp; Log Billing
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTenantForBilling(null)} className="h-8 w-8 text-zinc-500">
                    <X size={16} />
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6 overflow-y-auto">
                  {/* Record Payment Form */}
                  <div className="space-y-4 bg-background/50 p-4 rounded-lg border border-border">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Catat Pembayaran Baru</h4>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Nominal Pembayaran (Rp)</label>
                      <Input
                        type="number"
                        placeholder="Contoh: 250000"
                        value={newInvoiceAmount}
                        onChange={e => setNewInvoiceAmount(e.target.value)}
                        className="h-10 text-xs font-mono tabular-nums"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Metode Bayar</label>
                        <select
                          className="w-full h-10 px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground font-black uppercase"
                          value={newInvoiceMethod}
                          onChange={e => setNewInvoiceMethod(e.target.value)}
                        >
                          <option value="QRIS">QRIS</option>
                          <option value="Transfer">Transfer</option>
                          <option value="Cash">Cash</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Masa Aktif</label>
                        <select
                          className="w-full h-10 px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground font-black"
                          value={newInvoiceDuration}
                          onChange={e => setNewInvoiceDuration(e.target.value)}
                        >
                          <option value="30">30 Hari (Bulanan)</option>
                          <option value="90">90 Hari (Triwulan)</option>
                          <option value="365">365 Hari (Tahunan)</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900"
                      onClick={() => recordPayment(selectedTenantForBilling.id)}
                    >
                      Konfirmasi Pembayaran
                    </Button>
                  </div>

                  {/* Payment History */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b pb-2">Riwayat Invoice</h4>
                    <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                      {(selectedTenantForBilling.feature_overrides?.billing_history || []).length === 0 ? (
                        <p className="text-[10px] text-zinc-500 text-center italic py-4">Belum ada riwayat transaksi.</p>
                      ) : (
                        selectedTenantForBilling.feature_overrides.billing_history.map((inv, idx) => (
                          <div key={inv.id || idx} className="p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded border border-border flex justify-between items-center text-[10px]">
                            <div className="space-y-0.5">
                              <p className="font-black text-foreground">{inv.invoice_number}</p>
                              <p className="text-zinc-500 text-[9px] font-mono tabular-nums">
                                {new Date(inv.payment_date).toLocaleDateString('id-ID')} &bull; {inv.payment_method}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-black text-amber-600 dark:text-amber-400">Rp {inv.amount?.toLocaleString('id-ID')}</p>
                              <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 uppercase font-black px-1.5 py-0.5 rounded border border-emerald-200/50">LUNAS</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card border-border shadow-xl rounded-lg border-dashed p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <CreditCard size={48} className="text-zinc-300 dark:text-zinc-600 mb-4 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Pilih Client untuk Mengelola Billing</p>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px] mx-auto">
                  Catat pembayaran &amp; perpanjang masa aktif subskripsi.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: INVOICES ──────────────────────────────────────────── */}
      {activeTab === 'invoices' && (
        <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
          <CardHeader className="p-8 border-b border-border bg-background">
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Riwayat Invoice Semua Tenant</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-zinc-500">
              Daftar semua invoice yang tercatat lintas tenant, termasuk status pembayaran.
            </CardDescription>
          </CardHeader>
          {allInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Receipt size={48} className="text-zinc-300 dark:text-zinc-600" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Belum ada data invoice.</p>
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
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allInvoices.map((inv, idx) => (
                    <tr key={inv.id || idx} className="hover:bg-background transition-colors">
                      <td className="px-6 py-4 font-black text-sm text-foreground font-mono tabular-nums">{inv.invoice_number}</td>
                      <td className="px-6 py-4 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">{inv.clientName}</td>
                      <td className="px-6 py-4 font-mono tabular-nums font-black text-amber-600 dark:text-amber-400">
                        Rp {inv.amount?.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">{inv.payment_method}</td>
                      <td className="px-6 py-4 text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                        {new Date(inv.payment_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border',
                          inv.status === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800'
                        )}>
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

      {/* ── TAB 3: QUOTA ─────────────────────────────────────────────── */}
      {activeTab === 'quota' && (
        <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
          <CardHeader className="p-8 border-b border-border bg-background">
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Monitoring Kuota Tenant</CardTitle>
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
                {filtered.map(t => {
                  const quota = t.quota || {};
                  const usedOutlets = quota.used_outlets ?? '–';
                  const maxOutlets = t.max_outlets ?? (t.tier === 'enterprise' ? 50 : t.tier === 'pro' ? 10 : 1);
                  const usedUsers = quota.used_users ?? '–';
                  const maxUsers = t.max_users ?? (t.tier === 'enterprise' ? 200 : t.tier === 'pro' ? 30 : 10);
                  const storageMb = quota.storage_used_mb ?? 0;
                  const storageLimit = t.storage_limit_mb ?? (t.tier === 'enterprise' ? 5120 : t.tier === 'pro' ? 1024 : 256);
                  const pct = storageLimit > 0 ? Math.round((storageMb / storageLimit) * 100) : 0;
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
                              className={cn('h-1.5 rounded-sm transition-all', isWarning ? 'bg-rose-500' : 'bg-emerald-500')}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border',
                          isWarning
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                        )}>
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
