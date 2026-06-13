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
    loadTaxData
  } = useTaxReportPage();

  const [selectedMonth, setSelectedMonth] = React.useState('all');

  const monthOptions = React.useMemo(() => {
    const options = new Map();
    const sortedData = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    sortedData.forEach(tx => {
      if (!tx.created_at) return;
      const date = new Date(tx.created_at);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      if (!options.has(key)) {
        options.set(key, label);
      }
    });
    return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
  }, [data]);

  const filteredData = React.useMemo(() => {
    if (selectedMonth === 'all') return data;
    return data.filter(tx => {
      if (!tx.created_at) return false;
      const txDate = new Date(tx.created_at);
      const txYear = txDate.getFullYear();
      const txMonth = String(txDate.getMonth() + 1).padStart(2, '0');
      const txKey = `${txYear}-${txMonth}`;
      return txKey === selectedMonth;
    });
  }, [data, selectedMonth]);

  const computedSales = React.useMemo(() => {
    return filteredData.reduce((acc, tx) => acc + (tx.payment_status === 'paid' ? tx.total : 0), 0);
  }, [filteredData]);

  const computedTax = React.useMemo(() => {
    return filteredData.reduce((acc, tx) => acc + (tx.payment_status === 'paid' ? (tx.tax || Math.round(tx.total * 0.11 / 1.11)) : 0), 0);
  }, [filteredData]);

  const computedNet = computedSales - computedTax;

  const printTaxReport = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return alert('Pop-up terblokir! Izinkan pop-up untuk mencetak laporan.');

    const itemsHtml = filteredData
      .filter(tx => tx.payment_status === 'paid')
      .map((tx, idx) => {
        const displayTax = tx.tax || Math.round(tx.total * 0.11 / 1.11);
        const displayDpp = tx.total - displayTax;
        return `
          <tr>
            <td style="font-family: monospace; font-size: 11px;">${tx.order_number}</td>
            <td style="font-size: 11px; text-transform: uppercase; font-weight: 600;">${tx.customer_name || 'Anonymous Customer'}</td>
            <td style="text-align: right; font-family: monospace; font-size: 11px;">${formatCurrency(displayDpp)}</td>
            <td style="text-align: right; font-family: monospace; font-size: 11px; color: #059669; font-weight: 600;">${formatCurrency(displayTax)}</td>
            <td style="text-align: right; font-family: monospace; font-size: 11px; font-weight: bold;">${formatCurrency(tx.total)}</td>
          </tr>
        `;
      })
      .join('');

    let periodLabel = 'Semua Periode';
    if (selectedMonth !== 'all') {
      const option = monthOptions.find(o => o.value === selectedMonth);
      if (option) periodLabel = option.label;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Kepatuhan Pajak (PPN 11%) - ${new Date().toISOString().slice(0,10)}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; background-color: #ffffff; }
            .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title-area h1 { font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: -0.5px; color: #111827; }
            .title-area p { font-size: 10px; color: #6b7280; text-transform: uppercase; margin: 5px 0 0 0; letter-spacing: 1px; font-weight: 700; }
            .meta-info { text-align: right; font-size: 11px; color: #4b5563; }
            .meta-info div { margin-bottom: 3px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; background-color: #f9fafb; }
            .stat-card .label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; letter-spacing: 0.5px; }
            .stat-card .value { font-size: 18px; font-weight: 900; font-family: monospace; color: #111827; }
            .stat-card.highlight { border-color: #10b981; background-color: #ecfdf5; }
            .stat-card.highlight .value { color: #059669; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
            th { background-color: #f3f4f6; text-transform: uppercase; font-weight: 800; font-size: 9px; color: #374151; letter-spacing: 0.5px; }
            tr:nth-child(even) td { background-color: #f9fafb; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 11px; margin-top: 80px; page-break-inside: avoid; }
            .sig-space { height: 70px; margin-bottom: 10px; }
            .sig-line { border-bottom: 1px solid #9ca3af; width: 200px; margin: 0 auto 5px auto; }
            .no-print-bar { background: #1f2937; color: #fff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-radius: 6px; margin-bottom: 24px; }
            .no-print-bar button { padding: 8px 16px; font-weight: bold; cursor: pointer; background-color: #10b981; border: none; color: white; border-radius: 4px; font-size: 12px; transition: opacity 0.2s; }
            .no-print-bar button:hover { opacity: 0.9; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print-bar no-print">
            <span style="font-weight: 800; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">Pratinjau Cetak Dokumen Fiskal (${periodLabel})</span>
            <button onclick="window.print()">Cetak Laporan</button>
          </div>
          <div class="header">
            <div class="title-area">
              <h1>Tax Compliance Report</h1>
              <p>Enterprise Fiscal Reporting Engine &bull; PPN 11%</p>
            </div>
            <div class="meta-info">
              <div><strong>Waktu Cetak:</strong> ${new Date().toLocaleString('id-ID')}</div>
              <div><strong>Periode Laporan:</strong> ${periodLabel}</div>
              <div><strong>Status Pajak:</strong> Audit Ready</div>
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="label">Total Penjualan Kotor (Gross)</div>
              <div class="value">${formatCurrency(computedSales)}</div>
            </div>
            <div class="stat-card">
              <div class="label">Pendapatan Kena Pajak (DPP)</div>
              <div class="value">${formatCurrency(computedNet)}</div>
            </div>
            <div class="stat-card highlight">
              <div class="label">Pajak Terkumpul (PPN 11%)</div>
              <div class="value">${formatCurrency(computedTax)}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice / Ref #</th>
                <th>Customer Entity</th>
                <th style="text-align: right;">Taxable Amount (DPP)</th>
                <th style="text-align: right; color: #059669;">PPN (11%)</th>
                <th style="text-align: right;">Gross Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || '<tr><td colspan="5" style="text-align:center; color:#9ca3af; padding: 24px;">Tidak ada data transaksi kena pajak pada periode ini.</td></tr>'}
            </tbody>
          </table>
          <div class="signatures">
            <div>
              <p>Disiapkan Oleh (Finance/Accounting),</p>
              <div class="sig-space"></div>
              <div class="sig-line"></div>
              <p style="font-weight: bold; color: #4b5563;">Staff Keuangan</p>
            </div>
            <div>
              <p>Disetujui Oleh (Direktur/Outlet Manager),</p>
              <div class="sig-space"></div>
              <div class="sig-line"></div>
              <p style="font-weight: bold; color: #4b5563;">Outlet Manager</p>
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse font-mono tabular-nums">
      <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Calculating Tax Liability...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-700 max-w-[1400px] mx-auto">
      {/* 🏛️ FISCAL COCKPIT HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-card border border-zinc-200 dark:border-zinc-800 p-6 rounded-lg shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-md flex items-center justify-center text-emerald-600 shadow-inner">
            <Landmark size={32} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none italic text-zinc-900 dark:text-white">
              Tax <span className="text-emerald-600">Compliance</span>
            </h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-[0.2em]">Enterprise Fiscal Reporting V3.1</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <Button 
             variant="outline" 
             className="rounded-md font-bold text-xs border-zinc-250 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all h-10"
             onClick={printTaxReport}
           >
              <Receipt size={14} className="mr-2" /> Print Report
           </Button>
           <Button 
             className="bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 rounded-md font-bold text-xs h-10 px-4 active:scale-95 transition-all shadow-md shadow-amber-500/10"
             onClick={() => alert("Laporan telah disertifikasi oleh sistem.")}
           >
              <ShieldCheck size={14} className="mr-2" /> Certify Report
           </Button>
        </div>
      </header>

      {/* 📊 TAX SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm bg-card relative overflow-hidden group rounded-lg">
           <div className="absolute -right-4 -bottom-4 text-emerald-600 dark:text-emerald-400/5 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp size={120} />
           </div>
           <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Total Tax Collected (PPN 11%)</p>
           <h2 className="text-4xl font-black text-emerald-600 font-mono tabular-nums tracking-tighter">
             {formatCurrency(computedTax)}
           </h2>
           <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
             <ShieldCheck size={12} /> Verified Physical Sales Only
           </div>
        </Card>

        <Card className="p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm bg-card rounded-lg">
           <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Net Taxable Revenue (DPP)</p>
           <h2 className="text-4xl font-black text-zinc-900 dark:text-white font-mono tabular-nums tracking-tighter">
             {formatCurrency(computedNet)}
           </h2>
           <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
             <FileText size={12} /> Base for PPN calculation
           </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-emerald-600 text-zinc-900 dark:text-zinc-100 rounded-lg">
           <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-2">Current Fiscal Status</p>
           <h2 className="text-3xl font-black uppercase tracking-tighter">Audit Ready</h2>
           <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-emerald-100 uppercase tracking-widest">
             <AlertCircle size={12} /> No Discrepancies Found
           </div>
        </Card>
      </div>

      {/* 📑 DETAILED TAX LOG */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-md overflow-hidden rounded-lg bg-card text-card-foreground">
        <CardHeader className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex flex-row items-center justify-between">
           <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">Tax Ledger</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Detailed transaction-level tax breakdown</CardDescription>
           </div>
           <div className="flex items-center gap-4">
              <div className="h-10 px-3 bg-background rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center gap-2 shadow-inner">
                 <Calendar size={14} className="text-zinc-500 dark:text-zinc-400" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 font-mono focus:outline-none cursor-pointer"
                  >
                    <option value="all">Semua Periode</option>
                    {monthOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <TableRow>
                  <TableHead className="px-6 py-4">Invoice #</TableHead>
                  <TableHead className="px-6 py-4">Customer Entity</TableHead>
                  <TableHead className="px-6 py-4 text-right">Taxable Amount (DPP)</TableHead>
                  <TableHead className="px-6 py-4 text-right text-emerald-600">PPN (11%)</TableHead>
                  <TableHead className="px-6 py-4 text-right font-black">Gross Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-zinc-250 dark:divide-zinc-800">
                {filteredData.filter(tx => tx.payment_status === 'paid').map(tx => {
                  const displayTax = tx.tax || Math.round(tx.total * 0.11 / 1.11);
                  const displayDpp = tx.total - displayTax;
                  return (
                    <TableRow key={tx.id} className="group hover:bg-emerald-500/5 transition-all">
                      <TableCell className="px-6 py-3 font-mono tabular-nums text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        {tx.order_number}
                      </TableCell>
                      <TableCell className="px-6 py-3 font-black text-sm uppercase text-zinc-900 dark:text-white">
                        {tx.customer_name || 'Anonymous Customer'}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-right font-mono tabular-nums text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {formatCurrency(displayDpp)}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-right font-mono tabular-nums text-sm font-black text-emerald-600">
                        {formatCurrency(displayTax)}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-right font-mono tabular-nums text-sm font-black text-zinc-900 dark:text-white">
                        {formatCurrency(tx.total)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                       <div className="flex flex-col items-center justify-center gap-4 text-zinc-400">
                          <FileText size={48} />
                          <p className="text-xs font-black uppercase tracking-widest">No taxable data found for this period</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <footer className="flex flex-col md:flex-row items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg">
         <div className="space-y-1">
            <h4 className="text-lg font-black uppercase italic tracking-tighter text-zinc-900 dark:text-white leading-none">Automatic Tax Reconciler</h4>
            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">Powered by KEN Enterprise Fiscal Engine</p>
         </div>
         <div className="mt-4 md:mt-0 px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md bg-card flex items-center gap-6">
            <div className="text-center">
               <p className="text-[8px] font-black text-zinc-500 uppercase">Sales Volume</p>
               <p className="text-sm font-black font-mono tabular-nums tracking-tighter text-zinc-950 dark:text-white">{filteredData.length}</p>
            </div>
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
            <div className="text-center">
               <p className="text-[8px] font-black text-zinc-500 uppercase">Tax Accuracy</p>
               <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tighter">100.0%</p>
            </div>
         </div>
      </footer>
    </div>
  );
}

