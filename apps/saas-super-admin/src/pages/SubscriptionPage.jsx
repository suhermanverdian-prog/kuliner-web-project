import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { useSuperAdminPage } from '../hooks/useSuperAdminPage';

export default function SubscriptionPage() {
  const { tenants, filtered, getDaysRemaining } = useSuperAdminPage();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="p-8 border-b border-border bg-background">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter text-foreground">
            Daftar Subskripsi Tenant
          </CardTitle>
          <CardDescription className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
            Informasi masa aktif, siklus billing, dan status pembayaran.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-border">
                <th className="px-6 py-4">Nama Client</th>
                <th className="px-6 py-4">Paket</th>
                <th className="px-6 py-4">Siklus Billing</th>
                <th className="px-6 py-4">Masa Aktif</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(t => {
                const sub = t.feature_overrides?.subscription || {};
                const daysLeft = getDaysRemaining(sub.expires_at);
                return (
                  <tr key={t.id} className="hover:bg-background transition-colors">
                    <td className="px-6 py-4 font-black text-sm text-foreground">{t.name}</td>
                    <td className="px-6 py-4 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">{t.tier?.toUpperCase() || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">{sub.billing_cycle || 'monthly'}</td>
                    <td className="px-6 py-4 text-xs font-mono tabular-nums font-bold">
                      {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('id-ID') : 'N/A'}
                      <span className="text-[10px] text-amber-500 ml-2 font-black">({daysLeft})</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                        sub.payment_status === 'paid'
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800"
                      )}>
                        {sub.payment_status || 'unpaid'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
