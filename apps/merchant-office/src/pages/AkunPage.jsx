import React, { useState } from 'react';
import {
  BookOpen, TrendingUp, TrendingDown, DollarSign, Wallet,
  ArrowUpRight, ArrowDownRight, Download, Printer, RefreshCw,
  ChevronDown, ChevronRight, Filter, Plus, CheckCircle2,
  AlertTriangle, FileText, Building2, Scale, CreditCard,
  Target, Save, Trash2, BarChart3, CalendarDays
} from 'lucide-react';
import { useBudgetPage } from '../hooks/useBudgetPage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { cn } from '../lib/utils';
import { useAkunPage } from '../hooks/useAkunPage';


const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n) => n >= 1e9 ? `${(n/1e9).toFixed(1)}M` : n >= 1e6 ? `${(n/1e6).toFixed(1)}jt` : n >= 1e3 ? `${(n/1e3).toFixed(0)}rb` : String(Math.round(n||0));

const PERIODS = [
  { key: 'today', label: 'Hari Ini' },
  { key: '7days', label: '7 Hari' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'year',  label: 'Tahun Ini' },
];

const TABS = [
  { key: 'summary',  label: 'Ringkasan Keuangan', icon: TrendingUp },
  { key: 'ledger',   label: 'Buku Besar (Jurnal)', icon: BookOpen },
  { key: 'coa',      label: 'Chart of Accounts',  icon: Scale },
];

const COA_COLORS = {
  'Aset': 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Asset': 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Kewajiban': 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-500/20',
  'Liability': 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-500/20',
  'Ekuitas': 'bg-amber-500/10 text-primary border-zinc-800/20',
  'Equity': 'bg-amber-500/10 text-primary border-zinc-800/20',
  'Pendapatan': 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Revenue': 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Beban': 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-500/20',
  'Expense': 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-500/20',
};

