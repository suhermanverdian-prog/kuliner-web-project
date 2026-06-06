import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { useSuperAdminPage } from '../hooks/useSuperAdminPage';

export default function InvoicesPage() {
  const { tenants, filtered } = useSuperAdminPage();

  // Gather all invoices from tenants
  const invoices = filtered.flatMap(t => (t.feature_overrides?.billing_history || []).map(inv => ({ ...inv, clientName: t.name })));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="p-8 border-b border-border bg-background">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter text-foreground">
            Riwayat Invoice Semua Tenant
          </CardTitle>
          <CardDescription className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
            Daftar semua invoice yang tercatat, termasuk status pembayaran.
          </CardDescription>
        </CardHeader>
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
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-background transition-colors">
                  <td className="px-6 py-4 font-black text-sm text-foreground">{inv.invoice_number}</td>
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
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                      inv.status === 'success'
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                        : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800"
                    )}>
                      {inv.status === 'success' ? 'LUNAS' : 'BELUM'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
