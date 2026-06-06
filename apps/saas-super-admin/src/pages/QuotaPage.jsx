import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { useSuperAdminPage } from '../hooks/useSuperAdminPage';

export default function QuotaPage() {
  const { filtered } = useSuperAdminPage();

  // Assuming each tenant has `quota` object: {used, limit}
  // Fallback to placeholder if not present.

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="p-8 border-b border-border bg-background">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter text-foreground">
            Kuota Tenant
          </CardTitle>
          <CardDescription className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
            Monitoring penggunaan kuota sumber daya per client.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-border">
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Kuota Digunakan</th>
                <th className="px-6 py-4">Batas Kuota</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(t => {
                const quota = t.quota || { used: 0, limit: 0 };
                const percent = quota.limit > 0 ? Math.round((quota.used / quota.limit) * 100) : 0;
                const statusColor = percent >= 80 ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800';
                return (
                  <tr key={t.id} className="hover:bg-background transition-colors">
                    <td className="px-6 py-4 font-black text-sm text-foreground">{t.name}</td>
                    <td className="px-6 py-4 font-mono tabular-nums text-amber-600 dark:text-amber-400">
                      {quota.used}
                    </td>
                    <td className="px-6 py-4 font-mono tabular-nums text-amber-600 dark:text-amber-400">
                      {quota.limit}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                        statusColor
                      )}>
                        {percent}%
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