function KPICard({ label, value, sub, icon: Icon, color, trend, trendVal }) {
  return (
    <Card className="border-none shadow-lg bg-card overflow-hidden group hover:shadow-xl transition-all font-mono tabular-nums">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">{label}</p>
            <h3 className="text-xl font-black tracking-tight truncate">{value}</h3>
            {sub && <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-medium">{sub}</p>}
          </div>
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center shadow-md shrink-0 ml-4', color)}>
            <Icon size={22} className="text-zinc-900 dark:text-zinc-100" />
          </div>
        </div>
        {trendVal !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black', trendVal >= 0 ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' : 'bg-destructive/10 text-destructive')}>
              {trendVal >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(trendVal).toFixed(1)}%
            </div>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-100 font-bold">margin</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JournalRow({ journal, expanded, onToggle }) {
  const totalDebit = journal.lines?.reduce((s, l) => s + Number(l.debit || 0), 0) || journal.totalDebit || 0;
  return (
    <>
      <tr className={cn('hover:bg-background transition-colors cursor-pointer group', expanded && 'bg-amber-50 dark:bg-amber-950/30')} onClick={onToggle}>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <div className={cn('w-6 h-6 rounded flex items-center justify-center transition-colors', expanded ? 'bg-amber-500 dark:bg-amber-400 text-zinc-900 dark:text-zinc-100' : 'bg-background text-zinc-500 dark:text-zinc-100')}>
              <ChevronRight size={12} className={cn('transition-transform', expanded && 'rotate-90')} />
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-[10px] text-zinc-500 dark:text-zinc-100 font-mono">{new Date(journal.date).toLocaleDateString('id-ID')}</td>
        <td className="px-4 py-4 text-xs font-black text-amber-600 dark:text-amber-400">{journal.reference}</td>
        <td className="px-4 py-4 text-xs font-medium text-foreground max-w-xs truncate">{journal.description}</td>
        <td className="px-4 py-4 text-xs font-black text-right">{fmt(totalDebit)}</td>
        <td className="px-4 py-4 text-xs font-black text-right">{fmt(totalDebit)}</td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg w-fit ml-auto">
            <CheckCircle2 size={10} />
            <span className="text-[9px] font-black uppercase">Balance</span>
          </div>
        </td>
      </tr>
      {expanded && journal.lines?.map((l, i) => (
        <tr key={i} className="bg-amber-50 dark:bg-amber-950/30 border-l-2 border-accent/30">
          <td className="px-4 py-2" />
          <td className="px-4 py-2 text-[10px] text-zinc-500 dark:text-zinc-100 font-mono pl-8">{l.accountCode}</td>
          <td className="px-4 py-2 text-[10px] text-zinc-500 dark:text-zinc-100" colSpan={2}>{l.accountName}</td>
          <td className="px-4 py-2 text-[10px] font-black text-right text-primary">{l.debit > 0 ? fmt(l.debit) : '—'}</td>
          <td className="px-4 py-2 text-[10px] font-black text-right text-primary">{l.credit > 0 ? fmt(l.credit) : '—'}</td>
          <td />
        </tr>
      ))}
    </>
  );
}

function AddExpenseModal({ onClose, onSave, loading, accounts }) {
  const [form, setForm] = useState({ description: '', amount: '', category: 'Beban Operasional', paymentMethod: 'Tunai', date: new Date().toISOString().split('T')[0] });
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 border-none rounded-lg">
        <CardHeader className="border-b bg-background">
          <CardTitle className="text-xl flex items-center gap-2"><CreditCard className="text-amber-600 dark:text-amber-400" /> Catat Pengeluaran Baru</CardTitle>
          <CardDescription>Input biaya operasional (listrik, gaji, sewa, dll)</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Deskripsi Biaya</label>
            <Input placeholder="Contoh: Bayar Listrik Bulan Mei" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Jumlah (Rp)</label>
                <Input type="number" className="font-mono tabular-nums" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Metode Pembayaran</label>
                <Select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                  <option>Tunai</option>
                  <option>BCA</option>
                  <option>Mandiri</option>
                </Select>
             </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Kategori Akun</label>
            <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="Beban Operasional">Beban Operasional Umum</option>
              <option value="Beban Gaji">Beban Gaji Pegawai</option>
              <option value="Beban Listrik & Air">Beban Listrik & Air</option>
              <option value="Beban Sewa">Beban Sewa Tempat</option>
              <option value="Beban Lainnya">Beban Lain-lain</option>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t bg-background gap-4">
           <Button variant="ghost" className="flex-1 font-bold" onClick={onClose}>Batal</Button>
           <Button variant="primary" className="flex-[2] font-black" onClick={() => onSave(form)} disabled={loading || !form.description || !form.amount}>
             {loading ? 'Menyimpan...' : 'SIMPAN PENGELUARAN'}
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function AddTopupModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({ description: '', amount: '', source: 'Modal', date: new Date().toISOString().split('T')[0] });
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 border-none rounded-lg">
        <CardHeader className="border-b bg-background">
          <CardTitle className="text-xl flex items-center gap-2"><Wallet className="text-emerald-600 dark:text-emerald-400" /> Pengisian Saldo Kas Kecil / Top-up</CardTitle>
          <CardDescription>Menambah saldo Kas Tunai toko dari sumber dana eksternal</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Deskripsi Pengisian</label>
            <Input placeholder="Contoh: Setoran Modal Awal Kas Kecil Toko" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Jumlah Top-up (Rp)</label>
                <Input type="number" className="font-mono tabular-nums" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Sumber Dana</label>
                <Select value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                  <option value="Modal">Modal Pemilik (Owner Equity)</option>
                  <option value="Bank">Transfer dari Rekening Bank Toko</option>
                </Select>
             </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t bg-background gap-4">
           <Button variant="ghost" className="flex-1 font-bold" onClick={onClose}>Batal</Button>
           <button 
             type="button" 
             className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-zinc-900 shadow-md shadow-emerald-500/10 active:scale-95 transition-all text-xs font-black uppercase rounded-md flex items-center justify-center disabled:opacity-50"
             onClick={() => onSave(form)} 
             disabled={loading || !form.description || !form.amount}
           >
             {loading ? 'Menyimpan...' : 'SIMPAN TOP-UP KAS'}
           </button>
        </CardFooter>
      </Card>
    </div>
  );
}

const fmtBudget = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

