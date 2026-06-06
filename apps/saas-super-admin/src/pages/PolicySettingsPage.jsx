import { useState } from 'react';
import { Shield, Database, Lock, RefreshCw, CheckCircle2, AlertTriangle, Download, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

const CONTROLS = [
  { id: 'A.9', label: 'A.9 Access Control', status: 'ok',      detail: 'JWT + RBAC enforced di semua endpoint admin.' },
  { id: 'A.12', label: 'A.12 Operations Security', status: 'ok',  detail: 'Audit-log realtime via Supabase Realtime channel.' },
  { id: 'A.18', label: 'A.18 Compliance', status: 'warning', detail: 'GDPR export tersedia, namun belum terjadwal otomatis.' },
  { id: 'GDPR', label: 'GDPR Data Retention', status: 'ok',    detail: 'Kebijakan retensi aktif — data dihapus setelah masa retensi.' },
  { id: 'MFA',  label: '2FA / MFA',           status: 'warning', detail: 'MFA opsional; belum diwajibkan untuk semua akun admin.' },
  { id: 'SSL',  label: 'SSL / TLS Enforced',  status: 'ok',    detail: 'HTTPS wajib, redirect otomatis aktif.' },
];

export default function PolicySettingsPage() {
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 10,
    requireUppercase: true,
    requireNumber: true,
    requireSymbol: true,
    maxFailedAttempts: 5,
    lockoutDurationMin: 15,
  });
  const [retentionDays, setRetentionDays] = useState(90);
  const [gdprConsent, setGdprConsent] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In production: call API to persist policy
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleGdprExport = () => {
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), policy: passwordPolicy, retention_days: retentionDays }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gdpr-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider rounded border border-amber-500/20">
          Compliance Hub
        </span>
        <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Kebijakan &amp; Keamanan</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          Konfigurasi password policy, data retention, GDPR, dan pantau status ISO 27001 controls.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: ISO 27001 Checklist */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-background">
              <CardTitle className="text-base font-black uppercase tracking-tighter flex items-center gap-2">
                <Shield size={16} className="text-amber-500" /> ISO 27001 Controls
              </CardTitle>
              <CardDescription className="text-[9px] uppercase font-bold text-zinc-500">Status kepatuhan keamanan platform</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {CONTROLS.map(c => (
                <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border">
                  {c.status === 'ok'
                    ? <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    : <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className="text-[10px] font-black uppercase text-foreground">{c.label}</p>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">{c.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* GDPR Export */}
          <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-background">
              <CardTitle className="text-base font-black uppercase tracking-tighter flex items-center gap-2">
                <Download size={16} className="text-amber-500" /> GDPR Export
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border">
                <input
                  type="checkbox"
                  id="gdpr-consent"
                  checked={gdprConsent}
                  onChange={e => setGdprConsent(e.target.checked)}
                  className="accent-amber-500"
                />
                <label htmlFor="gdpr-consent" className="text-[10px] font-black uppercase text-foreground cursor-pointer">
                  GDPR Consent Flag Aktif
                </label>
              </div>
              <Button
                onClick={handleGdprExport}
                className="w-full h-10 text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500"
              >
                <Download size={14} className="mr-2" /> Export Data JSON
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Password Policy + Retention */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-background">
              <CardTitle className="text-base font-black uppercase tracking-tighter flex items-center gap-2">
                <Lock size={16} className="text-amber-500" /> Password Policy
              </CardTitle>
              <CardDescription className="text-[9px] uppercase font-bold text-zinc-500">
                Aturan kekuatan password dan lockout akun pengguna
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Min. Panjang Password</label>
                  <Input
                    type="number"
                    min={8}
                    max={32}
                    value={passwordPolicy.minLength}
                    onChange={e => setPasswordPolicy(p => ({ ...p, minLength: Number(e.target.value) }))}
                    className="h-10 font-mono tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Max Gagal Login</label>
                  <Input
                    type="number"
                    min={3}
                    max={20}
                    value={passwordPolicy.maxFailedAttempts}
                    onChange={e => setPasswordPolicy(p => ({ ...p, maxFailedAttempts: Number(e.target.value) }))}
                    className="h-10 font-mono tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Durasi Lockout (Menit)</label>
                  <Input
                    type="number"
                    min={5}
                    max={1440}
                    value={passwordPolicy.lockoutDurationMin}
                    onChange={e => setPasswordPolicy(p => ({ ...p, lockoutDurationMin: Number(e.target.value) }))}
                    className="h-10 font-mono tabular-nums"
                  />
                </div>
                <div className="space-y-3 p-4 bg-background/60 border border-border rounded-lg">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Persyaratan Karakter</p>
                  {[
                    { key: 'requireUppercase', label: 'Wajib Huruf Kapital' },
                    { key: 'requireNumber',    label: 'Wajib Angka' },
                    { key: 'requireSymbol',    label: 'Wajib Simbol' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={item.key}
                        checked={passwordPolicy[item.key]}
                        onChange={e => setPasswordPolicy(p => ({ ...p, [item.key]: e.target.checked }))}
                        className="accent-amber-500"
                      />
                      <label htmlFor={item.key} className="text-[10px] font-bold text-foreground cursor-pointer">{item.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-background">
              <CardTitle className="text-base font-black uppercase tracking-tighter flex items-center gap-2">
                <Clock size={16} className="text-amber-500" /> Data Retention
              </CardTitle>
              <CardDescription className="text-[9px] uppercase font-bold text-zinc-500">
                Berapa lama data log dan transaksi disimpan sebelum dihapus otomatis
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Retensi Log (Hari)</label>
                <Input
                  type="number"
                  min={30}
                  max={730}
                  value={retentionDays}
                  onChange={e => setRetentionDays(Number(e.target.value))}
                  className="h-10 font-mono tabular-nums max-w-[200px]"
                />
                <p className="text-[9px] text-zinc-500">Data audit log akan dihapus otomatis setelah <span className="font-black text-amber-500">{retentionDays} hari</span>.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className={cn(
                'h-12 px-12 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all',
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500'
              )}
            >
              {saved ? '✅ Tersimpan!' : 'Simpan Kebijakan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
