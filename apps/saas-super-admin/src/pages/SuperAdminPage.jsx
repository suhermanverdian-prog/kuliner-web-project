import { useState } from 'react';
import { 
  ShieldCheck, Users, Zap, 
  CreditCard, ToggleLeft, ToggleRight,
  TrendingUp, Activity, CheckCircle2,
  AlertCircle, ChevronRight, Search,
  Filter, MoreHorizontal, Globe,
  Shield, Landmark, Wallet,
  Layers, Settings, Info, X, Save,
  BarChart3, Box, Calendar, RefreshCw,
  Clock, Database, HardDrive, Cpu, Lock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { FEATURE_CATALOG, resolveFeatures } from '../lib/featureFlags';
import { useSuperAdminPage } from '../hooks/useSuperAdminPage';

export default function SuperAdminPage() {
  const {
    tenants,
    loading,
    search, setSearch,
    editingFeatures, setEditingFeatures,
    selectedTenantForBilling, setSelectedTenantForBilling,
    isRegisterModalOpen, setIsRegisterModalOpen,
    registerForm, setRegisterForm,
    globalConfig, setGlobalConfig,
    fetchTenants,
    toggleStatus,
    changeTier,
    toggleFeatureOverride,
    resetFeatureOverrides,
    submitRegisterTenant,
    updateSubscriptionSettings,
    saveGlobalConfig,
    filtered
  } = useSuperAdminPage();

  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'billing' | 'system'
  
  // Local states for new invoice creation inside Billing Tab
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  const [newInvoiceMethod, setNewInvoiceMethod] = useState('QRIS');
  const [newInvoiceDuration, setNewInvoiceDuration] = useState('30'); // days
  
  // Local states for global system config form
  const [configForm, setConfigForm] = useState(null);

  const initConfigForm = () => {
    setConfigForm({ ...globalConfig });
  };

  if (loading && tenants.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-mono tabular-nums">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-lg animate-spin" />
      <p className="text-zinc-500 dark:text-zinc-100 font-medium animate-pulse uppercase tracking-widest text-[10px] font-mono tabular-nums">Establishing Secure Node Connection...</p>
    </div>
  );

  // Helper to check active days remaining
  const getDaysRemaining = (expiryDateStr) => {
    if (!expiryDateStr) return 'Lifetime';
    const diffTime = new Date(expiryDateStr) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} Hari` : 'Expired';
  };

  const recordPayment = (tenantId) => {
    const amount = Number(newInvoiceAmount);
    if (!amount || amount <= 0) {
      alert("Masukkan nominal pembayaran yang valid.");
      return;
    }

    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    // Calculate new expiry date
    const currentExpiry = tenant.feature_overrides?.subscription?.expires_at;
    const baseDate = currentExpiry && new Date(currentExpiry) > new Date() ? new Date(currentExpiry) : new Date();
    const expiryDate = new Date(baseDate.getTime() + Number(newInvoiceDuration) * 24 * 60 * 60 * 1000);

    const invoiceNumber = `INV-${tenant.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    
    const newInvoice = {
      id: Date.now(),
      invoice_number: invoiceNumber,
      amount,
      payment_method: newInvoiceMethod,
      payment_date: new Date().toISOString(),
      expiry_date: expiryDate.toISOString(),
      status: 'success'
    };

    const subData = {
      expires_at: expiryDate.toISOString(),
      payment_status: 'paid',
      billing_cycle: Number(newInvoiceDuration) === 365 ? 'yearly' : 'monthly'
    };

    updateSubscriptionSettings(tenantId, subData, newInvoice);
    setNewInvoiceAmount('');
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-4">
              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider rounded border border-amber-500/20">System Owner Access</span>
              <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest"><div className="w-1.5 h-1.5 rounded-lg bg-emerald-500 animate-pulse" /> Nodes Online</span>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">SuperAdmin Hub</h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
             Pusat kendali platform SaaS &mdash; Kelola Tenant, Subskripsi & Konfigurasi Global.
           </p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" size="sm" onClick={fetchTenants} className="h-10 px-6 font-black uppercase tracking-widest text-[10px] rounded-lg border-border">
             <RefreshCw className="mr-2 h-3 w-3" /> Sinkronisasi
           </Button>
           <Button 
             onClick={() => setIsRegisterModalOpen(true)}
             size="sm" 
             className="h-10 px-8 font-black uppercase tracking-widest text-white rounded-lg bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500"
           >
             + Registrasi Client
           </Button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        {[
          { id: 'tenants', label: 'Daftar Tenant', icon: Users },
          { id: 'billing', label: 'Subskripsi & Billing', icon: CreditCard },
          { id: 'system', label: 'Sistem & Keamanan', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'system') initConfigForm();
            }}
            className={cn(
              "flex items-center gap-2 px-6 py-3 border-b-2 font-black text-xs uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? "border-amber-500 text-amber-500" 
                : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: TENANTS LIST */}
      {activeTab === 'tenants' && (
        <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
          <CardHeader className="p-10 border-b border-border bg-background">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-1">
                   <CardTitle className="text-2xl font-black tracking-tighter uppercase">Manajemen Tenant</CardTitle>
                   <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Konfigurasi Hak Akses & Fitur Global Client</CardDescription>
                </div>
                <div className="relative group min-w-[350px]">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                   <Input 
                     className="pl-12 h-12 bg-background/50 border-border rounded-lg font-medium" 
                     placeholder="Cari nama bisnis atau ID..." 
                     value={search} onChange={e => setSearch(e.target.value)}
                   />
                </div>
             </div>
          </CardHeader>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                   <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-border">
                      <th className="px-6 py-6">Client / Bisnis</th>
                      <th className="px-6 py-6">Paket Langganan</th>
                      <th className="px-10 py-6">Kustomisasi Fitur</th>
                      <th className="px-6 py-6">Status & Billing</th>
                      <th className="px-6 py-6 text-right">Aksi</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border">
                   {filtered.map(t => (
                     <tr key={t.id} className="hover:bg-background transition-colors group">
                        <td className="px-6 py-8">
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white font-black border border-border group-hover:border-amber-500/40">
                                 {t.name[0]}
                              </div>
                              <div>
                                 <p className="text-base font-black text-foreground group-hover:text-amber-500 transition-colors">{t.name}</p>
                                 <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-2 uppercase mt-1">
                                    <Calendar size={12} /> Terdaftar: <span className="font-mono tabular-nums font-black">{new Date(t.created_at).toLocaleDateString('id-ID')}</span>
                                 </p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-8">
                           <select 
                             value={t.tier} 
                             onChange={(e) => changeTier(t, e.target.value)}
                             className={cn(
                               "h-10 px-4 rounded-lg border text-[10px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer shadow-sm bg-white dark:bg-zinc-800",
                               t.tier === 'enterprise' || t.tier === 'pro' ? "border-amber-500/30 text-amber-600 dark:text-amber-400" : "border-border text-zinc-500 dark:text-zinc-400"
                             )}
                           >
                              <option value="lite">LITE</option>
                              <option value="pro">PRO</option>
                              <option value="enterprise">ENTERPRISE</option>
                           </select>
                        </td>
                        <td className="px-10 py-8">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="h-10 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest border-border hover:bg-background"
                             onClick={() => setEditingFeatures(t)}
                           >
                             <Settings size={14} className="mr-2" /> Atur Fitur
                           </Button>
                        </td>
                        <td className="px-6 py-8">
                           <div className={cn(
                             "inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                             t.is_active ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800"
                           )}>
                              <div className={cn("w-1.5 h-1.5 rounded-lg", t.is_active ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                              {t.is_active ? 'Active' : 'Suspended'}
                           </div>
                        </td>
                        <td className="px-6 py-8 text-right">
                           <div className="flex justify-end gap-4">
                              <Button 
                                variant={t.is_active ? "destructive" : "default"} 
                                size="sm"
                                className={cn(
                                  "h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95",
                                  t.is_active 
                                    ? "bg-rose-500 hover:bg-rose-600 text-white" 
                                    : "bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 text-white"
                                )}
                                onClick={() => toggleStatus(t)}
                              >
                                 {t.is_active ? 'Suspend' : 'Activate'}
                              </Button>
                           </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: BILLING & SUBSCRIPTIONS */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tenant Subscriptions List */}
          <Card className="lg:col-span-2 border-none bg-card shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="p-8 border-b border-border bg-background flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tighter">Status Subskripsi Client</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-zinc-500">Pantau masa aktif & siklus billing</CardDescription>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-border">
                    <th className="px-6 py-4">Nama Client</th>
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
                        <td className="px-6 py-5 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">{sub.billing_cycle || 'monthly'}</td>
                        <td className="px-6 py-5 text-xs font-mono tabular-nums font-bold">
                          {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('id-ID') : 'N/A'} 
                          <span className="text-[10px] text-amber-500 ml-2 font-black">({daysLeft})</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                            sub.payment_status === 'paid' 
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 border-rose-200 dark:border-rose-800"
                          )}>
                            {sub.payment_status || 'unpaid'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 text-[9px] font-black uppercase tracking-widest hover:bg-background"
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
            </div>
          </Card>

          {/* Billing Detail Panel */}
          <div>
            {selectedTenantForBilling ? (
              <Card className="bg-card border-border shadow-xl rounded-lg overflow-hidden flex flex-col h-full">
                <CardHeader className="bg-zinc-50 dark:bg-zinc-900/30 p-6 border-b border-border flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-base font-black text-foreground uppercase">{selectedTenantForBilling.name}</CardTitle>
                    <CardDescription className="text-[9px] font-bold text-zinc-500 uppercase">Input Pembayaran & log Billing</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTenantForBilling(null)} className="h-8 w-8 text-zinc-500"><X size={16} /></Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
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
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b pb-2">Riwayat Invoice / Pembayaran</h4>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 no-scrollbar">
                      {(selectedTenantForBilling.feature_overrides?.billing_history || []).length === 0 ? (
                        <p className="text-[10px] text-zinc-500 text-center italic py-4">Belum ada riwayat transaksi.</p>
                      ) : (
                        (selectedTenantForBilling.feature_overrides.billing_history).map((inv, idx) => (
                          <div key={inv.id || idx} className="p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded border border-border flex justify-between items-center text-[10px]">
                            <div className="space-y-1">
                              <p className="font-black text-foreground">{inv.invoice_number}</p>
                              <p className="text-zinc-500 text-[9px] font-mono tabular-nums">{new Date(inv.payment_date).toLocaleDateString('id-ID')} &bull; {inv.payment_method}</p>
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
              <Card className="bg-card border-border shadow-xl rounded-lg border-dashed p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                <CreditCard size={48} className="text-zinc-300 dark:text-zinc-600 mb-4 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Pilih Client untuk Mengelola Billing</p>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px] mx-auto">Anda dapat mencatat invoices pembayaran & memperpanjang masa aktif subskripsi secara manual.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: GLOBAL SYSTEM & SECURITY SETTINGS */}
      {activeTab === 'system' && configForm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-card border-border shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="p-8 border-b border-border bg-background flex justify-between items-center flex-row">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tighter">Konfigurasi Server & Parameter Global</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-zinc-500">Pengaturan kernel sistem, pembatasan rate-limit, dan parameter keamanan.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Server Parameters */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 border-b border-border pb-2 flex items-center gap-2">
                  <Server size={14} /> Server Configuration Kernel
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">API Rate Limit (Req/Min)</label>
                    <Input 
                      type="number"
                      value={configForm.apiRateLimit}
                      onChange={e => setConfigForm({ ...configForm, apiRateLimit: Number(e.target.value) })}
                      className="h-10 text-xs font-mono font-black tabular-nums bg-white dark:bg-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Session Timeout (Jam)</label>
                    <Input 
                      type="number"
                      value={configForm.sessionDuration}
                      onChange={e => setConfigForm({ ...configForm, sessionDuration: Number(e.target.value) })}
                      className="h-10 text-xs font-mono font-black tabular-nums bg-white dark:bg-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">DB Pool Size Limit</label>
                    <Input 
                      type="number"
                      value={configForm.dbPoolLimit}
                      onChange={e => setConfigForm({ ...configForm, dbPoolLimit: Number(e.target.value) })}
                      className="h-10 text-xs font-mono font-black tabular-nums bg-white dark:bg-zinc-800"
                    />
                  </div>
                </div>
              </div>

              {/* Security & Cryptography Parameters */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 border-b border-border pb-2 flex items-center gap-2">
                  <Lock size={14} /> Keamanan & Kriptografi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tingkat Pengerasan JWT (Hardening)</label>
                    <select 
                      className="w-full h-10 px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground font-black"
                      value={configForm.jwtHardening}
                      onChange={e => setConfigForm({ ...configForm, jwtHardening: e.target.value })}
                    >
                      <option value="Low">Low (Standard HMAC-256)</option>
                      <option value="Medium">Medium (Dual Signature)</option>
                      <option value="High">High (Cryptographic Rotations & HMAC)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Retensi Audit Log (Hari)</label>
                    <Input 
                      type="number"
                      value={configForm.logRetentionDays}
                      onChange={e => setConfigForm({ ...configForm, logRetentionDays: Number(e.target.value) })}
                      className="h-10 text-xs font-mono font-black tabular-nums bg-white dark:bg-zinc-800"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded border border-border">
                    <div>
                      <p className="text-sm font-black text-foreground">Paksa Enkripsi SSL/TLS</p>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-black mt-1">Seluruh rute HTTP API wajib menggunakan TLS 1.3</p>
                    </div>
                    <button 
                      onClick={() => setConfigForm({ ...configForm, sslEnforced: !configForm.sslEnforced })}
                      className={cn(
                        "w-12 h-6 rounded-lg transition-all relative flex items-center shadow-inner",
                        configForm.sslEnforced ? "bg-amber-500" : "bg-zinc-700"
                      )}
                    >
                      <span className={cn("w-4.5 h-4.5 bg-background rounded-lg shadow-lg transition-transform absolute left-1", configForm.sslEnforced ? "translate-x-5.5" : "translate-x-0")} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded border border-border">
                    <div>
                      <p className="text-sm font-black text-foreground">Verifikasi Wajah AI untuk Void Transaksi</p>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-black mt-1">Kasir wajib memindai wajah manager/owner untuk melakukan void di POS</p>
                    </div>
                    <button 
                      onClick={() => setConfigForm({ ...configForm, aiVoidVerification: !configForm.aiVoidVerification })}
                      className={cn(
                        "w-12 h-6 rounded-lg transition-all relative flex items-center shadow-inner",
                        configForm.aiVoidVerification ? "bg-amber-500" : "bg-zinc-700"
                      )}
                    >
                      <span className={cn("w-4.5 h-4.5 bg-background rounded-lg shadow-lg transition-transform absolute left-1", configForm.aiVoidVerification ? "translate-x-5.5" : "translate-x-0")} />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-background p-6 border-t border-border flex justify-end">
              <Button 
                onClick={() => saveGlobalConfig(configForm)}
                className="h-12 px-10 font-black uppercase tracking-widest text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500"
              >
                <Save size={16} className="mr-2" /> Simpan Konfigurasi
              </Button>
            </CardFooter>
          </Card>

          {/* Infrastructure Quick Health Info */}
          <div className="space-y-6">
            <Card className="bg-card border-border shadow-xl rounded-lg p-6 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 border-b pb-2 flex items-center gap-2">
                <Activity size={14} className="text-amber-500 animate-pulse" /> Status Node Kernel
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-zinc-500 uppercase">SSL STATUS</span>
                  <span className="font-black text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-200/50">SECURED (TLS 1.3)</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-zinc-500 uppercase">JWT AUTH LOGIC</span>
                  <span className="font-black text-amber-500 font-mono">HMAC-SHA256 (ROUTING ENCRYPTED)</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-zinc-500 uppercase">AI VERIFIER STATUS</span>
                  <span className="font-black text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-200/50">ONLINE (100% HEALTHY)</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* PREMIUM CLIENT REGISTRATION INTEGRATED MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl bg-card border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
            <CardHeader className="bg-background border-b border-border flex flex-row items-center justify-between py-3 px-6 shrink-0">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <Globe className="text-amber-500" size={16} /> Registrasi Client Baru
                </CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background text-zinc-500" onClick={() => setIsRegisterModalOpen(false)}><X size={16} /></Button>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 overflow-y-auto no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Nama Bisnis / Client</label>
                <Input 
                  placeholder="Contoh: PT Kopi Enak Indonesia" 
                  value={registerForm.name}
                  onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                  className="h-10 bg-white dark:bg-zinc-800 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Subscription Tier</label>
                  <select 
                    className="w-full h-10 px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground font-black uppercase"
                    value={registerForm.tier}
                    onChange={e => setRegisterForm({ ...registerForm, tier: e.target.value })}
                  >
                    <option value="lite">Lite Plan</option>
                    <option value="pro">Pro Plan</option>
                    <option value="enterprise">Enterprise Plan</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Masa Aktif Awal</label>
                  <select 
                    className="w-full h-10 px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground font-black"
                    value={registerForm.durationDays}
                    onChange={e => setRegisterForm({ ...registerForm, durationDays: e.target.value })}
                  >
                    <option value="30">30 Hari (Bulanan)</option>
                    <option value="90">90 Hari (Triwulan)</option>
                    <option value="365">365 Hari (Tahunan)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Status Pembayaran</label>
                <select 
                  className="w-full h-10 px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground font-black uppercase"
                  value={registerForm.paymentStatus}
                  onChange={e => setRegisterForm({ ...registerForm, paymentStatus: e.target.value })}
                >
                  <option value="paid">Lunas / Berbayar (Paid)</option>
                  <option value="unpaid">Belum Bayar (Grace Period / unpaid)</option>
                </select>
              </div>

              {registerForm.paymentStatus === 'paid' && (
                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Nominal (Rp)</label>
                    <Input 
                      type="number"
                      placeholder="Contoh: 350000"
                      value={registerForm.amount}
                      onChange={e => setRegisterForm({ ...registerForm, amount: e.target.value })}
                      className="h-10 bg-white dark:bg-zinc-800 text-xs font-mono font-black tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Metode Bayar</label>
                    <select 
                      className="w-full h-10 px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground font-black uppercase"
                      value={registerForm.paymentMethod}
                      onChange={e => setRegisterForm({ ...registerForm, paymentMethod: e.target.value })}
                    >
                      <option value="QRIS">QRIS</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-background p-4 px-6 border-t border-border flex justify-end gap-3 shrink-0">
              <Button variant="outline" className="h-10 px-6 font-bold text-xs" onClick={() => setIsRegisterModalOpen(false)}>Batal</Button>
              <Button 
                onClick={submitRegisterTenant}
                className="h-10 px-8 font-black uppercase tracking-widest text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900"
              >
                Registrasikan Node
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Feature Flag Modal */}
      {editingFeatures && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-3xl shadow-2xl bg-card border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
            <CardHeader className="bg-background border-b border-border flex flex-row items-center justify-between py-4 px-6 shrink-0">
              <div className="space-y-0.5">
                <CardTitle className="text-lg font-black uppercase tracking-tighter text-foreground">{editingFeatures.name}</CardTitle>
                <CardDescription className="uppercase font-black tracking-[0.2em] text-[9px] text-amber-500">Feature Flags & Overrides</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background text-zinc-500" onClick={() => setEditingFeatures(null)}><X size={20} /></Button>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto no-scrollbar space-y-6">
              {['Core', 'Produksi', 'Pengadaan', 'Laporan', 'Keuangan', 'Bisnis', 'Enterprise'].map(group => (
                <div key={group} className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 border-b border-border pb-3">{group} Management</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {FEATURE_CATALOG.filter(f => f.group === group).map(f => {
                      const isActive = resolveFeatures(editingFeatures)[f.key];
                      const isOverride = editingFeatures.feature_overrides && (f.key in editingFeatures.feature_overrides);
                      
                      return (
                        <div key={f.key} className={cn(
                          "flex items-center justify-between p-4 rounded-lg border transition-all duration-350 group/feature",
                          isActive ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-500/20" : "bg-background border-border"
                        )}>
                          <div className="flex items-center gap-4">
                            <span className="text-2xl group-hover/feature:scale-110 transition-transform">{f.icon}</span>
                            <div>
                              <p className="text-sm font-black text-foreground leading-none">{f.label}</p>
                              <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1.5 font-bold uppercase tracking-wider">{f.description}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => toggleFeatureOverride(editingFeatures, f.key)}
                            className={cn(
                              "w-12 h-6 rounded-lg transition-all relative flex items-center shadow-inner",
                              isActive ? "bg-amber-500" : "bg-zinc-700",
                              isOverride ? "ring-4 ring-amber-500/20" : ""
                            )}
                          >
                            <span className={cn("w-4.5 h-4.5 bg-background rounded-lg shadow-lg transition-transform absolute left-1", isActive ? "translate-x-5.5" : "translate-x-0")} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="bg-background p-6 border-t border-border flex justify-between gap-6">
              <Button variant="ghost" size="sm" className="text-[10px] uppercase font-black tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-foreground" onClick={() => resetFeatureOverrides(editingFeatures)}>Reset Defaults</Button>
              <Button size="sm" className="h-12 px-10 font-black uppercase tracking-[0.2em] text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900" onClick={() => setEditingFeatures(null)}>Save Matrix</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