function BudgetStatusBadge({ status, percent }) {
  const config = {
    under_budget: { label: 'Under Budget', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
    on_budget: { label: 'On Track', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    over_budget: { label: 'Over Budget', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  };
  const c = config[status] || config.on_budget;
  return (
    <span className={cn('px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border', c.cls)}>
      {c.label} ({percent}%)
    </span>
  );
}

function VarianceProgressBar({ percent, status }) {
  const clampedPercent = Math.min(percent, 150);
  const barWidth = Math.min((clampedPercent / 100) * 100, 100);
  const barColor = status === 'over_budget'
    ? 'bg-rose-500 dark:bg-rose-400'
    : status === 'under_budget'
      ? 'bg-emerald-500 dark:bg-emerald-400'
      : 'bg-amber-500 dark:bg-amber-400';

  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-md h-2 overflow-hidden">
      <div
        className={cn('h-full rounded-md transition-all duration-500', barColor)}
        style={{ width: `${barWidth}%` }}
      />
    </div>
  );
}

export default function AkunPage({ user }) {
  const {
    tab, setTab,
    period, setPeriod,
    summary,
    accounts,
    loading,
    expandedJournal, setExpandedJournal,
    search, setSearch,
    showExpenseModal, setShowExpenseModal,
    savingExpense,
    showTopupModal, setShowTopupModal,
    savingTopup,
    loadData,
    is, bs, cf,
    grossMargin, netMargin,
    filteredJournals
  } = useAkunPage({ user });

  const handlePrint = () => {
    let targetId = 'akun-print-area';
    let docTitle = 'Laporan Keuangan Konsolidasi';
    let subTitle = 'Laporan Konsolidasi Finansial · Real-time Feed';
    let customHtml = '';

    if (tab === 'ledger') {
      docTitle = 'Buku Besar (General Ledger)';
      subTitle = 'Daftar Entri Jurnal Transaksi Keuangan';
      
      // Build a professional flat table for printing instead of copying the interactive DOM directly
      customHtml = `
        <div class="bg-card">
          <div class="border-b" style="margin-bottom: 20px;">
            <h3 class="card-title">Rincian Jurnal Transaksi</h3>
            <p class="card-description">Laporan detail entri debit/kredit double-entry pembukuan.</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 100px;">Tanggal</th>
                <th style="width: 120px;">Referensi</th>
                <th>Akun & Deskripsi Transaksi</th>
                <th style="text-align: right; width: 120px;">Debit</th>
                <th style="text-align: right; width: 120px;">Kredit</th>
              </tr>
            </thead>
            <tbody>
      `;

      if (filteredJournals.length === 0) {
        customHtml += `<tr><td colspan="5" class="text-center" style="padding: 40px; color: #71717a;">Belum ada entri jurnal untuk periode ini.</td></tr>`;
      } else {
        filteredJournals.forEach(j => {
          const totalDebit = j.lines?.reduce((s, l) => s + Number(l.debit || 0), 0) || j.totalDebit || 0;
          const totalDebitFormatted = fmt(totalDebit);
          const dateStr = new Date(j.date).toLocaleDateString('id-ID');
          
          // Header transaction row
          customHtml += `
            <tr style="background-color: #f8fafc; font-weight: 800; border-top: 2px solid #e2e8f0;">
              <td><strong>${dateStr}</strong></td>
              <td><span class="text-amber-600"><strong>${j.reference}</strong></span></td>
              <td><strong>${j.description || 'Jurnal Transaksi'}</strong></td>
              <td class="text-right font-mono"><strong>${totalDebitFormatted}</strong></td>
              <td class="text-right font-mono"><strong>${totalDebitFormatted}</strong></td>
            </tr>
          `;
          
          // Double entry split lines
          if (Array.isArray(j.lines)) {
            j.lines.forEach(l => {
              customHtml += `
                <tr style="color: #4b5563;">
                  <td></td>
                  <td style="color: #71717a; font-family: Courier, monospace; font-size: 9px; padding-left: 20px;">${l.accountCode}</td>
                  <td style="padding-left: 40px; font-size: 9px; italic">${l.accountName}</td>
                  <td class="text-right font-mono" style="font-size: 9px;">${l.debit > 0 ? fmt(l.debit) : '—'}</td>
                  <td class="text-right font-mono" style="font-size: 9px;">${l.credit > 0 ? fmt(l.credit) : '—'}</td>
                </tr>
              `;
            });
          }
        });
      }

      customHtml += `
            </tbody>
          </table>
        </div>
      `;
    } else if (tab === 'coa') {
      docTitle = 'Chart of Accounts (COA)';
      subTitle = 'Daftar Standardisasi Akun Perusahaan';
      
      customHtml = `
        <div class="bg-card">
          <table>
            <thead>
              <tr>
                <th style="width: 120px;">Kode Akun</th>
                <th>Nama Akun</th>
                <th>Kategori Akun</th>
                <th style="width: 150px;">Saldo Normal</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      accounts.forEach(acc => {
        customHtml += `
          <tr>
            <td class="font-mono font-black text-amber-600">${acc.code}</td>
            <td class="font-black" style="font-size: 11px;">${acc.name}</td>
            <td><span style="font-size: 9px; text-transform: uppercase; font-weight: 800; border: 1px solid #e4e4e7; padding: 2px 6px; border-radius: 4px; background: #fafafa;">${acc.category}</span></td>
            <td style="text-transform: capitalize; color: #71717a;">${acc.normalBalance}</td>
          </tr>
        `;
      });

      customHtml += `
            </tbody>
          </table>
        </div>
      `;
    } else {
      const content = document.getElementById(targetId);
      if (!content) {
        alert('Konten cetak tidak ditemukan untuk tab ini.');
        return;
      }
      customHtml = content.innerHTML;
    }

    const w = window.open('', '_blank');
    
    // Professional print styles matching the corporate Zinc & Monospace layout rules
    w.document.write(`
      <html>
        <head>
          <title>${docTitle} - KEN ERP</title>
          <style>
            @media print {
              body { margin: 1.6cm; }
              .no-print { display: none !important; }
            }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
              font-size: 11px; 
              color: #18181b; 
              line-height: 1.5;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px; 
            }
            th, td { 
              border: 1px solid #e4e4e7; 
              padding: 8px 10px; 
              text-align: left; 
            }
            th { 
              background: #f4f4f5; 
              color: #18181b; 
              font-weight: 800; 
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            td {
              font-size: 10px;
            }
            .font-mono {
              font-family: Courier, monospace;
              letter-spacing: -0.02em;
            }
            .font-black {
              font-weight: 800;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .text-amber-600 {
              color: #d97706;
            }
            .text-destructive, .text-rose-600 {
              color: #e11d48;
            }
            .bg-card {
              border: 1px solid #e4e4e7;
              border-radius: 6px;
              padding: 16px;
              margin-bottom: 20px;
            }
            .border-b {
              border-bottom: 1px solid #e4e4e7;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .flex {
              display: flex;
            }
            .justify-between {
              justify-content: space-between;
            }
            .items-center {
              align-items: center;
            }
            .py-1 {
              padding-top: 4px;
              padding-bottom: 4px;
            }
            .border-t-2 {
              border-top: 2px solid #e4e4e7;
            }
            .pt-2 {
              padding-top: 8px;
            }
            .mt-2 {
              margin-top: 8px;
            }
            .p-4 {
              padding: 12px;
            }
            .bg-amber-50 {
              background-color: #fef3c7;
              border: 1px solid #fde68a;
            }
            .rounded-lg {
              border-radius: 6px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(12, minmax(0, 1fr));
              gap: 20px;
            }
            .grid-cols-2 > * {
              grid-column: span 6 / span 6;
            }
            .grid-cols-3 > * {
              grid-column: span 4 / span 4;
            }
            .grid-cols-4 > * {
              grid-column: span 3 / span 3;
            }
            .space-y-8 > * + * {
              margin-top: 30px;
            }
            .text-xs {
              font-size: 10px;
            }
            .text-sm {
              font-size: 11px;
            }
            .text-base {
              font-size: 13px;
            }
            .text-xl {
              font-size: 18px;
            }
            .uppercase {
              text-transform: uppercase;
            }
            .tracking-widest {
              letter-spacing: 0.1em;
            }
            .text-zinc-500 {
              color: #71717a;
            }
            .card-title {
              font-weight: 800;
              font-size: 13px;
              margin: 0;
            }
            .card-description {
              font-size: 10px;
              color: #71717a;
              margin: 2px 0 0 0;
            }
            .header-print {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #18181b;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .header-print h1 {
              font-size: 20px;
              font-weight: 950;
              text-transform: uppercase;
              letter-spacing: -0.03em;
              margin: 0;
            }
            .header-print p {
              font-size: 10px;
              color: #71717a;
              margin: 2px 0 0 0;
            }
          </style>
        </head>
        <body>
          <div class="header-print">
            <div>
              <h1>${docTitle}</h1>
              <p>${subTitle}</p>
            </div>
            <div style="text-align: right">
              <span style="font-weight:800; font-size: 10px; text-transform: uppercase; border: 1px solid #18181b; padding: 4px 8px; border-radius: 4px;">Asli / Original</span>
            </div>
          </div>
          ${customHtml}
        </body>
      </html>
    `);
    w.document.close(); 
    w.print();
  };

  const handleExcelExport = () => {
    window.location.href = `${API}/accounting/export/excel?period=${period}`;
  };

  const handleSaveExpense = async (formData) => {
    setSavingExpense(true);
    try {
      const res = await fetch(`${API}/accounting/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({...formData, amount: Number(formData.amount), userName: user?.name})
      });
      if (!res.ok) throw new Error('Gagal simpan');
      setShowExpenseModal(false);
      loadData();
    } catch (err) { alert(err.message); }
    finally { setSavingExpense(false); }
  };

  const handleSaveTopup = async (formData) => {
    setSavingTopup(true);
    try {
      const res = await fetch(`${API}/accounting/topup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({...formData, amount: Number(formData.amount), userName: user?.name})
      });
      if (!res.ok) throw new Error('Gagal top-up');
      setShowTopupModal(false);
      loadData();
    } catch (err) { alert(err.message); }
    finally { setSavingTopup(false); }
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 dark:bg-amber-400/10 rounded-md flex items-center justify-center border border-amber-500/20">
              <BookOpen className="text-amber-500 dark:bg-amber-400" size={20} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
              Modul Akuntansi
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 pl-13">Double-entry bookkeeping · Laporan Keuangan · Buku Besar</p>
        </div>
        
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Period Selector */}
          <div className="flex bg-white dark:bg-zinc-800 p-1 rounded-md border border-zinc-200 dark:border-zinc-700 gap-1">
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={cn('px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all active:scale-95',
                  period === p.key ? 'bg-amber-500 dark:bg-amber-400 text-white dark:text-zinc-900 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-foreground')}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Quick Actions (Data utilities) */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 h-9 px-3 border-zinc-200 dark:border-zinc-700" onClick={handleExcelExport}>
              <Download size={13} /> Excel
            </Button>
            <Button variant="outline" size="sm" className="gap-2 h-9 px-3 border-zinc-200 dark:border-zinc-700" onClick={handlePrint}>
              <Printer size={13} /> Print
            </Button>
            <Button variant="outline" size="sm" className="gap-2 h-9 px-3 border-zinc-200 dark:border-zinc-700" onClick={loadData}>
              <RefreshCw size={13} /> Refresh
            </Button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2">
            <button 
              type="button"
              className="flex items-center gap-2 px-4 h-9 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-zinc-900 shadow-md shadow-emerald-500/10 active:scale-95 transition-all text-xs font-black uppercase rounded-md border border-emerald-500/20" 
              onClick={() => setShowTopupModal(true)}
            >
              <Plus size={14} /> Top-up Kas
            </button>
            <Button 
              variant="primary" 
              size="sm" 
              className="gap-2 h-9 px-4 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-md active:scale-95 transition-all text-xs font-black uppercase rounded-md" 
              onClick={() => setShowExpenseModal(true)}
            >
              <Plus size={14} /> Tambah Biaya
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-background p-1 rounded-lg border w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('flex items-center gap-2 px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all',
                tab === t.key ? 'bg-background shadow text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-100 hover:text-foreground')}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-amber-500 dark:border-amber-400 border-t-transparent rounded-lg animate-spin" />
        </div>
      ) : (
        <>
          {/* ====== TAB: SUMMARY ====== */}
          {tab === 'summary' && (
            <div id="akun-print-area" className="space-y-8">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Total Pendapatan" value={fmtShort(is.revenue)} sub="Penjualan bersih" icon={TrendingUp} color="bg-amber-500 dark:bg-amber-400" trendVal={grossMargin} />
                <KPICard label="Laba Kotor" value={fmtShort(is.grossProfit)} sub={`Margin ${grossMargin.toFixed(1)}%`} icon={DollarSign} color="bg-amber-500 dark:bg-amber-400" />
                <KPICard label="Laba Bersih" value={fmtShort(is.netProfit)} sub={`Net ${netMargin.toFixed(1)}%`} icon={Wallet} color={is.netProfit >= 0 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-destructive'} trendVal={netMargin} />
                <KPICard label="Hutang Supplier" value={fmtShort(bs.liabilities?.hutangDagang)} sub={`${summary?.unpaidInvoices || 0} invoice belum lunas`} icon={CreditCard} color="bg-amber-500" />
              </div>

              {/* Laba Rugi + Neraca side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Statement */}
                <Card className="border-none shadow-xl bg-card">
                  <CardHeader className="border-b bg-background pb-4">
                    <CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={18} className="text-amber-600 dark:text-amber-400" /> Laporan Laba Rugi</CardTitle>
                    <CardDescription>Income Statement · {period}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {[
                      { label: 'Pendapatan Penjualan', val: is.revenue, style: 'font-black text-primary text-base' },
                      { label: '(-) Harga Pokok Penjualan', val: is.hpp, style: 'text-destructive', minus: true },
                      { label: 'LABA KOTOR', val: is.grossProfit, style: 'font-black border-t pt-2' },
                      { label: '(-) Biaya Operasional', val: is.opex, style: 'text-destructive', minus: true },
                      { label: '(-) Waste & Susut', val: is.waste, style: 'text-destructive', minus: true },
                      { label: 'LABA BERSIH', val: is.netProfit, style: is.netProfit >= 0 ? 'font-black text-amber-600 dark:text-amber-400 border-t-2 border-accent/30 pt-2 text-base' : 'font-black text-destructive border-t-2 pt-2 text-base' },
                    ].map((row, i) => (
                      <div key={i} className={cn('flex justify-between items-center py-1', row.style)}>
                        <span className="text-sm">{row.label}</span>
                        <span className="text-sm tabular-nums">{fmt(row.val)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Balance Sheet */}
                <Card className="border-none shadow-xl bg-card">
                  <CardHeader className="border-b bg-background pb-4">
                    <CardTitle className="text-lg flex items-center gap-2"><Scale size={18} className="text-amber-600 dark:text-amber-400" /> Neraca (Balance Sheet)</CardTitle>
                    <CardDescription>Posisi Keuangan · {period}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest mb-2">ASET</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>Kas & Bank</span><span className="font-black">{fmt(bs.assets?.kas)}</span></div>
                        <div className="flex justify-between text-sm"><span>Persediaan Bahan Baku</span><span className="font-black">{fmt(bs.assets?.persediaan)}</span></div>
                        <div className="flex justify-between font-black border-t pt-2"><span>TOTAL ASET</span><span className="text-amber-600 dark:text-amber-400">{fmt(bs.assets?.total)}</span></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest mb-2">LIABILITAS</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>Hutang Dagang</span><span className="font-black text-destructive">{fmt(bs.liabilities?.hutangDagang)}</span></div>
                        <div className="flex justify-between text-sm"><span>Hutang Pajak</span><span className="font-black text-destructive">{fmt(bs.liabilities?.hutangPajak)}</span></div>
                        <div className="flex justify-between font-black border-t pt-2"><span>TOTAL LIABILITAS</span><span className="text-destructive">{fmt(bs.liabilities?.total)}</span></div>
                      </div>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded-lg flex justify-between font-black">
                      <span>EKUITAS (Aset - Liabilitas)</span>
                      <span className="text-amber-600 dark:text-amber-400">{fmt((bs.assets?.total || 0) - (bs.liabilities?.total || 0))}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow */}
              <Card className="border-none shadow-xl bg-card">
                <CardHeader className="border-b bg-background pb-4">
                  <CardTitle className="text-lg flex items-center gap-2"><Wallet size={18} className="text-amber-600 dark:text-amber-400" /> Arus Kas (Cash Flow)</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: 'Kas Masuk (Penjualan)', val: cf.operasional, color: 'text-amber-600 dark:text-amber-400' },
                      { label: 'Kas Keluar (Pembelian/HPP)', val: cf.pembelian, color: 'text-destructive' },
                      { label: 'Net Cash Flow', val: cf.net, color: cf.net >= 0 ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-destructive font-black' },
                    ].map((item, i) => (
                      <div key={i} className="text-center p-4 bg-background rounded-lg border">
                        <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest mb-2">{item.label}</p>
                        <p className={cn('text-2xl font-black', item.color)}>{fmt(item.val)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ====== TAB: LEDGER ====== */}
          {tab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <Input
                  className="flex-1 max-w-sm"
                  placeholder="Cari referensi atau deskripsi jurnal..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tabular-nums">{filteredJournals.length} entri jurnal</p>
              </div>

              <div id="ledger-print-area">
                <Card className="border-none shadow-xl bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-background text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 border-b">
                          <th className="px-4 py-4 w-8" />
                          <th className="px-4 py-4 text-left">Tanggal</th>
                          <th className="px-4 py-4 text-left">Referensi</th>
                          <th className="px-4 py-4 text-left">Deskripsi</th>
                          <th className="px-4 py-4 text-right">Debit</th>
                          <th className="px-4 py-4 text-right">Kredit</th>
                          <th className="px-4 py-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/30">
                        {filteredJournals.length === 0 ? (
                          <tr><td colSpan={7} className="py-20 text-center text-zinc-500 dark:text-zinc-100 text-sm">Belum ada entri jurnal untuk periode ini. Lakukan transaksi penjualan atau penerimaan barang untuk membuat jurnal otomatis.</td></tr>
                        ) : filteredJournals.map(j => (
                          <JournalRow key={j.id} journal={j} expanded={expandedJournal === j.id} onToggle={() => setExpandedJournal(expandedJournal === j.id ? null : j.id)} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ====== TAB: COA ====== */}
          {tab === 'coa' && (
            <div className="space-y-4">
              <div id="coa-print-area">
                <Card className="border-none shadow-xl bg-card overflow-hidden">
                  <CardHeader className="border-b bg-background">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Chart of Accounts</CardTitle>
                        <CardDescription>Daftar akun standar yang digunakan dalam sistem pembukuan</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-background text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 border-b">
                          <th className="px-6 py-4 text-left">Kode</th>
                          <th className="px-6 py-4 text-left">Nama Akun</th>
                          <th className="px-6 py-4 text-left">Kategori</th>
                          <th className="px-6 py-4 text-left">Saldo Normal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/30">
                        {accounts.map((acc, i) => (
                          <tr key={i} className="hover:bg-background transition-colors">
                            <td className="px-6 py-4 font-mono text-xs font-black text-amber-600 dark:text-amber-400">{acc.code}</td>
                            <td className="px-6 py-4 text-sm font-bold">{acc.name}</td>
                            <td className="px-6 py-4">
                              <span className={cn('px-4 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest', COA_COLORS[acc.category] || 'bg-background text-zinc-500 dark:text-zinc-100')}>
                                {acc.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-100 capitalize">{acc.normalBalance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
      {showExpenseModal && (
        <AddExpenseModal 
          onClose={() => setShowExpenseModal(false)} 
          loading={savingExpense}
          accounts={accounts}
          onSave={handleSaveExpense}
        />
      )}
      {showTopupModal && (
        <AddTopupModal 
          onClose={() => setShowTopupModal(false)} 
          loading={savingTopup}
          onSave={handleSaveTopup}
        />
      )}
    </div>
  );
}
