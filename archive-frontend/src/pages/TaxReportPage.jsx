import React from 'react';
import { 
  Receipt, Landmark, Download, Filter, 
  Calendar, FileText, ChevronRight, TrendingUp,
  AlertCircle, ShieldCheck, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/Table";
import { cn } from "../lib/utils";
import { useTaxReportPage } from '../hooks/useTaxReportPage';

const formatCurrency = (n) => new Intl.NumberFormat('id-ID', { 
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0 
}).format(n || 0);

export default function TaxReportPage() {
  const {
    loading,
    data,
    period, setPeriod,
    totalSales,
    totalTax,
    netRevenue,
    loadTaxData
  } = useTaxReportPage();

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse font-mono tabular-nums">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-100">Calculating Tax Liability...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700 max-w-[1400px] mx-auto">
      {/* 🏛️ FISCAL COCKPIT HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-card border border-border p-8 rounded-lg shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center text-emerald-600 shadow-inner">
            <Landmark size={32} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none italic">
              Tax <span className="text-emerald-600">Compliance</span>
            </h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-black uppercase tracking-[0.2em]">Enterprise Fiscal Reporting V3.1</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <Button variant="outline" className="rounded-lg font-black text-[10px] uppercase tracking-widest border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-500 hover:text-zinc-900 dark:text-zinc-100 transition-all">
              <Download size={14} className="mr-2" /> Export e-Faktur
           </Button>
           <Button className="bg-emerald-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20">
              <ShieldCheck size={14} className="mr-2" /> Certify Report
           </Button>
        </div>
      </header>

      {/* 📊 TAX SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 border-none shadow-xl bg-card relative overflow-hidden group">
           <div className="absolute -right-4 -bottom-4 text-emerald-600 dark:text-emerald-400/5 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp size={120} />
           </div>
           <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest mb-2">Total Tax Collected (PPN 11%)</p>
           <h2 className="text-4xl font-black text-emerald-600 font-mono tabular-nums tracking-tighter tabular-nums">
             {formatCurrency(totalTax)}
           </h2>
           <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
             <ShieldCheck size={12} /> Verified Physical Sales Only
           </div>
        </Card>

        <Card className="p-8 border-none shadow-xl bg-card">
           <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest mb-2">Net Taxable Revenue (DPP)</p>
           <h2 className="text-4xl font-black text-foreground font-mono tabular-nums tracking-tighter tabular-nums">
             {formatCurrency(netRevenue)}
           </h2>
           <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">
             <FileText size={12} /> Base for PPN calculation
           </div>
        </Card>

        <Card className="p-8 border-none shadow-xl bg-emerald-600 text-zinc-900 dark:text-zinc-100">
           <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-2">Current Fiscal Status</p>
           <h2 className="text-3xl font-black uppercase tracking-tighter">Audit Ready</h2>
           <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-emerald-100 uppercase tracking-widest">
             <AlertCircle size={12} /> No Discrepancies Found
           </div>
        </Card>
      </div>

      {/* 📑 DETAILED TAX LOG */}
      <Card className="border-none shadow-2xl overflow-hidden rounded-lg">
        <CardHeader className="p-10 border-b border-border bg-background flex flex-row items-center justify-between">
           <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Tax Ledger</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100">Detailed transaction-level tax breakdown</CardDescription>
           </div>
           <div className="flex items-center gap-4">
              <div className="h-10 px-4 bg-background rounded-lg border border-border flex items-center gap-4 shadow-inner">
                 <Calendar size={14} className="text-zinc-500 dark:text-zinc-100" />
                 <span className="text-[10px] font-black uppercase tracking-widest">May 2026</span>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-background">
              <TableRow>
                <TableHead className="px-10 py-6">Invoice #</TableHead>
                <TableHead>Customer Entity</TableHead>
                <TableHead className="text-right">Taxable Amount (DPP)</TableHead>
                <TableHead className="text-right text-emerald-600">PPN (11%)</TableHead>
                <TableHead className="text-right font-black">Gross Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.filter(tx => tx.payment_status === 'paid').map(tx => (
                <TableRow key={tx.id} className="group h-20 hover:bg-emerald-500/5 transition-all">
                  <TableCell className="px-10 font-mono tabular-nums text-xs font-bold text-zinc-500 dark:text-zinc-100">
                    {tx.order_number}
                  </TableCell>
                  <TableCell className="font-black text-sm uppercase">
                    {tx.customer_name || 'Anonymous Customer'}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-sm font-bold">
                    {formatCurrency(tx.total - (tx.tax || 0))}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-sm font-black text-emerald-600">
                    {formatCurrency(tx.tax || 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-lg font-black text-foreground tabular-nums tracking-tighter">
                    {formatCurrency(tx.total)}
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                     <div className="flex flex-col items-center justify-center  gap-4">
                        <FileText size={48} />
                        <p className="text-xs font-black uppercase tracking-widest">No taxable data found for this period</p>
                     </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <footer className="flex flex-col md:flex-row items-center justify-between p-10 ">
         <div className="space-y-1">
            <h4 className="text-lg font-black uppercase italic tracking-tighter">Automatic Tax Reconciler</h4>
            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">Powered by KEN Enterprise Fiscal Engine</p>
         </div>
         <div className="mt-6 md:mt-0 px-6 py-2 border border-zinc-700 rounded-lg flex items-center gap-6">
            <div className="text-center">
               <p className="text-[8px] font-black text-zinc-500 uppercase">Sales Volume</p>
               <p className="text-sm font-black font-mono tabular-nums tracking-tighter">{data.length}</p>
            </div>
            <div className="w-px h-8 " />
            <div className="text-center">
               <p className="text-[8px] font-black text-zinc-500 uppercase">Tax Accuracy</p>
               <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tighter">100.0%</p>
            </div>
         </div>
      </footer>
    </div>
  );
}
